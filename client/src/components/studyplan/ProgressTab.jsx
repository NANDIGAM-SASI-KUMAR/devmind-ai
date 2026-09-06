import { useEffect, useState } from 'react';
import { Loader2, TrendingUp, BarChart3 } from 'lucide-react';
import { studyPlansAPI } from '../../api/studyPlans.js';

const barColor = (pct) => (pct >= 75 ? 'bg-state-success' : pct >= 50 ? 'bg-state-warning' : 'bg-state-danger');

export default function ProgressTab({ planId }) {
  const [progress, setProgress] = useState(null);

  useEffect(() => {
    studyPlansAPI.getProgress(planId).then(setProgress).catch(() => setProgress({ hasData: false, topics: [] }));
  }, [planId]);

  if (progress === null) {
    return <div className="py-12 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-brand" /></div>;
  }

  if (!progress.hasData) {
    return (
      <div className="bg-card border border-line2 rounded-2xl p-8 text-center">
        <BarChart3 className="w-8 h-8 text-text2-faint mx-auto mb-3" />
        <p className="text-sm text-text2-muted">No progress yet — take a quiz to start tracking how well you know each topic.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="bg-card border border-line2 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp className="w-4 h-4 text-brand-soft" />
          <h2 className="font-heading text-lg font-bold text-text2">Overall progress</h2>
        </div>
        <p className="text-sm text-text2-faint mb-4">
          Based on {progress.attemptCount} quiz attempt{progress.attemptCount === 1 ? '' : 's'}.
        </p>
        <p className="text-4xl font-heading font-extrabold text-text2">{progress.overallScore}%</p>
      </div>

      <div className="bg-card border border-line2 rounded-2xl p-6 space-y-4">
        <h3 className="font-heading text-sm font-bold text-text2">By topic</h3>
        {progress.topics.map((t) => (
          <div key={t.topic}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm text-text2">{t.topic}</span>
              <span className="text-xs text-text2-faint">{t.percentage}% · {t.questionsAnswered} answered</span>
            </div>
            <div className="h-2 rounded-full bg-card-raised overflow-hidden">
              <div className={`h-full rounded-full ${barColor(t.percentage)}`} style={{ width: `${t.percentage}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
