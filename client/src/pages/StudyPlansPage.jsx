import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Loader2, GraduationCap, Trash2 } from 'lucide-react';
import AppShell from '../components/shell/AppShell.jsx';
import NewStudyPlanModal from '../components/studyplan/NewStudyPlanModal.jsx';
import { studyPlansAPI } from '../api/studyPlans.js';

const LEVEL_LABEL = { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced' };

export default function StudyPlansPage() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const load = async () => {
    setLoading(true);
    try { setPlans(await studyPlansAPI.list()); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (name, level) => {
    const plan = await studyPlansAPI.create(name, level);
    setShowModal(false);
    navigate(`/study-plans/${plan._id}`);
  };

  const handleDelete = async (id, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('Permanently delete this study plan and all its materials?')) return;
    await studyPlansAPI.remove(id);
    setPlans((p) => p.filter((x) => x._id !== id));
  };

  return (
    <AppShell>
      <main className="h-full overflow-y-auto px-6 md:px-10 py-10 max-w-[1000px] mx-auto">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
          <div>
            <p className="text-sm text-text2-faint mb-2">Upload material, get a plan built for you</p>
            <h1 className="font-heading text-4xl md:text-5xl font-extrabold text-text2 tracking-tight">
              Study <span className="brand-gradient-text">plans</span>
            </h1>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="btn-brand flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-white font-semibold w-full md:w-auto"
          >
            <Plus className="w-4 h-4" strokeWidth={2.5} />
            New study plan
          </button>
        </div>

        {loading ? (
          <div className="py-32 flex justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-brand" />
          </div>
        ) : plans.length === 0 ? (
          <div className="py-24 text-center bg-card border border-line2 rounded-2xl">
            <div className="w-14 h-14 rounded-2xl bg-brand/15 flex items-center justify-center mx-auto mb-6">
              <GraduationCap className="w-6 h-6 text-brand-soft" />
            </div>
            <h2 className="font-heading text-2xl font-bold text-text2 mb-2">No study plans yet</h2>
            <p className="text-text2-muted mb-8 max-w-sm mx-auto">
              Upload your course notes, slides, or textbook chapters and get a structured plan built around them.
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="btn-brand inline-flex items-center gap-2 px-5 py-3 rounded-xl text-white font-semibold"
            >
              <Plus className="w-4 h-4" strokeWidth={2.5} />
              Create your first study plan
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {plans.map((plan) => (
              <Link
                key={plan._id}
                to={`/study-plans/${plan._id}`}
                className="group relative bg-card border border-line2 rounded-2xl p-6 hover:border-line2-strong hover:bg-card-hover transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-brand/15 flex items-center justify-center">
                    <GraduationCap className="w-5 h-5 text-brand-soft" />
                  </div>
                  <button
                    onClick={(e) => handleDelete(plan._id, e)}
                    aria-label="Delete study plan"
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-text2-faint hover:text-state-danger hover:bg-state-danger/10 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <h3 className="font-heading text-lg font-bold text-text2 mb-1.5 truncate">{plan.name}</h3>
                <span className="inline-block px-2 py-0.5 rounded-md text-[11px] font-medium text-brand-soft bg-brand/10 border border-brand/25">
                  {LEVEL_LABEL[plan.understandingLevel]}
                </span>
              </Link>
            ))}
          </div>
        )}
      </main>

      {showModal && <NewStudyPlanModal onClose={() => setShowModal(false)} onCreate={handleCreate} />}
    </AppShell>
  );
}
