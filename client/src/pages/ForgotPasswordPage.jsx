import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../api/auth.js';
import { AuthShell, InputField, ErrorBanner, SubmitButton, OtpStep } from '../components/auth/AuthPrimitives.jsx';
import { Mail, Lock, CheckCircle2, ArrowRight } from 'lucide-react';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();

  const [step, setStep] = useState('request'); // 'request' | 'otp' | 'reset' | 'done'
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [passwords, setPasswords] = useState({ password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [notice, setNotice] = useState('');

  const handleRequest = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authAPI.forgotPassword(email);
      setStep('otp');
      setNotice(`If an account exists for ${email}, a code has been sent`);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await authAPI.verifyResetOtp(email, code);
      setResetToken(data.resetToken);
      setStep('reset');
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
      await authAPI.resendOtp(email, 'reset');
      setNotice(`New code sent to ${email}`);
      setCode('');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not resend code');
    } finally {
      setResending(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setError('');
    if (passwords.password !== passwords.confirm) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await authAPI.resetPassword(resetToken, passwords.password);
      setStep('done');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell>
      {step === 'request' && (
        <>
          <h1 className="font-heading text-2xl font-bold text-text2 mb-1">Reset your password</h1>
          <p className="text-text2-muted text-sm mb-8">Enter your email and we'll send you a verification code.</p>

          <form onSubmit={handleRequest} className="space-y-4">
            <InputField icon={Mail} label="Email address" type="email" value={email} onChange={setEmail} placeholder="you@company.com" />

            {error && <ErrorBanner message={error} />}

            <SubmitButton loading={loading}>
              Send code <ArrowRight className="w-4 h-4" />
            </SubmitButton>
          </form>

          <p className="text-center text-sm text-text2-muted mt-8">
            Remembered it?{' '}
            <Link to="/login" className="text-brand-soft hover:text-brand-glow font-medium transition-colors">
              Back to sign in
            </Link>
          </p>
        </>
      )}

      {step === 'otp' && (
        <OtpStep
          email={email}
          code={code}
          setCode={setCode}
          onSubmit={handleVerify}
          onResend={handleResend}
          onBack={() => setStep('request')}
          loading={loading}
          resending={resending}
          error={error}
          notice={notice}
        />
      )}

      {step === 'reset' && (
        <>
          <h1 className="font-heading text-2xl font-bold text-text2 mb-1">Set a new password</h1>
          <p className="text-text2-muted text-sm mb-8">Choose something strong you'll remember.</p>

          <form onSubmit={handleReset} className="space-y-4">
            <InputField
              icon={Lock}
              label="New password"
              type="password"
              minLength={6}
              value={passwords.password}
              onChange={(v) => setPasswords({ ...passwords, password: v })}
              placeholder="•••••••• (6+ characters)"
            />
            <InputField
              icon={Lock}
              label="Confirm password"
              type="password"
              minLength={6}
              value={passwords.confirm}
              onChange={(v) => setPasswords({ ...passwords, confirm: v })}
              placeholder="••••••••"
            />

            {error && <ErrorBanner message={error} />}

            <SubmitButton loading={loading}>Update password</SubmitButton>
          </form>
        </>
      )}

      {step === 'done' && (
        <div className="text-center py-2">
          <div className="w-12 h-12 rounded-full bg-state-success/15 flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="w-6 h-6 text-state-success" />
          </div>
          <h1 className="font-heading text-2xl font-bold text-text2 mb-1">Password updated</h1>
          <p className="text-text2-muted text-sm mb-8">You can now sign in with your new password.</p>
          <button onClick={() => navigate('/login')} className="btn-brand w-full rounded-xl text-white font-semibold py-3">
            Back to sign in
          </button>
        </div>
      )}
    </AuthShell>
  );
}
