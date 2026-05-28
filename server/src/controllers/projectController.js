import Project from '../models/Project.js';
import Message from '../models/Message.js';

// GET /api/projects
export const getProjects = async (req, res) => {
  const projects = await Project.find({ user: req.user._id }).sort('-updatedAt');
  res.json(projects);
};

// POST /api/projects
export const createProject = async (req, res) => {
  const { name, description, tech, color } = req.body;
  if (!name) return res.status(400).json({ message: 'Project name required' });

  const project = await Project.create({
    user: req.user._id,
    name,
    description: description || '',
    tech: tech || [],
    color: color || '#8b5cf6'
  });
  res.status(201).json(project);
};

// GET /api/projects/:id
export const getProject = async (req, res) => {
  const project = await Project.findOne({ _id: req.params.id, user: req.user._id });
  if (!project) return res.status(404).json({ message: 'Project not found' });
  res.json(project);
};

// PUT /api/projects/:id
export const updateProject = async (req, res) => {
  const project = await Project.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    req.body,
    { new: true }
  );
  if (!project) return res.status(404).json({ message: 'Project not found' });
  res.json(project);
};

// DELETE /api/projects/:id
export const deleteProject = async (req, res) => {
  const project = await Project.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!project) return res.status(404).json({ message: 'Project not found' });
  await Message.deleteMany({ project: project._id });
  res.json({ message: 'Project deleted' });
};

// GET /api/projects/:id/messages
export const getMessages = async (req, res) => {
  const project = await Project.findOne({ _id: req.params.id, user: req.user._id });
  if (!project) return res.status(404).json({ message: 'Project not found' });
  const messages = await Message.find({ project: project._id }).sort('createdAt');
  res.json(messages);
};
