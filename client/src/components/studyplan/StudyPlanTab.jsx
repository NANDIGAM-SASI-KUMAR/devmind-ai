import { useState } from 'react';
import { Loader2, Sparkles, AlertCircle, RefreshCw, CalendarDays } from 'lucide-react';
import { studyPlansAPI } from '../../api/studyPlans.js';

export default function StudyPlanTab({ plan, readyCount, onPlanUpdated }) {
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  const weeks = (() => {
    if (!plan?.plan) return null;
    try {
      return JSON.parse(plan.plan);
    } catch {
      return null;
    }
  })();

  const handleGenerate = async () => {
    setGenerating(true);
    setError('');
    try {
      const updated = await studyPlansAPI.generatePlan(plan._id);
      onPlanUpdated(updated);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not generate a study plan right now.');
    } finally {
      setGenerating(false);
    }
  };

  if (readyCount === 0) {
    return (
      <div className="bg-card border border-line2 rounded-2xl p-8 text-center">
        <CalendarDays className="w-8 h-8 text-text2-faint mx-auto mb-3" />
        <p className="text-sm text-text2-muted">Upload course material first — the plan is generated from what you actually upload.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="bg-card border border-line2 rounded-2xl p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-brand-soft" />
              <h2 className="font-heading text-lg font-bold text-text2">Weekly study plan</h2>
            </div>
            <p className="text-sm text-text2-faint">
              {weeks ? 'Generated from your uploaded material.' : 'Generate a week-by-week curriculum from your uploaded material.'}
            </p>
          </div>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="btn-brand px-4 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-50 flex items-center gap-2 flex-shrink-0"
          >
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : weeks ? <RefreshCw className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
            {generating ? 'Generating…' : weeks ? 'Regenerate' : 'Generate plan'}
          </button>
        </div>
        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-state-danger/30 bg-state-danger/10 px-3.5 py-2.5 text-state-danger text-sm mt-4">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}
        {plan.planGeneratedAt && (
          <p className="text-xs text-text2-faint mt-4">Last generated {new Date(plan.planGeneratedAt).toLocaleString()}</p>
        )}
      </div>

      {weeks && (
        <div className="space-y-3">
          {weeks.map((week, i) => (
            <div key={i} className="bg-card border border-line2 rounded-2xl p-5">
              <h3 className="font-heading text-sm font-bold text-text2 mb-3">
                Week {i + 1} — {week.title}
              </h3>
              <div className="space-y-2.5">
                {week.topics?.map((topic, j) => (
                  <div key={j} className="rounded-xl bg-card-raised border border-line2 px-4 py-3">
                    <p className="text-sm font-medium text-text2 mb-1">{topic.title}</p>
                    <p className="text-xs text-text2-faint leading-relaxed">{topic.summary}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
