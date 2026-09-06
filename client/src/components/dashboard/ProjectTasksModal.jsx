import { useState, useEffect } from 'react';
import {
  X, Loader2, Plus, Circle, CircleDot, CheckCircle2, Trash2,
  Sparkles, ChevronDown, ChevronRight
} from 'lucide-react';
import { tasksAPI } from '../../api/tasks.js';

const STATUS_CYCLE = { todo: 'in_progress', in_progress: 'done', done: 'todo' };
const STATUS_ICON = { todo: Circle, in_progress: CircleDot, done: CheckCircle2 };
const STATUS_COLOR = { todo: '#5C6178', in_progress: '#FBBF24', done: '#34D399' };
const PRIORITY_COLOR = { low: '#5C6178', medium: '#818CF8', high: '#F87171' };

export default function ProjectTasksModal({ projectId, onClose }) {
  const [tab, setTab] = useState('tasks');
  const [tasks, setTasks] = useState(null);
  const [newTitle, setNewTitle] = useState('');
  const [adding, setAdding] = useState(false);

  const load = async () => {
    try { setTasks(await tasksAPI.list(projectId)); } catch (err) { console.error(err); }
  };

  useEffect(() => { load(); }, [projectId]);

  useEffect(() => {
    const handler = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setAdding(true);
    try {
      const task = await tasksAPI.create(projectId, { title: newTitle.trim() });
      setTasks((t) => [...(t || []), task]);
      setNewTitle('');
    } finally {
      setAdding(false);
    }
  };

  const cycleStatus = async (task) => {
    const status = STATUS_CYCLE[task.status];
    const updated = await tasksAPI.update(task._id, { status });
    setTasks((t) => t.map((x) => (x._id === task._id ? updated : x)));
  };

  const handleDelete = async (id) => {
    await tasksAPI.remove(id);
    setTasks((t) => t.filter((x) => x._id !== id));
  };

  const grouped = groupByPhase(tasks || []);
  const doneCount = (tasks || []).filter((t) => t.status === 'done').length;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="w-full max-w-xl auth-card rounded-2xl shadow-2xl shadow-black/50 auth-fade-in max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 pt-6 pb-1 flex-shrink-0">
          <h2 className="font-heading text-xl font-bold text-text2">Engineering tasks</h2>
          <button onClick={onClose} aria-label="Close" className="p-1.5 rounded-lg text-text2-faint hover:text-text2 hover:bg-card-hover transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-1 px-6 pt-3 flex-shrink-0">
          <TabButton active={tab === 'tasks'} onClick={() => setTab('tasks')}>
            Tasks {tasks ? `(${doneCount}/${tasks.length})` : ''}
          </TabButton>
          <TabButton active={tab === 'plan'} onClick={() => setTab('plan')}>
            <Sparkles className="w-3.5 h-3.5" /> AI Planner
          </TabButton>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4">
          {tab === 'tasks' ? (
            <TasksTab
              tasks={tasks}
              grouped={grouped}
              onCycleStatus={cycleStatus}
              onDelete={handleDelete}
              newTitle={newTitle}
              setNewTitle={setNewTitle}
              onAdd={handleAdd}
              adding={adding}
            />
          ) : (
            <PlannerTab projectId={projectId} onTasksAdded={load} onSwitchToTasks={() => setTab('tasks')} />
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
      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-colors ${
        active ? 'bg-card-raised text-text2 border border-line2' : 'text-text2-faint hover:text-text2'
      }`}
    >
      {children}
    </button>
  );
}

function groupByPhase(tasks) {
  const groups = new Map();
  for (const t of tasks) {
    const key = t.phase || 'General';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(t);
  }
  return [...groups.entries()];
}

function TasksTab({ tasks, grouped, onCycleStatus, onDelete, newTitle, setNewTitle, onAdd, adding }) {
  if (tasks === null) {
    return <div className="py-12 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-brand" /></div>;
  }

  return (
    <div>
      <form onSubmit={onAdd} className="flex gap-2 mb-4">
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Add a task…"
          className="field-shell flex-1 rounded-xl px-3.5 py-2.5 text-sm text-text2 placeholder:text-text2-faint focus:outline-none"
        />
        <button
          type="submit"
          disabled={adding || !newTitle.trim()}
          aria-label="Add task"
          className="btn-brand px-4 py-2.5 rounded-xl text-white disabled:opacity-40"
        >
          {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
        </button>
      </form>

      {tasks.length === 0 ? (
        <p className="text-sm text-text2-faint text-center py-8">No tasks yet. Add one above, or generate a plan with AI.</p>
      ) : (
        <div className="space-y-4">
          {grouped.map(([phase, items]) => (
            <div key={phase}>
              {grouped.length > 1 && <p className="text-[11px] font-medium tracking-wide text-text2-faint uppercase mb-1.5">{phase}</p>}
              <div className="space-y-1">
                {items.map((task) => (
                  <TaskRow key={task._id} task={task} onCycleStatus={onCycleStatus} onDelete={onDelete} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TaskRow({ task, onCycleStatus, onDelete }) {
  const StatusIcon = STATUS_ICON[task.status];
  return (
    <div className="group flex items-start gap-2.5 px-3 py-2.5 rounded-xl hover:bg-card-hover transition-colors">
      <button onClick={() => onCycleStatus(task)} aria-label="Cycle task status" className="mt-0.5 flex-shrink-0" title="Cycle status">
        <StatusIcon className="w-4 h-4" style={{ color: STATUS_COLOR[task.status] }} fill={task.status === 'done' ? STATUS_COLOR.done : 'none'} />
      </button>
      <div className="flex-1 min-w-0">
        <p className={`text-sm ${task.status === 'done' ? 'text-text2-faint line-through' : 'text-text2'}`}>{task.title}</p>
        {task.description && <p className="text-xs text-text2-faint mt-0.5">{task.description}</p>}
      </div>
      <span
        className="px-1.5 py-0.5 rounded text-[10px] font-medium flex-shrink-0 mt-0.5"
        style={{ color: PRIORITY_COLOR[task.priority], backgroundColor: `${PRIORITY_COLOR[task.priority]}18` }}
      >
        {task.priority}
      </span>
      <button
        onClick={() => onDelete(task._id)}
        aria-label="Delete task"
        className="opacity-0 group-hover:opacity-100 p-1 rounded text-text2-faint hover:text-state-danger transition-all flex-shrink-0"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

function PlannerTab({ projectId, onTasksAdded, onSwitchToTasks }) {
  const [goal, setGoal] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [plan, setPlan] = useState(null);
  const [checked, setChecked] = useState(new Set());
  const [expanded, setExpanded] = useState(new Set());
  const [adding, setAdding] = useState(false);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!goal.trim()) return;
    setLoading(true);
    setError('');
    setPlan(null);
    try {
      const result = await tasksAPI.generatePlan(projectId, goal.trim());
      setPlan(result.phases);
      const allChecked = new Set();
      const allExpanded = new Set();
      result.phases.forEach((phase, pi) => {
        allExpanded.add(pi);
        phase.items.forEach((_, ii) => allChecked.add(`${pi}-${ii}`));
      });
      setChecked(allChecked);
      setExpanded(allExpanded);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not generate a plan');
    } finally {
      setLoading(false);
    }
  };

  const toggleItem = (key) => {
    setChecked((s) => {
      const next = new Set(s);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const toggleExpand = (pi) => {
    setExpanded((s) => {
      const next = new Set(s);
      next.has(pi) ? next.delete(pi) : next.add(pi);
      return next;
    });
  };

  const handleAddSelected = async () => {
    const items = [];
    plan.forEach((phase, pi) => {
      phase.items.forEach((item, ii) => {
        if (checked.has(`${pi}-${ii}`)) items.push({ ...item, phase: phase.name });
      });
    });
    if (items.length === 0) return;
    setAdding(true);
    try {
      await tasksAPI.createBulk(projectId, items);
      await onTasksAdded();
      onSwitchToTasks();
    } finally {
      setAdding(false);
    }
  };

  const selectedCount = checked.size;

  return (
    <div>
      <form onSubmit={handleGenerate} className="mb-4">
        <span className="block text-xs font-medium text-text2-muted mb-1.5">What are you building?</span>
        <div className="flex gap-2">
          <input
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="e.g. A task management API with auth and email notifications"
            className="field-shell flex-1 rounded-xl px-3.5 py-2.5 text-sm text-text2 placeholder:text-text2-faint focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading || !goal.trim()}
            className="btn-brand px-4 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-40 flex-shrink-0"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Plan it'}
          </button>
        </div>
      </form>

      {error && (
        <div className="rounded-xl border border-state-danger/30 bg-state-danger/10 px-3.5 py-2.5 text-state-danger text-sm mb-4">
          {error}
        </div>
      )}

      {plan && (
        <div className="space-y-3">
          {plan.map((phase, pi) => (
            <div key={pi} className="rounded-xl border border-line2 overflow-hidden">
              <button
                onClick={() => toggleExpand(pi)}
                className="w-full flex items-center gap-2 px-3.5 py-2.5 bg-card-raised text-left"
              >
                {expanded.has(pi) ? <ChevronDown className="w-3.5 h-3.5 text-text2-faint" /> : <ChevronRight className="w-3.5 h-3.5 text-text2-faint" />}
                <span className="text-sm font-semibold text-text2">{phase.name}</span>
                <span className="text-xs text-text2-faint ml-auto">{phase.items.length} items</span>
              </button>
              {expanded.has(pi) && (
                <div className="p-2 space-y-0.5">
                  {phase.items.map((item, ii) => (
                    <label key={ii} className="flex items-start gap-2.5 px-2 py-2 rounded-lg hover:bg-card-hover cursor-pointer">
                      <input
                        type="checkbox"
                        checked={checked.has(`${pi}-${ii}`)}
                        onChange={() => toggleItem(`${pi}-${ii}`)}
                        className="mt-1 accent-brand"
                      />
                      <div>
                        <p className="text-sm text-text2">{item.title}</p>
                        {item.description && <p className="text-xs text-text2-faint mt-0.5">{item.description}</p>}
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          ))}

          <button
            onClick={handleAddSelected}
            disabled={adding || selectedCount === 0}
            className="btn-brand w-full py-3 rounded-xl text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-40"
          >
            {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : `Add ${selectedCount} task${selectedCount === 1 ? '' : 's'}`}
          </button>
        </div>
      )}
    </div>
  );
}
