import { Link } from 'react-router-dom';
import { Loader2, ShieldCheck } from 'lucide-react';
import OtpInput from './OtpInput.jsx';
import OrchestratorPreview from '../shared/OrchestratorPreview.jsx';

export function InputField({ icon: Icon, label, type, value, onChange, placeholder, minLength, required = true }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-text2-muted mb-1.5">{label}</span>
      <div className="field-shell rounded-xl flex items-center gap-3 px-3.5 py-3">
        <Icon className="w-4 h-4 text-text2-faint flex-shrink-0" strokeWidth={2} />
        <input
          type={type}
          required={required}
          minLength={minLength}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-transparent text-text2 text-sm placeholder:text-text2-faint focus:outline-none"
        />
      </div>
    </label>
  );
}

export function ErrorBanner({ message }) {
  return (
    <div className="rounded-xl border border-state-danger/30 bg-state-danger/10 px-3.5 py-2.5 text-state-danger text-sm">
      {message}
    </div>
  );
}

export function SubmitButton({ loading, disabled, children }) {
  return (
    <button
      type="submit"
      disabled={loading || disabled}
      className="btn-brand w-full rounded-xl text-white font-semibold py-3 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : children}
    </button>
  );
}

export function OtpStep({ email, code, setCode, onSubmit, onResend, onBack, loading, resending, error, notice, ctaLabel = 'Verify & continue' }) {
  return (
    <>
      <div className="w-11 h-11 rounded-xl bg-brand/15 flex items-center justify-center mb-5">
        <ShieldCheck className="w-5 h-5 text-brand-soft" />
      </div>
      <h1 className="font-heading text-2xl font-bold text-text2 mb-1">Enter your code</h1>
      <p className="text-text2-muted text-sm mb-8">{notice || `We sent a 6-digit code to ${email}`}</p>

      <form onSubmit={onSubmit} className="space-y-6">
        <OtpInput value={code} onChange={setCode} autoFocus />

        {error && <ErrorBanner message={error} />}

        <SubmitButton loading={loading} disabled={code.length !== 6}>{ctaLabel}</SubmitButton>
      </form>

      <div className="flex items-center justify-between mt-6 text-sm">
        <button type="button" onClick={onBack} className="text-text2-muted hover:text-text2 transition-colors">
          ← Back
        </button>
        <button type="button" onClick={onResend} disabled={resending} className="text-brand-soft hover:text-brand-glow transition-colors disabled:opacity-50">
          {resending ? 'Sending…' : 'Resend code'}
        </button>
      </div>
    </>
  );
}

export function AuthShell({ children }) {
  return (
    <div className="min-h-screen mesh-bg flex">
      {/* LEFT — branding panel */}
      <aside className="hidden lg:flex lg:w-[46%] flex-col justify-between p-12 border-r border-line2 relative overflow-hidden">
        <Link to="/" className="flex items-center gap-2.5 relative z-10">
          <div className="w-9 h-9 rounded-lg btn-brand flex items-center justify-center text-white font-heading font-extrabold text-sm">
            dm
          </div>
          <span className="font-heading font-bold text-text2 text-lg">DevMind</span>
        </Link>

        <div className="relative z-10 auth-fade-in">
          <h2 className="font-heading text-4xl font-extrabold text-text2 leading-[1.1] tracking-tight mb-4">
            One workspace, <span className="brand-gradient-text">four specialists</span>.
          </h2>
          <p className="text-text2-muted leading-relaxed max-w-sm mb-10">
            The orchestrator reads every request and routes it to the specialist built for the job — in real time.
          </p>
          <OrchestratorPreview className="max-w-md shadow-2xl shadow-black/40" />
        </div>

        <p className="text-xs text-text2-faint relative z-10">© 2026 DevMind. All rights reserved.</p>
      </aside>

      {/* RIGHT — form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md auth-fade-in">
          <Link to="/" className="lg:hidden flex items-center justify-center gap-2.5 mb-8">
            <div className="w-9 h-9 rounded-lg btn-brand flex items-center justify-center text-white font-heading font-extrabold text-sm">
              dm
            </div>
            <span className="font-heading font-bold text-text2 text-lg">DevMind</span>
          </Link>
          <div className="auth-card rounded-2xl p-8 shadow-2xl shadow-black/40">{children}</div>
        </div>
      </div>
    </div>
  );
}
