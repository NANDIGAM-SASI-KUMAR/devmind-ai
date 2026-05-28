import Message from '../models/Message.js';
import Project from '../models/Project.js';
import { routeMessage, runAgent, AGENT_META } from '../agents/orchestrator.js';

/**
 * POST /api/chat/:projectId
 * Body: { message, agent? }
 *
 * Streams response back via Server-Sent Events.
 * If `agent` is provided, skip routing and use that agent directly.
 */
export const streamChat = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { message, agent: agentOverride } = req.body;

    if (!message?.trim()) return res.status(400).json({ message: 'Message required' });

    const project = await Project.findOne({ _id: projectId, user: req.user._id });
    if (!project) return res.status(404).json({ message: 'Project not found' });

    // ---------- Save user message ----------
    const userMsg = await Message.create({
      project: project._id,
      user: req.user._id,
      role: 'user',
      content: message
    });

    // ---------- Setup SSE ----------
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();

    const send = (type, data) =>
      res.write(`data: ${JSON.stringify({ type, ...data })}\n\n`);

    // ---------- Route to agent ----------
    const agentName = ['planner', 'coder', 'debugger', 'docs'].includes(agentOverride)
      ? agentOverride
      : await routeMessage(message);

    send('agent_selected', { agent: agentName, meta: AGENT_META[agentName] });
    send('user_message_saved', { messageId: userMsg._id });

    // ---------- Load recent history (last 10 messages) ----------
    const history = await Message.find({ project: project._id })
      .sort('-createdAt')
      .limit(10)
      .lean();
    const orderedHistory = history
      .reverse()
      .filter((m) => m._id.toString() !== userMsg._id.toString())
      .map((m) => ({ role: m.role, content: m.content }));

    // ---------- Stream agent response ----------
    let fullResponse = '';
    try {
      fullResponse = await runAgent({
        agentName,
        userMessage: message,
        history: orderedHistory,
        onChunk: (chunk) => send('chunk', { text: chunk })
      });
    } catch (err) {
      console.error('Agent error:', err);
      send('error', { message: 'Agent failed: ' + err.message });
      return res.end();
    }

    // ---------- Save assistant message ----------
    const assistantMsg = await Message.create({
      project: project._id,
      user: req.user._id,
      role: 'assistant',
      agent: agentName,
      content: fullResponse
    });

    // ---------- Touch project so it sorts to top ----------
    project.updatedAt = new Date();
    await project.save();

    send('done', { messageId: assistantMsg._id, agent: agentName });
    res.end();
  } catch (err) {
    console.error('streamChat error:', err);
    if (!res.headersSent) {
      res.status(500).json({ message: err.message });
    } else {
      res.write(`data: ${JSON.stringify({ type: 'error', message: err.message })}\n\n`);
      res.end();
    }
  }
};
