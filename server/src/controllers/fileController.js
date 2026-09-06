import fs from 'fs/promises';
import path from 'path';
import Project from '../models/Project.js';
import ProjectFile from '../models/ProjectFile.js';
import Checkpoint from '../models/Checkpoint.js';
import { UPLOAD_DIR } from '../middleware/upload.js';
import { chunkText } from '../utils/chunking.js';
import { addCodeChunks, deleteCodeFileChunks, queryCodeChunks } from '../utils/chroma.js';
import { callLLM } from '../utils/llm.js';

const readFileContent = (file) => fs.readFile(path.join(UPLOAD_DIR, file.storedName), 'utf8');

const reindexFile = async (file, content) => {
  await deleteCodeFileChunks(file.project, file._id);
  const chunks = chunkText(content, { chunkSize: 800, overlap: 100 });
  await addCodeChunks(file.project, file._id, file.originalName, chunks);
};

const MAX_CONTEXT_CHARS = 6000;

// POST /api/projects/:projectId/files
export const uploadFile = async (req, res) => {
  const project = await Project.findOne({ _id: req.params.projectId, user: req.user._id });
  if (!project) return res.status(404).json({ message: 'Project not found' });
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

  const file = await ProjectFile.create({
    project: project._id,
    user: req.user._id,
    originalName: req.file.originalname,
    storedName: req.file.filename,
    mimeType: req.file.mimetype,
    size: req.file.size
  });

  // Best-effort: index the file for semantic codebase search. A failure here
  // shouldn't fail the upload — the file is already saved and usable as chat context.
  try {
    const content = await fs.readFile(path.join(UPLOAD_DIR, req.file.filename), 'utf8');
    const chunks = chunkText(content, { chunkSize: 800, overlap: 100 });
    await addCodeChunks(project._id, file._id, file.originalName, chunks);
  } catch (err) {
    console.error('Code indexing failed for', file.originalName, ':', err.message);
  }

  res.status(201).json(file);
};

// GET /api/projects/:projectId/files
export const listFiles = async (req, res) => {
  const project = await Project.findOne({ _id: req.params.projectId, user: req.user._id });
  if (!project) return res.status(404).json({ message: 'Project not found' });

  const files = await ProjectFile.find({ project: project._id }).sort('-createdAt');
  res.json(files);
};

// DELETE /api/files/:id
export const deleteFile = async (req, res) => {
  const file = await ProjectFile.findOne({ _id: req.params.id, user: req.user._id });
  if (!file) return res.status(404).json({ message: 'File not found' });

  await fs.unlink(path.join(UPLOAD_DIR, file.storedName)).catch(() => {});
  await deleteCodeFileChunks(file.project, file._id);
  await file.deleteOne();
  res.json({ message: 'File deleted' });
};

// GET /api/projects/:projectId/search-code?q=...
export const searchCode = async (req, res) => {
  const project = await Project.findOne({ _id: req.params.projectId, user: req.user._id });
  if (!project) return res.status(404).json({ message: 'Project not found' });

  const q = (req.query.q || '').trim();
  if (!q) return res.status(400).json({ message: 'Query is required' });

  const results = await queryCodeChunks(project._id, q, 6);
  res.json({ results });
};

// Used internally by chatController to build project context from uploaded files.
export const getFilesContext = async (projectId) => {
  const files = await ProjectFile.find({ project: projectId }).sort('-createdAt');
  if (files.length === 0) return '';

  let budget = MAX_CONTEXT_CHARS;
  const blocks = [];
  for (const file of files) {
    if (budget <= 0) break;
    try {
      const content = await fs.readFile(path.join(UPLOAD_DIR, file.storedName), 'utf8');
      const snippet = content.slice(0, budget);
      blocks.push(`### ${file.originalName}\n\`\`\`\n${snippet}\n\`\`\``);
      budget -= snippet.length;
    } catch {
      // File missing on disk — skip silently, don't fail the whole chat request.
    }
  }
  return blocks.length ? `Project files:\n${blocks.join('\n\n')}` : '';
};

const PROPOSE_PROMPT = `You are the Coder Agent modifying an existing file in DevMind.

You will be given the file's current full content and an instruction for how to change it.
Respond with ONLY the complete new file content — no markdown fences, no commentary, no explanation.
Preserve everything that isn't relevant to the instruction. Output the full file, not a diff or a partial snippet.`;

// POST /api/files/:id/propose  { instruction }
// Asks the Coder agent for the file's full new content. Does NOT write anything —
// this only returns a proposal for the user to review as a diff before accepting.
export const proposeFileEdit = async (req, res) => {
  const file = await ProjectFile.findOne({ _id: req.params.id, user: req.user._id });
  if (!file) return res.status(404).json({ message: 'File not found' });

  const instruction = (req.body.instruction || '').trim();
  if (!instruction) return res.status(400).json({ message: 'An instruction is required' });

  try {
    const oldContent = await readFileContent(file);
    const newContent = await callLLM({
      system: PROPOSE_PROMPT,
      messages: [{ role: 'user', content: `File: ${file.originalName}\n\nCurrent content:\n${oldContent}\n\nInstruction: ${instruction}` }],
      maxTokens: 3000
    });
    res.json({ oldContent, newContent: newContent.trim() });
  } catch (err) {
    console.error('Propose edit failed:', err);
    res.status(500).json({ message: 'Could not generate a proposed change right now.' });
  }
};

// POST /api/files/:id/apply  { newContent }
// Accepts a proposed change: snapshots the current content as a checkpoint, then
// actually overwrites the file on disk and re-indexes it.
export const applyFileEdit = async (req, res) => {
  const file = await ProjectFile.findOne({ _id: req.params.id, user: req.user._id });
  if (!file) return res.status(404).json({ message: 'File not found' });

  const newContent = req.body.newContent;
  if (typeof newContent !== 'string' || !newContent.trim()) {
    return res.status(400).json({ message: 'New content is required' });
  }

  const oldContent = await readFileContent(file);
  await Checkpoint.create({
    project: file.project,
    file: file._id,
    user: req.user._id,
    label: `Before edit — ${new Date().toLocaleString()}`,
    content: oldContent
  });

  await fs.writeFile(path.join(UPLOAD_DIR, file.storedName), newContent, 'utf8');
  file.size = Buffer.byteLength(newContent, 'utf8');
  await file.save();
  await reindexFile(file, newContent);

  res.json({ message: 'Change applied', file });
};

// GET /api/files/:id/checkpoints
export const listCheckpoints = async (req, res) => {
  const file = await ProjectFile.findOne({ _id: req.params.id, user: req.user._id });
  if (!file) return res.status(404).json({ message: 'File not found' });

  const checkpoints = await Checkpoint.find({ file: file._id }).sort('-createdAt').select('-content');
  res.json(checkpoints);
};

// POST /api/files/:id/checkpoints/:checkpointId/restore
// Restoring is itself reversible: the CURRENT content is saved as a new checkpoint
// before being overwritten, so a restore can always be undone by restoring again.
export const restoreCheckpoint = async (req, res) => {
  const file = await ProjectFile.findOne({ _id: req.params.id, user: req.user._id });
  if (!file) return res.status(404).json({ message: 'File not found' });

  const checkpoint = await Checkpoint.findOne({ _id: req.params.checkpointId, file: file._id });
  if (!checkpoint) return res.status(404).json({ message: 'Checkpoint not found' });

  const currentContent = await readFileContent(file);
  await Checkpoint.create({
    project: file.project,
    file: file._id,
    user: req.user._id,
    label: `Before restore — ${new Date().toLocaleString()}`,
    content: currentContent
  });

  await fs.writeFile(path.join(UPLOAD_DIR, file.storedName), checkpoint.content, 'utf8');
  file.size = Buffer.byteLength(checkpoint.content, 'utf8');
  await file.save();
  await reindexFile(file, checkpoint.content);

  res.json({ message: 'Checkpoint restored', file });
};
