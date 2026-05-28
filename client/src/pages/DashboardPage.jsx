import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, LogOut, Trash2, Loader2, ArrowUpRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { projectsAPI } from '../api/projects.js';
import NewProjectModal from '../components/dashboard/NewProjectModal.jsx';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => { loadProjects(); }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const data = await projectsAPI.list();
      setProjects(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (data) => {
    const project = await projectsAPI.create(data);
    setShowModal(false);
    navigate(`/project/${project._id}`);
  };

  const handleDelete = async (id, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('Permanently delete this project and all its messages?')) return;
    await projectsAPI.remove(id);
    setProjects(projects.filter((p) => p._id !== id));
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const today = new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="min-h-screen atmosphere">
      {/* ============ TOP BAR ============ */}
      <header className="border-b border-rule sticky top-0 bg-paper/90 backdrop-blur z-30">
        <div className="flex items-center justify-between px-6 md:px-10 py-4">
          <Link to="/dashboard" className="flex items-center gap-3">
            <span className="stamp text-signal">dm</span>
            <div className="hidden sm:block">
              <div className="display text-lg leading-none">Dev<span className="display-italic">Mind</span></div>
              <div className="label-xs text-ink-faint mt-1">workshop · vol.01</div>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <span className="label-xs text-ink-faint hidden md:inline">{today.toUpperCase()}</span>
            <div className="hidden md:block w-px h-6 bg-rule"></div>
            <div className="flex items-center gap-2.5 px-3 py-1.5 border border-rule">
              <div className="w-6 h-6 bg-signal flex items-center justify-center text-paper font-display italic text-sm">
                {user?.name?.[0]?.toUpperCase() || 'U'}
              </div>
              <span className="text-sm text-ink-muted hidden sm:block">{user?.name}</span>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-ink-faint hover:text-ink hover:bg-surface transition-colors"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="px-6 md:px-10 py-12 md:py-16 max-w-[1400px] mx-auto">
        {/* Meta */}
        <div className="grid grid-cols-12 gap-6 mb-8 stagger">
          <div className="col-span-12 md:col-span-3 label-xs text-ink-faint">
            DEVMIND / WORKSHOP
          </div>
          <div className="col-span-12 md:col-span-6 label-xs text-ink-muted">
            <span className="text-signal">●</span>&nbsp;&nbsp;{projects.length} {projects.length === 1 ? 'PROJECT' : 'PROJECTS'} ON FILE
          </div>
          <div className="col-span-12 md:col-span-3 label-xs text-ink-faint md:text-right">
            SESSION ACTIVE
          </div>
        </div>

        <div className="hairline mb-10"></div>

        {/* Hero header */}
        <div className="grid grid-cols-12 gap-6 mb-16 stagger">
          <div className="col-span-12 md:col-span-9">
            <div className="label-xs text-ink-faint mb-3">GOOD TO SEE YOU, {user?.name?.split(' ')[0]?.toUpperCase()}</div>
            <h1 className="display text-6xl md:text-7xl lg:text-8xl">
              Your <span className="display-italic text-signal">projects</span>,
              <br />
              gathered in one place.
            </h1>
          </div>
          <div className="col-span-12 md:col-span-3 flex md:flex-col md:justify-end md:items-end gap-3">
            <button
              onClick={() => setShowModal(true)}
              className="group inline-flex items-center justify-between gap-4 px-5 py-3 bg-signal text-paper hover:bg-ink transition-colors w-full md:min-w-[220px]"
            >
              <span className="label-xs">Start a new project</span>
              <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* ============ PROJECT LIST — editorial table style ============ */}
        {loading ? (
          <div className="py-32 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-signal" />
          </div>
        ) : projects.length === 0 ? (
          <EmptyState onCreate={() => setShowModal(true)} />
        ) : (
          <div>
            {/* Table header */}
            <div className="hidden md:grid grid-cols-12 gap-4 pb-3 mb-px label-xs text-ink-faint border-b border-rule">
              <div className="col-span-1">NO.</div>
              <div className="col-span-4">PROJECT</div>
              <div className="col-span-4">DESCRIPTION</div>
              <div className="col-span-2">STACK</div>
              <div className="col-span-1 text-right">UPDATED</div>
            </div>

            <div className="space-y-px bg-rule border-x border-b border-rule">
              {projects.map((project, i) => (
                <ProjectRow
                  key={project._id}
                  project={project}
                  index={i + 1}
                  onDelete={(e) => handleDelete(project._id, e)}
                />
              ))}
            </div>

            <div className="dotted-rule mt-6"></div>
            <div className="flex justify-between mt-3 label-xs text-ink-faint">
              <span>END OF ARCHIVE</span>
              <span>{projects.length} of {projects.length}</span>
            </div>
          </div>
        )}
      </main>

      {showModal && <NewProjectModal onClose={() => setShowModal(false)} onCreate={handleCreate} />}
    </div>
  );
}

function ProjectRow({ project, index, onDelete }) {
  const time = new Date(project.updatedAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric'
  });

  return (
    <Link
      to={`/project/${project._id}`}
      className="group block bg-paper hover:bg-surface transition-colors p-5 md:p-6"
      style={{ animation: `fadeUp 0.6s cubic-bezier(0.22, 1, 0.36, 1) ${index * 0.04}s both` }}
    >
      <div className="grid grid-cols-12 gap-4 items-baseline">
        <div className="col-span-2 md:col-span-1 numeral text-3xl md:text-4xl" style={{ color: project.color }}>
          {String(index).padStart(2, '0')}
        </div>

        <div className="col-span-10 md:col-span-4">
          <h3 className="display text-2xl md:text-3xl leading-tight group-hover:text-signal transition-colors">
            {project.name}
          </h3>
        </div>

        <div className="col-span-12 md:col-span-4 text-ink-muted text-sm leading-relaxed line-clamp-2 md:pl-0 pl-0 md:mt-0 mt-2">
          {project.description || <span className="italic text-ink-faint">No description.</span>}
        </div>

        <div className="col-span-9 md:col-span-2 flex flex-wrap gap-1.5">
          {project.tech?.slice(0, 2).map((t) => (
            <span key={t} className="px-2 py-0.5 label-xs text-ink-muted border border-rule">
              {t}
            </span>
          ))}
          {project.tech?.length > 2 && (
            <span className="px-2 py-0.5 label-xs text-ink-faint">
              +{project.tech.length - 2}
            </span>
          )}
        </div>

        <div className="col-span-3 md:col-span-1 flex items-center justify-end gap-2">
          <span className="label-xs text-ink-faint hidden md:inline">{time}</span>
          <button
            onClick={onDelete}
            className="opacity-0 group-hover:opacity-100 p-1.5 text-ink-faint hover:text-warm transition-all"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <ArrowUpRight className="w-4 h-4 text-ink-faint group-hover:text-signal group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all" strokeWidth={1.5} />
        </div>
      </div>
    </Link>
  );
}

function EmptyState({ onCreate }) {
  return (
    <div className="py-20 md:py-32 text-center grid-paper border border-rule animate-fade-in">
      <div className="numeral text-9xl text-signal mb-6 leading-none">00</div>
      <div className="label-xs text-ink-faint mb-4">YOUR ARCHIVE IS EMPTY</div>
      <h2 className="display text-4xl md:text-5xl mb-3">Nothing here <span className="display-italic">yet</span>.</h2>
      <p className="text-ink-muted mb-10 max-w-md mx-auto font-display italic text-lg leading-relaxed">
        Create your first project to begin a conversation with the agents.
      </p>
      <button
        onClick={onCreate}
        className="group inline-flex items-center gap-3 px-6 py-3 bg-signal text-paper hover:bg-ink transition-colors"
      >
        <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" strokeWidth={2.5} />
        <span className="label-xs">Start the first one</span>
      </button>
    </div>
  );
}
