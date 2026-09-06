import StudyPlan from '../models/StudyPlan.js';
import StudyMaterial from '../models/StudyMaterial.js';
import Quiz from '../models/Quiz.js';
import QuizAttempt from '../models/QuizAttempt.js';
import { generateQuizFromContext } from '../agents/studyPlanAgent.js';
import { gatherStudyContext } from './studyPlanController.js';
import { notify } from './notificationController.js';

const stripAnswers = (quiz) => ({
  _id: quiz._id,
  studyPlan: quiz.studyPlan,
  title: quiz.title,
  createdAt: quiz.createdAt,
  questions: quiz.questions.map((q) => ({
    type: q.type,
    question: q.question,
    options: q.options,
    topic: q.topic
  }))
});

// POST /api/study-plans/:id/quiz
// Generates and persists a new quiz (answer key stays server-side).
export const generateQuiz = async (req, res) => {
  const plan = await StudyPlan.findOne({ _id: req.params.id, user: req.user._id });
  if (!plan) return res.status(404).json({ message: 'Study plan not found' });

  const materials = await StudyMaterial.find({ studyPlan: plan._id, status: 'ready' });
  if (materials.length === 0) {
    return res.status(400).json({ message: 'Upload at least one processed material before generating a quiz.' });
  }

  const context = await gatherStudyContext(plan._id, materials);
  if (context.length === 0) {
    return res.status(400).json({ message: 'No indexed content was found for this material yet. Try again shortly.' });
  }

  try {
    const questions = await generateQuizFromContext({ context: context.map((c) => c.text).join('\n\n---\n\n'), count: 8 });
    const quiz = await Quiz.create({
      studyPlan: plan._id,
      user: req.user._id,
      title: `${plan.name} — Quiz`,
      questions
    });

    await notify(req.user._id, {
      type: 'quiz_generated',
      title: 'New quiz ready',
      message: plan.name,
      link: `/study-plans/${plan._id}`
    });

    res.status(201).json(stripAnswers(quiz));
  } catch (err) {
    console.error('Quiz generation failed:', err);
    res.status(500).json({ message: err.message || 'Could not generate a quiz right now. Please try again.' });
  }
};

// GET /api/study-plans/:id/quizzes
export const listQuizzes = async (req, res) => {
  const plan = await StudyPlan.findOne({ _id: req.params.id, user: req.user._id });
  if (!plan) return res.status(404).json({ message: 'Study plan not found' });

  const quizzes = await Quiz.find({ studyPlan: plan._id, user: req.user._id }).sort('-createdAt').select('title createdAt questions');
  res.json(quizzes.map((q) => ({ _id: q._id, title: q.title, createdAt: q.createdAt, questionCount: q.questions.length })));
};

// GET /api/quizzes/:id  (answers withheld)
export const getQuiz = async (req, res) => {
  const quiz = await Quiz.findOne({ _id: req.params.id, user: req.user._id });
  if (!quiz) return res.status(404).json({ message: 'Quiz not found' });
  res.json(stripAnswers(quiz));
};

// POST /api/quizzes/:id/submit  { answers: [{ questionIndex, answer }] }
// Grades against the server-held answer key; persists a real attempt for progress tracking.
export const submitQuiz = async (req, res) => {
  const quiz = await Quiz.findOne({ _id: req.params.id, user: req.user._id });
  if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

  const submitted = Array.isArray(req.body.answers) ? req.body.answers : [];
  const byIndex = new Map(submitted.map((a) => [a.questionIndex, a.answer]));

  const graded = quiz.questions.map((q, i) => {
    const given = (byIndex.get(i) ?? '').toString().trim();
    const correct =
      q.type === 'short_answer'
        ? given.toLowerCase() === q.correctAnswer.trim().toLowerCase()
        : given === q.correctAnswer;
    return {
      questionIndex: i,
      topic: q.topic,
      type: q.type,
      answer: given,
      correct,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation
    };
  });

  const score = Math.round((graded.filter((g) => g.correct).length / graded.length) * 100);

  const attempt = await QuizAttempt.create({
    quiz: quiz._id,
    studyPlan: quiz.studyPlan,
    user: req.user._id,
    answers: graded.map(({ questionIndex, topic, type, answer, correct }) => ({ questionIndex, topic, type, answer, correct })),
    score
  });

  const weakTopics = [...new Set(graded.filter((g) => !g.correct).map((g) => g.topic))];

  res.json({ attemptId: attempt._id, score, results: graded, weakTopics });
};

// Aggregates per-topic correct/total from a set of QuizAttempt-style answer arrays.
// Shared by the quiz progress endpoint and the exam blueprint builder (which needs
// existing weak topics to weight question allocation) so the stats logic has one home.
export const computeTopicStatsFromAttempts = (attempts) => {
  const byTopic = new Map();
  for (const attempt of attempts) {
    for (const ans of attempt.answers) {
      const t = byTopic.get(ans.topic) || { correct: 0, total: 0 };
      t.total += 1;
      if (ans.correct) t.correct += 1;
      byTopic.set(ans.topic, t);
    }
  }
  return [...byTopic.entries()]
    .map(([topic, { correct, total }]) => ({ topic, percentage: Math.round((correct / total) * 100), questionsAnswered: total }))
    .sort((a, b) => b.percentage - a.percentage);
};

// GET /api/study-plans/:id/progress
// Derived strictly from stored QuizAttempt records — no data, no fabricated numbers.
export const getProgress = async (req, res) => {
  const plan = await StudyPlan.findOne({ _id: req.params.id, user: req.user._id });
  if (!plan) return res.status(404).json({ message: 'Study plan not found' });

  const attempts = await QuizAttempt.find({ studyPlan: plan._id, user: req.user._id });
  if (attempts.length === 0) {
    return res.json({ hasData: false, topics: [], overallScore: null, attemptCount: 0 });
  }

  const topics = computeTopicStatsFromAttempts(attempts);
  const overallScore = Math.round(attempts.reduce((sum, a) => sum + a.score, 0) / attempts.length);

  res.json({ hasData: true, topics, overallScore, attemptCount: attempts.length });
};
