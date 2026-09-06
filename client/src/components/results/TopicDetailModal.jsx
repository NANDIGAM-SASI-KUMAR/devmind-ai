import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { X, Loader2, CheckCircle2, AlertTriangle, GraduationCap, ClipboardCheck } from 'lucide-react';
import { resultsAPI } from '../../api/results.js';

export default function TopicDetailModal({ topic, onClose }) {
  const [detail, setDetail] = useState(null);

  useEffect(() => {
    const handler = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', handler); document.body.style.overflow = ''; };
  }, [onClose]);

  useEffect(() => {
    resultsAPI.topicDetail(topic).then(setDetail).catch(() => setDetail(false));
  }, [topic]);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="w-full max-w-lg auth-card rounded-2xl p-6 md:p-8 max-h-[85vh] overflow-y-auto relative shadow-2xl shadow-black/50 auth-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} aria-label="Close" className="absolute top-5 right-5 p-1.5 rounded-lg text-text2-faint hover:text-text2 hover:bg-card-hover transition-colors">
          <X className="w-4 h-4" />
        </button>

        {detail === null ? (
          <div className="py-12 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-brand" /></div>
        ) : detail === false ? (
          <p className="text-sm text-text2-muted py-8 text-center">Could not load this topic.</p>
        ) : (
          <>
            <h2 className="font-heading text-2xl font-bold text-text2 mb-1">{detail.topic}</h2>
            <p className="text-4xl font-heading font-extrabold text-text2 mb-6">{detail.overallPercentage}%</p>

            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-card-raised border border-line2 rounded-xl p-4">
                <p className="text-xs text-text2-faint mb-1">Quiz performance</p>
                <p className="text-xl font-heading font-bold text-text2">{detail.quizScore ?? '—'}{detail.quizScore !== null ? '%' : ''}</p>
                <p className="text-xs text-text2-faint mt-1">{detail.quizAttemptCount} quiz{detail.quizAttemptCount === 1 ? '' : 'zes'}</p>
              </div>
              <div className="bg-card-raised border border-line2 rounded-xl p-4">
                <p className="text-xs text-text2-faint mb-1">Exam performance</p>
                <p className="text-xl font-heading font-bold text-text2">{detail.examScore ?? '—'}{detail.examScore !== null ? '%' : ''}</p>
                <p className="text-xs text-text2-faint mt-1">{detail.examAttemptCount} exam{detail.examAttemptCount === 1 ? '' : 's'}</p>
              </div>
            </div>

            {detail.concepts.length > 0 && (
              <div className="mb-6">
                <h3 className="font-heading text-xs font-bold text-text2-muted uppercase tracking-wide mb-2">Concepts</h3>
                <div className="space-y-2">
                  {detail.concepts.map((c) => (
                    <div key={c.concept} className="flex items-center justify-between text-sm">
                      <span className="text-text2">{c.concept}</span>
                      <span className="text-text2-faint">{c.percentage}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {detail.strongConcepts.length > 0 && (
              <div className="flex items-start gap-2 mb-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-state-success flex-shrink-0 mt-0.5" />
                <p className="text-text2-muted">Strong: <span className="text-text2">{detail.strongConcepts.join(', ')}</span></p>
              </div>
            )}
            {detail.weakConcepts.length > 0 && (
              <div className="flex items-start gap-2 mb-4 text-sm">
                <AlertTriangle className="w-4 h-4 text-state-warning flex-shrink-0 mt-0.5" />
                <p className="text-text2-muted">Needs improvement: <span className="text-text2">{detail.weakConcepts.join(', ')}</span></p>
              </div>
            )}

            <p className="text-sm text-text2-muted bg-card-raised border border-line2 rounded-xl p-4 mb-6">{detail.recommendation}</p>

            <div className="flex items-center gap-2">
              <Link to="/study-plans" onClick={onClose} className="flex-1 flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-line2 text-text2-muted hover:text-text2 hover:border-line2-strong transition-colors text-sm font-medium">
                <GraduationCap className="w-3.5 h-3.5" /> Study plans
              </Link>
              <Link to="/examinations" onClick={onClose} className="flex-1 flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-line2 text-text2-muted hover:text-text2 hover:border-line2-strong transition-colors text-sm font-medium">
                <ClipboardCheck className="w-3.5 h-3.5" /> Examinations
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
