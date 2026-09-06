import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema(
  {
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, default: 'New conversation', trim: true },
    pinned: { type: Boolean, default: false },
    archived: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
    lastMessageAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

conversationSchema.index({ project: 1, deletedAt: 1, archived: 1, lastMessageAt: -1 });
conversationSchema.index({ user: 1, deletedAt: 1 });

export default mongoose.model('Conversation', conversationSchema);
