import Conversation from '../models/Conversation.js';
import Project from '../models/Project.js';
import Message from '../models/Message.js';

// GET /api/projects/:projectId/conversations
export const listConversations = async (req, res) => {
  const project = await Project.findOne({ _id: req.params.projectId, user: req.user._id });
  if (!project) return res.status(404).json({ message: 'Project not found' });

  const conversations = await Conversation.find({
    project: project._id,
    deletedAt: null,
    archived: false
  }).sort('-pinned -lastMessageAt');

  res.json(conversations);
};

// POST /api/projects/:projectId/conversations
export const createConversation = async (req, res) => {
  const project = await Project.findOne({ _id: req.params.projectId, user: req.user._id });
  if (!project) return res.status(404).json({ message: 'Project not found' });

  const conversation = await Conversation.create({
    project: project._id,
    user: req.user._id,
    title: req.body.title?.trim() || 'New conversation'
  });
  res.status(201).json(conversation);
};

// GET /api/conversations/:id
export const getConversation = async (req, res) => {
  const conversation = await Conversation.findOne({ _id: req.params.id, user: req.user._id, deletedAt: null });
  if (!conversation) return res.status(404).json({ message: 'Conversation not found' });
  res.json(conversation);
};

// PUT /api/conversations/:id
export const updateConversation = async (req, res) => {
  const allowed = {};
  if (typeof req.body.title === 'string') allowed.title = req.body.title.trim() || 'New conversation';
  if (typeof req.body.pinned === 'boolean') allowed.pinned = req.body.pinned;
  if (typeof req.body.archived === 'boolean') allowed.archived = req.body.archived;

  const conversation = await Conversation.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id, deletedAt: null },
    allowed,
    { new: true }
  );
  if (!conversation) return res.status(404).json({ message: 'Conversation not found' });
  res.json(conversation);
};

// DELETE /api/conversations/:id  (move to trash)
export const trashConversation = async (req, res) => {
  const conversation = await Conversation.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id, deletedAt: null },
    { deletedAt: new Date() },
    { new: true }
  );
  if (!conversation) return res.status(404).json({ message: 'Conversation not found' });
  res.json(conversation);
};

// POST /api/conversations/:id/restore
export const restoreConversation = async (req, res) => {
  const conversation = await Conversation.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id, deletedAt: { $ne: null } },
    { deletedAt: null },
    { new: true }
  );
  if (!conversation) return res.status(404).json({ message: 'Conversation not found in trash' });
  res.json(conversation);
};

// DELETE /api/conversations/:id/permanent
export const permanentlyDeleteConversation = async (req, res) => {
  const conversation = await Conversation.findOne({ _id: req.params.id, user: req.user._id });
  if (!conversation) return res.status(404).json({ message: 'Conversation not found' });

  await Message.deleteMany({ conversation: conversation._id });
  await conversation.deleteOne();
  res.json({ message: 'Conversation permanently deleted' });
};

// DELETE /api/conversations/trash  (permanently deletes every trashed conversation for the user)
export const emptyTrash = async (req, res) => {
  const trashed = await Conversation.find({ user: req.user._id, deletedAt: { $ne: null } });
  const ids = trashed.map((c) => c._id);
  await Message.deleteMany({ conversation: { $in: ids } });
  await Conversation.deleteMany({ _id: { $in: ids } });
  res.json({ message: 'Trash emptied', deletedCount: ids.length });
};

// GET /api/projects/:projectId/conversations/archived
export const listArchivedConversations = async (req, res) => {
  const project = await Project.findOne({ _id: req.params.projectId, user: req.user._id });
  if (!project) return res.status(404).json({ message: 'Project not found' });

  const conversations = await Conversation.find({
    project: project._id,
    deletedAt: null,
    archived: true
  }).sort('-lastMessageAt');
  res.json(conversations);
};

// GET /api/conversations/pinned  (all pinned, active conversations for the user, across projects)
export const listPinned = async (req, res) => {
  const conversations = await Conversation.find({ user: req.user._id, deletedAt: null, pinned: true, archived: false })
    .sort('-lastMessageAt')
    .populate('project', 'name color');
  res.json(conversations);
};

// GET /api/conversations/trash  (all trashed conversations for the user, across projects)
export const listTrash = async (req, res) => {
  const conversations = await Conversation.find({ user: req.user._id, deletedAt: { $ne: null } })
    .sort('-deletedAt')
    .populate('project', 'name color');
  res.json(conversations);
};

// GET /api/conversations/:id/messages
export const getConversationMessages = async (req, res) => {
  const conversation = await Conversation.findOne({ _id: req.params.id, user: req.user._id, deletedAt: null });
  if (!conversation) return res.status(404).json({ message: 'Conversation not found' });
  const messages = await Message.find({ conversation: conversation._id }).sort('createdAt');
  res.json(messages);
};

// GET /api/search?q=...
export const searchConversations = async (req, res) => {
  const q = (req.query.q || '').trim();
  if (!q) return res.json({ conversations: [], messages: [] });

  const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

  const conversations = await Conversation.find({
    user: req.user._id,
    deletedAt: null,
    title: regex
  })
    .sort('-lastMessageAt')
    .limit(20)
    .populate('project', 'name color');

  const messageMatches = await Message.find({ user: req.user._id, content: regex })
    .sort('-createdAt')
    .limit(20)
    .populate({ path: 'conversation', select: 'title project', populate: { path: 'project', select: 'name color' } });

  // Only keep matches whose conversation still exists and isn't trashed
  const messages = messageMatches.filter((m) => m.conversation && !m.conversation.deletedAt);

  res.json({ conversations, messages });
};
