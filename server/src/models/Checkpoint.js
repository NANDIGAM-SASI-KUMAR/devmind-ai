import mongoose from 'mongoose';

const checkpointSchema = new mongoose.Schema(
  {
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    file: { type: mongoose.Schema.Types.ObjectId, ref: 'ProjectFile', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    label: { type: String, required: true, trim: true },
    content: { type: String, required: true }
  },
  { timestamps: true }
);

checkpointSchema.index({ file: 1, createdAt: -1 });

export default mongoose.model('Checkpoint', checkpointSchema);
