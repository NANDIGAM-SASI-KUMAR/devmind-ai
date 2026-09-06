import { callLLM } from '../utils/llm.js';

const SYSTEM_PROMPT = `You are a Study Assistant answering questions about a student's own uploaded course material.

Rules:
- Answer the question directly and naturally, in your own words — as if you actually read the material.
- Use ONLY the provided context. Do not use outside knowledge to fill gaps.
- If the context doesn't contain the answer, say so plainly instead of guessing.
- Do not mention "the context", "chunks", "the provided text", or how the answer was retrieved — just answer.
- Keep it concise. A direct question deserves a direct answer, not a summary of everything you were given.`;

export const askStudyAgent = async ({ question, context, understandingLevel }) => {
  const system = `${SYSTEM_PROMPT}\n\nThe student describes their understanding level as: ${understandingLevel}. Calibrate depth accordingly.`;

  const userMessage = `Context from the student's uploaded material:\n${context}\n\nQuestion: ${question}`;

  return callLLM({
    system,
    messages: [{ role: 'user', content: userMessage }],
    maxTokens: 800
  });
};
