import mongoose from 'mongoose';

const answerSchema = new mongoose.Schema(
  {
    questionIndex: { type: Number, required: true },
    topic: { type: String, default: 'General' },
    type: { type: String, default: '' }, // added after initial launch — older attempts may have this unset
    answer: { type: String, default: '' },
    correct: { type: Boolean, required: true }
  },
  { _id: false }
);

const quizAttemptSchema = new mongoose.Schema(
  {
    quiz: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
    studyPlan: { type: mongoose.Schema.Types.ObjectId, ref: 'StudyPlan', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    answers: { type: [answerSchema], required: true },
    score: { type: Number, required: true } // 0-100
  },
  { timestamps: true }
);

quizAttemptSchema.index({ studyPlan: 1, user: 1, createdAt: -1 });

export default mongoose.model('QuizAttempt', quizAttemptSchema);
