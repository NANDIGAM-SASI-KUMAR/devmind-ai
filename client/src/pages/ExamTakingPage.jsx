import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, Flag, ChevronLeft, ChevronRight, Clock, Send } from 'lucide-react';
import { examsAPI } from '../api/exams.js';

const formatTime = (totalSeconds) => {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

const RESYNC_INTERVAL_MS = 20000;

export default function ExamTakingPage() {
  const { attemptId } = useParams();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [questions, setQuestions] = useState(null);
  const [answers, setAnswers] = useState({}); // { [index]: { answer, flagged } }
  const [current, setCurrent] = useState(0);
  const [remaining, setRemaining] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const submittedRef = useRef(false);
  const saveTimeoutRef = useRef(null);

  const applyAttemptData = useCallback((data) => {
    if (data.status !== 'in_progress') {
      submittedRef.current = true;
      navigate(`/examinations/attempts/${attemptId}/result`, { replace: true });
      return;
    }
    setTitle(data.title);
    setQuestions(data.questions);
    setRemaining(data.remainingSeconds);
    const byIndex = {};
    for (const a of data.answers) byIndex[a.questionIndex] = { answer: a.answer, flagged: a.flagged };
    setAnswers(byIndex);
  }, [attemptId, navigate]);

  // Initial load
  useEffect(() => {
    examsAPI.getAttempt(attemptId).then(applyAttemptData).catch(() => setError('Could not load this examination.'));
  }, [attemptId, applyAttemptData]);

  // Local 1s countdown, resynced with the server periodically (server remains authoritative).
  useEffect(() => {
    if (remaining === null || submittedRef.current) return;
    const tick = setInterval(() => {
      setRemaining((r) => {
        if (r === null) return r;
        if (r <= 1) {
          clearInterval(tick);
          handleSubmit(true);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(tick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining === null]);

  useEffect(() => {
    const resync = setInterval(() => {
      if (submittedRef.current) return;
      examsAPI.getAttempt(attemptId).then(applyAttemptData).catch(() => {});
    }, RESYNC_INTERVAL_MS);
    return () => clearInterval(resync);
  }, [attemptId, applyAttemptData]);

  const persistAnswer = useCallback((index, patch) => {
    examsAPI.saveAnswer(attemptId, index, patch.answer, patch.flagged).catch((err) => {
      if (err.response?.status === 409) {
        submittedRef.current = true;
        navigate(`/examinations/attempts/${attemptId}/result`, { replace: true });
      }
    });
  }, [attemptId, navigate]);

  const setAnswer = (index, value) => {
    setAnswers((a) => ({ ...a, [index]: { ...(a[index] || { flagged: false }), answer: value } }));
    const q = questions[index];
    if (q.type === 'short_answer') {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => persistAnswer(index, { answer: value }), 600);
    } else {
      persistAnswer(index, { answer: value });
    }
  };

  const toggleFlag = (index) => {
    const nextFlagged = !(answers[index]?.flagged);
    setAnswers((a) => ({ ...a, [index]: { ...(a[index] || { answer: '' }), flagged: nextFlagged } }));
    persistAnswer(index, { flagged: nextFlagged });
  };

  const handleSubmit = async (auto = false) => {
    if (submittedRef.current) return;
    if (!auto && !confirm('Submit this examination? You cannot change your answers afterward.')) return;
    submittedRef.current = true;
    setSubmitting(true);
    try {
      await examsAPI.submit(attemptId);
    } catch {
      // Even if this call races with a server-side auto-grade, the result page will show the truth.
    }
    navigate(`/examinations/attempts/${attemptId}/result`, { replace: true });
  };

  if (error) return <div className="h-screen flex items-center justify-center mesh-bg text-text2-muted">{error}</div>;
  if (questions === null || remaining === null) {
    return <div className="h-screen flex items-center justify-center mesh-bg"><Loader2 className="w-5 h-5 animate-spin text-brand" /></div>;
  }

  const q = questions[current];
  const answeredCount = Object.values(answers).filter((a) => a.answer?.trim()).length;
  const isLowTime = remaining <= 300;
  const isCriticalTime = remaining <= 60;

  return (
    <div className="h-screen flex flex-col mesh-bg">
      <header className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-line2 bg-card/80 backdrop-blur">
        <p className="font-heading font-bold text-text2 truncate">{title}</p>
        <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full border font-mono text-sm font-semibold ${
          isCriticalTime ? 'border-state-danger/40 bg-state-danger/10 text-state-danger animate-pulse' :
          isLowTime ? 'border-state-warning/40 bg-state-warning/10 text-state-warning' :
          'border-line2 bg-card-raised text-text2'
        }`}>
          <Clock className="w-3.5 h-3.5" />
          Time remaining: {formatTime(remaining)}
        </div>
        <button
          onClick={() => handleSubmit(false)}
          disabled={submitting}
          className="btn-brand flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold disabled:opacity-50"
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-3.5 h-3.5" /> Submit</>}
        </button>
      </header>

      <div className="flex-1 min-h-0 flex overflow-hidden">
        <main className="flex-1 min-w-0 overflow-y-auto px-6 md:px-12 py-10">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-text2-faint">Question {current + 1} of {questions.length}</span>
              <button
                onClick={() => toggleFlag(current)}
                className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${
                  answers[current]?.flagged ? 'text-state-warning' : 'text-text2-faint hover:text-text2'
                }`}
              >
                <Flag className="w-3.5 h-3.5" fill={answers[current]?.flagged ? 'currentColor' : 'none'} />
                {answers[current]?.flagged ? 'Flagged' : 'Flag for review'}
              </button>
            </div>

            <h2 className="text-lg text-text2 font-medium mb-6 leading-relaxed">{q.question}</h2>

            {q.type === 'short_answer' ? (
              <textarea
                value={answers[current]?.answer || ''}
                onChange={(e) => setAnswer(current, e.target.value)}
                rows={5}
                placeholder="Your answer…"
                className="field-shell w-full rounded-xl px-3.5 py-3 text-sm text-text2 placeholder:text-text2-faint focus:outline-none resize-none"
              />
            ) : (
              <div className="space-y-2">
                {q.options.map((opt) => (
                  <label
                    key={opt}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-colors ${
                      answers[current]?.answer === opt ? 'border-brand/50 bg-brand/10' : 'border-line2 bg-card-raised hover:bg-card-hover'
                    }`}
                  >
                    <input
                      type="radio" name={`q-${current}`} checked={answers[current]?.answer === opt}
                      onChange={() => setAnswer(current, opt)} className="accent-brand"
                    />
                    <span className="text-sm text-text2">{opt}</span>
                  </label>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between mt-8">
              <button
                onClick={() => setCurrent((c) => Math.max(0, c - 1))}
                disabled={current === 0}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-line2 text-text2-muted hover:text-text2 hover:bg-card-hover transition-colors text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>
              <button
                onClick={() => setCurrent((c) => Math.min(questions.length - 1, c + 1))}
                disabled={current === questions.length - 1}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-line2 text-text2-muted hover:text-text2 hover:bg-card-hover transition-colors text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </main>

        <aside className="hidden md:block w-64 flex-shrink-0 border-l border-line2 bg-card/60 overflow-y-auto px-4 py-6">
          <p className="text-xs text-text2-faint mb-3">{answeredCount}/{questions.length} answered</p>
          <div className="grid grid-cols-5 gap-1.5">
            {questions.map((_, i) => {
              const a = answers[i];
              const isAnswered = a?.answer?.trim();
              return (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={`relative w-9 h-9 rounded-lg text-xs font-medium flex items-center justify-center transition-colors ${
                    i === current ? 'border-2 border-brand text-text2' :
                    isAnswered ? 'bg-brand/15 text-brand-soft' : 'bg-card-raised text-text2-faint border border-line2'
                  }`}
                >
                  {i + 1}
                  {a?.flagged && <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-state-warning" />}
                </button>
              );
            })}
          </div>
        </aside>
      </div>
    </div>
  );
}
