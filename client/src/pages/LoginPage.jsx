import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { ArrowUpRight, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row atmosphere">
      {/* LEFT — editorial column */}
      <aside className="md:w-1/2 md:border-r border-rule p-6 md:p-10 flex flex-col justify-between min-h-[40vh] md:min-h-screen relative">
        <div>
          <Link to="/" className="flex items-center gap-3">
            <span className="stamp text-signal">dm</span>
            <div className="label-xs text-ink-faint">DEVMIND / EST. 2026</div>
          </Link>
        </div>

        <div className="my-12 md:my-0 stagger">
          <div className="label-xs text-signal mb-4">§ ENTRY · 002</div>
          <blockquote className="display text-5xl md:text-6xl lg:text-7xl leading-[0.95] mb-8">
            <span className="display-italic">"Welcome</span> back to the workshop."
          </blockquote>
          <div className="dotted-rule max-w-xs mb-6"></div>
          <p className="text-ink-muted font-display italic text-lg max-w-md leading-relaxed">
            Your projects, conversations, and small machines have been kept warm.
          </p>
        </div>

        <div className="label-xs text-ink-faint hidden md:flex justify-between">
          <span>VOL. 01</span>
          <span>SIGN IN · LEAF Nº 002</span>
        </div>
      </aside>

      {/* RIGHT — form */}
      <section className="md:w-1/2 p-6 md:p-10 flex flex-col justify-center">
        <div className="max-w-md w-full mx-auto stagger">
          <div className="flex items-baseline gap-4 mb-3">
            <span className="label-xs text-signal">§ 02</span>
            <span className="label-xs text-ink-faint">Sign in</span>
          </div>
          <h1 className="display text-5xl md:text-6xl mb-3">
            <span className="display-italic">Hello</span> again.
          </h1>
          <p className="text-ink-muted mb-10">Enter your credentials below.</p>

          <form onSubmit={handleSubmit} className="space-y-7">
            <Field
              n="01"
              label="Email"
              type="email"
              value={form.email}
              onChange={(v) => setForm({ ...form, email: v })}
              placeholder="you@workshop.dev"
            />

            <Field
              n="02"
              label="Password"
              type="password"
              value={form.password}
              onChange={(v) => setForm({ ...form, password: v })}
              placeholder="•••••••• "
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
                {loading ? 'Authenticating…' : 'Sign in & continue'}
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
              New to the atelier?{' '}
              <Link to="/signup" className="text-signal hover:text-ink transition-colors underline underline-offset-4">
                Request a key
              </Link>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

function Field({ n, label, type, value, onChange, placeholder }) {
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
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent border-b border-rule-strong px-0 py-3 text-lg font-display italic placeholder:text-ink-ghost focus:border-signal focus:outline-none transition-colors"
      />
    </label>
  );
}
