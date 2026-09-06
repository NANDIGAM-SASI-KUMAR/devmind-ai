import { useState, useEffect } from 'react';
import { X, Loader2, Check, Plus, Trash2, Cpu, Layers, ListChecks, GitCommit, Github } from 'lucide-react';
import { projectBrainAPI } from '../../api/projectBrain.js';
import { githubAPI } from '../../api/github.js';

const CATEGORIES = [
  { key: 'technology', label: 'Technology', icon: Cpu },
  { key: 'architecture', label: 'Architecture', icon: Layers },
  { key: 'conventions', label: 'Conventions', icon: ListChecks },
  { key: 'decisions', label: 'Decisions', icon: GitCommit }
];

export default function ProjectInstructionsModal({ project, onClose, onSave }) {
  const [tab, setTab] = useState('instructions');
  const [instructions, setInstructions] = useState(project.instructions || '');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const handler = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(instructions);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="w-full max-w-lg auth-card rounded-2xl shadow-2xl shadow-black/50 auth-fade-in max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 pt-6 pb-1 flex-shrink-0">
          <h2 className="font-heading text-xl font-bold text-text2">Project context</h2>
          <button onClick={onClose} aria-label="Close" className="p-1.5 rounded-lg text-text2-faint hover:text-text2 hover:bg-card-hover transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-1 px-6 pt-3 flex-shrink-0">
          <TabButton active={tab === 'instructions'} onClick={() => setTab('instructions')}>Instructions</TabButton>
          <TabButton active={tab === 'brain'} onClick={() => setTab('brain')}>Project Brain</TabButton>
          <TabButton active={tab === 'github'} onClick={() => setTab('github')}>GitHub</TabButton>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4">
          {tab === 'instructions' ? (
            <form onSubmit={handleSave} className="space-y-4">
              <p className="text-sm text-text2-faint">
                Every specialist reads this before responding — describe your stack, conventions, and constraints.
              </p>
              <textarea
                autoFocus
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                rows={8}
                maxLength={4000}
                placeholder={'This is a Node.js backend using Express and MongoDB.\nAlways use TypeScript.\nFollow repository conventions.'}
                className="field-shell w-full rounded-xl px-3.5 py-3 text-sm text-text2 placeholder:text-text2-faint focus:outline-none resize-none"
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-text2-faint">{instructions.length}/4000</span>
                <div className="flex items-center gap-3">
                  {saved && (
                    <span className="flex items-center gap-1.5 text-sm text-state-success">
                      <Check className="w-4 h-4" /> Saved
                    </span>
                  )}
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-brand px-5 py-2.5 rounded-xl text-white text-sm font-semibold flex items-center gap-2 disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
                  </button>
                </div>
              </div>
            </form>
          ) : tab === 'brain' ? (
            <BrainTab projectId={project._id} />
          ) : (
            <GithubTab projectId={project._id} />
          )}
        </div>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-3.5 py-2 rounded-xl text-sm font-medium transition-colors ${
        active ? 'bg-card-raised text-text2 border border-line2' : 'text-text2-faint hover:text-text2'
      }`}
    >
      {children}
    </button>
  );
}

function BrainTab({ projectId }) {
  const [items, setItems] = useState(null);
  const [drafts, setDrafts] = useState({});
  const [addingCategory, setAddingCategory] = useState(null);

  const load = async () => {
    try { setItems(await projectBrainAPI.list(projectId)); } catch (err) { console.error(err); }
  };

  useEffect(() => { load(); }, [projectId]);

  const handleAdd = async (category) => {
    const content = (drafts[category] || '').trim();
    if (!content) return;
    setAddingCategory(category);
    try {
      const item = await projectBrainAPI.add(projectId, category, content);
      setItems((its) => [...(its || []), item]);
      setDrafts((d) => ({ ...d, [category]: '' }));
    } finally {
      setAddingCategory(null);
    }
  };

  const handleRemove = async (id) => {
    await projectBrainAPI.remove(id);
    setItems((its) => its.filter((i) => i._id !== id));
  };

  if (items === null) {
    return <div className="py-12 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-brand" /></div>;
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-text2-faint">
        Structured knowledge every specialist reads before responding. Add short facts; remove anything no longer true.
      </p>
      {CATEGORIES.map(({ key, label, icon: Icon }) => {
        const categoryItems = items.filter((i) => i.category === key);
        return (
          <div key={key}>
            <div className="flex items-center gap-2 mb-2">
              <Icon className="w-3.5 h-3.5 text-brand-soft" />
              <span className="text-xs font-semibold tracking-wide text-text2-muted uppercase">{label}</span>
            </div>
            {categoryItems.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {categoryItems.map((item) => (
                  <span
                    key={item._id}
                    className="group flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs text-text2 bg-card-raised border border-line2"
                  >
                    {item.content}
                    <button onClick={() => handleRemove(item._id)} aria-label={`Remove ${item.content}`} className="text-text2-faint hover:text-state-danger transition-colors">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex gap-1.5">
              <input
                value={drafts[key] || ''}
                onChange={(e) => setDrafts((d) => ({ ...d, [key]: e.target.value }))}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAdd(key))}
                placeholder={`Add ${label.toLowerCase()}…`}
                className="field-shell flex-1 rounded-lg px-3 py-1.5 text-xs text-text2 placeholder:text-text2-faint focus:outline-none"
              />
              <button
                onClick={() => handleAdd(key)}
                disabled={addingCategory === key || !drafts[key]?.trim()}
                aria-label={`Add ${label.toLowerCase()}`}
                className="p-1.5 rounded-lg text-text2-faint hover:text-brand-soft hover:bg-card-hover transition-colors disabled:opacity-40"
              >
                {addingCategory === key ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function GithubTab({ projectId }) {
  const [connection, setConnection] = useState(null);

  useEffect(() => {
    githubAPI.getConnection(projectId).then(setConnection).catch(() => setConnection({ connected: false }));
  }, [projectId]);

  if (connection === null) {
    return <div className="py-12 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-brand" /></div>;
  }

  return (
    <div className="text-center py-6">
      <div className="w-11 h-11 rounded-xl bg-card-raised border border-line2 flex items-center justify-center mx-auto mb-4">
        <Github className="w-5 h-5 text-text2-muted" />
      </div>
      <p className="text-sm text-text2 font-medium mb-1">
        {connection.connected ? `Connected to ${connection.repoFullName}` : 'GitHub isn’t connected yet'}
      </p>
      <p className="text-xs text-text2-faint max-w-xs mx-auto mb-5">
        Repo sync and PR-aware context are on the roadmap. This project isn't linked to a repository yet.
      </p>
      <button
        disabled
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-line2 text-text2-faint text-sm font-medium cursor-not-allowed opacity-60"
      >
        <Github className="w-3.5 h-3.5" />
        Connect GitHub — coming soon
      </button>
    </div>
  );
}
