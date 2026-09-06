import StudyPlan from '../models/StudyPlan.js';
import QuizAttempt from '../models/QuizAttempt.js';
import Exam from '../models/Exam.js';
import ExamAttempt from '../models/ExamAttempt.js';
import ExamRecommendation from '../models/ExamRecommendation.js';
import { queryChunks } from '../utils/chroma.js';
import { computeTopicStatsFromAttempts } from './studyQuizController.js';
import { computeTopicPerformance } from '../utils/analytics.js';
import {
  generateExamBlueprint,
  generateExamQuestionsForTopic,
  evaluateShortAnswer,
  generateLearningRecommendations
} from '../agents/examAgents.js';
import { notify } from './notificationController.js';
import { invalidateResultsCache } from './resultsController.js';
import { cacheDelByPrefix } from '../utils/cache.js';

const WEAK_THRESHOLD = 70;
const ALL_TYPES = ['mcq', 'true_false', 'short_answer'];

// ---------- shared helpers ----------

const planTopics = (plan) => {
  if (!plan.plan) return [];
  try {
    const weeks = JSON.parse(plan.plan);
    return [...new Set((weeks || []).flatMap((w) => (w.topics || []).map((t) => t.title)))];
  } catch {
    return [];
  }
};

const stripExamAnswers = (exam) => ({
  _id: exam._id,
  studyPlan: exam.studyPlan,
  title: exam.title,
  scope: exam.scope,
  blueprint: exam.blueprint,
  createdAt: exam.createdAt
});

const stripQuestionAnswers = (q) => ({ type: q.type, question: q.question, options: q.options, topic: q.topic });

const attemptRemainingSeconds = (attempt) => {
  const elapsedMs = Date.now() - new Date(attempt.startedAt).getTime();
  return Math.max(0, Math.round(attempt.durationMinutes * 60 - elapsedMs / 1000));
};

// Deterministic grading + LLM-evaluated short answers. Shared by manual submit and
// server-detected expiry so both paths always produce identical, consistent results.
const gradeAttempt = async (attempt, exam, { autoSubmitted }) => {
  const answersByIndex = new Map(attempt.answers.map((a) => [a.questionIndex, a.answer]));
  const results = [];

  for (let i = 0; i < exam.questions.length; i++) {
    const q = exam.questions[i];
    const given = (answersByIndex.get(i) ?? '').toString().trim();
    let correct;
    let evaluatorNote = '';

    if (q.type === 'short_answer') {
      if (!given) {
        correct = false;
      } else {
        const evalResult = await evaluateShortAnswer({
          question: q.question,
          studentAnswer: given,
          expectedAnswer: q.correctAnswer,
          sourceExcerpt: q.sourceExcerpt
        });
        correct = evalResult.correct;
        evaluatorNote = evalResult.feedback;
      }
    } else {
      correct = given === q.correctAnswer;
    }

    results.push({
      questionIndex: i, type: q.type, topic: q.topic, concept: q.concept, difficulty: q.difficulty,
      answer: given, correct, correctAnswer: q.correctAnswer, explanation: q.explanation, evaluatorNote
    });
  }

  const score = Math.round((results.filter((r) => r.correct).length / results.length) * 100);

  const topicMap = new Map();
  for (const r of results) {
    const t = topicMap.get(r.topic) || { correct: 0, total: 0 };
    t.total += 1; if (r.correct) t.correct += 1;
    topicMap.set(r.topic, t);
  }
  const topicPerformance = [...topicMap.entries()]
    .map(([topic, { correct, total }]) => ({ topic, correct, total, percentage: Math.round((correct / total) * 100) }))
    .sort((a, b) => a.percentage - b.percentage);

  const diffMap = new Map();
  for (const r of results) {
    const d = diffMap.get(r.difficulty) || { correct: 0, total: 0 };
    d.total += 1; if (r.correct) d.correct += 1;
    diffMap.set(r.difficulty, d);
  }
  const difficultyPerformance = [...diffMap.entries()]
    .map(([label, { correct, total }]) => ({ topic: label, correct, total, percentage: Math.round((correct / total) * 100) }));

  const weakTopics = topicPerformance.filter((t) => t.percentage < WEAK_THRESHOLD).map((t) => t.topic);

  const conceptMap = new Map();
  for (const r of results) {
    if (!r.concept) continue;
    const c = conceptMap.get(r.concept) || { correct: 0, total: 0 };
    c.total += 1; if (r.correct) c.correct += 1;
    conceptMap.set(r.concept, c);
  }
  const weakConcepts = [...conceptMap.entries()].filter(([, { correct, total }]) => correct / total < 0.6).map(([c]) => c);

  attempt.status = autoSubmitted ? 'expired' : 'submitted';
  attempt.autoSubmitted = autoSubmitted;
  attempt.submittedAt = new Date();
  attempt.score = score;
  attempt.results = results;
  attempt.topicPerformance = topicPerformance;
  attempt.difficultyPerformance = difficultyPerformance;
  attempt.weakTopics = weakTopics;
  attempt.weakConcepts = weakConcepts;
  attempt.totalTimeSeconds = Math.round((attempt.submittedAt - attempt.startedAt) / 1000);
  await attempt.save();

  // A graded attempt changes progress/mastery/results numbers everywhere they're shown.
  await Promise.all([
    invalidateResultsCache(attempt.user),
    cacheDelByPrefix(`progress:${attempt.user}:${attempt.studyPlan}`)
  ]);

  // Best-effort: feed real weaknesses back into a Study Plan recommendation. Never blocks grading.
  if (weakTopics.length > 0) {
    try {
      const recommendedActions = await generateLearningRecommendations({ weakTopics, weakConcepts });
      await ExamRecommendation.create({
        studyPlan: attempt.studyPlan,
        user: attempt.user,
        examAttempt: attempt._id,
        weakTopics,
        weakConcepts,
        recommendedActions
      });
      await notify(attempt.user, {
        type: 'revision_recommended',
        title: 'Revision recommended',
        message: `Focus areas: ${weakTopics.slice(0, 3).join(', ')}`,
        link: `/study-plans/${attempt.studyPlan}`
      });
    } catch (err) {
      console.error('Failed to generate exam recommendation:', err.message);
    }
  }

  if (autoSubmitted) {
    await notify(attempt.user, {
      type: 'exam_auto_submitted',
      title: 'Exam auto-submitted — time expired',
      message: `Score: ${score}%`,
      link: `/study-plans/${attempt.studyPlan}/exams/attempts/${attempt._id}/result`
    });
  }

  return attempt;
};

// Loads an attempt and, if the server clock says time is up, grades it right now.
// This is the mechanism behind "auto-submit when time expires" — there is no cron job;
// expiry is detected and settled the moment anything next touches the attempt.
const loadAndSettleAttempt = async (attemptId, userId) => {
  const attempt = await ExamAttempt.findOne({ _id: attemptId, user: userId });
  if (!attempt) return null;
  if (attempt.status === 'in_progress' && attemptRemainingSeconds(attempt) <= 0) {
    const exam = await Exam.findById(attempt.exam);
    await gradeAttempt(attempt, exam, { autoSubmitted: true });
  }
  return attempt;
};

// Core exam-creation pipeline: blueprint -> per-topic grounded questions -> validation -> save.
// Shared by the public "create exam" endpoint and the "start follow-up assessment" endpoint.
const createExamCore = async (plan, { title, scopeType, targetTopics, totalQuestions, durationMinutes, difficulty, questionTypes, followUpOf }) => {
  const quizAttempts = await QuizAttempt.find({ studyPlan: plan._id, user: plan.user });
  const examAttempts = await ExamAttempt.find({ studyPlan: plan._id, user: plan.user, status: { $ne: 'in_progress' } });
  const quizStats = computeTopicStatsFromAttempts(quizAttempts);
  const examTopicStats = computeTopicStatsFromAttempts([
    { answers: examAttempts.flatMap((a) => a.results.map((r) => ({ topic: r.topic, correct: r.correct }))) }
  ]);
  const combinedStatsMap = new Map();
  for (const s of [...quizStats, ...examTopicStats]) {
    const existing = combinedStatsMap.get(s.topic);
    if (!existing || s.questionsAnswered > existing.questionsAnswered) combinedStatsMap.set(s.topic, s);
  }
  const topicStats = [...combinedStatsMap.values()].filter((s) => targetTopics.includes(s.topic));

  const blueprintTopics = await generateExamBlueprint({
    studyPlanName: plan.name,
    understandingLevel: plan.understandingLevel,
    availableTopics: targetTopics,
    topicStats,
    totalQuestions,
    difficulty
  });

  const perTopicQuestions = await Promise.all(
    blueprintTopics.map(async (bt) => {
      const matches = await queryChunks(plan._id, bt.topic, 8);
      if (matches.length === 0) return [];
      const context = matches.map((m) => m.text).join('\n\n---\n\n').slice(0, 9000);
      try {
        return await generateExamQuestionsForTopic({
          topic: bt.topic, difficulty: bt.difficulty, count: bt.questionCount, questionTypes, context
        });
      } catch (err) {
        console.error(`Question generation failed for topic "${bt.topic}":`, err.message);
        return [];
      }
    })
  );

  const questions = perTopicQuestions.flat();
  if (questions.length === 0) {
    throw new Error('Could not generate any valid exam questions from your study material. Please try again.');
  }

  const actualTopicCounts = new Map();
  for (const q of questions) actualTopicCounts.set(q.topic, (actualTopicCounts.get(q.topic) || 0) + 1);

  const exam = await Exam.create({
    studyPlan: plan._id,
    user: plan.user,
    title,
    scope: { type: scopeType, topics: targetTopics },
    blueprint: {
      totalQuestions: questions.length,
      durationMinutes,
      difficulty,
      questionTypes,
      topics: blueprintTopics
        .filter((bt) => actualTopicCounts.has(bt.topic))
        .map((bt) => ({ topic: bt.topic, questionCount: actualTopicCounts.get(bt.topic), difficulty: bt.difficulty }))
    },
    questions,
    followUpOf: followUpOf || null
  });

  return exam;
};

// ---------- routes ----------

// POST /api/study-plans/:id/exams
export const createExam = async (req, res) => {
  const plan = await StudyPlan.findOne({ _id: req.params.id, user: req.user._id });
  if (!plan) return res.status(404).json({ message: 'Study plan not found' });

  const scopeType = ['full', 'topics', 'weak_areas', 'previous'].includes(req.body.scope) ? req.body.scope : 'full';
  const totalQuestions = Math.min(50, Math.max(5, parseInt(req.body.totalQuestions, 10) || 20));
  const durationMinutes = Math.min(180, Math.max(5, parseInt(req.body.durationMinutes, 10) || 30));
  const difficulty = ['easy', 'medium', 'hard', 'mixed'].includes(req.body.difficulty) ? req.body.difficulty : 'mixed';
  const questionTypes = Array.isArray(req.body.questionTypes) && req.body.questionTypes.length > 0
    ? req.body.questionTypes.filter((t) => ALL_TYPES.includes(t))
    : ALL_TYPES;
  if (questionTypes.length === 0) return res.status(400).json({ message: 'At least one valid question type is required' });

  const available = planTopics(plan);
  const quizAttempts = await QuizAttempt.find({ studyPlan: plan._id, user: req.user._id });
  const quizTopics = [...new Set(quizAttempts.flatMap((a) => a.answers.map((ans) => ans.topic)))];
  const allTopics = [...new Set([...available, ...quizTopics])];

  if (allTopics.length === 0) {
    return res.status(400).json({ message: 'Generate your study plan or take a quiz first so there are topics to examine.' });
  }

  let targetTopics;
  if (scopeType === 'topics') {
    targetTopics = (Array.isArray(req.body.topics) ? req.body.topics : []).filter((t) => allTopics.includes(t));
    if (targetTopics.length === 0) return res.status(400).json({ message: 'Select at least one valid topic from this study plan.' });
  } else if (scopeType === 'weak_areas') {
    const stats = computeTopicStatsFromAttempts(quizAttempts);
    targetTopics = stats.filter((s) => s.percentage < WEAK_THRESHOLD).map((s) => s.topic);
    if (targetTopics.length === 0) return res.status(400).json({ message: 'No weak areas found yet — take a quiz first, or choose the full study plan.' });
  } else if (scopeType === 'previous') {
    const lastExamAttempt = await ExamAttempt.findOne({ studyPlan: plan._id, user: req.user._id, status: { $ne: 'in_progress' } }).sort('-createdAt');
    targetTopics = lastExamAttempt?.weakTopics?.length > 0 ? lastExamAttempt.weakTopics : null;
    if (!targetTopics) return res.status(400).json({ message: 'No previous exam weak areas found yet — take a full exam first.' });
  } else {
    targetTopics = allTopics;
  }

  try {
    const exam = await createExamCore(plan, {
      title: `${plan.name} — Examination`,
      scopeType, targetTopics, totalQuestions, durationMinutes, difficulty, questionTypes
    });

    await notify(req.user._id, { type: 'exam_generated', title: 'Exam ready', message: exam.title, link: `/study-plans/${plan._id}/exams/${exam._id}` });

    res.status(201).json(stripExamAnswers(exam));
  } catch (err) {
    console.error('Exam creation failed:', err);
    res.status(500).json({ message: err.message || 'Could not create an exam right now. Please try again.' });
  }
};

// GET /api/study-plans/:id/exams
export const listExams = async (req, res) => {
  const plan = await StudyPlan.findOne({ _id: req.params.id, user: req.user._id });
  if (!plan) return res.status(404).json({ message: 'Study plan not found' });

  const exams = await Exam.find({ studyPlan: plan._id, user: req.user._id }).sort('-createdAt').select('title scope blueprint createdAt');
  res.json(exams.map((e) => ({
    _id: e._id, title: e.title, scope: e.scope,
    totalQuestions: e.blueprint.totalQuestions, durationMinutes: e.blueprint.durationMinutes,
    difficulty: e.blueprint.difficulty, createdAt: e.createdAt
  })));
};

// GET /api/study-plans/:id/exam-history
export const examHistory = async (req, res) => {
  const plan = await StudyPlan.findOne({ _id: req.params.id, user: req.user._id });
  if (!plan) return res.status(404).json({ message: 'Study plan not found' });

  const attempts = await ExamAttempt.find({ studyPlan: plan._id, user: req.user._id, status: { $ne: 'in_progress' } })
    .sort('-createdAt')
    .populate('exam', 'title blueprint');

  res.json(attempts.map((a) => ({
    _id: a._id,
    examId: a.exam?._id,
    title: a.exam?.title || 'Examination',
    score: a.score,
    questionCount: a.results.length,
    durationMinutes: a.durationMinutes,
    autoSubmitted: a.autoSubmitted,
    submittedAt: a.submittedAt,
    weakTopics: a.weakTopics
  })));
};

// GET /api/study-plans/:id/mastery
// Blends QuizAttempt + ExamAttempt topic/concept performance into one view.
// Additive — does not alter the existing /progress endpoint's behavior or contract.
export const getMastery = async (req, res) => {
  const plan = await StudyPlan.findOne({ _id: req.params.id, user: req.user._id });
  if (!plan) return res.status(404).json({ message: 'Study plan not found' });

  const quizAttempts = await QuizAttempt.find({ studyPlan: plan._id, user: req.user._id });
  const examAttempts = await ExamAttempt.find({ studyPlan: plan._id, user: req.user._id, status: { $ne: 'in_progress' } });

  if (quizAttempts.length === 0 && examAttempts.length === 0) {
    return res.json({ hasData: false, topics: [] });
  }

  const blended = computeTopicPerformance(quizAttempts, examAttempts);
  const topics = blended.map((t) => ({
    topic: t.topic,
    mastery: t.percentage,
    questionsAnswered: t.total,
    concepts: t.concepts.map((c) => ({ concept: c.concept, mastery: c.percentage, questionsAnswered: c.total }))
  }));

  res.json({ hasData: true, topics });
};

// GET /api/study-plans/:id/recommendations
export const listRecommendations = async (req, res) => {
  const plan = await StudyPlan.findOne({ _id: req.params.id, user: req.user._id });
  if (!plan) return res.status(404).json({ message: 'Study plan not found' });

  const recs = await ExamRecommendation.find({ studyPlan: plan._id, user: req.user._id }).sort('-createdAt');
  res.json(recs);
};

// GET /api/exams  (all exams for the user across every study plan — the Examinations dashboard)
export const listAllExams = async (req, res) => {
  const exams = await Exam.find({ user: req.user._id }).sort('-createdAt').populate('studyPlan', 'name').select('title scope blueprint studyPlan createdAt');
  res.json(exams.map((e) => ({
    _id: e._id, title: e.title, scope: e.scope,
    studyPlan: e.studyPlan ? { _id: e.studyPlan._id, name: e.studyPlan.name } : null,
    totalQuestions: e.blueprint.totalQuestions, durationMinutes: e.blueprint.durationMinutes,
    difficulty: e.blueprint.difficulty, createdAt: e.createdAt
  })));
};

// GET /api/exams/history  (all completed attempts across every study plan)
export const listAllExamHistory = async (req, res) => {
  const attempts = await ExamAttempt.find({ user: req.user._id, status: { $ne: 'in_progress' } })
    .sort('-createdAt')
    .populate('exam', 'title')
    .populate('studyPlan', 'name');

  res.json(attempts.map((a) => ({
    _id: a._id,
    examId: a.exam?._id,
    title: a.exam?.title || 'Examination',
    studyPlan: a.studyPlan ? { _id: a.studyPlan._id, name: a.studyPlan.name } : null,
    score: a.score,
    questionCount: a.results.length,
    durationMinutes: a.durationMinutes,
    autoSubmitted: a.autoSubmitted,
    submittedAt: a.submittedAt,
    weakTopics: a.weakTopics
  })));
};

// GET /api/exams/recommendations  (all pending/accepted recommendations across every study plan)
export const listAllRecommendations = async (req, res) => {
  const recs = await ExamRecommendation.find({ user: req.user._id, status: { $in: ['pending', 'accepted'] } })
    .sort('-createdAt')
    .populate('studyPlan', 'name');
  res.json(recs.map((r) => ({
    _id: r._id,
    studyPlan: r.studyPlan ? { _id: r.studyPlan._id, name: r.studyPlan.name } : null,
    weakTopics: r.weakTopics,
    weakConcepts: r.weakConcepts,
    recommendedActions: r.recommendedActions,
    status: r.status,
    followUpExam: r.followUpExam,
    createdAt: r.createdAt
  })));
};

// GET /api/exams/:id  (metadata only — no questions)
export const getExam = async (req, res) => {
  const exam = await Exam.findOne({ _id: req.params.id, user: req.user._id });
  if (!exam) return res.status(404).json({ message: 'Exam not found' });
  res.json(stripExamAnswers(exam));
};

// POST /api/exams/:id/attempts — start (or resume) an attempt
export const startAttempt = async (req, res) => {
  const exam = await Exam.findOne({ _id: req.params.id, user: req.user._id });
  if (!exam) return res.status(404).json({ message: 'Exam not found' });

  let attempt = await ExamAttempt.findOne({ exam: exam._id, user: req.user._id, status: 'in_progress' });
  if (attempt) {
    attempt = await loadAndSettleAttempt(attempt._id, req.user._id); // in case it expired between requests
  } else {
    attempt = await ExamAttempt.create({
      exam: exam._id, studyPlan: exam.studyPlan, user: req.user._id,
      startedAt: new Date(), durationMinutes: exam.blueprint.durationMinutes
    });
  }

  res.status(201).json({
    attemptId: attempt._id,
    status: attempt.status,
    remainingSeconds: attempt.status === 'in_progress' ? attemptRemainingSeconds(attempt) : 0,
    answers: attempt.answers,
    questions: exam.questions.map(stripQuestionAnswers),
    title: exam.title
  });
};

// GET /api/exams/attempts/:id — resume/poll (also settles expiry)
export const getAttempt = async (req, res) => {
  const attempt = await loadAndSettleAttempt(req.params.id, req.user._id);
  if (!attempt) return res.status(404).json({ message: 'Attempt not found' });
  const exam = await Exam.findById(attempt.exam);

  res.json({
    attemptId: attempt._id,
    status: attempt.status,
    remainingSeconds: attempt.status === 'in_progress' ? attemptRemainingSeconds(attempt) : 0,
    answers: attempt.answers,
    questions: exam.questions.map(stripQuestionAnswers),
    title: exam.title,
    score: attempt.status === 'in_progress' ? null : attempt.score
  });
};

// PATCH /api/exams/attempts/:id/answer  { questionIndex, answer, flagged }
export const saveAnswer = async (req, res) => {
  const attempt = await loadAndSettleAttempt(req.params.id, req.user._id);
  if (!attempt) return res.status(404).json({ message: 'Attempt not found' });
  if (attempt.status !== 'in_progress') {
    return res.status(409).json({ message: 'This exam has already ended.', status: attempt.status, score: attempt.score });
  }

  const { questionIndex, answer, flagged } = req.body;
  if (typeof questionIndex !== 'number') return res.status(400).json({ message: 'questionIndex is required' });

  const existing = attempt.answers.find((a) => a.questionIndex === questionIndex);
  if (existing) {
    if (typeof answer === 'string') existing.answer = answer;
    if (typeof flagged === 'boolean') existing.flagged = flagged;
  } else {
    attempt.answers.push({ questionIndex, answer: answer || '', flagged: !!flagged });
  }
  await attempt.save();

  res.json({ ok: true, remainingSeconds: attemptRemainingSeconds(attempt) });
};

// POST /api/exams/attempts/:id/submit
export const submitAttempt = async (req, res) => {
  let attempt = await ExamAttempt.findOne({ _id: req.params.id, user: req.user._id });
  if (!attempt) return res.status(404).json({ message: 'Attempt not found' });
  if (attempt.status !== 'in_progress') {
    return res.status(409).json({ message: 'This exam has already been submitted.' });
  }

  const exam = await Exam.findById(attempt.exam);
  const autoSubmitted = attemptRemainingSeconds(attempt) <= 0;
  attempt = await gradeAttempt(attempt, exam, { autoSubmitted });

  res.json({ attemptId: attempt._id, score: attempt.score, autoSubmitted: attempt.autoSubmitted });
};

// GET /api/exams/attempts/:id/result
export const getAttemptResult = async (req, res) => {
  const attempt = await loadAndSettleAttempt(req.params.id, req.user._id);
  if (!attempt) return res.status(404).json({ message: 'Attempt not found' });
  if (attempt.status === 'in_progress') return res.status(400).json({ message: 'Exam not yet submitted.' });

  const exam = await Exam.findById(attempt.exam).select('title');
  res.json({
    attemptId: attempt._id,
    title: exam?.title,
    score: attempt.score,
    autoSubmitted: attempt.autoSubmitted,
    results: attempt.results,
    topicPerformance: attempt.topicPerformance,
    difficultyPerformance: attempt.difficultyPerformance,
    weakTopics: attempt.weakTopics,
    weakConcepts: attempt.weakConcepts,
    totalTimeSeconds: attempt.totalTimeSeconds,
    submittedAt: attempt.submittedAt
  });
};

// POST /api/recommendations/:id/start-followup
export const startFollowUp = async (req, res) => {
  const rec = await ExamRecommendation.findOne({ _id: req.params.id, user: req.user._id });
  if (!rec) return res.status(404).json({ message: 'Recommendation not found' });
  if (rec.followUpExam) return res.status(400).json({ message: 'A follow-up assessment already exists for this recommendation.' });

  const plan = await StudyPlan.findOne({ _id: rec.studyPlan, user: req.user._id });
  if (!plan) return res.status(404).json({ message: 'Study plan not found' });

  try {
    const questionCount = Math.min(20, Math.max(5, rec.weakTopics.length * 4));
    const exam = await createExamCore(plan, {
      title: `${plan.name} — Follow-up Assessment`,
      scopeType: 'previous',
      targetTopics: rec.weakTopics,
      totalQuestions: questionCount,
      durationMinutes: Math.max(10, questionCount * 2),
      difficulty: 'medium',
      questionTypes: ALL_TYPES,
      followUpOf: rec._id
    });

    rec.status = 'accepted';
    rec.followUpExam = exam._id;
    await rec.save();

    res.status(201).json(stripExamAnswers(exam));
  } catch (err) {
    console.error('Follow-up exam creation failed:', err);
    res.status(500).json({ message: err.message || 'Could not create a follow-up assessment right now.' });
  }
};

// POST /api/recommendations/:id/dismiss
export const dismissRecommendation = async (req, res) => {
  const rec = await ExamRecommendation.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { status: 'dismissed' },
    { new: true }
  );
  if (!rec) return res.status(404).json({ message: 'Recommendation not found' });
  res.json(rec);
};
