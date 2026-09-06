import { callLLM } from '../utils/llm.js';

const stripFences = (text) =>
  text.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();

const parseJSON = (raw, label) => {
  try {
    return JSON.parse(stripFences(raw));
  } catch (err) {
    console.error(`Failed to parse ${label} JSON:`, raw);
    throw new Error(`Could not generate a valid ${label} right now. Please try again.`);
  }
};

// ============================================================
// 1. EXAM ORCHESTRATOR — turns a request + real prior performance into a blueprint.
// ============================================================

const BLUEPRINT_SYSTEM = `You are DevMind's exam orchestrator. Given a student's study plan topics and their real prior performance data, produce an examination blueprint that allocates questions across topics sensibly — weaker topics get more questions, stronger topics get fewer, within the requested total.

Respond with ONLY valid JSON (no markdown fences, no commentary) matching exactly:
{"topics":[{"topic":string,"questionCount":number,"difficulty":"easy"|"medium"|"hard"}]}

Rules:
- Only use topics from the "Available topics" list given to you — never invent a topic the student hasn't studied.
- The sum of all questionCount values MUST equal the requested total exactly.
- Weight questionCount toward topics with lower prior performance (weaker topics get proportionally more questions), but every listed topic should get at least 1 question if the total allows it.
- Assign difficulty per topic based on the requested overall difficulty and the student's prior performance on that topic (a topic they're weak on should skew slightly easier so the exam can still assess it meaningfully, unless "hard" was explicitly requested).`;

export const generateExamBlueprint = async ({
  studyPlanName, understandingLevel, availableTopics, topicStats, totalQuestions, difficulty
}) => {
  const statsLine = topicStats.length > 0
    ? topicStats.map((t) => `${t.topic}: ${t.percentage}% (${t.questionsAnswered} prior questions)`).join('\n')
    : 'No prior quiz/exam performance recorded yet — treat all topics as unknown.';

  const userMessage = `Study plan: ${studyPlanName}
Student level: ${understandingLevel}
Requested total questions: ${totalQuestions}
Requested difficulty: ${difficulty}

Available topics (choose only from these):
${availableTopics.join(', ')}

Prior performance by topic:
${statsLine}

Generate the exam blueprint JSON now.`;

  const raw = await callLLM({ system: BLUEPRINT_SYSTEM, messages: [{ role: 'user', content: userMessage }], maxTokens: 900 });
  const parsed = parseJSON(raw, 'exam blueprint');
  if (!Array.isArray(parsed.topics) || parsed.topics.length === 0) {
    throw new Error('Could not generate a valid exam blueprint right now. Please try again.');
  }

  // Never trust the LLM's arithmetic — deterministically correct the total so it exactly
  // matches what was requested, rather than silently shipping an exam with the wrong count.
  const validTopics = parsed.topics.filter(
    (t) => availableTopics.includes(t.topic) && Number.isFinite(t.questionCount) && t.questionCount > 0
  );
  if (validTopics.length === 0) throw new Error('Could not generate a valid exam blueprint right now. Please try again.');

  let sum = validTopics.reduce((s, t) => s + t.questionCount, 0);
  let diff = totalQuestions - sum;
  let i = 0;
  while (diff !== 0 && validTopics.length > 0) {
    const idx = i % validTopics.length;
    if (diff > 0) { validTopics[idx].questionCount += 1; diff -= 1; }
    else if (validTopics[idx].questionCount > 1) { validTopics[idx].questionCount -= 1; diff += 1; }
    i += 1;
    if (i > totalQuestions * 4) break; // safety valve against pathological loops
  }

  return validTopics.map((t) => ({
    topic: t.topic,
    questionCount: t.questionCount,
    difficulty: ['easy', 'medium', 'hard'].includes(t.difficulty) ? t.difficulty : (difficulty === 'mixed' ? 'medium' : difficulty)
  }));
};

// ============================================================
// 2. QUESTION GENERATOR — produces grounded, structured questions for one topic.
// ============================================================

const QUESTION_SYSTEM = (count, difficulty, questionTypes) => `You are DevMind's exam question generator.

Respond with ONLY valid JSON (no markdown fences, no commentary) matching exactly:
{"questions":[{"type":${questionTypes.map((t) => `"${t}"`).join('|')},"question":string,"options":string[],"correctAnswer":string,"explanation":string,"concept":string,"sourceExcerpt":string}]}

Rules:
- Generate exactly ${count} questions at ${difficulty} difficulty, using only these types: ${questionTypes.join(', ')}.
- "mcq" needs exactly 4 plausible options; "correctAnswer" must exactly match one of them.
- "true_false" needs "options": ["True","False"]; "correctAnswer" exactly "True" or "False".
- "short_answer" needs "options": [] and a concise expected "correctAnswer".
- "concept" is a short 2-4 word label naming the specific sub-idea the question tests (e.g. "BFS traversal", "AVL rotation") — more specific than the topic itself.
- "sourceExcerpt" is the short exact phrase or sentence from the material excerpts below that this question is grounded in — copy it verbatim, do not paraphrase.
- Base every question, answer, and explanation STRICTLY on the material excerpts given. Never invent a fact, option, or concept absent from the excerpts. If the excerpts don't support ${count} distinct questions, generate fewer rather than inventing content.`;

export const generateExamQuestionsForTopic = async ({ topic, difficulty, count, questionTypes, context }) => {
  const raw = await callLLM({
    system: QUESTION_SYSTEM(count, difficulty, questionTypes),
    messages: [{ role: 'user', content: `Topic: ${topic}\n\nMaterial excerpts:\n\n${context}\n\nGenerate the questions JSON now.` }],
    maxTokens: 2600
  });
  const parsed = parseJSON(raw, 'exam questions');
  if (!Array.isArray(parsed.questions)) throw new Error('Could not generate valid exam questions right now.');

  // Structural validation — a malformed question is dropped rather than shipped broken.
  const valid = parsed.questions.filter((q) => {
    if (!questionTypes.includes(q.type) || !q.question || !q.correctAnswer) return false;
    if (q.type === 'mcq') return Array.isArray(q.options) && q.options.length === 4 && q.options.includes(q.correctAnswer);
    if (q.type === 'true_false') return Array.isArray(q.options) && q.options.length === 2 && ['True', 'False'].includes(q.correctAnswer);
    if (q.type === 'short_answer') return typeof q.correctAnswer === 'string' && q.correctAnswer.trim().length > 0;
    return false;
  });

  return valid.map((q) => ({
    type: q.type,
    question: q.question,
    options: q.options || [],
    correctAnswer: q.correctAnswer,
    explanation: q.explanation || '',
    topic,
    concept: q.concept || '',
    difficulty,
    sourceExcerpt: q.sourceExcerpt || ''
  }));
};

// ============================================================
// 3. EVALUATOR — grades short-answer questions against a fixed expected answer.
// ============================================================

const EVAL_SYSTEM = `You are DevMind's exam evaluator, grading a student's short-answer response against a fixed expected answer.

Respond with ONLY valid JSON (no markdown fences, no commentary) matching exactly:
{"correct":boolean,"feedback":string}

Rules:
- Mark "correct": true ONLY if the student's answer captures the same meaning as the expected answer, grounded in the source excerpt — minor wording differences are fine, but a different or missing concept is not correct.
- Never award credit based on effort or length alone.
- "feedback" is one short sentence explaining the grading decision.`;

export const evaluateShortAnswer = async ({ question, studentAnswer, expectedAnswer, sourceExcerpt }) => {
  const userMessage = `Question: ${question}
Expected answer: ${expectedAnswer}
Source excerpt: ${sourceExcerpt || '(not available)'}
Student's answer: ${studentAnswer || '(no answer given)'}

Grade this now.`;
  try {
    const raw = await callLLM({ system: EVAL_SYSTEM, messages: [{ role: 'user', content: userMessage }], maxTokens: 250 });
    const parsed = parseJSON(raw, 'answer evaluation');
    return { correct: parsed.correct === true, feedback: parsed.feedback || '' };
  } catch (err) {
    console.error('Short-answer evaluation failed, marking incorrect:', err.message);
    return { correct: false, feedback: 'Could not evaluate this answer automatically.' };
  }
};

// ============================================================
// 4. LEARNING INTEGRATOR — turns deterministic weak-area stats into phrased study actions.
// Weak topics/concepts themselves are computed by the caller from real numbers; this agent
// only produces human-readable recommendations grounded in those already-decided facts.
// ============================================================

const RECOMMENDATION_SYSTEM = `You are DevMind's learning integrator. Given a student's weak topics and weak concepts from a real exam result, write concrete, actionable revision recommendations.

Respond with ONLY valid JSON (no markdown fences, no commentary) matching exactly:
{"recommendedActions":string[]}

Rules:
- Write 3-6 short, concrete action items (e.g. "Review graph traversal (BFS/DFS)", "Practice shortest-path problems", "Take a follow-up assessment on Dynamic Programming").
- Base every recommendation strictly on the weak topics/concepts given — do not invent topics not listed.
- End with one item recommending a follow-up assessment on the weakest topic.`;

export const generateLearningRecommendations = async ({ weakTopics, weakConcepts }) => {
  const userMessage = `Weak topics: ${weakTopics.join(', ') || 'none'}
Weak concepts: ${weakConcepts.join(', ') || 'none'}

Generate the recommendations JSON now.`;
  try {
    const raw = await callLLM({ system: RECOMMENDATION_SYSTEM, messages: [{ role: 'user', content: userMessage }], maxTokens: 500 });
    const parsed = parseJSON(raw, 'learning recommendations');
    return Array.isArray(parsed.recommendedActions) ? parsed.recommendedActions : [];
  } catch (err) {
    console.error('Learning recommendation generation failed:', err.message);
    return weakTopics.map((t) => `Review ${t}`);
  }
};
