import Message from '../models/Message.js';
import Conversation from '../models/Conversation.js';
import Project from '../models/Project.js';
import { routeMessage, runAgent, AGENT_META, AGENT_NAMES } from '../agents/orchestrator.js';
import { getFilesContext } from './fileController.js';
import { getBrainContext } from './projectBrainController.js';

const titleFromMessage = (text) => {
  const clean = text.trim().replace(/\s+/g, ' ');
  return clean.length > 60 ? clean.slice(0, 57) + '…' : clean;
};

const withErrorHandling = (res, fn) =>
  fn().catch((err) => {
    console.error('chat error:', err);
    if (!res.headersSent) {
      res.status(500).json({ message: err.message });
    } else {
      res.write(`data: ${JSON.stringify({ type: 'error', message: err.message })}\n\n`);
      res.end();
    }
  });

const openSSE = (res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();
};

/**
 * POST /api/chat/:conversationId
 * Body: { message, agent? }
 */
export const streamChat = (req, res) =>
  withErrorHandling(res, async () => {
    const { conversationId } = req.params;
    const { message, agent: agentOverride } = req.body;

    if (!message?.trim()) return res.status(400).json({ message: 'Message required' });

    const conversation = await Conversation.findOne({ _id: conversationId, user: req.user._id, deletedAt: null });
    if (!conversation) return res.status(404).json({ message: 'Conversation not found' });
    const project = await Project.findById(conversation.project);

    if (conversation.title === 'New conversation') {
      conversation.title = titleFromMessage(message);
    }

    const userMsg = await Message.create({
      conversation: conversation._id,
      project: conversation.project,
      user: req.user._id,
      role: 'user',
      content: message
    });

    openSSE(res);
    res.write(`data: ${JSON.stringify({ type: 'user_message_saved', messageId: userMsg._id, title: conversation.title })}\n\n`);

    await runAgentAndStream(res, { conversation, project, userMessageText: message, agentOverride, historyExcludeId: userMsg._id });
  });

// Core: route (or use a forced agent), stream the response, save it, and touch
// the conversation/project. Assumes SSE headers are already flushed by the caller.
const runAgentAndStream = async (res, { conversation, project, userMessageText, agentOverride, historyExcludeId }) => {
  const send = (type, data) => res.write(`data: ${JSON.stringify({ type, ...data })}\n\n`);

  const agentName = AGENT_NAMES.includes(agentOverride)
    ? agentOverride
    : await routeMessage(userMessageText);

  send('agent_selected', { agent: agentName, meta: AGENT_META[agentName] });

  const history = await Message.find({ conversation: conversation._id })
    .sort('-createdAt')
    .limit(10)
    .lean();
  const orderedHistory = history
    .reverse()
    .filter((m) => m._id.toString() !== String(historyExcludeId))
    .map((m) => ({ role: m.role, content: m.content }));

  const [filesContext, brainContext] = await Promise.all([
    getFilesContext(conversation.project),
    getBrainContext(conversation.project)
  ]);
  const projectContext = [project?.instructions, brainContext, filesContext].filter(Boolean).join('\n\n') || undefined;

  let fullResponse = '';
  try {
    fullResponse = await runAgent({
      agentName,
      userMessage: userMessageText,
      history: orderedHistory,
      projectContext,
      onChunk: (chunk) => send('chunk', { text: chunk })
    });
  } catch (err) {
    console.error('Agent error:', err);
    send('error', { message: 'Agent failed: ' + err.message });
    return res.end();
  }

  if (!fullResponse.trim()) {
    console.error('Agent returned empty content for conversation', conversation._id);
    send('error', { message: 'The agent returned an empty response. Please try again.' });
    return res.end();
  }

  const assistantMsg = await Message.create({
    conversation: conversation._id,
    project: conversation.project,
    user: conversation.user,
    role: 'assistant',
    agent: agentName,
    content: fullResponse
  });

  conversation.lastMessageAt = new Date();
  await conversation.save();
  if (project) {
    project.updatedAt = new Date();
    await project.save();
  }

  send('done', { messageId: assistantMsg._id, agent: agentName });
  res.end();
};

/**
 * POST /api/chat/:conversationId/regenerate
 * Body: { messageId, agent? }
 * Deletes the given assistant message and re-runs the preceding user message.
 */
export const regenerateMessage = (req, res) =>
  withErrorHandling(res, async () => {
    const { conversationId } = req.params;
    const { messageId, agent: agentOverride } = req.body;

    const conversation = await Conversation.findOne({ _id: conversationId, user: req.user._id, deletedAt: null });
    if (!conversation) return res.status(404).json({ message: 'Conversation not found' });
    const project = await Project.findById(conversation.project);

    const target = await Message.findOne({ _id: messageId, conversation: conversation._id, role: 'assistant' });
    if (!target) return res.status(404).json({ message: 'Message not found' });

    const precedingUserMsg = await Message.findOne({
      conversation: conversation._id,
      role: 'user',
      createdAt: { $lte: target.createdAt }
    }).sort('-createdAt');
    if (!precedingUserMsg) return res.status(400).json({ message: 'No prompt found to regenerate from' });

    const resolvedAgent = agentOverride || target.agent;
    await target.deleteOne();

    openSSE(res);

    await runAgentAndStream(res, {
      conversation,
      project,
      userMessageText: precedingUserMsg.content,
      agentOverride: resolvedAgent,
      historyExcludeId: precedingUserMsg._id
    });
  });

/**
 * POST /api/chat/:conversationId/edit
 * Body: { messageId, content, agent? }
 * Edits a user message, drops everything after it, and regenerates a fresh response.
 */
export const editMessage = (req, res) =>
  withErrorHandling(res, async () => {
    const { conversationId } = req.params;
    const { messageId, content, agent: agentOverride } = req.body;

    if (!content?.trim()) return res.status(400).json({ message: 'Message required' });

    const conversation = await Conversation.findOne({ _id: conversationId, user: req.user._id, deletedAt: null });
    if (!conversation) return res.status(404).json({ message: 'Conversation not found' });
    const project = await Project.findById(conversation.project);

    const target = await Message.findOne({ _id: messageId, conversation: conversation._id, role: 'user' });
    if (!target) return res.status(404).json({ message: 'Message not found' });

    // Drop this message and everything after it — an edit rewrites history from this point on.
    await Message.deleteMany({ conversation: conversation._id, createdAt: { $gte: target.createdAt } });

    const newUserMsg = await Message.create({
      conversation: conversation._id,
      project: conversation.project,
      user: req.user._id,
      role: 'user',
      content: content.trim()
    });

    openSSE(res);
    res.write(`data: ${JSON.stringify({ type: 'user_message_saved', messageId: newUserMsg._id, replacesFrom: messageId })}\n\n`);

    await runAgentAndStream(res, {
      conversation,
      project,
      userMessageText: newUserMsg.content,
      agentOverride,
      historyExcludeId: newUserMsg._id
    });
  });
