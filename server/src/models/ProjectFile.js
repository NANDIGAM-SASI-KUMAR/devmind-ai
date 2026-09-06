import mongoose from 'mongoose';

const projectFileSchema = new mongoose.Schema(
  {
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    originalName: { type: String, required: true },
    storedName: { type: String, required: true }, // filename on disk
    mimeType: { type: String, default: 'text/plain' },
    size: { type: Number, required: true }
  },
  { timestamps: true }
);

projectFileSchema.index({ project: 1, createdAt: -1 });

export default mongoose.model('ProjectFile', projectFileSchema);
