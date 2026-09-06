import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { AuthShell, InputField, ErrorBanner, SubmitButton, OtpStep } from '../components/auth/AuthPrimitives.jsx';
import { User, Mail, Phone, Lock, ArrowRight } from 'lucide-react';

export default function SignupPage() {
  const navigate = useNavigate();
  const { requestSignup, verifySignupOtp, resendOtp } = useAuth();

  const [step, setStep] = useState('form'); // 'form' | 'otp'
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [notice, setNotice] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await requestSignup(form.name, form.email, form.phone, form.password);
      if (data.token) {
        navigate('/dashboard');
        return;
      }
      setStep('otp');
      setNotice(`We sent a 6-digit code to ${form.email}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await verifySignupOtp(form.email, code);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setResending(true);
    try {
      await resendOtp(form.email, 'signup');
      setNotice(`New code sent to ${form.email}`);
      setCode('');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not resend code');
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthShell>
      {step === 'form' ? (
        <>
          <h1 className="font-heading text-2xl font-bold text-text2 mb-1">Create your account</h1>
          <p className="text-text2-muted text-sm mb-8">Your AI team, ready in under a minute.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <InputField
              icon={User}
              label="Full name"
              type="text"
              value={form.name}
              onChange={(v) => setForm({ ...form, name: v })}
              placeholder="Ada Lovelace"
            />
            <InputField
              icon={Mail}
              label="Email address"
              type="email"
              value={form.email}
              onChange={(v) => setForm({ ...form, email: v })}
              placeholder="you@company.com"
            />
            <InputField
              icon={Phone}
              label="Phone number"
              type="tel"
              required={false}
              value={form.phone}
              onChange={(v) => setForm({ ...form, phone: v })}
              placeholder="+91 98765 43210"
            />
            <InputField
              icon={Lock}
              label="Password"
              type="password"
              minLength={6}
              value={form.password}
              onChange={(v) => setForm({ ...form, password: v })}
              placeholder="•••••••• (6+ characters)"
            />

            {error && <ErrorBanner message={error} />}

            <SubmitButton loading={loading}>
              Create account <ArrowRight className="w-4 h-4" />
            </SubmitButton>
          </form>

          <p className="text-center text-sm text-text2-muted mt-8">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-soft hover:text-brand-glow font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </>
      ) : (
        <OtpStep
          email={form.email}
          code={code}
          setCode={setCode}
          onSubmit={handleVerify}
          onResend={handleResend}
          onBack={() => setStep('form')}
          loading={loading}
          resending={resending}
          error={error}
          notice={notice}
          ctaLabel="Verify & create account"
        />
      )}
    </AuthShell>
  );
}
