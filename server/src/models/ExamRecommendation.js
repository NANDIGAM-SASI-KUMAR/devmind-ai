import mongoose from 'mongoose';

const examRecommendationSchema = new mongoose.Schema(
  {
    studyPlan: { type: mongoose.Schema.Types.ObjectId, ref: 'StudyPlan', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    examAttempt: { type: mongoose.Schema.Types.ObjectId, ref: 'ExamAttempt', required: true },
    weakTopics: { type: [String], default: [] },
    weakConcepts: { type: [String], default: [] },
    recommendedActions: { type: [String], default: [] },
    status: { type: String, enum: ['pending', 'accepted', 'dismissed', 'completed'], default: 'pending' },
    followUpExam: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', default: null }
  },
  { timestamps: true }
);

examRecommendationSchema.index({ studyPlan: 1, user: 1, createdAt: -1 });

export default mongoose.model('ExamRecommendation', examRecommendationSchema);
