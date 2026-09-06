import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X, Loader2, SearchCode, AlertCircle, ArrowRight } from 'lucide-react';
import { publicAPI } from '../../api/public.js';

export default function FreeAuditModal({ onClose }) {
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('');
  const [loading, setLoading] = useState(false);
  const [review, setReview] = useState('');
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
    if (!code.trim()) return;
    setError('');
    setReview('');
    setLoading(true);
    try {
      const result = await publicAPI.freeAudit({ code, language });
      setReview(result.review);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not run the audit right now. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="w-full max-w-xl auth-card rounded-2xl p-6 md:p-8 relative shadow-2xl shadow-black/50 auth-fade-in max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} aria-label="Close" className="absolute top-5 right-5 p-1.5 rounded-lg text-text2-faint hover:text-text2 hover:bg-card-hover transition-colors">
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2.5 mb-1">
          <SearchCode className="w-4 h-4 text-brand-soft" />
          <h2 className="font-heading text-xl font-bold text-text2">Free code audit</h2>
        </div>
        <p className="text-text2-muted text-sm mb-6">
          Paste a function or file. A real pass from DevMind's Reviewer agent — no signup needed.
        </p>

        {!review ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="field-shell w-full rounded-xl px-3.5 py-2.5 text-sm text-text2 placeholder:text-text2-faint focus:outline-none"
              placeholder="Language (optional) — e.g. JavaScript, Python"
            />
            <textarea
              autoFocus
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              rows={10}
              maxLength={6000}
              className="field-shell w-full rounded-xl px-3.5 py-3 text-sm text-text2 placeholder:text-text2-faint focus:outline-none resize-none font-mono"
              placeholder="Paste your code here…"
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-text2-faint">{code.length}/6000</span>
              {error && (
                <span className="flex items-center gap-1.5 text-xs text-state-danger">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {error}
                </span>
              )}
            </div>
            <button
              type="submit"
              disabled={loading || !code.trim()}
              className="btn-brand w-full py-3 rounded-xl text-white font-semibold disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Run free audit'}
            </button>
          </form>
        ) : (
          <div className="space-y-5">
            <div className="rounded-xl bg-card-raised border border-line2 p-4">
              <p className="text-sm text-text2 leading-relaxed whitespace-pre-wrap">{review}</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => { setReview(''); setCode(''); }}
                className="flex-1 py-2.5 rounded-xl border border-line2 text-text2-muted hover:text-text2 hover:border-line2-strong transition-colors text-sm font-medium"
              >
                Audit something else
              </button>
              <Link
                to="/signup"
                className="btn-brand flex-1 py-2.5 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2"
              >
                Get the full review <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
