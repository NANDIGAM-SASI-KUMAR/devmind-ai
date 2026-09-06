import mongoose from 'mongoose';

const studyPlanSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true },
    understandingLevel: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' },
    plan: { type: String, default: '' },
    planGeneratedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

studyPlanSchema.index({ user: 1, updatedAt: -1 });

export default mongoose.model('StudyPlan', studyPlanSchema);
