import Task from '../models/Task.js';
import Project from '../models/Project.js';
import { callLLM } from '../utils/llm.js';
import { notify } from './notificationController.js';

// GET /api/projects/:projectId/tasks
export const listTasks = async (req, res) => {
  const project = await Project.findOne({ _id: req.params.projectId, user: req.user._id });
  if (!project) return res.status(404).json({ message: 'Project not found' });

  const tasks = await Task.find({ project: project._id }).sort('createdAt');
  res.json(tasks);
};

// POST /api/projects/:projectId/tasks
export const createTask = async (req, res) => {
  const project = await Project.findOne({ _id: req.params.projectId, user: req.user._id });
  if (!project) return res.status(404).json({ message: 'Project not found' });

  const { title, description, priority, agent, phase, conversation } = req.body;
  if (!title?.trim()) return res.status(400).json({ message: 'Title is required' });

  const task = await Task.create({
    project: project._id,
    user: req.user._id,
    conversation: conversation || null,
    title: title.trim(),
    description: description || '',
    priority: ['low', 'medium', 'high'].includes(priority) ? priority : 'medium',
    agent: ['planner', 'coder', 'debugger', 'docs', 'reviewer', 'tester'].includes(agent) ? agent : null,
    phase: phase || ''
  });
  res.status(201).json(task);
};

// PUT /api/tasks/:id
export const updateTask = async (req, res) => {
  const allowed = {};
  if (typeof req.body.title === 'string' && req.body.title.trim()) allowed.title = req.body.title.trim();
  if (typeof req.body.description === 'string') allowed.description = req.body.description;
  if (['todo', 'in_progress', 'done'].includes(req.body.status)) allowed.status = req.body.status;
  if (['low', 'medium', 'high'].includes(req.body.priority)) allowed.priority = req.body.priority;

  const existing = await Task.findOne({ _id: req.params.id, user: req.user._id });
  if (!existing) return res.status(404).json({ message: 'Task not found' });

  const wasDone = existing.status === 'done';
  const task = await Task.findOneAndUpdate({ _id: req.params.id, user: req.user._id }, allowed, { new: true });

  if (!wasDone && task.status === 'done') {
    await notify(req.user._id, {
      type: 'task_completed',
      title: 'Task completed',
      message: task.title,
      link: `/project/${task.project}`
    });
  }

  res.json(task);
};

// DELETE /api/tasks/:id
export const deleteTask = async (req, res) => {
  const task = await Task.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!task) return res.status(404).json({ message: 'Task not found' });
  res.json({ message: 'Task deleted' });
};

// POST /api/projects/:projectId/tasks/bulk  { items: [{ title, description, priority, phase }] }
export const createTasksBulk = async (req, res) => {
  const project = await Project.findOne({ _id: req.params.projectId, user: req.user._id });
  if (!project) return res.status(404).json({ message: 'Project not found' });

  const items = Array.isArray(req.body.items) ? req.body.items : [];
  if (items.length === 0) return res.status(400).json({ message: 'No items provided' });

  const docs = items
    .filter((i) => i.title?.trim())
    .map((i) => ({
      project: project._id,
      user: req.user._id,
      title: i.title.trim(),
      description: i.description || '',
      priority: ['low', 'medium', 'high'].includes(i.priority) ? i.priority : 'medium',
      phase: i.phase || ''
    }));

  const created = await Task.insertMany(docs);
  res.status(201).json(created);
};

const PLAN_PROMPT = `You are DevMind's project planner. Given a project goal, produce a phased implementation plan.

Respond with ONLY valid JSON (no markdown fences, no commentary) matching exactly this shape:
{
  "phases": [
    { "name": "Phase name", "items": [ { "title": "short task title", "description": "one sentence of detail" } ] }
  ]
}

Use 3-5 phases (e.g. Foundation, Core, Testing, Deployment — adapt to the actual goal). Each phase should have 2-6 concrete items. Keep titles short and actionable.`;

// POST /api/projects/:projectId/plan  { goal }
export const generateProjectPlan = async (req, res) => {
  const project = await Project.findOne({ _id: req.params.projectId, user: req.user._id });
  if (!project) return res.status(404).json({ message: 'Project not found' });

  const goal = (req.body.goal || '').trim();
  if (!goal) return res.status(400).json({ message: 'A project goal is required' });

  try {
    const raw = await callLLM({
      system: PLAN_PROMPT,
      messages: [{ role: 'user', content: goal }],
      maxTokens: 1500
    });

    const jsonText = raw.trim().replace(/^```(json)?/i, '').replace(/```$/, '').trim();
    const parsed = JSON.parse(jsonText);

    if (!Array.isArray(parsed.phases)) throw new Error('Malformed plan response');

    await notify(req.user._id, {
      type: 'project_plan_generated',
      title: 'Project plan generated',
      message: project.name,
      link: `/project/${project._id}`
    });

    res.json({ phases: parsed.phases });
  } catch (err) {
    console.error('Plan generation failed:', err);
    res.status(500).json({ message: 'Could not generate a plan right now. Please try again.' });
  }
};
