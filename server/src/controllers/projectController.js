import fs from 'fs/promises';
import path from 'path';
import Project from '../models/Project.js';
import Message from '../models/Message.js';
import Conversation from '../models/Conversation.js';
import ProjectFile from '../models/ProjectFile.js';
import Task from '../models/Task.js';
import ProjectMemory from '../models/ProjectMemory.js';
import Checkpoint from '../models/Checkpoint.js';
import GithubConnection from '../models/GithubConnection.js';
import { UPLOAD_DIR } from '../middleware/upload.js';
import { deleteProjectCodeCollection } from '../utils/chroma.js';

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

// Deletes everything scoped to a project: files on disk, its Chroma code collection,
// and every dependent Mongo collection. Shared by single-project deletion and full
// account deletion so both stay in sync as new project-scoped data is added.
export const cascadeDeleteProjectData = async (projectId) => {
  const files = await ProjectFile.find({ project: projectId });
  await Promise.all(files.map((f) => fs.unlink(path.join(UPLOAD_DIR, f.storedName)).catch(() => {})));
  await ProjectFile.deleteMany({ project: projectId });
  await deleteProjectCodeCollection(projectId);

  await Message.deleteMany({ project: projectId });
  await Conversation.deleteMany({ project: projectId });
  await Task.deleteMany({ project: projectId });
  await ProjectMemory.deleteMany({ project: projectId });
  await Checkpoint.deleteMany({ project: projectId });
  await GithubConnection.deleteMany({ project: projectId });
};

// DELETE /api/projects/:id
export const deleteProject = async (req, res) => {
  const project = await Project.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!project) return res.status(404).json({ message: 'Project not found' });

  await cascadeDeleteProjectData(project._id);
  res.json({ message: 'Project deleted' });
};

// GET /api/projects/:id/messages
export const getMessages = async (req, res) => {
  const project = await Project.findOne({ _id: req.params.id, user: req.user._id });
  if (!project) return res.status(404).json({ message: 'Project not found' });
  const messages = await Message.find({ project: project._id }).sort('createdAt');
  res.json(messages);
};
