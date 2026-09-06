import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    conversation: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true },
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: ['user', 'assistant'], required: true },
    agent: {
      type: String,
      enum: ['planner', 'coder', 'debugger', 'docs', 'reviewer', 'tester', 'orchestrator', null],
      default: null
    },
    content: { type: String, required: true }
  },
  { timestamps: true }
);

messageSchema.index({ conversation: 1, createdAt: 1 });
messageSchema.index({ project: 1, createdAt: 1 });

export default mongoose.model('Message', messageSchema);
