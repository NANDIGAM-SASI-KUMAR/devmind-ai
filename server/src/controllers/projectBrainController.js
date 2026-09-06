import Project from '../models/Project.js';
import ProjectMemory from '../models/ProjectMemory.js';

const CATEGORIES = ['technology', 'architecture', 'conventions', 'decisions'];

// GET /api/projects/:projectId/brain
export const listMemory = async (req, res) => {
  const project = await Project.findOne({ _id: req.params.projectId, user: req.user._id });
  if (!project) return res.status(404).json({ message: 'Project not found' });

  const items = await ProjectMemory.find({ project: project._id }).sort('createdAt');
  res.json(items);
};

// POST /api/projects/:projectId/brain
export const addMemory = async (req, res) => {
  const project = await Project.findOne({ _id: req.params.projectId, user: req.user._id });
  if (!project) return res.status(404).json({ message: 'Project not found' });

  const { category, content } = req.body;
  if (!CATEGORIES.includes(category)) return res.status(400).json({ message: 'Invalid category' });
  if (!content?.trim()) return res.status(400).json({ message: 'Content is required' });

  const item = await ProjectMemory.create({ project: project._id, user: req.user._id, category, content: content.trim() });
  res.status(201).json(item);
};

// DELETE /api/brain/:id
export const removeMemory = async (req, res) => {
  const item = await ProjectMemory.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!item) return res.status(404).json({ message: 'Memory item not found' });
  res.json({ message: 'Removed' });
};

// Used internally by chatController to build agent context from the Project Brain.
export const getBrainContext = async (projectId) => {
  const items = await ProjectMemory.find({ project: projectId });
  if (items.length === 0) return '';

  const byCategory = {};
  for (const item of items) {
    (byCategory[item.category] ||= []).push(item.content);
  }

  const labels = { technology: 'TECHNOLOGY', architecture: 'ARCHITECTURE', conventions: 'CONVENTIONS', decisions: 'DECISIONS' };
  const lines = CATEGORIES.filter((c) => byCategory[c]?.length).map((c) => `${labels[c]}: ${byCategory[c].join(', ')}`);

  return lines.length ? `Project Brain:\n${lines.join('\n')}` : '';
};
