import { useState, useEffect } from 'react';
import { X, Loader2, ArrowRight } from 'lucide-react';

const COLORS = [
  '#6366F1', // indigo (brand)
  '#38BDF8', // sky
  '#2DD4BF', // teal
  '#FB923C', // orange
  '#F472B6', // pink
  '#A78BFA', // violet
  '#34D399', // emerald
  '#FBBF24'  // amber
];

const TECH_SUGGESTIONS = [
  'React', 'Node.js', 'Express', 'MongoDB', 'TypeScript', 'Next.js',
  'Python', 'FastAPI', 'PostgreSQL', 'Tailwind', 'Vite', 'Prisma'
];

export default function NewProjectModal({ onClose, onCreate }) {
  const [form, setForm] = useState({ name: '', description: '', tech: [], color: COLORS[0] });
  const [techInput, setTechInput] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handler = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const addTech = (t) => {
    const v = t.trim();
    if (v && !form.tech.includes(v)) setForm({ ...form, tech: [...form.tech, v] });
    setTechInput('');
  };
  const removeTech = (t) => setForm({ ...form, tech: form.tech.filter((x) => x !== t) });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setLoading(true);
    try { await onCreate(form); }
    finally { setLoading(false); }
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg auth-card rounded-2xl p-6 md:p-8 max-h-[90vh] overflow-y-auto relative shadow-2xl shadow-black/50 auth-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-5 right-5 p-1.5 rounded-lg text-text2-faint hover:text-text2 hover:bg-card-hover transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <h2 className="font-heading text-2xl font-bold text-text2 mb-1">New project</h2>
        <p className="text-text2-muted text-sm mb-7">A workspace for one idea. Give it a name, then begin.</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <label className="block">
            <span className="block text-xs font-medium text-text2-muted mb-1.5">Project name</span>
            <input
              type="text"
              required
              autoFocus
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="field-shell w-full rounded-xl px-3.5 py-3 text-sm text-text2 placeholder:text-text2-faint focus:outline-none"
              placeholder="My next idea"
            />
          </label>

          <label className="block">
            <span className="block text-xs font-medium text-text2-muted mb-1.5">Description <span className="text-text2-faint">(optional)</span></span>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              className="field-shell w-full rounded-xl px-3.5 py-3 text-sm text-text2 placeholder:text-text2-faint focus:outline-none resize-none"
              placeholder="What are you building?"
            />
          </label>

          <div>
            <span className="block text-xs font-medium text-text2-muted mb-1.5">Tech stack <span className="text-text2-faint">(optional)</span></span>

            {form.tech.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2.5">
                {form.tech.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => removeTech(t)}
                    className="group flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-brand-soft bg-brand/10 border border-brand/25 hover:bg-brand/20 transition-colors"
                  >
                    {t}
                    <X className="w-3 h-3" />
                  </button>
                ))}
              </div>
            )}

            <input
              type="text"
              value={techInput}
              onChange={(e) => setTechInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTech(techInput); }
              }}
              className="field-shell w-full rounded-xl px-3.5 py-2.5 text-sm text-text2 placeholder:text-text2-faint focus:outline-none"
              placeholder="Type and press Enter…"
            />

            <div className="flex flex-wrap gap-1.5 mt-2.5">
              {TECH_SUGGESTIONS.filter((s) => !form.tech.includes(s)).slice(0, 8).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => addTech(s)}
                  className="px-2 py-1 rounded-md text-xs text-text2-faint hover:text-text2 hover:bg-card-hover transition-colors"
                >
                  + {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="block text-xs font-medium text-text2-muted mb-2.5">Accent color</span>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setForm({ ...form, color: c })}
                  className={`w-8 h-8 rounded-lg transition-all ${
                    form.color === c ? 'ring-2 ring-offset-2 ring-offset-card ring-text2 scale-110' : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: c }}
                  aria-label={`Color ${c}`}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-line2 text-text2-muted hover:text-text2 hover:border-line2-strong transition-colors text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !form.name.trim()}
              className="btn-brand flex-[2] py-3 rounded-xl text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Create project <ArrowRight className="w-4 h-4" /></>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
