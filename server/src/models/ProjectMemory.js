import mongoose from 'mongoose';

const projectMemorySchema = new mongoose.Schema(
  {
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    category: { type: String, enum: ['technology', 'architecture', 'conventions', 'decisions'], required: true },
    content: { type: String, required: true, trim: true, maxlength: 200 }
  },
  { timestamps: true }
);

projectMemorySchema.index({ project: 1, category: 1 });

export default mongoose.model('ProjectMemory', projectMemorySchema);
