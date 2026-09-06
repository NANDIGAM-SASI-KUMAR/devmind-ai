import { callLLM } from '../utils/llm.js';

const stripFences = (text) =>
  text
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();

const parseJSON = (raw, label) => {
  try {
    return JSON.parse(stripFences(raw));
  } catch (err) {
    console.error(`Failed to parse ${label} JSON:`, raw);
    throw new Error(`Could not generate a valid ${label} right now. Please try again.`);
  }
};

// ---------- Study Plan generation ----------

const PLAN_SYSTEM = (level) => `You are DevMind's study plan generator.

Respond with ONLY valid JSON (no markdown fences, no commentary) matching exactly this shape:
{"weeks":[{"title":string,"topics":[{"title":string,"summary":string}]}]}

Rules:
- Base every topic STRICTLY on the material excerpts you are given. Never invent a topic, tool, or fact that is not present in the excerpts.
- Organize into up to 4 weeks progressing from fundamentals toward advanced material, with the final week focused on revision and self-assessment.
- If the excerpts only support fewer distinct topics, produce fewer weeks or fewer topics per week rather than padding with invented content.
- Each topic needs a short title and a 1-2 sentence summary grounded in the excerpts.
- The student's self-rated understanding level is: ${level}. A beginner needs more foundational weeks; an advanced student can compress fundamentals and focus on nuance.`;

export const generateStudyPlanFromContext = async ({ context, understandingLevel }) => {
  const raw = await callLLM({
    system: PLAN_SYSTEM(understandingLevel),
    messages: [{ role: 'user', content: `Material excerpts:\n\n${context}\n\nGenerate the study plan JSON now.` }],
    maxTokens: 2200
  });
  const parsed = parseJSON(raw, 'study plan');
  if (!Array.isArray(parsed.weeks)) throw new Error('Could not generate a valid study plan right now. Please try again.');
  return parsed.weeks;
};

// ---------- Quiz generation ----------

const QUIZ_SYSTEM = (count) => `You are DevMind's quiz generator.

Respond with ONLY valid JSON (no markdown fences, no commentary) matching exactly this shape:
{"questions":[{"type":"mcq"|"true_false"|"short_answer","question":string,"options":string[],"correctAnswer":string,"explanation":string,"topic":string}]}

Rules:
- Generate exactly ${count} questions, mixing types: mostly "mcq", a few "true_false", one or two "short_answer".
- "mcq" questions need exactly 4 plausible options in "options"; "correctAnswer" must exactly match one of them.
- "true_false" questions must have "options": ["True","False"] and "correctAnswer" exactly "True" or "False".
- "short_answer" questions must have "options": [] and a concise expected "correctAnswer" (a few words).
- "topic" is a short 1-3 word label naming the concept area the question tests (e.g. "Arrays", "Normalization") — reuse the same topic label across questions that test the same concept, so results can be grouped.
- Base every question and answer STRICTLY on the material excerpts given below. Never invent facts, options, or answers absent from the excerpts.
- "explanation" briefly explains why the correct answer is correct, grounded in the excerpts.`;

export const generateQuizFromContext = async ({ context, count = 8 }) => {
  const raw = await callLLM({
    system: QUIZ_SYSTEM(count),
    messages: [{ role: 'user', content: `Material excerpts:\n\n${context}\n\nGenerate the quiz JSON now.` }],
    maxTokens: 2600
  });
  const parsed = parseJSON(raw, 'quiz');
  if (!Array.isArray(parsed.questions) || parsed.questions.length === 0) {
    throw new Error('Could not generate a valid quiz right now. Please try again.');
  }
  return parsed.questions;
};
