import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Loader2, CheckCircle2, XCircle, AlertTriangle, Clock } from 'lucide-react';
import AppShell from '../components/shell/AppShell.jsx';
import { examsAPI } from '../api/exams.js';

const barColor = (pct) => (pct >= 75 ? 'bg-state-success' : pct >= 50 ? 'bg-state-warning' : 'bg-state-danger');

export default function ExamResultPage() {
  const { attemptId } = useParams();
  const [result, setResult] = useState(null);

  useEffect(() => {
    examsAPI.getResult(attemptId).then(setResult).catch(() => setResult(false));
  }, [attemptId]);

  if (result === null) {
    return <AppShell><div className="h-full flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-brand" /></div></AppShell>;
  }
  if (result === false) {
    return <AppShell><div className="h-full flex items-center justify-center text-text2-muted">Result not available.</div></AppShell>;
  }

  return (
    <AppShell>
      <main className="h-full overflow-y-auto px-6 md:px-10 py-10 max-w-[820px] mx-auto">
        <Link to="/examinations" className="inline-flex items-center gap-1.5 text-sm text-text2-faint hover:text-text2 transition-colors mb-6">
          <ArrowLeft className="w-3.5 h-3.5" /> Examinations
        </Link>

        <div className="bg-card border border-line2 rounded-2xl p-8 text-center mb-6">
          <p className="text-xs text-text2-faint uppercase tracking-wide mb-2">{result.title}</p>
          <p className="text-6xl font-heading font-extrabold text-text2 mb-2">{result.score}%</p>
          <p className="text-sm text-text2-muted">
            {result.results.filter((r) => r.correct).length} of {result.results.length} correct
            {result.autoSubmitted && ' · auto-submitted when time expired'}
          </p>
          {result.totalTimeSeconds && (
            <p className="text-xs text-text2-faint mt-1 flex items-center justify-center gap-1.5">
              <Clock className="w-3 h-3" /> {Math.round(result.totalTimeSeconds / 60)} minutes
            </p>
          )}
        </div>

        {result.weakTopics.length > 0 && (
          <div className="rounded-2xl border border-state-warning/30 bg-state-warning/[0.06] p-6 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-state-warning" />
              <h2 className="font-heading text-sm font-bold text-text2 uppercase tracking-wide">Weak areas identified</h2>
            </div>
            <p className="text-sm text-text2-muted mb-2">
              {result.weakTopics.join(', ')}
            </p>
            {result.weakConcepts.length > 0 && (
              <p className="text-xs text-text2-faint">Specific concepts to revisit: {result.weakConcepts.join(', ')}</p>
            )}
            <p className="text-xs text-text2-faint mt-3">
              Check your study plan — a revision recommendation has been added there.
            </p>
          </div>
        )}

        <div className="bg-card border border-line2 rounded-2xl p-6 mb-6">
          <h2 className="font-heading text-sm font-bold text-text2-muted uppercase tracking-wide mb-4">Topic performance</h2>
          <div className="space-y-3">
            {result.topicPerformance.map((t) => (
              <div key={t.topic}>
                <div className="flex items-center justify-between mb-1.5 text-sm">
                  <span className="text-text2">{t.topic}</span>
                  <span className="text-text2-faint">{t.percentage}% ({t.correct}/{t.total})</span>
                </div>
                <div className="h-2 rounded-full bg-card-raised overflow-hidden">
                  <div className={`h-full rounded-full ${barColor(t.percentage)}`} style={{ width: `${t.percentage}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {result.difficultyPerformance.length > 0 && (
          <div className="bg-card border border-line2 rounded-2xl p-6 mb-6">
            <h2 className="font-heading text-sm font-bold text-text2-muted uppercase tracking-wide mb-4">By difficulty</h2>
            <div className="grid grid-cols-3 gap-3">
              {result.difficultyPerformance.map((d) => (
                <div key={d.topic} className="text-center">
                  <p className="text-2xl font-heading font-extrabold text-text2">{d.percentage}%</p>
                  <p className="text-xs text-text2-faint capitalize">{d.topic}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-3">
          <h2 className="font-heading text-sm font-bold text-text2-muted uppercase tracking-wide">Question review</h2>
          {result.results.map((r, i) => (
            <div key={i} className="bg-card border border-line2 rounded-2xl p-5">
              <div className="flex items-start gap-2.5 mb-2">
                {r.correct ? (
                  <CheckCircle2 className="w-4 h-4 text-state-success flex-shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-4 h-4 text-state-danger flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className="text-sm font-medium text-text2">{i + 1}. Question</p>
                  <p className="text-xs text-text2-faint">{r.topic}{r.concept ? ` · ${r.concept}` : ''} · {r.difficulty}</p>
                </div>
              </div>
              <div className="ml-6 space-y-1 text-xs">
                <p className="text-text2-faint">Your answer: <span className="text-text2">{r.answer || '(no answer)'}</span></p>
                {!r.correct && <p className="text-text2-faint">Correct answer: <span className="text-state-success">{r.correctAnswer}</span></p>}
                {r.explanation && <p className="text-text2-faint pt-1">{r.explanation}</p>}
                {r.evaluatorNote && <p className="text-text2-faint italic pt-1">{r.evaluatorNote}</p>}
              </div>
            </div>
          ))}
        </div>
      </main>
    </AppShell>
  );
}
