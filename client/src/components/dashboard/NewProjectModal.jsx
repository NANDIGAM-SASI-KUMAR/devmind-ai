import { useState, useEffect } from 'react';
import { X, Loader2, ArrowUpRight } from 'lucide-react';

const COLORS = [
  '#D4FF3A', // signal lime
  '#FF6B35', // warm
  '#FFB627', // amber
  '#5B8FE5', // cool
  '#F472B6', // pink
  '#22D3EE', // cyan
  '#FB7185', // rose
  '#A78BFA'  // violet
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
      className="fixed inset-0 bg-paper/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-paper border border-rule-strong p-6 md:p-10 max-h-[90vh] overflow-y-auto relative"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: 'fadeUp 0.5s cubic-bezier(0.22, 1, 0.36, 1)' }}
      >
        {/* close */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-ink-faint hover:text-ink transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* header */}
        <div className="mb-10">
          <div className="flex items-baseline gap-4 mb-3">
            <span className="label-xs text-signal">§ NEW</span>
            <span className="label-xs text-ink-faint">Project / Leaf Nº 001</span>
          </div>
          <h2 className="display text-4xl md:text-5xl mb-2">
            Name your <span className="display-italic">project</span>.
          </h2>
          <p className="text-ink-muted text-sm">A workshop for one idea. Give it a title, then begin.</p>
        </div>

        <div className="hairline mb-8"></div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* name */}
          <label className="block">
            <div className="flex items-baseline justify-between mb-2">
              <div className="flex items-baseline gap-3">
                <span className="label-xs text-signal">01</span>
                <span className="label-xs text-ink-muted">Title</span>
              </div>
              <span className="label-xs text-ink-faint">required</span>
            </div>
            <input
              type="text"
              required
              autoFocus
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full bg-transparent border-b border-rule-strong px-0 py-3 text-2xl md:text-3xl font-display italic placeholder:text-ink-ghost focus:border-signal focus:outline-none transition-colors"
              placeholder="My next idea"
            />
          </label>

          {/* description */}
          <label className="block">
            <div className="flex items-baseline justify-between mb-2">
              <div className="flex items-baseline gap-3">
                <span className="label-xs text-signal">02</span>
                <span className="label-xs text-ink-muted">A brief description</span>
              </div>
              <span className="label-xs text-ink-faint">optional</span>
            </div>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              className="w-full bg-transparent border-b border-rule-strong px-0 py-3 text-lg font-display italic placeholder:text-ink-ghost focus:border-signal focus:outline-none transition-colors resize-none"
              placeholder="What are you building?"
            />
          </label>

          {/* tech */}
          <div>
            <div className="flex items-baseline justify-between mb-2">
              <div className="flex items-baseline gap-3">
                <span className="label-xs text-signal">03</span>
                <span className="label-xs text-ink-muted">Tools of the trade</span>
              </div>
              <span className="label-xs text-ink-faint">optional</span>
            </div>

            {form.tech.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {form.tech.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => removeTech(t)}
                    className="group flex items-center gap-1.5 px-2.5 py-1 label-xs text-signal border border-signal/40 hover:bg-signal hover:text-paper transition-colors"
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
              className="w-full bg-transparent border-b border-rule px-0 py-2 text-base font-display italic placeholder:text-ink-ghost focus:border-signal focus:outline-none transition-colors"
              placeholder="Type and press Enter…"
            />

            <div className="flex flex-wrap gap-1 mt-3">
              {TECH_SUGGESTIONS.filter((s) => !form.tech.includes(s)).slice(0, 8).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => addTech(s)}
                  className="px-2 py-0.5 label-xs text-ink-faint hover:text-signal hover:bg-surface transition-colors"
                >
                  + {s}
                </button>
              ))}
            </div>
          </div>

          {/* color */}
          <div>
            <div className="flex items-baseline gap-3 mb-3">
              <span className="label-xs text-signal">04</span>
              <span className="label-xs text-ink-muted">Spine color</span>
            </div>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setForm({ ...form, color: c })}
                  className={`w-10 h-10 transition-all ${
                    form.color === c ? 'ring-2 ring-offset-4 ring-offset-paper ring-ink scale-110' : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: c }}
                  aria-label={`Color ${c}`}
                />
              ))}
            </div>
          </div>

          <div className="hairline"></div>

          {/* actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3.5 border border-rule-strong text-ink-muted hover:text-ink hover:border-ink transition-colors label-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !form.name.trim()}
              className="flex-[2] py-3.5 bg-signal text-paper hover:bg-ink transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 group label-xs"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  Create project & begin
                  <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" strokeWidth={2.5} />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
