import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Loader2, ArrowRight, X } from 'lucide-react';
import { examsAPI } from '../../api/exams.js';

export default function RecommendationCard({ recommendation, onChanged, showPlanName }) {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  const handleStartFollowUp = async () => {
    setBusy(true);
    try {
      const exam = await examsAPI.startFollowUp(recommendation._id);
      navigate(`/examinations/${exam._id}`);
    } catch (err) {
      alert(err.response?.data?.message || 'Could not start a follow-up assessment right now.');
    } finally {
      setBusy(false);
    }
  };

  const handleDismiss = async () => {
    setBusy(true);
    try {
      await examsAPI.dismissRecommendation(recommendation._id);
      onChanged?.();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-2xl border border-state-warning/30 bg-state-warning/[0.06] p-6">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-state-warning" />
          <h3 className="font-heading text-sm font-bold text-text2 tracking-wide uppercase">AI recommended revision</h3>
        </div>
        <button onClick={handleDismiss} disabled={busy} aria-label="Dismiss recommendation" className="p-1 rounded-lg text-text2-faint hover:text-text2 hover:bg-card-hover transition-colors">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {showPlanName && recommendation.studyPlan && (
        <p className="text-xs text-text2-faint mb-2">{recommendation.studyPlan.name}</p>
      )}

      <p className="text-sm text-text2-muted mb-3">
        Based on your latest examination, focus on:{' '}
        <span className="text-text2 font-medium">{recommendation.weakTopics.join(', ')}</span>
      </p>

      <ul className="space-y-1.5 mb-4">
        {recommendation.recommendedActions.map((a, i) => (
          <li key={i} className="text-sm text-text2-muted flex items-start gap-2">
            <span className="text-state-warning mt-1">•</span>
            <span>{a}</span>
          </li>
        ))}
      </ul>

      <button
        onClick={handleStartFollowUp}
        disabled={busy || recommendation.status === 'accepted'}
        className="btn-brand flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-50"
      >
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : recommendation.status === 'accepted' ? 'Follow-up started' : <>Take follow-up assessment <ArrowRight className="w-3.5 h-3.5" /></>}
      </button>
    </div>
  );
}
