import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, Plus, ClipboardCheck, FileClock, ChevronRight, History } from 'lucide-react';
import AppShell from '../components/shell/AppShell.jsx';
import { examsAPI } from '../api/exams.js';
import CreateExamModal from '../components/exam/CreateExamModal.jsx';
import RecommendationCard from '../components/exam/RecommendationCard.jsx';

export default function ExaminationsPage() {
  const navigate = useNavigate();
  const [exams, setExams] = useState(null);
  const [history, setHistory] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const [showCreate, setShowCreate] = useState(false);

  const load = () => {
    examsAPI.listAll().then(setExams).catch(() => setExams([]));
    examsAPI.listAllHistory().then((h) => setHistory(h.slice(0, 5))).catch(() => setHistory([]));
    examsAPI.listAllRecommendations().then(setRecommendations).catch(() => setRecommendations([]));
  };

  useEffect(load, []);

  const handleCreated = (exam) => {
    setShowCreate(false);
    navigate(`/examinations/${exam._id}`);
  };

  const loading = exams === null || history === null || recommendations === null;

  return (
    <AppShell>
      <main className="h-full overflow-y-auto px-6 md:px-10 py-10 max-w-[900px] mx-auto">
        <div className="flex items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-heading text-3xl md:text-4xl font-extrabold text-text2 tracking-tight mb-2">Examinations</h1>
            <p className="text-text2-muted">Measure what you actually know — grounded in your own study material.</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="btn-brand flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold"
          >
            <Plus className="w-4 h-4" strokeWidth={2.5} />
            Create examination
          </button>
        </div>

        {loading ? (
          <div className="py-24 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-brand" /></div>
        ) : (
          <div className="space-y-8">
            {recommendations.length > 0 && (
              <section className="space-y-3">
                {recommendations.map((r) => (
                  <RecommendationCard key={r._id} recommendation={r} onChanged={load} showPlanName />
                ))}
              </section>
            )}

            <section>
              <h2 className="font-heading text-lg font-bold text-text2 mb-3">Available examinations</h2>
              {exams.length === 0 ? (
                <div className="bg-card border border-line2 rounded-2xl p-8 text-center">
                  <ClipboardCheck className="w-8 h-8 text-text2-faint mx-auto mb-3" />
                  <p className="text-sm text-text2-muted">No examinations yet — create one from any study plan's material.</p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {exams.map((e) => (
                    <Link
                      key={e._id}
                      to={`/examinations/${e._id}`}
                      className="flex items-center gap-3 px-4 py-3.5 rounded-xl bg-card border border-line2 hover:bg-card-hover transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-text2 truncate">{e.title}</p>
                        <p className="text-xs text-text2-faint">
                          {e.studyPlan?.name} · {e.totalQuestions} questions · {e.durationMinutes} min · {e.difficulty}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-text2-faint flex-shrink-0" />
                    </Link>
                  ))}
                </div>
              )}
            </section>

            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-heading text-lg font-bold text-text2">Recent results</h2>
                <Link to="/examinations/history" className="flex items-center gap-1 text-xs text-brand-soft hover:text-brand-glow transition-colors">
                  <History className="w-3.5 h-3.5" /> Full history
                </Link>
              </div>
              {history.length === 0 ? (
                <div className="bg-card border border-line2 rounded-2xl p-8 text-center">
                  <FileClock className="w-8 h-8 text-text2-faint mx-auto mb-3" />
                  <p className="text-sm text-text2-muted">No completed examinations yet.</p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {history.map((h) => (
                    <Link
                      key={h._id}
                      to={`/examinations/attempts/${h._id}/result`}
                      className="flex items-center gap-3 px-4 py-3.5 rounded-xl bg-card border border-line2 hover:bg-card-hover transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-text2 truncate">{h.title}</p>
                        <p className="text-xs text-text2-faint">
                          {h.studyPlan?.name} · {new Date(h.submittedAt).toLocaleDateString()} · {h.questionCount} questions
                          {h.autoSubmitted && ' · auto-submitted'}
                        </p>
                      </div>
                      <span className="text-lg font-heading font-extrabold text-text2 flex-shrink-0">{h.score}%</span>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </main>

      {showCreate && <CreateExamModal onClose={() => setShowCreate(false)} onCreated={handleCreated} />}
    </AppShell>
  );
}
