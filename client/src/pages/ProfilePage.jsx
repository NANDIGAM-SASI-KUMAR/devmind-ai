import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Check, AlertTriangle, ShieldCheck, ShieldOff, Monitor } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import AppShell from '../components/shell/AppShell.jsx';
import { InputField, ErrorBanner } from '../components/auth/AuthPrimitives.jsx';
import { User, Phone, Mail, Lock, Trash2 } from 'lucide-react';
import { securityAPI } from '../api/security.js';

export default function ProfilePage() {
  return (
    <AppShell>
      <main className="h-full overflow-y-auto px-6 md:px-10 py-10 max-w-[720px] mx-auto">
        <div className="mb-8">
          <h1 className="font-heading text-3xl md:text-4xl font-extrabold text-text2 tracking-tight mb-2">Settings</h1>
          <p className="text-text2-muted">Manage your account and preferences.</p>
        </div>

        <div className="space-y-4">
          <PersonalInfoCard />
          <PasswordCard />
          <SecurityCard />
          <DangerZoneCard />
        </div>
      </main>
    </AppShell>
  );
}

const describeUserAgent = (ua = '') => {
  if (/Mobile|Android|iPhone/i.test(ua)) return 'Mobile browser';
  if (/curl|Postman|axios/i.test(ua)) return 'API client';
  if (/Chrome/i.test(ua)) return 'Chrome';
  if (/Firefox/i.test(ua)) return 'Firefox';
  if (/Safari/i.test(ua)) return 'Safari';
  if (/Edg/i.test(ua)) return 'Edge';
  return 'Unknown device';
};

function SecurityCard() {
  const [security, setSecurity] = useState(null);

  useEffect(() => {
    securityAPI.get().then(setSecurity).catch(() => setSecurity(null));
  }, []);

  return (
    <SectionCard title="Security" description="Two-factor authentication and recent sign-in activity.">
      {security === null ? (
        <div className="py-4 flex justify-center"><Loader2 className="w-4 h-4 animate-spin text-brand" /></div>
      ) : (
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            {security.twoFactorEnabled ? (
              <ShieldCheck className="w-4 h-4 text-state-success flex-shrink-0" />
            ) : (
              <ShieldOff className="w-4 h-4 text-state-warning flex-shrink-0" />
            )}
            <div>
              <p className="text-sm text-text2">
                Two-factor authentication (email code) is {security.twoFactorEnabled ? 'required at every sign-in' : 'currently not enforced'}.
              </p>
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-text2-muted uppercase tracking-wide mb-2">Recent sign-in activity</p>
            {security.recentActivity.length === 0 ? (
              <p className="text-sm text-text2-faint">No activity recorded yet.</p>
            ) : (
              <div className="space-y-1.5">
                {security.recentActivity.map((a) => (
                  <div key={a._id} className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-card-raised border border-line2">
                    <Monitor className="w-3.5 h-3.5 text-text2-faint flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-text2">
                        {a.purpose === 'signup' ? 'Account created' : 'Signed in'} · {describeUserAgent(a.userAgent)}
                      </p>
                      <p className="text-xs text-text2-faint">
                        {a.ip} · {new Date(a.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </SectionCard>
  );
}

function SectionCard({ title, description, children }) {
  return (
    <div className="bg-card border border-line2 rounded-2xl p-6">
      <h2 className="font-heading text-lg font-bold text-text2 mb-1">{title}</h2>
      {description && <p className="text-sm text-text2-faint mb-5">{description}</p>}
      {children}
    </div>
  );
}

function PersonalInfoCard() {
  const { user, updateProfile } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const dirty = name !== user?.name || phone !== (user?.phone || '');

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);
    try {
      await updateProfile({ name, phone });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2500);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SectionCard title="Personal information" description="Your name and contact details.">
      <form onSubmit={handleSave} className="space-y-4">
        <InputField icon={User} label="Full name" type="text" value={name} onChange={setName} placeholder="Your name" />
        <InputField icon={Phone} label="Phone number" type="tel" required={false} value={phone} onChange={setPhone} placeholder="+91 98765 43210" />
        <label className="block">
          <span className="block text-xs font-medium text-text2-muted mb-1.5">Email address</span>
          <div className="field-shell rounded-xl flex items-center gap-3 px-3.5 py-3 opacity-60">
            <Mail className="w-4 h-4 text-text2-faint flex-shrink-0" />
            <span className="text-sm text-text2">{user?.email}</span>
          </div>
        </label>

        {error && <ErrorBanner message={error} />}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={!dirty || loading}
            className="btn-brand px-5 py-2.5 rounded-xl text-white text-sm font-semibold flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save changes'}
          </button>
          {success && (
            <span className="flex items-center gap-1.5 text-sm text-state-success">
              <Check className="w-4 h-4" /> Saved
            </span>
          )}
        </div>
      </form>
    </SectionCard>
  );
}

function PasswordCard() {
  const { changePassword } = useAuth();
  const [form, setForm] = useState({ current: '', next: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    if (form.next !== form.confirm) {
      setError('New passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await changePassword(form.current, form.next);
      setForm({ current: '', next: '', confirm: '' });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2500);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SectionCard title="Password" description="Change the password used to sign in.">
      <form onSubmit={handleSubmit} className="space-y-4">
        <InputField icon={Lock} label="Current password" type="password" value={form.current} onChange={(v) => setForm({ ...form, current: v })} placeholder="••••••••" />
        <InputField icon={Lock} label="New password" type="password" minLength={6} value={form.next} onChange={(v) => setForm({ ...form, next: v })} placeholder="•••••••• (6+ characters)" />
        <InputField icon={Lock} label="Confirm new password" type="password" minLength={6} value={form.confirm} onChange={(v) => setForm({ ...form, confirm: v })} placeholder="••••••••" />

        {error && <ErrorBanner message={error} />}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={!form.current || !form.next || loading}
            className="btn-brand px-5 py-2.5 rounded-xl text-white text-sm font-semibold flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update password'}
          </button>
          {success && (
            <span className="flex items-center gap-1.5 text-sm text-state-success">
              <Check className="w-4 h-4" /> Updated
            </span>
          )}
        </div>
      </form>
    </SectionCard>
  );
}

function DangerZoneCard() {
  const { deleteAccount } = useAuth();
  const navigate = useNavigate();
  const [confirming, setConfirming] = useState(false);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await deleteAccount(password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not delete account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-card border border-state-danger/30 rounded-2xl p-6">
      <div className="flex items-start gap-3 mb-1">
        <AlertTriangle className="w-5 h-5 text-state-danger flex-shrink-0 mt-0.5" />
        <div>
          <h2 className="font-heading text-lg font-bold text-text2">Delete account</h2>
          <p className="text-sm text-text2-faint">
            Permanently deletes your account, all projects, conversations, and messages. This cannot be undone.
          </p>
        </div>
      </div>

      {!confirming ? (
        <button
          onClick={() => setConfirming(true)}
          className="mt-4 flex items-center gap-2 px-4 py-2.5 rounded-xl border border-state-danger/40 text-state-danger text-sm font-semibold hover:bg-state-danger/10 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          Delete my account
        </button>
      ) : (
        <form onSubmit={handleDelete} className="mt-4 space-y-3">
          <InputField
            icon={Lock}
            label="Enter your password to confirm"
            type="password"
            value={password}
            onChange={setPassword}
            placeholder="••••••••"
          />
          {error && <ErrorBanner message={error} />}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => { setConfirming(false); setPassword(''); setError(''); }}
              className="px-4 py-2.5 rounded-xl border border-line2 text-text2-muted hover:text-text2 text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!password || loading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-state-danger text-white text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Permanently delete account'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
