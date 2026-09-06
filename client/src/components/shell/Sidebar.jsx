import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  Plus, X, FolderKanban, ChevronRight, Search, Trash2, Pin,
  Check, MessageSquare, BarChart3, GraduationCap, ArrowLeft, MessageSquarePlus, ClipboardCheck, Home, LineChart
} from 'lucide-react';
import { useProjects } from '../../context/ProjectsContext.jsx';
import { conversationsAPI } from '../../api/conversations.js';
import { studyPlansAPI } from '../../api/studyPlans.js';
import { examsAPI } from '../../api/exams.js';
import { exportConversationAsMarkdown } from '../../utils/exportConversation.js';
import ProfileMenu from './ProfileMenu.jsx';
import NotificationBell from './NotificationBell.jsx';
import ConversationMenu from './ConversationMenu.jsx';
import NewProjectModal from '../dashboard/NewProjectModal.jsx';
import NewStudyPlanModal from '../studyplan/NewStudyPlanModal.jsx';
import CreateExamModal from '../exam/CreateExamModal.jsx';

const groupByDate = (conversations) => {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);
  const sevenDaysAgo = new Date(startOfToday);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const groups = { Today: [], Yesterday: [], 'Previous 7 days': [], Older: [] };
  for (const c of conversations) {
    const t = new Date(c.lastMessageAt);
    if (t >= startOfToday) groups.Today.push(c);
    else if (t >= startOfYesterday) groups.Yesterday.push(c);
    else if (t >= sevenDaysAgo) groups['Previous 7 days'].push(c);
    else groups.Older.push(c);
  }
  return Object.entries(groups).filter(([, list]) => list.length > 0);
};

export default function Sidebar({ open, onClose, onSearch }) {
  const { projects, loading, createProject } = useProjects();
  const { projectId: activeProjectId, conversationId: activeConversationId, id: activeStudyPlanId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showStudyModal, setShowStudyModal] = useState(false);
  const [showExamModal, setShowExamModal] = useState(false);
  const [expandedProject, setExpandedProject] = useState(activeProjectId || null);
  const [studyPlans, setStudyPlans] = useState(null);
  const [exams, setExams] = useState(null);
  const [pinned, setPinned] = useState([]);
  const [pinnedRefresh, setPinnedRefresh] = useState(0);

  const isStudyMode = location.pathname.startsWith('/study-plans');
  const isExamMode = location.pathname.startsWith('/examinations');

  useEffect(() => {
    if (activeProjectId) setExpandedProject(activeProjectId);
  }, [activeProjectId]);

  useEffect(() => {
    if (isExamMode) {
      examsAPI.listAll().then(setExams).catch(() => setExams([]));
    } else if (isStudyMode) {
      studyPlansAPI.list().then(setStudyPlans).catch(() => setStudyPlans([]));
    } else {
      conversationsAPI.listPinned().then(setPinned).catch(() => setPinned([]));
    }
  }, [isStudyMode, isExamMode, activeStudyPlanId, activeConversationId, pinnedRefresh]);

  const refreshPinned = () => setPinnedRefresh((n) => n + 1);

  const handleCreateProject = async (data) => {
    const project = await createProject(data);
    setShowProjectModal(false);
    onClose?.();
    navigate(`/project/${project._id}`);
  };

  const handleCreateStudyPlan = async (name, level) => {
    const plan = await studyPlansAPI.create(name, level);
    setShowStudyModal(false);
    onClose?.();
    navigate(`/study-plans/${plan._id}`);
  };

  // "+ New conversation": uses the current project if inside one, otherwise the
  // most recently active project, otherwise prompts to create a project first.
  const handleNewConversation = async () => {
    const targetProjectId = activeProjectId || projects[0]?._id;
    if (!targetProjectId) {
      setShowProjectModal(true);
      return;
    }
    const conv = await conversationsAPI.create(targetProjectId);
    setExpandedProject(targetProjectId);
    onClose?.();
    navigate(`/project/${targetProjectId}/c/${conv._id}`);
  };

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/60 z-40 md:hidden" onClick={onClose}></div>}

      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 md:z-auto w-72 flex-shrink-0 transition-transform duration-300 md:translate-x-0 p-3 md:p-0 md:pr-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-full md:h-[calc(100vh-1.5rem)] md:my-3 flex flex-col gap-3 rounded-2xl border border-line2 bg-card/90 backdrop-blur p-3 shadow-lg shadow-black/20">
          <div className="flex-shrink-0 flex items-center justify-between px-1">
            <Link to="/dashboard" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg btn-brand flex items-center justify-center text-white font-heading font-extrabold text-xs">
                dm
              </div>
              <span className="font-heading font-bold text-text2 text-base">DevMind</span>
            </Link>
            <button onClick={onClose} aria-label="Close sidebar" className="p-1.5 rounded-lg text-text2-faint hover:text-text2 hover:bg-card-hover md:hidden">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-shrink-0 flex items-center gap-1.5">
            <button
              onClick={onSearch}
              aria-label="Search"
              className="flex-1 min-w-0 flex items-center gap-2.5 px-3 py-2 rounded-xl bg-card-raised border border-line2 text-sm text-text2-faint hover:text-text2 hover:border-line2-strong transition-colors"
            >
              <Search className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">Search</span>
              <kbd className="ml-auto px-1.5 py-0.5 rounded border border-line2 font-mono text-[10px]">⌘K</kbd>
            </button>
            <NotificationBell />
          </div>

          {isExamMode ? (
            <>
              <button
                onClick={() => setShowExamModal(true)}
                className="flex-shrink-0 btn-brand flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-white text-sm font-semibold"
              >
                <Plus className="w-4 h-4" strokeWidth={2.5} />
                Create examination
              </button>
              <Link
                to="/dashboard"
                onClick={onClose}
                className="flex-shrink-0 flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-sm text-text2-muted hover:text-text2 hover:bg-card-hover transition-colors border border-line2"
              >
                <Home className="w-3.5 h-3.5" />
                Dashboard
              </Link>
            </>
          ) : isStudyMode ? (
            <>
              <button
                onClick={() => setShowStudyModal(true)}
                className="flex-shrink-0 btn-brand flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-white text-sm font-semibold"
              >
                <Plus className="w-4 h-4" strokeWidth={2.5} />
                New study plan
              </button>
              <Link
                to="/projects"
                onClick={onClose}
                className="flex-shrink-0 flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-sm text-text2-muted hover:text-text2 hover:bg-card-hover transition-colors border border-line2"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Coding projects
              </Link>
            </>
          ) : (
            <>
              <button
                onClick={handleNewConversation}
                className="flex-shrink-0 btn-brand flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-white text-sm font-semibold"
              >
                <MessageSquarePlus className="w-4 h-4" strokeWidth={2.5} />
                New conversation
              </button>
              <div className="flex-shrink-0 grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => setShowProjectModal(true)}
                  className="flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-xl text-xs text-text2-muted hover:text-text2 hover:bg-card-hover transition-colors border border-line2"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Project
                </button>
                <Link
                  to="/study-plans"
                  onClick={onClose}
                  className="flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-xl text-xs text-text2-muted hover:text-text2 hover:bg-card-hover transition-colors border border-line2"
                >
                  <GraduationCap className="w-3.5 h-3.5 text-brand-soft" />
                  Study plans
                </Link>
              </div>
            </>
          )}

          <div className="flex-1 min-h-0 overflow-y-auto -mx-1 px-1">
            {isExamMode ? (
              <>
                <p className="px-2 mb-1.5 text-[11px] font-medium tracking-wide text-text2-faint uppercase">Examinations</p>
                {exams === null ? (
                  <div className="px-2 py-3 text-xs text-text2-faint">Loading…</div>
                ) : exams.length === 0 ? (
                  <div className="px-2 py-3 text-xs text-text2-faint">No examinations yet.</div>
                ) : (
                  <div className="space-y-0.5">
                    {exams.map((exam) => (
                      <Link
                        key={exam._id}
                        to={`/examinations/${exam._id}`}
                        onClick={onClose}
                        className="flex items-center gap-2 px-2.5 py-2 rounded-xl text-sm text-text2-muted hover:text-text2 hover:bg-card-hover transition-colors"
                      >
                        <ClipboardCheck className="w-3.5 h-3.5 flex-shrink-0 text-specialist-reviewer" />
                        <span className="truncate flex-1 text-left">{exam.title}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </>
            ) : isStudyMode ? (
              <>
                <p className="px-2 mb-1.5 text-[11px] font-medium tracking-wide text-text2-faint uppercase">Study plans</p>
                {studyPlans === null ? (
                  <div className="px-2 py-3 text-xs text-text2-faint">Loading…</div>
                ) : studyPlans.length === 0 ? (
                  <div className="px-2 py-3 text-xs text-text2-faint">No study plans yet.</div>
                ) : (
                  <div className="space-y-0.5">
                    {studyPlans.map((plan) => (
                      <Link
                        key={plan._id}
                        to={`/study-plans/${plan._id}`}
                        onClick={onClose}
                        className={`flex items-center gap-2 px-2.5 py-2 rounded-xl text-sm transition-colors ${
                          activeStudyPlanId === plan._id ? 'bg-card-hover text-text2' : 'text-text2-muted hover:text-text2 hover:bg-card-hover'
                        }`}
                      >
                        <GraduationCap className="w-3.5 h-3.5 flex-shrink-0 text-brand-soft" />
                        <span className="truncate flex-1 text-left">{plan.name}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <>
                {pinned.length > 0 && (
                  <div className="mb-3">
                    <p className="px-2 mb-1.5 text-[11px] font-medium tracking-wide text-text2-faint uppercase">Pinned</p>
                    <div className="space-y-0.5">
                      {pinned.map((conv) => (
                        <Link
                          key={conv._id}
                          to={`/project/${conv.project?._id}/c/${conv._id}`}
                          onClick={onClose}
                          className={`flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs transition-colors ${
                            activeConversationId === conv._id ? 'bg-card-hover text-text2' : 'text-text2-muted hover:text-text2 hover:bg-card-hover'
                          }`}
                        >
                          <Pin className="w-3 h-3 flex-shrink-0 text-brand-soft" fill="currentColor" />
                          <span className="truncate flex-1 text-left">{conv.title}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                <p className="px-2 mb-1.5 text-[11px] font-medium tracking-wide text-text2-faint uppercase">Projects</p>
                {loading ? (
                  <div className="px-2 py-3 text-xs text-text2-faint">Loading…</div>
                ) : projects.length === 0 ? (
                  <div className="px-2 py-3 text-xs text-text2-faint">No projects yet.</div>
                ) : (
                  <div className="space-y-0.5">
                    {projects.map((p) => (
                      <ProjectItem
                        key={p._id}
                        project={p}
                        isActive={activeProjectId === p._id}
                        isExpanded={expandedProject === p._id}
                        activeConversationId={activeConversationId}
                        onToggle={() => setExpandedProject(expandedProject === p._id ? null : p._id)}
                        onNavigate={onClose}
                        onPinChanged={refreshPinned}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="flex-shrink-0 space-y-0.5">
            <Link
              to="/results"
              onClick={onClose}
              className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-sm text-text2-faint hover:text-text2 hover:bg-card-hover transition-colors"
            >
              <LineChart className="w-3.5 h-3.5" />
              Results
            </Link>
            <Link
              to="/usage"
              onClick={onClose}
              className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-sm text-text2-faint hover:text-text2 hover:bg-card-hover transition-colors"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              Usage
            </Link>
            <Link
              to="/trash"
              onClick={onClose}
              className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-sm text-text2-faint hover:text-text2 hover:bg-card-hover transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Trash
            </Link>
          </div>

          <ProfileMenu />
        </div>
      </aside>

      {showProjectModal && <NewProjectModal onClose={() => setShowProjectModal(false)} onCreate={handleCreateProject} />}
      {showStudyModal && <NewStudyPlanModal onClose={() => setShowStudyModal(false)} onCreate={handleCreateStudyPlan} />}
      {showExamModal && (
        <CreateExamModal
          onClose={() => setShowExamModal(false)}
          onCreated={(exam) => { setShowExamModal(false); onClose?.(); navigate(`/examinations/${exam._id}`); }}
        />
      )}
    </>
  );
}

function ProjectItem({ project, isActive, isExpanded, activeConversationId, onToggle, onNavigate, onPinChanged }) {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState(null);
  const [renamingId, setRenamingId] = useState(null);
  const [titleDraft, setTitleDraft] = useState('');

  const loadConversations = useCallback(async () => {
    try {
      const data = await conversationsAPI.list(project._id);
      setConversations(data);
    } catch (err) {
      console.error(err);
    }
  }, [project._id]);

  useEffect(() => {
    if (isExpanded && conversations === null) loadConversations();
  }, [isExpanded, conversations, loadConversations]);

  const handleToggle = () => {
    onToggle();
    if (conversations === null) loadConversations();
  };

  const handleNewConversation = async (e) => {
    e.stopPropagation();
    const conv = await conversationsAPI.create(project._id);
    setConversations((cs) => [conv, ...(cs || [])]);
    onNavigate?.();
    navigate(`/project/${project._id}/c/${conv._id}`);
  };

  const handleTogglePin = async (conv) => {
    const updated = await conversationsAPI.update(conv._id, { pinned: !conv.pinned });
    setConversations((cs) => cs.map((c) => (c._id === conv._id ? updated : c)));
    onPinChanged?.();
  };

  const handleToggleArchive = async (conv) => {
    await conversationsAPI.update(conv._id, { archived: !conv.archived });
    setConversations((cs) => cs.filter((c) => c._id !== conv._id));
  };

  const handleDelete = async (conv) => {
    await conversationsAPI.trash(conv._id);
    setConversations((cs) => cs.filter((c) => c._id !== conv._id));
    onPinChanged?.();
    if (activeConversationId === conv._id) navigate(`/project/${project._id}`);
  };

  const startRename = (conv) => {
    setRenamingId(conv._id);
    setTitleDraft(conv.title);
  };

  const saveRename = async (conv) => {
    const title = titleDraft.trim();
    setRenamingId(null);
    if (!title || title === conv.title) return;
    const updated = await conversationsAPI.update(conv._id, { title });
    setConversations((cs) => cs.map((c) => (c._id === conv._id ? updated : c)));
  };

  const pinned = (conversations || []).filter((c) => c.pinned);
  const unpinned = (conversations || []).filter((c) => !c.pinned);
  const grouped = groupByDate(unpinned);

  return (
    <div>
      <button
        onClick={handleToggle}
        className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-sm transition-colors ${
          isActive ? 'bg-card-hover text-text2' : 'text-text2-muted hover:text-text2 hover:bg-card-hover'
        }`}
      >
        <ChevronRight className={`w-3.5 h-3.5 flex-shrink-0 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
        <FolderKanban className="w-3.5 h-3.5 flex-shrink-0" style={{ color: project.color }} />
        <span className="truncate flex-1 text-left">{project.name}</span>
      </button>

      {isExpanded && (
        <div className="ml-4 pl-3 border-l border-line2-soft mt-0.5 mb-1 space-y-2.5">
          <button
            onClick={handleNewConversation}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-brand-soft hover:text-brand-glow hover:bg-card-hover transition-colors"
          >
            <Plus className="w-3 h-3" />
            New conversation
          </button>

          {conversations === null ? (
            <p className="px-2 text-xs text-text2-faint">Loading…</p>
          ) : conversations.length === 0 ? (
            <p className="px-2 text-xs text-text2-faint">No conversations yet.</p>
          ) : (
            <>
              {pinned.length > 0 && (
                <ConversationGroup
                  label="Pinned"
                  items={pinned}
                  projectId={project._id}
                  activeConversationId={activeConversationId}
                  renamingId={renamingId}
                  titleDraft={titleDraft}
                  setTitleDraft={setTitleDraft}
                  onTogglePin={handleTogglePin}
                  onToggleArchive={handleToggleArchive}
                  onDelete={handleDelete}
                  onStartRename={startRename}
                  onSaveRename={saveRename}
                  onNavigate={onNavigate}
                />
              )}
              {grouped.map(([label, items]) => (
                <ConversationGroup
                  key={label}
                  label={label}
                  items={items}
                  projectId={project._id}
                  activeConversationId={activeConversationId}
                  renamingId={renamingId}
                  titleDraft={titleDraft}
                  setTitleDraft={setTitleDraft}
                  onTogglePin={handleTogglePin}
                  onToggleArchive={handleToggleArchive}
                  onDelete={handleDelete}
                  onStartRename={startRename}
                  onSaveRename={saveRename}
                  onNavigate={onNavigate}
                />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function ConversationGroup({
  label, items, projectId, activeConversationId, renamingId, titleDraft, setTitleDraft,
  onTogglePin, onToggleArchive, onDelete, onStartRename, onSaveRename, onNavigate
}) {
  return (
    <div>
      <p className="px-2 mb-1 text-[10px] font-medium tracking-wide text-text2-faint uppercase">{label}</p>
      <div className="space-y-0.5">
        {items.map((conv) => (
          <div
            key={conv._id}
            className={`group flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs transition-colors ${
              activeConversationId === conv._id ? 'bg-card-hover text-text2' : 'text-text2-muted hover:text-text2 hover:bg-card-hover'
            }`}
          >
            {renamingId === conv._id ? (
              <div className="flex items-center gap-1 flex-1 min-w-0">
                <input
                  autoFocus
                  value={titleDraft}
                  onChange={(e) => setTitleDraft(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.key === 'Enter' && onSaveRename(conv)}
                  className="flex-1 min-w-0 bg-card border border-line2 rounded px-1.5 py-0.5 text-xs text-text2 focus:outline-none"
                />
                <button onClick={() => onSaveRename(conv)} aria-label="Save title" className="p-1 rounded text-state-success hover:bg-state-success/10 flex-shrink-0">
                  <Check className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <>
                <Link
                  to={`/project/${projectId}/c/${conv._id}`}
                  onClick={onNavigate}
                  className="flex items-center gap-1.5 flex-1 min-w-0"
                >
                  <MessageSquare className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{conv.title}</span>
                </Link>
                <div className="hidden group-hover:block flex-shrink-0">
                  <ConversationMenu
                    conversation={conv}
                    onRename={() => onStartRename(conv)}
                    onTogglePin={onTogglePin}
                    onToggleArchive={onToggleArchive}
                    onExport={exportConversationAsMarkdown}
                    onDelete={onDelete}
                  />
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
