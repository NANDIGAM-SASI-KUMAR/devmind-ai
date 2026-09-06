// One-time migration: create a default Conversation for every existing Project
// that has messages predating the Conversation model, and attach those
// messages to it. Safe to re-run — skips projects that already have a
// conversation covering their messages.
import 'dotenv/config';
import mongoose from 'mongoose';
import Project from '../src/models/Project.js';
import Conversation from '../src/models/Conversation.js';
import Message from '../src/models/Message.js';

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected. Scanning for orphaned messages...');

  const orphaned = await Message.find({ conversation: { $exists: false } });
  console.log(`Found ${orphaned.length} messages without a conversation.`);

  const byProject = new Map();
  for (const msg of orphaned) {
    const key = msg.project.toString();
    if (!byProject.has(key)) byProject.set(key, []);
    byProject.get(key).push(msg);
  }

  for (const [projectId, msgs] of byProject) {
    const project = await Project.findById(projectId);
    if (!project) {
      console.log(`Skipping ${msgs.length} messages — project ${projectId} no longer exists.`);
      continue;
    }

    const lastMessageAt = msgs.reduce((max, m) => (m.createdAt > max ? m.createdAt : max), msgs[0].createdAt);
    const conversation = await Conversation.create({
      project: project._id,
      user: project.user,
      title: project.name,
      lastMessageAt
    });

    const ids = msgs.map((m) => m._id);
    await Message.updateMany({ _id: { $in: ids } }, { conversation: conversation._id });
    console.log(`Project "${project.name}": migrated ${msgs.length} messages into conversation ${conversation._id}`);
  }

  console.log('Migration complete.');
  await mongoose.disconnect();
};

run().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
