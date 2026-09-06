import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Search, MessageSquare, FolderKanban, X, Loader2, MessageSquarePlus, Plus,
  GraduationCap, BarChart3, Trash2, Settings, Keyboard, CornerDownLeft
} from 'lucide-react';
import { conversationsAPI } from '../../api/conversations.js';
import { useProjects } from '../../context/ProjectsContext.jsx';
import NewProjectModal from '../dashboard/NewProjectModal.jsx';
import NewStudyPlanModal from '../studyplan/NewStudyPlanModal.jsx';
import KeyboardShortcutsModal from './KeyboardShortcutsModal.jsx';
import { studyPlansAPI } from '../../api/studyPlans.js';

export default function SearchModal({ onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ conversations: [], messages: [] });
  const [loading, setLoading] = useState(false);
  const [showNewProject, setShowNewProject] = useState(false);
  const [showNewStudyPlan, setShowNewStudyPlan] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const { projectId: activeProjectId } = useParams();
  const { projects, createProject } = useProjects();

  useEffect(() => {
    inputRef.current?.focus();
    const handler = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const runSearch = useCallback(async (q) => {
    if (!q.trim()) {
      setResults({ conversations: [], messages: [] });
      return;
    }
    setLoading(true);
    try {
      const data = await conversationsAPI.search(q);
      setResults(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => runSearch(query), 250);
    return () => clearTimeout(t);
  }, [query, runSearch]);

  const goTo = (projectId, conversationId) => {
    navigate(`/project/${projectId}/c/${conversationId}`);
    onClose();
  };

  const go = (path) => {
    navigate(path);
    onClose();
  };

  const handleNewConversation = async () => {
    const targetProjectId = activeProjectId || projects[0]?._id;
    if (!targetProjectId) {
      setShowNewProject(true);
      return;
    }
    const conv = await conversationsAPI.create(targetProjectId);
    goTo(targetProjectId, conv._id);
  };

  const handleCreateProject = async (data) => {
    const project = await createProject(data);
    setShowNewProject(false);
    go(`/project/${project._id}`);
  };

  const handleCreateStudyPlan = async (name, level) => {
    const plan = await studyPlansAPI.create(name, level);
    setShowNewStudyPlan(false);
    go(`/study-plans/${plan._id}`);
  };

  const COMMANDS = [
    { icon: MessageSquarePlus, label: 'New conversation', run: handleNewConversation },
    { icon: Plus, label: 'New project', run: () => setShowNewProject(true) },
    { icon: GraduationCap, label: 'New study plan', run: () => setShowNewStudyPlan(true) },
    { icon: FolderKanban, label: 'Open projects', run: () => go('/projects') },
    { icon: GraduationCap, label: 'Open study plans', run: () => go('/study-plans') },
    { icon: BarChart3, label: 'Open usage', run: () => go('/usage') },
    { icon: Trash2, label: 'Open trash', run: () => go('/trash') },
    { icon: Settings, label: 'Open settings', run: () => go('/profile') },
    { icon: Keyboard, label: 'View keyboard shortcuts', run: () => setShowShortcuts(true) }
  ];

  const q = query.trim().toLowerCase();
  const matchingCommands = q ? COMMANDS.filter((c) => c.label.toLowerCase().includes(q)) : COMMANDS;
  const hasResults = results.conversations.length > 0 || results.messages.length > 0;

  return (
    <>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-start justify-center pt-24 p-4" onClick={onClose}>
        <div
          className="w-full max-w-lg auth-card rounded-2xl shadow-2xl shadow-black/50 overflow-hidden auth-fade-in"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-3 px-4 py-3.5 border-b border-line2">
            <Search className="w-4 h-4 text-text2-faint flex-shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search or type a command…"
              className="flex-1 bg-transparent text-sm text-text2 placeholder:text-text2-faint focus:outline-none"
            />
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin text-text2-faint flex-shrink-0" />
            ) : (
              <button onClick={onClose} aria-label="Close search" className="p-1 rounded-lg text-text2-faint hover:text-text2 hover:bg-card-hover">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="max-h-[60vh] overflow-y-auto p-2">
            {matchingCommands.length > 0 && (
              <div className="mb-2">
                <p className="px-3 py-1.5 text-[11px] font-medium tracking-wide text-text2-faint uppercase">Commands</p>
                {matchingCommands.map((c) => (
                  <button
                    key={c.label}
                    onClick={c.run}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-card-hover transition-colors text-left"
                  >
                    <c.icon className="w-4 h-4 flex-shrink-0 text-text2-faint" />
                    <span className="text-sm text-text2 flex-1">{c.label}</span>
                    <CornerDownLeft className="w-3 h-3 text-text2-faint opacity-0 group-hover:opacity-100" />
                  </button>
                ))}
              </div>
            )}

            {!q ? (
              matchingCommands.length === 0 && <p className="px-3 py-6 text-center text-sm text-text2-faint">Type to search or run a command.</p>
            ) : !loading && !hasResults && matchingCommands.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-text2-faint">No results for "{query}".</p>
            ) : (
              <>
                {results.conversations.length > 0 && (
                  <div className="mb-2">
                    <p className="px-3 py-1.5 text-[11px] font-medium tracking-wide text-text2-faint uppercase">Conversations</p>
                    {results.conversations.map((c) => (
                      <button
                        key={c._id}
                        onClick={() => goTo(c.project?._id, c._id)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-card-hover transition-colors text-left"
                      >
                        <FolderKanban className="w-3.5 h-3.5 flex-shrink-0" style={{ color: c.project?.color }} />
                        <div className="min-w-0">
                          <p className="text-sm text-text2 truncate">{c.title}</p>
                          <p className="text-xs text-text2-faint truncate">{c.project?.name}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {results.messages.length > 0 && (
                  <div>
                    <p className="px-3 py-1.5 text-[11px] font-medium tracking-wide text-text2-faint uppercase">Messages</p>
                    {results.messages.map((m) => (
                      <button
                        key={m._id}
                        onClick={() => goTo(m.conversation?.project?._id, m.conversation?._id)}
                        className="w-full flex items-start gap-3 px-3 py-2.5 rounded-xl hover:bg-card-hover transition-colors text-left"
                      >
                        <MessageSquare className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-text2-faint" />
                        <div className="min-w-0">
                          <p className="text-sm text-text2 truncate">{m.conversation?.title}</p>
                          <p className="text-xs text-text2-faint line-clamp-2">{m.content}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {showNewProject && <NewProjectModal onClose={() => setShowNewProject(false)} onCreate={handleCreateProject} />}
      {showNewStudyPlan && <NewStudyPlanModal onClose={() => setShowNewStudyPlan(false)} onCreate={handleCreateStudyPlan} />}
      {showShortcuts && <KeyboardShortcutsModal onClose={() => setShowShortcuts(false)} />}
    </>
  );
}
