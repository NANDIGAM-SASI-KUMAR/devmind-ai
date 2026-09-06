import { useState, useEffect } from 'react';
import { X, Loader2, ArrowRight } from 'lucide-react';

const LEVELS = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' }
];

export default function NewStudyPlanModal({ onClose, onCreate }) {
  const [name, setName] = useState('');
  const [level, setLevel] = useState('beginner');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handler = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try { await onCreate(name.trim(), level); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="w-full max-w-md auth-card rounded-2xl p-6 shadow-2xl shadow-black/50 auth-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-1">
          <h2 className="font-heading text-xl font-bold text-text2">New study plan</h2>
          <button onClick={onClose} aria-label="Close" className="p-1.5 rounded-lg text-text2-faint hover:text-text2 hover:bg-card-hover transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-sm text-text2-faint mb-6">Upload your course material and get a plan built around it.</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <label className="block">
            <span className="block text-xs font-medium text-text2-muted mb-1.5">Subject name</span>
            <input
              type="text"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="field-shell w-full rounded-xl px-3.5 py-3 text-sm text-text2 placeholder:text-text2-faint focus:outline-none"
              placeholder="Operating Systems"
            />
          </label>

          <div>
            <span className="block text-xs font-medium text-text2-muted mb-2">Your understanding level</span>
            <div className="grid grid-cols-3 gap-2">
              {LEVELS.map((l) => (
                <button
                  key={l.value}
                  type="button"
                  onClick={() => setLevel(l.value)}
                  className={`px-3 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                    level === l.value
                      ? 'bg-brand text-white border-brand'
                      : 'bg-card-raised text-text2-muted border-line2 hover:text-text2'
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="btn-brand w-full py-3 rounded-xl text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Create <ArrowRight className="w-4 h-4" /></>}
          </button>
        </form>
      </div>
    </div>
  );
}
