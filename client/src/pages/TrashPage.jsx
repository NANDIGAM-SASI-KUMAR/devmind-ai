import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Trash2, RotateCcw, Loader2, FolderKanban } from 'lucide-react';
import { conversationsAPI } from '../api/conversations.js';
import AppShell from '../components/shell/AppShell.jsx';

export default function TrashPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      setLoading(true);
      const data = await conversationsAPI.listTrash();
      setItems(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (id) => {
    setBusyId(id);
    try {
      await conversationsAPI.restore(id);
      setItems((its) => its.filter((i) => i._id !== id));
    } catch (err) {
      console.error(err);
    } finally {
      setBusyId(null);
    }
  };

  const handlePermanentDelete = async (id) => {
    if (!confirm('Permanently delete this conversation?\n\nThis action cannot be undone.')) return;
    setBusyId(id);
    try {
      await conversationsAPI.permanentlyDelete(id);
      setItems((its) => its.filter((i) => i._id !== id));
    } catch (err) {
      console.error(err);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <AppShell>
      <main className="h-full overflow-y-auto px-6 md:px-10 py-10 max-w-[900px] mx-auto">
        <div className="mb-8">
          <h1 className="font-heading text-3xl md:text-4xl font-extrabold text-text2 tracking-tight mb-2">Trash</h1>
          <p className="text-text2-muted">Conversations here can be restored, or permanently deleted.</p>
        </div>

        {loading ? (
          <div className="py-24 flex justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-brand" />
          </div>
        ) : items.length === 0 ? (
          <div className="py-20 text-center bg-card border border-line2 rounded-2xl">
            <div className="w-12 h-12 rounded-2xl bg-card-hover flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-5 h-5 text-text2-faint" />
            </div>
            <p className="text-text2-muted">Trash is empty.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((c) => (
              <div
                key={c._id}
                className="flex items-center justify-between gap-4 bg-card border border-line2 rounded-2xl px-5 py-4"
              >
                <div className="min-w-0 flex items-center gap-3">
                  <FolderKanban className="w-4 h-4 flex-shrink-0" style={{ color: c.project?.color }} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-text2 truncate">{c.title}</p>
                    <p className="text-xs text-text2-faint truncate">
                      {c.project?.name} · deleted {new Date(c.deletedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => handleRestore(c._id)}
                    disabled={busyId === c._id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-text2-muted hover:text-text2 hover:bg-card-hover transition-colors disabled:opacity-50"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Restore
                  </button>
                  <button
                    onClick={() => handlePermanentDelete(c._id)}
                    disabled={busyId === c._id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-state-danger hover:bg-state-danger/10 transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete forever
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <Link to="/projects" className="inline-block mt-8 text-sm text-brand-soft hover:text-brand-glow transition-colors">
          ← Back to projects
        </Link>
      </main>
    </AppShell>
  );
}
