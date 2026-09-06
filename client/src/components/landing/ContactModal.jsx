import { useState, useEffect } from 'react';
import { X, Loader2, Mail, CheckCircle2, AlertCircle } from 'lucide-react';
import { publicAPI } from '../../api/public.js';

export default function ContactModal({ onClose }) {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const handler = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await publicAPI.submitContact(form);
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not send your message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="w-full max-w-md auth-card rounded-2xl p-6 md:p-8 relative shadow-2xl shadow-black/50 auth-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} aria-label="Close" className="absolute top-5 right-5 p-1.5 rounded-lg text-text2-faint hover:text-text2 hover:bg-card-hover transition-colors">
          <X className="w-4 h-4" />
        </button>

        {sent ? (
          <div className="text-center py-6">
            <div className="w-12 h-12 rounded-2xl bg-state-success/15 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-6 h-6 text-state-success" />
            </div>
            <h2 className="font-heading text-xl font-bold text-text2 mb-2">Message sent</h2>
            <p className="text-sm text-text2-muted">Thanks for reaching out — we'll get back to you soon.</p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2.5 mb-1">
              <Mail className="w-4 h-4 text-brand-soft" />
              <h2 className="font-heading text-xl font-bold text-text2">Contact us</h2>
            </div>
            <p className="text-text2-muted text-sm mb-6">Questions, feedback, or a partnership idea — send it over.</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="block">
                <span className="block text-xs font-medium text-text2-muted mb-1.5">Your name</span>
                <input
                  type="text"
                  required
                  autoFocus
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="field-shell w-full rounded-xl px-3.5 py-3 text-sm text-text2 placeholder:text-text2-faint focus:outline-none"
                  placeholder="Ada Lovelace"
                />
              </label>
              <label className="block">
                <span className="block text-xs font-medium text-text2-muted mb-1.5">Email</span>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="field-shell w-full rounded-xl px-3.5 py-3 text-sm text-text2 placeholder:text-text2-faint focus:outline-none"
                  placeholder="ada@example.com"
                />
              </label>
              <label className="block">
                <span className="block text-xs font-medium text-text2-muted mb-1.5">Message</span>
                <textarea
                  required
                  rows={4}
                  maxLength={4000}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="field-shell w-full rounded-xl px-3.5 py-3 text-sm text-text2 placeholder:text-text2-faint focus:outline-none resize-none"
                  placeholder="How can we help?"
                />
              </label>

              {error && (
                <div className="flex items-center gap-2 rounded-xl border border-state-danger/30 bg-state-danger/10 px-3.5 py-2.5 text-state-danger text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-brand w-full py-3 rounded-xl text-white font-semibold disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send message'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
