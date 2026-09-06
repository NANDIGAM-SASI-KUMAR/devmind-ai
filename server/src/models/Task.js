import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema(
  {
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    conversation: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', default: null },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    status: { type: String, enum: ['todo', 'in_progress', 'done'], default: 'todo' },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    agent: { type: String, enum: ['planner', 'coder', 'debugger', 'docs', 'reviewer', 'tester', null], default: null },
    phase: { type: String, default: '' }
  },
  { timestamps: true }
);

taskSchema.index({ project: 1, createdAt: -1 });

export default mongoose.model('Task', taskSchema);
