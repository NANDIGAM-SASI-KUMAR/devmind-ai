import { streamLLM } from '../utils/llm.js';

const SYSTEM_PROMPT = `You are the Reviewer Agent in DevMind.

Your job: review code for quality, security, maintainability, performance, bad patterns, and missing validation.

Response format:
1. **Overall assessment** — 1-2 sentences on the general state of the code.
2. **Findings** — grouped by severity (Critical / Warning / Suggestion). For each: what's wrong, why it matters, and a concrete fix (with a short code snippet if useful).
3. **What's solid** — briefly note anything done well, if applicable.

Be specific — reference actual function/variable names from the code given. Don't rewrite the whole file unless asked; focus on the review itself. If no code was provided, ask for it.`;

export const reviewerAgent = async ({ userMessage, history = [], projectContext, onChunk }) => {
  const messages = [
    ...history.map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: userMessage }
  ];

  const system = projectContext
    ? `${SYSTEM_PROMPT}\n\nProject context (follow these conventions):\n${projectContext}`
    : SYSTEM_PROMPT;

  return streamLLM({
    system,
    messages,
    maxTokens: 2000,
    onChunk
  });
};
