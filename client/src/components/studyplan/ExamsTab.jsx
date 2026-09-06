import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, Plus, ClipboardCheck, ChevronRight, TrendingUp } from 'lucide-react';
import { examsAPI } from '../../api/exams.js';
import CreateExamModal from '../exam/CreateExamModal.jsx';
import RecommendationCard from '../exam/RecommendationCard.jsx';

const masteryColor = (pct) => (pct >= 75 ? 'bg-state-success' : pct >= 50 ? 'bg-state-warning' : 'bg-state-danger');

export default function ExamsTab({ planId, readyCount }) {
  const navigate = useNavigate();
  const [exams, setExams] = useState(null);
  const [history, setHistory] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const [mastery, setMastery] = useState(null);
  const [showCreate, setShowCreate] = useState(false);

  const load = () => {
    examsAPI.listForPlan(planId).then(setExams).catch(() => setExams([]));
    examsAPI.historyForPlan(planId).then(setHistory).catch(() => setHistory([]));
    examsAPI.recommendationsForPlan(planId).then((r) => setRecommendations(r.filter((x) => x.status === 'pending' || x.status === 'accepted'))).catch(() => setRecommendations([]));
    examsAPI.mastery(planId).then(setMastery).catch(() => setMastery({ hasData: false, topics: [] }));
  };

  useEffect(load, [planId]);

  if (readyCount === 0) {
    return (
      <div className="bg-card border border-line2 rounded-2xl p-8 text-center">
        <ClipboardCheck className="w-8 h-8 text-text2-faint mx-auto mb-3" />
        <p className="text-sm text-text2-muted">Upload course material first — examinations are generated from what you actually upload.</p>
      </div>
    );
  }

  const loading = exams === null || history === null || recommendations === null || mastery === null;
  if (loading) return <div className="py-12 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-brand" /></div>;

  return (
    <div className="space-y-5">
      {recommendations.length > 0 && recommendations.map((r) => (
        <RecommendationCard key={r._id} recommendation={r} onChanged={load} />
      ))}

      <div className="bg-card border border-line2 rounded-2xl p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ClipboardCheck className="w-4 h-4 text-brand-soft" />
              <h2 className="font-heading text-lg font-bold text-text2">Examinations</h2>
            </div>
            <p className="text-sm text-text2-faint">Timed, source-grounded assessments — with weak-area detection built in.</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="btn-brand px-4 py-2.5 rounded-xl text-white text-sm font-semibold flex items-center gap-2 flex-shrink-0"
          >
            <Plus className="w-4 h-4" /> Create
          </button>
        </div>
      </div>

      {exams.length > 0 && (
        <div className="space-y-1.5">
          {exams.map((e) => (
            <Link
              key={e._id}
              to={`/examinations/${e._id}`}
              className="flex items-center gap-3 px-4 py-3.5 rounded-xl bg-card border border-line2 hover:bg-card-hover transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm text-text2 truncate">{e.title}</p>
                <p className="text-xs text-text2-faint">{e.totalQuestions} questions · {e.durationMinutes} min · {e.difficulty}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-text2-faint flex-shrink-0" />
            </Link>
          ))}
        </div>
      )}

      {history.length > 0 && (
        <div className="bg-card border border-line2 rounded-2xl p-6">
          <h3 className="font-heading text-sm font-bold text-text2-muted uppercase tracking-wide mb-3">Recent results</h3>
          <div className="space-y-2">
            {history.slice(0, 5).map((h) => (
              <Link key={h._id} to={`/examinations/attempts/${h._id}/result`} className="flex items-center justify-between px-2 py-2 rounded-lg hover:bg-card-hover transition-colors">
                <span className="text-sm text-text2-muted">{new Date(h.submittedAt).toLocaleDateString()}{h.autoSubmitted && ' (auto)'}</span>
                <span className="text-sm font-semibold text-text2">{h.score}%</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {mastery.hasData && (
        <div className="bg-card border border-line2 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-brand-soft" />
            <h3 className="font-heading text-sm font-bold text-text2-muted uppercase tracking-wide">Mastery (quizzes + exams combined)</h3>
          </div>
          <div className="space-y-3">
            {mastery.topics.map((t) => (
              <div key={t.topic}>
                <div className="flex items-center justify-between mb-1.5 text-sm">
                  <span className="text-text2">{t.topic}</span>
                  <span className="text-text2-faint">{t.mastery}%</span>
                </div>
                <div className="h-2 rounded-full bg-card-raised overflow-hidden mb-1.5">
                  <div className={`h-full rounded-full ${masteryColor(t.mastery)}`} style={{ width: `${t.mastery}%` }} />
                </div>
                {t.concepts.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {t.concepts.map((c) => (
                      <span key={c.concept} className="px-2 py-0.5 rounded-md text-[11px] text-text2-faint bg-card-raised border border-line2">
                        {c.concept}: {c.mastery}%
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {showCreate && (
        <CreateExamModal
          planId={planId}
          onClose={() => setShowCreate(false)}
          onCreated={(exam) => { setShowCreate(false); navigate(`/examinations/${exam._id}`); }}
        />
      )}
    </div>
  );
}
