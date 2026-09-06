import { useEffect, useState } from 'react';
import { Loader2, FolderKanban, MessageSquare, MessagesSquare, Trash2, CalendarDays, HardDrive, Download } from 'lucide-react';
import AppShell from '../components/shell/AppShell.jsx';
import { usageAPI } from '../api/usage.js';
import { conversationsAPI } from '../api/conversations.js';
import { getAgentMeta } from '../utils/agents.js';

const formatBytes = (bytes) => {
  if (!bytes) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export default function UsagePage() {
  const [usage, setUsage] = useState(null);
  const [storage, setStorage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [emptying, setEmptying] = useState(false);
  const [emptyDone, setEmptyDone] = useState(false);

  useEffect(() => {
    Promise.all([usageAPI.get().then(setUsage), usageAPI.getStorage().then(setStorage)]).finally(() => setLoading(false));
  }, []);

  const handleExport = async () => {
    setExporting(true);
    try {
      const data = await usageAPI.exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'devmind-export.json';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
    } finally {
      setExporting(false);
    }
  };

  const handleEmptyTrash = async () => {
    if (!confirm('Permanently delete every conversation in trash?\n\nThis cannot be undone.')) return;
    setEmptying(true);
    try {
      await conversationsAPI.emptyTrash();
      setUsage((u) => (u ? { ...u, trashedConversations: 0 } : u));
      setEmptyDone(true);
      setTimeout(() => setEmptyDone(false), 2500);
    } catch (err) {
      console.error(err);
    } finally {
      setEmptying(false);
    }
  };

  return (
    <AppShell>
      <main className="h-full overflow-y-auto px-6 md:px-10 py-10 max-w-[820px] mx-auto">
        <div className="mb-8">
          <h1 className="font-heading text-3xl md:text-4xl font-extrabold text-text2 tracking-tight mb-2">Usage &amp; storage</h1>
          <p className="text-text2-muted">A real-time look at your DevMind activity and stored data.</p>
        </div>

        {loading ? (
          <div className="py-24 flex justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-brand" />
          </div>
        ) : !usage ? (
          <p className="text-text2-faint">Could not load usage data.</p>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard icon={FolderKanban} label="Projects" value={usage.projects} />
              <StatCard icon={MessageSquare} label="Conversations" value={usage.conversations} />
              <StatCard icon={MessagesSquare} label="Messages" value={usage.messages.total} />
              <StatCard icon={Trash2} label="In trash" value={usage.trashedConversations} />
            </div>

            {storage && (
              <div className="bg-card border border-line2 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <HardDrive className="w-4 h-4 text-brand-soft" />
                  <h2 className="font-heading text-lg font-bold text-text2">Data &amp; storage</h2>
                </div>
                <div className="space-y-3 mb-5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-text2-muted">Project files</span>
                    <span className="text-text2-faint">{storage.projectFiles.count} file{storage.projectFiles.count === 1 ? '' : 's'} · {formatBytes(storage.projectFiles.bytes)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-text2-muted">Study materials</span>
                    <span className="text-text2-faint">{storage.studyMaterials.count} file{storage.studyMaterials.count === 1 ? '' : 's'} · {formatBytes(storage.studyMaterials.bytes)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm pt-3 border-t border-line2">
                    <span className="text-text2 font-medium">Total</span>
                    <span className="text-text2 font-medium">{formatBytes(storage.totalBytes)}</span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={handleExport}
                    disabled={exporting}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-line2 text-text2-muted hover:text-text2 hover:bg-card-hover text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                    Export my data
                  </button>
                  <button
                    onClick={handleEmptyTrash}
                    disabled={emptying || usage.trashedConversations === 0}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-line2 text-text2-muted hover:text-state-danger hover:border-state-danger/40 text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {emptying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    Empty trash{usage.trashedConversations > 0 ? ` (${usage.trashedConversations})` : ''}
                  </button>
                  {emptyDone && <span className="text-sm text-state-success">Trash emptied</span>}
                </div>
              </div>
            )}

            <div className="bg-card border border-line2 rounded-2xl p-6">
              <h2 className="font-heading text-lg font-bold text-text2 mb-4">Messages</h2>
              <div className="space-y-3">
                <BarRow label="From you" value={usage.messages.fromYou} total={usage.messages.total} color="#6366F1" />
                <BarRow label="From agents" value={usage.messages.fromAgents} total={usage.messages.total} color="#818CF8" />
              </div>
            </div>

            <div className="bg-card border border-line2 rounded-2xl p-6">
              <h2 className="font-heading text-lg font-bold text-text2 mb-4">Agent usage</h2>
              {usage.agentBreakdown.length === 0 ? (
                <p className="text-sm text-text2-faint">No agent responses yet.</p>
              ) : (
                <div className="space-y-3">
                  {usage.agentBreakdown.map((a) => {
                    const meta = getAgentMeta(a.agent);
                    const max = usage.agentBreakdown[0].count;
                    return (
                      <BarRow
                        key={a.agent}
                        label={meta.label}
                        icon={meta.icon}
                        value={a.count}
                        total={max}
                        color={meta.color}
                      />
                    );
                  })}
                </div>
              )}
            </div>

            {usage.memberSince && (
              <div className="flex items-center gap-2 text-xs text-text2-faint px-1">
                <CalendarDays className="w-3.5 h-3.5" />
                Member since {new Date(usage.memberSince).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
              </div>
            )}
          </div>
        )}
      </main>
    </AppShell>
  );
}

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="bg-card border border-line2 rounded-2xl p-5">
      <Icon className="w-4 h-4 text-text2-faint mb-3" />
      <div className="font-heading text-2xl font-extrabold text-text2">{value}</div>
      <div className="text-xs text-text2-faint mt-0.5">{label}</div>
    </div>
  );
}

function BarRow({ label, icon: Icon, value, total, color }) {
  const pct = total > 0 ? Math.max((value / total) * 100, value > 0 ? 4 : 0) : 0;
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5 text-sm">
        <span className="flex items-center gap-1.5 text-text2-muted">
          {Icon && <Icon className="w-3.5 h-3.5" style={{ color }} />}
          {label}
        </span>
        <span className="text-text2-faint">{value}</span>
      </div>
      <div className="h-1.5 rounded-full bg-card-hover overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }}></div>
      </div>
    </div>
  );
}
