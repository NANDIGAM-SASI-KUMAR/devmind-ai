import Project from '../models/Project.js';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import User from '../models/User.js';
import ProjectFile from '../models/ProjectFile.js';
import StudyPlan from '../models/StudyPlan.js';
import StudyMaterial from '../models/StudyMaterial.js';
import Task from '../models/Task.js';
import QuizAttempt from '../models/QuizAttempt.js';
import { cached } from '../utils/cache.js';

// Usage/storage stats are viewed occasionally (a settings-style page), not polled, so a
// short TTL alone is enough to keep them fast without needing to wire invalidation into
// every project/file/conversation write path across the app.
const USAGE_TTL = 45;

// GET /api/usage
export const getUsage = async (req, res) => {
  const userId = req.user._id;

  const result = await cached(`usage:${userId}:overview`, USAGE_TTL, async () => {
    const [projectCount, conversationCount, trashedCount, messageStats, agentBreakdown, user] = await Promise.all([
      Project.countDocuments({ user: userId }),
      Conversation.countDocuments({ user: userId, deletedAt: null }),
      Conversation.countDocuments({ user: userId, deletedAt: { $ne: null } }),
      Message.aggregate([
        { $match: { user: userId } },
        { $group: { _id: '$role', count: { $sum: 1 } } }
      ]),
      Message.aggregate([
        { $match: { user: userId, role: 'assistant', agent: { $ne: null } } },
        { $group: { _id: '$agent', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      User.findById(userId).select('createdAt')
    ]);

    const messagesByRole = Object.fromEntries(messageStats.map((s) => [s._id, s.count]));

    return {
      memberSince: user?.createdAt,
      projects: projectCount,
      conversations: conversationCount,
      trashedConversations: trashedCount,
      messages: {
        total: (messagesByRole.user || 0) + (messagesByRole.assistant || 0),
        fromYou: messagesByRole.user || 0,
        fromAgents: messagesByRole.assistant || 0
      },
      agentBreakdown: agentBreakdown.map((a) => ({ agent: a._id, count: a.count }))
    };
  });

  res.json(result);
};

// GET /api/usage/storage
export const getStorage = async (req, res) => {
  const userId = req.user._id;

  const result = await cached(`usage:${userId}:storage`, USAGE_TTL, async () => {
    const [projectFiles, studyMaterials, studyPlanCount] = await Promise.all([
      ProjectFile.aggregate([{ $match: { user: userId } }, { $group: { _id: null, bytes: { $sum: '$size' }, count: { $sum: 1 } } }]),
      StudyMaterial.aggregate([{ $match: { user: userId } }, { $group: { _id: null, bytes: { $sum: '$size' }, count: { $sum: 1 } } }]),
      StudyPlan.countDocuments({ user: userId })
    ]);

    const projectFileStats = projectFiles[0] || { bytes: 0, count: 0 };
    const studyMaterialStats = studyMaterials[0] || { bytes: 0, count: 0 };

    return {
      projectFiles: { bytes: projectFileStats.bytes, count: projectFileStats.count },
      studyMaterials: { bytes: studyMaterialStats.bytes, count: studyMaterialStats.count },
      studyPlans: studyPlanCount,
      totalBytes: projectFileStats.bytes + studyMaterialStats.bytes
    };
  });

  res.json(result);
};

// GET /api/usage/export — a real, complete export of the account's own metadata. No message
// bodies (keeps the export small and avoids re-exposing potentially sensitive chat content
// silently); everything included is exactly what's stored, nothing inferred or fabricated.
export const exportData = async (req, res) => {
  const userId = req.user._id;

  const [user, projects, conversations, tasks, studyPlans, studyMaterials, quizAttempts] = await Promise.all([
    User.findById(userId).select('name email phone createdAt'),
    Project.find({ user: userId }).select('name description tech color createdAt updatedAt'),
    Conversation.find({ user: userId, deletedAt: null }).select('title project pinned archived createdAt lastMessageAt'),
    Task.find({ user: userId }).select('title status agent project createdAt'),
    StudyPlan.find({ user: userId }).select('name understandingLevel planGeneratedAt createdAt'),
    StudyMaterial.find({ user: userId }).select('originalName studyPlan size status chunkCount createdAt'),
    QuizAttempt.find({ user: userId }).select('studyPlan quiz score createdAt')
  ]);

  res.setHeader('Content-Disposition', 'attachment; filename="devmind-export.json"');
  res.json({
    exportedAt: new Date().toISOString(),
    profile: user,
    projects,
    conversations,
    tasks,
    studyPlans,
    studyMaterials,
    quizAttempts
  });
};
