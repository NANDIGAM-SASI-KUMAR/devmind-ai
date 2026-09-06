import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Loader2, FileClock } from 'lucide-react';
import AppShell from '../components/shell/AppShell.jsx';
import { examsAPI } from '../api/exams.js';

export default function ExamHistoryPage() {
  const [history, setHistory] = useState(null);

  useEffect(() => {
    examsAPI.listAllHistory().then(setHistory).catch(() => setHistory([]));
  }, []);

  return (
    <AppShell>
      <main className="h-full overflow-y-auto px-6 md:px-10 py-10 max-w-[820px] mx-auto">
        <Link to="/examinations" className="inline-flex items-center gap-1.5 text-sm text-text2-faint hover:text-text2 transition-colors mb-6">
          <ArrowLeft className="w-3.5 h-3.5" /> Examinations
        </Link>

        <h1 className="font-heading text-3xl md:text-4xl font-extrabold text-text2 tracking-tight mb-2">Examination history</h1>
        <p className="text-text2-muted mb-8">Every examination you've completed, in one place.</p>

        {history === null ? (
          <div className="py-24 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-brand" /></div>
        ) : history.length === 0 ? (
          <div className="bg-card border border-line2 rounded-2xl p-8 text-center">
            <FileClock className="w-8 h-8 text-text2-faint mx-auto mb-3" />
            <p className="text-sm text-text2-muted">No completed examinations yet.</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {history.map((h) => (
              <Link
                key={h._id}
                to={`/examinations/attempts/${h._id}/result`}
                className="flex items-center gap-4 px-5 py-4 rounded-xl bg-card border border-line2 hover:bg-card-hover transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text2 truncate">{h.title}</p>
                  <p className="text-xs text-text2-faint">
                    {h.studyPlan?.name} · {new Date(h.submittedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                  <p className="text-xs text-text2-faint mt-0.5">
                    {h.questionCount} questions · {h.durationMinutes} minutes{h.autoSubmitted && ' · auto-submitted'}
                  </p>
                </div>
                <span className="text-2xl font-heading font-extrabold text-text2 flex-shrink-0">{h.score}%</span>
              </Link>
            ))}
          </div>
        )}
      </main>
    </AppShell>
  );
}
