import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Trash2, Loader2, ArrowUpRight, FolderOpen } from 'lucide-react';
import { useProjects } from '../context/ProjectsContext.jsx';
import AppShell from '../components/shell/AppShell.jsx';
import NewProjectModal from '../components/dashboard/NewProjectModal.jsx';

export default function ProjectsListPage() {
  const navigate = useNavigate();
  const { projects, loading, createProject, removeProject } = useProjects();
  const [showModal, setShowModal] = useState(false);

  const handleCreate = async (data) => {
    const project = await createProject(data);
    setShowModal(false);
    navigate(`/project/${project._id}`);
  };

  const handleDelete = async (id, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('Permanently delete this project and all its messages?')) return;
    await removeProject(id);
  };

  return (
    <AppShell>
      <main className="h-full overflow-y-auto px-6 md:px-10 py-10 max-w-[1200px] mx-auto">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
          <h1 className="font-heading text-4xl md:text-5xl font-extrabold text-text2 tracking-tight">
            Your <span className="brand-gradient-text">projects</span>
          </h1>
          <button
            onClick={() => setShowModal(true)}
            className="btn-brand group flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-white font-semibold w-full md:w-auto"
          >
            <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" strokeWidth={2.5} />
            New project
          </button>
        </div>

        {loading ? (
          <div className="py-32 flex justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-brand" />
          </div>
        ) : projects.length === 0 ? (
          <EmptyState onCreate={() => setShowModal(true)} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <ProjectCard key={project._id} project={project} onDelete={(e) => handleDelete(project._id, e)} />
            ))}
          </div>
        )}
      </main>

      {showModal && <NewProjectModal onClose={() => setShowModal(false)} onCreate={handleCreate} />}
    </AppShell>
  );
}

function ProjectCard({ project, onDelete }) {
  const time = new Date(project.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

  return (
    <Link
      to={`/project/${project._id}`}
      className="group relative bg-card border border-line2 rounded-2xl p-6 hover:border-line2-strong hover:bg-card-hover transition-all duration-300 auth-fade-in"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${project.color}22` }}>
          <FolderOpen className="w-5 h-5" style={{ color: project.color }} />
        </div>
        <button
          onClick={onDelete}
          aria-label="Delete project"
          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-text2-faint hover:text-state-danger hover:bg-state-danger/10 transition-all"
          title="Delete"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <h3 className="font-heading text-lg font-bold text-text2 mb-1.5 truncate group-hover:text-brand-soft transition-colors">
        {project.name}
      </h3>
      <p className="text-sm text-text2-muted leading-relaxed line-clamp-2 mb-4 min-h-[2.5em]">
        {project.description || <span className="text-text2-faint">No description.</span>}
      </p>

      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-1.5">
          {project.tech?.slice(0, 2).map((t) => (
            <span key={t} className="px-2 py-0.5 rounded-md text-[11px] font-medium text-text2-muted bg-card-hover border border-line2">
              {t}
            </span>
          ))}
          {project.tech?.length > 2 && (
            <span className="px-2 py-0.5 text-[11px] text-text2-faint">+{project.tech.length - 2}</span>
          )}
        </div>
        <span className="text-[11px] text-text2-faint flex items-center gap-1 flex-shrink-0">
          {time}
          <ArrowUpRight className="w-3.5 h-3.5 text-text2-faint group-hover:text-brand-soft group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all" strokeWidth={2} />
        </span>
      </div>
    </Link>
  );
}

function EmptyState({ onCreate }) {
  return (
    <div className="py-24 text-center bg-card border border-line2 rounded-2xl auth-fade-in">
      <div className="w-14 h-14 rounded-2xl bg-brand/15 flex items-center justify-center mx-auto mb-6">
        <FolderOpen className="w-6 h-6 text-brand-soft" />
      </div>
      <h2 className="font-heading text-2xl font-bold text-text2 mb-2">Nothing here yet</h2>
      <p className="text-text2-muted mb-8 max-w-sm mx-auto">Create your first project to begin a conversation with the specialists.</p>
      <button
        onClick={onCreate}
        className="btn-brand inline-flex items-center gap-2 px-5 py-3 rounded-xl text-white font-semibold"
      >
        <Plus className="w-4 h-4" strokeWidth={2.5} />
        Start your first project
      </button>
    </div>
  );
}
