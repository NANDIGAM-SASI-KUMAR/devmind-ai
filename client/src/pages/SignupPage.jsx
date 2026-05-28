import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { ArrowUpRight, Loader2 } from 'lucide-react';

const PERKS = [
  { n: '01', text: 'Unlimited projects · unlimited conversations.' },
  { n: '02', text: 'Four agents on call — Planner, Coder, Debugger, Docs.' },
  { n: '03', text: 'Real-time streaming. No spinners, no waiting.' },
  { n: '04', text: 'Full history saved per project. Pick up where you left off.' }
];

export default function SignupPage() {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signup(form.name, form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row atmosphere">
      {/* LEFT — form */}
      <section className="md:w-1/2 p-6 md:p-10 flex flex-col justify-center order-2 md:order-1">
        <div className="max-w-md w-full mx-auto stagger">
          <div className="flex items-baseline gap-4 mb-3">
            <span className="label-xs text-signal">§ 01</span>
            <span className="label-xs text-ink-faint">Begin</span>
          </div>
          <h1 className="display text-5xl md:text-6xl mb-3">
            Request a <span className="display-italic">key</span>.
          </h1>
          <p className="text-ink-muted mb-10">Your AI team, ready in under a minute.</p>

          <form onSubmit={handleSubmit} className="space-y-7">
            <Field
              n="01"
              label="Your name"
              type="text"
              value={form.name}
              onChange={(v) => setForm({ ...form, name: v })}
              placeholder="Ada Lovelace"
            />
            <Field
              n="02"
              label="Email"
              type="email"
              value={form.email}
              onChange={(v) => setForm({ ...form, email: v })}
              placeholder="you@workshop.dev"
            />
            <Field
              n="03"
              label="Password"
              type="password"
              minLength={6}
              value={form.password}
              onChange={(v) => setForm({ ...form, password: v })}
              placeholder="•••••••• (6+ characters)"
            />

            {error && (
              <div className="border border-warm/40 bg-warm/5 p-3 text-warm text-sm font-display italic animate-fade-in">
                ⚠ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="group w-full bg-signal text-paper py-4 flex items-center justify-between px-5 hover:bg-ink transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="label-xs">
                {loading ? 'Issuing key…' : 'Create my workshop'}
              </span>
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" strokeWidth={2.5} />
              )}
            </button>
          </form>

          <div className="mt-10 pt-6 border-t border-rule">
            <p className="text-sm text-ink-muted">
              Already a member?{' '}
              <Link to="/login" className="text-signal hover:text-ink transition-colors underline underline-offset-4">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* RIGHT — perks */}
      <aside className="md:w-1/2 md:border-l border-rule p-6 md:p-10 flex flex-col justify-between order-1 md:order-2 min-h-[40vh]">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <span className="stamp text-signal">dm</span>
            <div className="label-xs text-ink-faint">DEVMIND / EST. 2026</div>
          </Link>
          <span className="label-xs text-ink-faint">SIGN UP · LEAF Nº 001</span>
        </div>

        <div className="my-12 md:my-0 stagger">
          <div className="label-xs text-signal mb-4">§ WHAT YOU RECEIVE</div>
          <h2 className="display text-4xl md:text-5xl leading-tight mb-10">
            A small, capable
            <br />
            <span className="display-italic">team-in-a-tab.</span>
          </h2>

          <ul className="space-y-6">
            {PERKS.map((p) => (
              <li key={p.n} className="grid grid-cols-12 gap-4 items-start">
                <div className="col-span-1 numeral text-2xl text-signal">{p.n}</div>
                <div className="col-span-11 text-ink-muted leading-relaxed font-display italic text-lg">{p.text}</div>
              </li>
            ))}
          </ul>
        </div>

        <div className="label-xs text-ink-faint hidden md:block">
          FREE FOREVER · NO CARD REQUIRED
        </div>
      </aside>
    </div>
  );
}

function Field({ n, label, type, value, onChange, placeholder, minLength }) {
  return (
    <label className="block group">
      <div className="flex items-baseline justify-between mb-2">
        <div className="flex items-baseline gap-3">
          <span className="label-xs text-signal">{n}</span>
          <span className="label-xs text-ink-muted">{label}</span>
        </div>
        <span className="label-xs text-ink-faint">required</span>
      </div>
      <input
        type={type}
        required
        minLength={minLength}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent border-b border-rule-strong px-0 py-3 text-lg font-display italic placeholder:text-ink-ghost focus:border-signal focus:outline-none transition-colors"
      />
    </label>
  );
}
