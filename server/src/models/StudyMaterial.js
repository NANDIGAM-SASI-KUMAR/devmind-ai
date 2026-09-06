import mongoose from 'mongoose';

const studyMaterialSchema = new mongoose.Schema(
  {
    studyPlan: { type: mongoose.Schema.Types.ObjectId, ref: 'StudyPlan', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    originalName: { type: String, required: true },
    storedName: { type: String, required: true },
    mimeType: { type: String, default: '' },
    size: { type: Number, required: true },
    status: { type: String, enum: ['processing', 'ready', 'failed'], default: 'processing' },
    chunkCount: { type: Number, default: 0 },
    error: { type: String, default: '' }
  },
  { timestamps: true }
);

studyMaterialSchema.index({ studyPlan: 1, createdAt: -1 });

export default mongoose.model('StudyMaterial', studyMaterialSchema);
