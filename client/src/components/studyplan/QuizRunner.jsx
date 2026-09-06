import { useState } from 'react';
import { Loader2, CheckCircle2, XCircle, ArrowLeft, AlertTriangle } from 'lucide-react';
import { quizzesAPI } from '../../api/quizzes.js';

export default function QuizRunner({ quiz, onExit }) {
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const setAnswer = (index, value) => setAnswers((a) => ({ ...a, [index]: value }));

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');
    try {
      const payload = quiz.questions.map((_, i) => ({ questionIndex: i, answer: answers[i] || '' }));
      const graded = await quizzesAPI.submit(quiz._id, payload);
      setResult(graded);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not submit this quiz right now.');
    } finally {
      setSubmitting(false);
    }
  };

  const answeredCount = Object.values(answers).filter((v) => v?.trim()).length;

  if (result) {
    return (
      <div className="space-y-5">
        <button onClick={onExit} className="inline-flex items-center gap-1.5 text-sm text-text2-faint hover:text-text2 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to quizzes
        </button>

        <div className="bg-card border border-line2 rounded-2xl p-6 text-center">
          <p className="text-4xl font-heading font-extrabold text-text2 mb-1">{result.score}%</p>
          <p className="text-sm text-text2-faint">
            {result.results.filter((r) => r.correct).length} of {result.results.length} correct
          </p>
          {result.weakTopics?.length > 0 && (
            <div className="flex items-center justify-center gap-1.5 mt-3 text-xs text-state-warning">
              <AlertTriangle className="w-3.5 h-3.5" />
              Focus next on: {result.weakTopics.join(', ')}
            </div>
          )}
        </div>

        <div className="space-y-3">
          {quiz.questions.map((q, i) => {
            const r = result.results[i];
            return (
              <div key={i} className="bg-card border border-line2 rounded-2xl p-5">
                <div className="flex items-start gap-2.5 mb-2">
                  {r.correct ? (
                    <CheckCircle2 className="w-4 h-4 text-state-success flex-shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-4 h-4 text-state-danger flex-shrink-0 mt-0.5" />
                  )}
                  <p className="text-sm font-medium text-text2">{q.question}</p>
                </div>
                <div className="ml-6 space-y-1 text-xs">
                  <p className="text-text2-faint">
                    Your answer: <span className="text-text2">{r.answer || '(no answer)'}</span>
                  </p>
                  {!r.correct && (
                    <p className="text-text2-faint">
                      Correct answer: <span className="text-state-success">{r.correctAnswer}</span>
                    </p>
                  )}
                  {r.explanation && <p className="text-text2-faint pt-1">{r.explanation}</p>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <button onClick={onExit} className="inline-flex items-center gap-1.5 text-sm text-text2-faint hover:text-text2 transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to quizzes
      </button>

      {quiz.questions.map((q, i) => (
        <div key={i} className="bg-card border border-line2 rounded-2xl p-5">
          <p className="text-sm font-medium text-text2 mb-3">
            {i + 1}. {q.question}
          </p>
          {q.type === 'short_answer' ? (
            <input
              value={answers[i] || ''}
              onChange={(e) => setAnswer(i, e.target.value)}
              placeholder="Your answer…"
              className="field-shell w-full rounded-xl px-3.5 py-2.5 text-sm text-text2 placeholder:text-text2-faint focus:outline-none"
            />
          ) : (
            <div className="space-y-1.5">
              {q.options.map((opt) => (
                <label
                  key={opt}
                  className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border cursor-pointer transition-colors ${
                    answers[i] === opt ? 'border-brand/50 bg-brand/10' : 'border-line2 bg-card-raised hover:bg-card-hover'
                  }`}
                >
                  <input
                    type="radio"
                    name={`q-${i}`}
                    checked={answers[i] === opt}
                    onChange={() => setAnswer(i, opt)}
                    className="accent-brand"
                  />
                  <span className="text-sm text-text2">{opt}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      ))}

      {error && (
        <div className="rounded-xl border border-state-danger/30 bg-state-danger/10 px-3.5 py-2.5 text-state-danger text-sm">{error}</div>
      )}

      <div className="flex items-center justify-between">
        <span className="text-xs text-text2-faint">
          {answeredCount}/{quiz.questions.length} answered
        </span>
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="btn-brand px-5 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-50 flex items-center gap-2"
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          Submit quiz
        </button>
      </div>
    </div>
  );
}
