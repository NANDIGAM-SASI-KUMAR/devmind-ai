import { useState, useEffect } from 'react';
import { X, Loader2, ClipboardCheck, AlertCircle } from 'lucide-react';
import { studyPlansAPI } from '../../api/studyPlans.js';
import { examsAPI } from '../../api/exams.js';

const SCOPES = [
  { value: 'full', label: 'Entire study plan', desc: 'Cover every topic in this study plan.' },
  { value: 'topics', label: 'Selected topics', desc: 'Choose specific topics to be examined on.' },
  { value: 'weak_areas', label: 'Weak areas', desc: 'Focus on topics you’ve scored below 70% on in quizzes.' },
  { value: 'previous', label: 'Previous exam’s weak areas', desc: 'Re-test the topics you struggled with last time.' }
];

const TYPES = [
  { value: 'mcq', label: 'Multiple choice' },
  { value: 'true_false', label: 'True / False' },
  { value: 'short_answer', label: 'Short answer' }
];

export default function CreateExamModal({ planId: fixedPlanId, onClose, onCreated }) {
  const [plans, setPlans] = useState(fixedPlanId ? null : []);
  const [planId, setPlanId] = useState(fixedPlanId || '');
  const [planTopics, setPlanTopics] = useState([]);
  const [scope, setScope] = useState('full');
  const [selectedTopics, setSelectedTopics] = useState([]);
  const [totalQuestions, setTotalQuestions] = useState(15);
  const [durationMinutes, setDurationMinutes] = useState(20);
  const [difficulty, setDifficulty] = useState('mixed');
  const [questionTypes, setQuestionTypes] = useState(['mcq', 'true_false', 'short_answer']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const handler = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', handler); document.body.style.overflow = ''; };
  }, [onClose]);

  useEffect(() => {
    if (!fixedPlanId) studyPlansAPI.list().then(setPlans).catch(() => setPlans([]));
  }, [fixedPlanId]);

  useEffect(() => {
    if (!planId) { setPlanTopics([]); return; }
    studyPlansAPI.get(planId).then((plan) => {
      try {
        const weeks = plan.plan ? JSON.parse(plan.plan) : [];
        const topics = [...new Set(weeks.flatMap((w) => (w.topics || []).map((t) => t.title)))];
        setPlanTopics(topics);
      } catch {
        setPlanTopics([]);
      }
    }).catch(() => setPlanTopics([]));
  }, [planId]);

  const toggleTopic = (t) => setSelectedTopics((ts) => (ts.includes(t) ? ts.filter((x) => x !== t) : [...ts, t]));
  const toggleType = (t) => setQuestionTypes((ts) => (ts.includes(t) ? ts.filter((x) => x !== t) : [...ts, t]));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!planId) { setError('Choose a study plan first.'); return; }
    if (questionTypes.length === 0) { setError('Select at least one question type.'); return; }
    if (scope === 'topics' && selectedTopics.length === 0) { setError('Select at least one topic.'); return; }

    setError('');
    setLoading(true);
    try {
      const exam = await examsAPI.create(planId, {
        scope, topics: scope === 'topics' ? selectedTopics : undefined,
        totalQuestions, durationMinutes, difficulty, questionTypes
      });
      onCreated(exam);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create an examination right now.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="w-full max-w-lg auth-card rounded-2xl p-6 md:p-8 max-h-[90vh] overflow-y-auto relative shadow-2xl shadow-black/50 auth-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} aria-label="Close" className="absolute top-5 right-5 p-1.5 rounded-lg text-text2-faint hover:text-text2 hover:bg-card-hover transition-colors">
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2.5 mb-1">
          <ClipboardCheck className="w-4 h-4 text-brand-soft" />
          <h2 className="font-heading text-xl font-bold text-text2">Create examination</h2>
        </div>
        <p className="text-text2-muted text-sm mb-6">Grounded in your study plan's real material — nothing you haven't studied.</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {!fixedPlanId && (
            <label className="block">
              <span className="block text-xs font-medium text-text2-muted mb-1.5">Study plan</span>
              {plans === null ? (
                <div className="py-2"><Loader2 className="w-4 h-4 animate-spin text-brand" /></div>
              ) : (
                <select
                  value={planId}
                  onChange={(e) => setPlanId(e.target.value)}
                  className="field-shell w-full rounded-xl px-3.5 py-3 text-sm text-text2 focus:outline-none"
                >
                  <option value="">Choose a study plan…</option>
                  {plans.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
                </select>
              )}
            </label>
          )}

          <div>
            <span className="block text-xs font-medium text-text2-muted mb-2">Coverage</span>
            <div className="space-y-1.5">
              {SCOPES.map((s) => (
                <label
                  key={s.value}
                  className={`flex items-start gap-2.5 px-3.5 py-2.5 rounded-xl border cursor-pointer transition-colors ${
                    scope === s.value ? 'border-brand/50 bg-brand/10' : 'border-line2 bg-card-raised hover:bg-card-hover'
                  }`}
                >
                  <input type="radio" name="scope" checked={scope === s.value} onChange={() => setScope(s.value)} className="accent-brand mt-0.5" />
                  <div>
                    <p className="text-sm text-text2 font-medium">{s.label}</p>
                    <p className="text-xs text-text2-faint">{s.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {scope === 'topics' && (
            <div>
              <span className="block text-xs font-medium text-text2-muted mb-2">Topics</span>
              {planTopics.length === 0 ? (
                <p className="text-xs text-text2-faint">Generate this study plan first to see its topics.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {planTopics.map((t) => (
                    <button
                      key={t} type="button" onClick={() => toggleTopic(t)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                        selectedTopics.includes(t) ? 'border-brand/50 bg-brand/10 text-brand-soft' : 'border-line2 text-text2-muted hover:text-text2'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="block text-xs font-medium text-text2-muted mb-1.5">Questions</span>
              <input
                type="number" min={5} max={50} value={totalQuestions}
                onChange={(e) => setTotalQuestions(Number(e.target.value))}
                className="field-shell w-full rounded-xl px-3.5 py-2.5 text-sm text-text2 focus:outline-none"
              />
            </label>
            <label className="block">
              <span className="block text-xs font-medium text-text2-muted mb-1.5">Duration (minutes)</span>
              <input
                type="number" min={5} max={180} value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="field-shell w-full rounded-xl px-3.5 py-2.5 text-sm text-text2 focus:outline-none"
              />
            </label>
          </div>

          <label className="block">
            <span className="block text-xs font-medium text-text2-muted mb-1.5">Difficulty</span>
            <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="field-shell w-full rounded-xl px-3.5 py-2.5 text-sm text-text2 focus:outline-none">
              <option value="mixed">Mixed</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </label>

          <div>
            <span className="block text-xs font-medium text-text2-muted mb-2">Question types</span>
            <div className="flex flex-wrap gap-1.5">
              {TYPES.map((t) => (
                <button
                  key={t.value} type="button" onClick={() => toggleType(t.value)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    questionTypes.includes(t.value) ? 'border-brand/50 bg-brand/10 text-brand-soft' : 'border-line2 text-text2-muted hover:text-text2'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-state-danger/30 bg-state-danger/10 px-3.5 py-2.5 text-state-danger text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <button
            type="submit" disabled={loading}
            className="btn-brand w-full py-3 rounded-xl text-white font-semibold disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
          >
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating your examination…</> : 'Generate examination'}
          </button>
        </form>
      </div>
    </div>
  );
}
