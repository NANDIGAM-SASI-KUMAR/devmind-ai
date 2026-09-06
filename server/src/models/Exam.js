import mongoose from 'mongoose';

const blueprintTopicSchema = new mongoose.Schema(
  { topic: { type: String, required: true }, questionCount: { type: Number, required: true }, difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true } },
  { _id: false }
);

const examQuestionSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['mcq', 'true_false', 'short_answer'], required: true },
    question: { type: String, required: true },
    options: { type: [String], default: [] },
    correctAnswer: { type: String, required: true },
    explanation: { type: String, default: '' },
    topic: { type: String, required: true },
    concept: { type: String, default: '' },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true },
    sourceExcerpt: { type: String, default: '' } // retained for audit/traceability, never sent to the client
  },
  { _id: false }
);

const examSchema = new mongoose.Schema(
  {
    studyPlan: { type: mongoose.Schema.Types.ObjectId, ref: 'StudyPlan', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    scope: {
      type: { type: String, enum: ['full', 'topics', 'weak_areas', 'previous'], required: true },
      topics: { type: [String], default: [] }
    },
    blueprint: {
      totalQuestions: { type: Number, required: true },
      durationMinutes: { type: Number, required: true },
      difficulty: { type: String, enum: ['easy', 'medium', 'hard', 'mixed'], required: true },
      questionTypes: { type: [String], default: ['mcq', 'true_false', 'short_answer'] },
      topics: { type: [blueprintTopicSchema], required: true }
    },
    questions: { type: [examQuestionSchema], required: true },
    // Set only when this exam was generated as a follow-up to a specific weak-area recommendation.
    followUpOf: { type: mongoose.Schema.Types.ObjectId, ref: 'ExamRecommendation', default: null }
  },
  { timestamps: true }
);

examSchema.index({ studyPlan: 1, user: 1, createdAt: -1 });

export default mongoose.model('Exam', examSchema);
