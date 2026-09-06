import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { AuthShell, InputField, ErrorBanner, SubmitButton, OtpStep } from '../components/auth/AuthPrimitives.jsx';
import { Mail, Lock, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const { requestLogin, verifyLoginOtp, resendOtp } = useAuth();

  const [step, setStep] = useState('form'); // 'form' | 'otp'
  const [form, setForm] = useState({ email: '', password: '' });
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
      const data = await requestLogin(form.email, form.password);
      if (data.token) {
        navigate('/dashboard');
        return;
      }
      setStep('otp');
      setNotice(`We sent a 6-digit code to ${form.email}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await verifyLoginOtp(form.email, code);
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
      await resendOtp(form.email, 'login');
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
          <h1 className="font-heading text-2xl font-bold text-text2 mb-1">Welcome back</h1>
          <p className="text-text2-muted text-sm mb-8">Sign in to continue to your workspace.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <InputField
              icon={Mail}
              label="Email address"
              type="email"
              value={form.email}
              onChange={(v) => setForm({ ...form, email: v })}
              placeholder="you@company.com"
            />
            <InputField
              icon={Lock}
              label="Password"
              type="password"
              value={form.password}
              onChange={(v) => setForm({ ...form, password: v })}
              placeholder="••••••••"
            />

            <div className="flex justify-end -mt-1">
              <Link to="/forgot-password" className="text-sm text-brand-soft hover:text-brand-glow transition-colors">
                Forgot password?
              </Link>
            </div>

            {error && <ErrorBanner message={error} />}

            <SubmitButton loading={loading}>
              Continue <ArrowRight className="w-4 h-4" />
            </SubmitButton>
          </form>

          <p className="text-center text-sm text-text2-muted mt-8">
            Don't have an account?{' '}
            <Link to="/signup" className="text-brand-soft hover:text-brand-glow font-medium transition-colors">
              Sign up
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
        />
      )}
    </AuthShell>
  );
}
