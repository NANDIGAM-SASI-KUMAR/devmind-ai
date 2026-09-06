import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Loader2, Clock, ListChecks, BarChart3, Play } from 'lucide-react';
import AppShell from '../components/shell/AppShell.jsx';
import { examsAPI } from '../api/exams.js';

export default function ExamStartPage() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    examsAPI.get(examId).then(setExam).catch(() => setExam(false));
  }, [examId]);

  const handleStart = async () => {
    setStarting(true);
    setError('');
    try {
      const attempt = await examsAPI.startAttempt(examId);
      navigate(`/examinations/attempts/${attempt.attemptId}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not start this examination right now.');
      setStarting(false);
    }
  };

  if (exam === null) {
    return <AppShell><div className="h-full flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-brand" /></div></AppShell>;
  }
  if (exam === false) {
    return <AppShell><div className="h-full flex items-center justify-center text-text2-muted">Examination not found.</div></AppShell>;
  }

  return (
    <AppShell>
      <main className="h-full overflow-y-auto px-6 md:px-10 py-10 max-w-[700px] mx-auto">
        <Link to="/examinations" className="inline-flex items-center gap-1.5 text-sm text-text2-faint hover:text-text2 transition-colors mb-6">
          <ArrowLeft className="w-3.5 h-3.5" /> Examinations
        </Link>

        <h1 className="font-heading text-3xl md:text-4xl font-extrabold text-text2 tracking-tight mb-2">{exam.title}</h1>
        <p className="text-text2-muted mb-8">Once you start, the timer runs server-side and cannot be paused or reset by refreshing.</p>

        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-card border border-line2 rounded-2xl p-5 text-center">
            <ListChecks className="w-4 h-4 text-brand-soft mx-auto mb-2" />
            <p className="font-heading text-xl font-extrabold text-text2">{exam.blueprint.totalQuestions}</p>
            <p className="text-xs text-text2-faint">Questions</p>
          </div>
          <div className="bg-card border border-line2 rounded-2xl p-5 text-center">
            <Clock className="w-4 h-4 text-brand-soft mx-auto mb-2" />
            <p className="font-heading text-xl font-extrabold text-text2">{exam.blueprint.durationMinutes}</p>
            <p className="text-xs text-text2-faint">Minutes</p>
          </div>
          <div className="bg-card border border-line2 rounded-2xl p-5 text-center">
            <BarChart3 className="w-4 h-4 text-brand-soft mx-auto mb-2" />
            <p className="font-heading text-xl font-extrabold text-text2 capitalize">{exam.blueprint.difficulty}</p>
            <p className="text-xs text-text2-faint">Difficulty</p>
          </div>
        </div>

        <div className="bg-card border border-line2 rounded-2xl p-6 mb-6">
          <h2 className="font-heading text-sm font-bold text-text2-muted uppercase tracking-wide mb-3">Topic breakdown</h2>
          <div className="space-y-2">
            {exam.blueprint.topics.map((t) => (
              <div key={t.topic} className="flex items-center justify-between text-sm">
                <span className="text-text2">{t.topic}</span>
                <span className="text-text2-faint">{t.questionCount} questions · {t.difficulty}</span>
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-state-danger/30 bg-state-danger/10 px-3.5 py-2.5 text-state-danger text-sm mb-4">{error}</div>
        )}

        <button
          onClick={handleStart}
          disabled={starting}
          className="btn-brand w-full py-3.5 rounded-xl text-white font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {starting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Play className="w-4 h-4" /> Start examination</>}
        </button>
      </main>
    </AppShell>
  );
}
