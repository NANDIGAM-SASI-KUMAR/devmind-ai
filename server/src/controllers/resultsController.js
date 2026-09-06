import crypto from 'crypto';
import StudyPlan from '../models/StudyPlan.js';
import QuizAttempt from '../models/QuizAttempt.js';
import Exam from '../models/Exam.js';
import ExamAttempt from '../models/ExamAttempt.js';
import ResultsInsight from '../models/ResultsInsight.js';
import {
  computeTopicPerformance, computeTopicQuizVsExam, computeQuestionTypePerformance,
  computeScoreTrend, classifyStrongWeak, pct, STRONG_THRESHOLD
} from '../utils/analytics.js';
import { generateResultsInsights } from '../agents/resultsAnalystAgent.js';
import { cached, cacheDelByPrefix } from '../utils/cache.js';

// Every Results cache entry for a user lives under this one prefix so a single write
// (a new quiz/exam attempt, a regenerated study plan) can invalidate all of it at once —
// simpler and safer than tracking which specific endpoints a given write affects.
export const resultsCachePrefix = (userId) => `results:${userId}:`;
export const invalidateResultsCache = (userId) => cacheDelByPrefix(resultsCachePrefix(userId));

const RESULTS_TTL = 60; // seconds — short safety net; real freshness comes from explicit invalidation on writes

const loadAttempts = async (userId, { studyPlan } = {}) => {
  const quizFilter = { user: userId, ...(studyPlan ? { studyPlan } : {}) };
  const examFilter = { user: userId, status: { $ne: 'in_progress' }, ...(studyPlan ? { studyPlan } : {}) };
  const [quizAttempts, examAttempts] = await Promise.all([
    QuizAttempt.find(quizFilter).sort('createdAt'),
    ExamAttempt.find(examFilter).sort('createdAt')
  ]);
  return { quizAttempts, examAttempts };
};

const RANGE_DAYS = { '7d': 7, '30d': 30, '3m': 90, all: null };

// GET /api/results/overview
export const getOverview = async (req, res) => {
  const result = await cached(`${resultsCachePrefix(req.user._id)}overview`, RESULTS_TTL, async () => {
    const { quizAttempts, examAttempts } = await loadAttempts(req.user._id);
    if (quizAttempts.length === 0 && examAttempts.length === 0) return { hasData: false };

    const topics = computeTopicPerformance(quizAttempts, examAttempts);
    const totalCorrect = topics.reduce((s, t) => s + t.correct, 0);
    const totalQuestions = topics.reduce((s, t) => s + t.total, 0);
    const mastered = topics.filter((t) => t.percentage >= STRONG_THRESHOLD).length;

    return {
      hasData: true,
      overallProgress: pct(totalCorrect, totalQuestions),
      quizAccuracy: quizAttempts.length > 0 ? Math.round(quizAttempts.reduce((s, a) => s + a.score, 0) / quizAttempts.length) : null,
      examAverage: examAttempts.length > 0 ? Math.round(examAttempts.reduce((s, a) => s + a.score, 0) / examAttempts.length) : null,
      topicsMastered: { count: mastered, total: topics.length },
      quizzesCompleted: quizAttempts.length,
      examsCompleted: examAttempts.length
    };
  });
  res.json(result);
};

// GET /api/results/trend?range=7d|30d|3m|all&type=all|quiz|exam
export const getTrend = async (req, res) => {
  const type = ['all', 'quiz', 'exam'].includes(req.query.type) ? req.query.type : 'all';
  const range = Object.keys(RANGE_DAYS).includes(req.query.range) ? req.query.range : 'all';

  const result = await cached(`${resultsCachePrefix(req.user._id)}trend:${range}:${type}`, RESULTS_TTL, async () => {
    const { quizAttempts, examAttempts } = await loadAttempts(req.user._id);

    let points = computeScoreTrend(
      type === 'exam' ? [] : quizAttempts,
      type === 'quiz' ? [] : examAttempts
    );

    const days = RANGE_DAYS[range];
    if (days) {
      const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
      points = points.filter((p) => new Date(p.date).getTime() >= cutoff);
    }

    return { hasData: points.length > 0, points };
  });
  res.json(result);
};

// GET /api/results/topics
export const getTopics = async (req, res) => {
  const result = await cached(`${resultsCachePrefix(req.user._id)}topics`, RESULTS_TTL, async () => {
    const { quizAttempts, examAttempts } = await loadAttempts(req.user._id);
    if (quizAttempts.length === 0 && examAttempts.length === 0) return { hasData: false, topics: [], strong: [], weak: [] };

    const topics = computeTopicPerformance(quizAttempts, examAttempts);
    const { strong, weak } = classifyStrongWeak(topics);
    return { hasData: true, topics, strong, weak };
  });
  res.json(result);
};

// GET /api/results/topics/:topic
export const getTopicDetail = async (req, res) => {
  const topicName = decodeURIComponent(req.params.topic);

  const result = await cached(`${resultsCachePrefix(req.user._id)}topic:${topicName}`, RESULTS_TTL, async () => {
    const { quizAttempts, examAttempts } = await loadAttempts(req.user._id);

    const topics = computeTopicPerformance(quizAttempts, examAttempts);
    const detail = topics.find((t) => t.topic === topicName);
    if (!detail) return null;

    const quizVsExam = computeTopicQuizVsExam(quizAttempts, examAttempts).find((t) => t.topic === topicName);
    const { strong: strongConcepts, weak: weakConcepts } = classifyStrongWeak(detail.concepts, { minAttempts: 1 });

    const recommendation = weakConcepts.length > 0
      ? `Review ${weakConcepts[0].concept} and take a targeted quiz on ${topicName}.`
      : detail.percentage < STRONG_THRESHOLD
        ? `Take a targeted quiz on ${topicName} to build confidence.`
        : `Keep reinforcing ${topicName} with periodic review.`;

    return {
      topic: topicName,
      overallPercentage: detail.percentage,
      quizScore: quizVsExam?.quizScore ?? null,
      examScore: quizVsExam?.examScore ?? null,
      quizAttemptCount: detail.quizAttemptCount,
      examAttemptCount: detail.examAttemptCount,
      concepts: detail.concepts,
      strongConcepts: strongConcepts.map((c) => c.concept),
      weakConcepts: weakConcepts.map((c) => c.concept),
      recommendation
    };
  });

  if (!result) return res.status(404).json({ message: 'No data for this topic yet' });
  res.json(result);
};

// GET /api/results/quiz-analytics
export const getQuizAnalytics = async (req, res) => {
  const result = await cached(`${resultsCachePrefix(req.user._id)}quiz-analytics`, RESULTS_TTL, async () => {
    const { quizAttempts } = await loadAttempts(req.user._id);
    if (quizAttempts.length === 0) return { hasData: false };

    const scores = quizAttempts.map((a) => a.score);
    const recent = await QuizAttempt.find({ user: req.user._id }).sort('-createdAt').limit(8).populate('quiz', 'title').populate('studyPlan', 'name');

    return {
      hasData: true,
      completed: quizAttempts.length,
      averageScore: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
      highestScore: Math.max(...scores),
      lowestScore: Math.min(...scores),
      questionTypePerformance: computeQuestionTypePerformance(quizAttempts, []),
      topicPerformance: computeTopicPerformance(quizAttempts, []),
      recentAttempts: recent.map((a) => ({
        _id: a._id, title: a.quiz?.title || 'Quiz', studyPlan: a.studyPlan ? { _id: a.studyPlan._id, name: a.studyPlan.name } : null,
        score: a.score, questionCount: a.answers.length, createdAt: a.createdAt
      }))
    };
  });
  res.json(result);
};

// GET /api/results/exam-analytics
export const getExamAnalytics = async (req, res) => {
  const result = await cached(`${resultsCachePrefix(req.user._id)}exam-analytics`, RESULTS_TTL, async () => {
    const { examAttempts } = await loadAttempts(req.user._id);
    if (examAttempts.length === 0) return { hasData: false };

    const scores = examAttempts.map((a) => a.score);
    const timed = examAttempts.filter((a) => typeof a.totalTimeSeconds === 'number');
    const recent = await ExamAttempt.find({ user: req.user._id, status: { $ne: 'in_progress' } }).sort('-createdAt').limit(8).populate('exam', 'title').populate('studyPlan', 'name');

    let improvement = null;
    if (examAttempts.length >= 2) {
      const first = examAttempts[0].score;
      const latest = examAttempts[examAttempts.length - 1].score;
      improvement = { firstExamScore: first, latestExamScore: latest, delta: latest - first };
    }

    return {
      hasData: true,
      completed: examAttempts.length,
      averageScore: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
      highestScore: Math.max(...scores),
      latestScore: scores[scores.length - 1],
      improvement,
      averageTimeSeconds: timed.length > 0 ? Math.round(timed.reduce((s, a) => s + a.totalTimeSeconds, 0) / timed.length) : null,
      topicPerformance: computeTopicPerformance([], examAttempts),
      recentAttempts: recent.map((a) => ({
        _id: a._id, title: a.exam?.title || 'Examination', studyPlan: a.studyPlan ? { _id: a.studyPlan._id, name: a.studyPlan.name } : null,
        score: a.score, questionCount: a.results.length, autoSubmitted: a.autoSubmitted, submittedAt: a.submittedAt
      }))
    };
  });
  res.json(result);
};

// GET /api/results/study-plans
export const getStudyPlanAnalytics = async (req, res) => {
  const result = await cached(`${resultsCachePrefix(req.user._id)}study-plan-analytics`, RESULTS_TTL, async () => {
    const plans = await StudyPlan.find({ user: req.user._id }).sort('-updatedAt');
    return Promise.all(plans.map(async (plan) => {
      const { quizAttempts, examAttempts } = await loadAttempts(req.user._id, { studyPlan: plan._id });
      const topics = computeTopicPerformance(quizAttempts, examAttempts);
      const { strong, weak } = classifyStrongWeak(topics, { minAttempts: 1 });

      let planTopicCount = 0;
      try { planTopicCount = plan.plan ? [...new Set(JSON.parse(plan.plan).flatMap((w) => (w.topics || []).map((t) => t.title)))].length : 0; } catch { /* noop */ }

      // Quiz/exam topics are freeform LLM-generated labels and don't always match the study
      // plan's own topic titles verbatim, so "practiced" can exceed the plan's declared count.
      // The total is widened (never shrunk) so the fraction shown is always practiced <= total.
      const topicsTotal = Math.max(planTopicCount, topics.length);

      return {
        _id: plan._id,
        name: plan.name,
        topicsPracticed: topics.length,
        topicsTotal,
        quizAccuracy: quizAttempts.length > 0 ? Math.round(quizAttempts.reduce((s, a) => s + a.score, 0) / quizAttempts.length) : null,
        examPerformance: examAttempts.length > 0 ? Math.round(examAttempts.reduce((s, a) => s + a.score, 0) / examAttempts.length) : null,
        strong: strong.slice(0, 3).map((t) => t.topic),
        weak: weak.slice(0, 3).map((t) => t.topic),
        hasData: quizAttempts.length > 0 || examAttempts.length > 0
      };
    }));
  });
  res.json(result);
};

// GET /api/results/activity
export const getRecentActivity = async (req, res) => {
  const activity = await cached(`${resultsCachePrefix(req.user._id)}activity`, RESULTS_TTL, async () => {
    const [quizAttempts, examAttempts, plans] = await Promise.all([
      QuizAttempt.find({ user: req.user._id }).sort('-createdAt').limit(10).populate('quiz', 'title').populate('studyPlan', 'name'),
      ExamAttempt.find({ user: req.user._id, status: { $ne: 'in_progress' } }).sort('-createdAt').limit(10).populate('exam', 'title').populate('studyPlan', 'name'),
      StudyPlan.find({ user: req.user._id, planGeneratedAt: { $ne: null } }).sort('-planGeneratedAt').limit(10)
    ]);

    return [
      ...quizAttempts.map((a) => ({
        type: 'quiz', label: a.quiz?.title || 'Quiz completed', score: a.score, date: a.createdAt,
        link: a.studyPlan ? `/study-plans/${a.studyPlan._id}` : null
      })),
      ...examAttempts.map((a) => ({
        type: 'exam', label: a.exam?.title || 'Examination completed', score: a.score, date: a.submittedAt || a.createdAt,
        link: `/examinations/attempts/${a._id}/result`
      })),
      ...plans.map((p) => ({
        type: 'study_plan', label: `${p.name} — study plan generated`, score: null, date: p.planGeneratedAt,
        link: `/study-plans/${p._id}`
      }))
    ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 15);
  });
  res.json(activity);
};

const fingerprintFor = (quizAttempts, examAttempts) => {
  const raw = `${quizAttempts.length}:${examAttempts.length}:${quizAttempts.at(-1)?._id || ''}:${examAttempts.at(-1)?._id || ''}`;
  return crypto.createHash('sha1').update(raw).digest('hex');
};

// GET /api/results/insights
// Regenerates only when the underlying data has actually changed since the last call —
// never on every dashboard load. This is the ONLY endpoint in the whole Results feature
// that calls an LLM.
export const getInsights = async (req, res) => {
  const { quizAttempts, examAttempts } = await loadAttempts(req.user._id);
  if (quizAttempts.length === 0 && examAttempts.length === 0) {
    return res.json({ hasData: false });
  }

  const fingerprint = fingerprintFor(quizAttempts, examAttempts);
  const cached = await ResultsInsight.findOne({ user: req.user._id });
  if (cached && cached.dataFingerprint === fingerprint) {
    return res.json({
      hasData: true, cached: true, summary: cached.summary, strengths: cached.strengths,
      weakAreas: cached.weakAreas, trends: cached.trends, recommendations: cached.recommendations, generatedAt: cached.generatedAt
    });
  }

  const topics = computeTopicPerformance(quizAttempts, examAttempts);
  const { strong, weak } = classifyStrongWeak(topics);
  const questionTypes = computeQuestionTypePerformance(quizAttempts, examAttempts);
  const quizAvg = quizAttempts.length > 0 ? Math.round(quizAttempts.reduce((s, a) => s + a.score, 0) / quizAttempts.length) : null;
  const examAvg = examAttempts.length > 0 ? Math.round(examAttempts.reduce((s, a) => s + a.score, 0) / examAttempts.length) : null;

  const stats = {
    overallProgress: pct(topics.reduce((s, t) => s + t.correct, 0), topics.reduce((s, t) => s + t.total, 0)),
    quizAccuracy: quizAvg,
    examAverage: examAvg,
    topics: topics.map((t) => ({ name: t.topic, percentage: t.percentage, quizQuestions: t.quizQuestions, examQuestions: t.examQuestions })),
    strongTopics: strong.map((t) => t.topic),
    weakTopics: weak.map((t) => t.topic),
    questionTypePerformance: questionTypes,
    improvement: examAttempts.length >= 2 ? { firstExam: examAttempts[0].score, latestExam: examAttempts[examAttempts.length - 1].score } : null
  };

  try {
    const insights = await generateResultsInsights(stats);
    await ResultsInsight.findOneAndUpdate(
      { user: req.user._id },
      { ...insights, dataFingerprint: fingerprint, generatedAt: new Date() },
      { upsert: true }
    );
    res.json({ hasData: true, cached: false, ...insights, generatedAt: new Date() });
  } catch (err) {
    console.error('Results insight generation failed:', err);
    res.status(500).json({ message: 'Could not generate performance insights right now. Please try again.' });
  }
};
