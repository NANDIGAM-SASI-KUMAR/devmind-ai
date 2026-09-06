import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['mcq', 'true_false', 'short_answer'], required: true },
    question: { type: String, required: true },
    options: { type: [String], default: [] }, // mcq only
    correctAnswer: { type: String, required: true },
    explanation: { type: String, default: '' },
    topic: { type: String, default: 'General' }
  },
  { _id: false }
);

const quizSchema = new mongoose.Schema(
  {
    studyPlan: { type: mongoose.Schema.Types.ObjectId, ref: 'StudyPlan', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    questions: { type: [questionSchema], required: true }
  },
  { timestamps: true }
);

export default mongoose.model('Quiz', quizSchema);
