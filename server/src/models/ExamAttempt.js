import mongoose from 'mongoose';

const savedAnswerSchema = new mongoose.Schema(
  { questionIndex: { type: Number, required: true }, answer: { type: String, default: '' }, flagged: { type: Boolean, default: false } },
  { _id: false }
);

const resultSchema = new mongoose.Schema(
  {
    questionIndex: { type: Number, required: true },
    type: { type: String, required: true },
    topic: { type: String, required: true },
    concept: { type: String, default: '' },
    difficulty: { type: String, required: true },
    answer: { type: String, default: '' },
    correct: { type: Boolean, required: true },
    correctAnswer: { type: String, required: true },
    explanation: { type: String, default: '' },
    evaluatorNote: { type: String, default: '' } // set only for LLM-evaluated short-answer questions
  },
  { _id: false }
);

const topicStatSchema = new mongoose.Schema(
  { topic: { type: String, required: true }, correct: { type: Number, required: true }, total: { type: Number, required: true }, percentage: { type: Number, required: true } },
  { _id: false }
);

const examAttemptSchema = new mongoose.Schema(
  {
    exam: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
    studyPlan: { type: mongoose.Schema.Types.ObjectId, ref: 'StudyPlan', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    // Server-authoritative timing — the only source of truth for remaining time.
    startedAt: { type: Date, required: true },
    durationMinutes: { type: Number, required: true },

    status: { type: String, enum: ['in_progress', 'submitted', 'expired'], default: 'in_progress' },
    autoSubmitted: { type: Boolean, default: false },
    submittedAt: { type: Date, default: null },

    answers: { type: [savedAnswerSchema], default: [] },

    // Populated only once graded (status !== 'in_progress').
    score: { type: Number, default: null },
    results: { type: [resultSchema], default: [] },
    topicPerformance: { type: [topicStatSchema], default: [] },
    difficultyPerformance: { type: [topicStatSchema], default: [] }, // 'topic' field reused to hold the difficulty label
    weakTopics: { type: [String], default: [] },
    weakConcepts: { type: [String], default: [] },
    totalTimeSeconds: { type: Number, default: null }
  },
  { timestamps: true }
);

examAttemptSchema.index({ studyPlan: 1, user: 1, createdAt: -1 });
examAttemptSchema.index({ exam: 1, user: 1 });

export default mongoose.model('ExamAttempt', examAttemptSchema);
