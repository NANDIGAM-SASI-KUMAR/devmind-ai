// Shared deterministic analytics helpers over QuizAttempt + ExamAttempt records.
// Nothing here calls an LLM — these are pure, reusable calculations consumed by the
// Study Plan mastery view, the Results Dashboard, and the Results Analyst's input digest,
// so topic/concept/question-type math is defined in exactly one place.

const STRONG_THRESHOLD = 75;
const WEAK_THRESHOLD = 60;
const MIN_ATTEMPTS_FOR_CLASSIFICATION = 3;

const pct = (correct, total) => (total > 0 ? Math.round((correct / total) * 100) : 0);

// Blends QuizAttempt.answers + ExamAttempt.results into one per-topic performance view,
// tracking how many quiz vs. exam questions contributed so the result stays explainable
// ("based on 4 quizzes, 2 examinations") rather than a single opaque percentage.
export const computeTopicPerformance = (quizAttempts, examAttempts) => {
  const topicMap = new Map();

  const bump = (topic, correct, source, concept) => {
    if (!topic) return;
    const t = topicMap.get(topic) || { correct: 0, total: 0, quizQuestions: 0, examQuestions: 0, concepts: new Map() };
    t.total += 1;
    if (correct) t.correct += 1;
    if (source === 'quiz') t.quizQuestions += 1; else t.examQuestions += 1;
    if (concept) {
      const c = t.concepts.get(concept) || { correct: 0, total: 0 };
      c.total += 1; if (correct) c.correct += 1;
      t.concepts.set(concept, c);
    }
    topicMap.set(topic, t);
  };

  for (const a of quizAttempts) for (const ans of a.answers) bump(ans.topic, ans.correct, 'quiz');
  for (const a of examAttempts) for (const r of a.results) bump(r.topic, r.correct, 'exam', r.concept);

  return [...topicMap.entries()]
    .map(([topic, t]) => ({
      topic,
      percentage: pct(t.correct, t.total),
      correct: t.correct,
      total: t.total,
      quizQuestions: t.quizQuestions,
      examQuestions: t.examQuestions,
      quizAttemptCount: quizAttempts.filter((a) => a.answers.some((ans) => ans.topic === topic)).length,
      examAttemptCount: examAttempts.filter((a) => a.results.some((r) => r.topic === topic)).length,
      concepts: [...t.concepts.entries()].map(([concept, c]) => ({ concept, percentage: pct(c.correct, c.total), correct: c.correct, total: c.total }))
    }))
    .sort((a, b) => a.percentage - b.percentage);
};

// Per-topic quiz-only vs exam-only score, used to power "practice vs. real performance" insights.
export const computeTopicQuizVsExam = (quizAttempts, examAttempts) => {
  const quizByTopic = new Map();
  for (const a of quizAttempts) for (const ans of a.answers) {
    const t = quizByTopic.get(ans.topic) || { correct: 0, total: 0 };
    t.total += 1; if (ans.correct) t.correct += 1;
    quizByTopic.set(ans.topic, t);
  }
  const examByTopic = new Map();
  for (const a of examAttempts) for (const r of a.results) {
    const t = examByTopic.get(r.topic) || { correct: 0, total: 0 };
    t.total += 1; if (r.correct) t.correct += 1;
    examByTopic.set(r.topic, t);
  }
  const topics = new Set([...quizByTopic.keys(), ...examByTopic.keys()]);
  return [...topics].map((topic) => ({
    topic,
    quizScore: quizByTopic.has(topic) ? pct(quizByTopic.get(topic).correct, quizByTopic.get(topic).total) : null,
    examScore: examByTopic.has(topic) ? pct(examByTopic.get(topic).correct, examByTopic.get(topic).total) : null
  }));
};

export const computeQuestionTypePerformance = (quizAttempts, examAttempts) => {
  const byType = new Map();
  const bump = (type, correct) => {
    if (!type) return;
    const t = byType.get(type) || { correct: 0, total: 0 };
    t.total += 1; if (correct) t.correct += 1;
    byType.set(type, t);
  };
  for (const a of quizAttempts) for (const ans of a.answers) bump(ans.type, ans.correct);
  for (const a of examAttempts) for (const r of a.results) bump(r.type, r.correct);

  return [...byType.entries()].map(([type, t]) => ({ type, percentage: pct(t.correct, t.total), correct: t.correct, total: t.total }));
};

// A single, comparable score-over-time series across both quizzes and exams.
export const computeScoreTrend = (quizAttempts, examAttempts) => {
  const points = [
    ...quizAttempts.map((a) => ({ date: a.createdAt, score: a.score, kind: 'quiz', id: a._id })),
    ...examAttempts.map((a) => ({ date: a.submittedAt || a.createdAt, score: a.score, kind: 'exam', id: a._id }))
  ];
  return points.sort((a, b) => new Date(a.date) - new Date(b.date));
};

export const classifyStrongWeak = (topics, { minAttempts = MIN_ATTEMPTS_FOR_CLASSIFICATION } = {}) => {
  const eligible = topics.filter((t) => t.total >= minAttempts);
  const strong = eligible.filter((t) => t.percentage >= STRONG_THRESHOLD).sort((a, b) => b.percentage - a.percentage);
  const weak = eligible.filter((t) => t.percentage < WEAK_THRESHOLD).sort((a, b) => a.percentage - b.percentage);
  return { strong, weak };
};

export { pct, STRONG_THRESHOLD, WEAK_THRESHOLD, MIN_ATTEMPTS_FOR_CLASSIFICATION };
