import { streamLLM } from '../utils/llm.js';

const SYSTEM_PROMPT = `You are the Planner Agent in DevMind, an AI developer assistant.

Your job: take a user's project idea or feature request, and break it down into a clear, actionable plan.

When responding:
1. Start with a 1-line summary of what you understood.
2. List 3-7 high-level milestones or phases (use markdown ## headers).
3. Under each milestone, list 2-5 concrete tasks as bullet points.
4. End with a brief recommendation on what to tackle first.

Be practical, specific, and concise. Don't write code — that's the Coder Agent's job.
Use markdown formatting.`;

export const plannerAgent = async ({ userMessage, history = [], onChunk }) => {
  const messages = [
    ...history.map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: userMessage }
  ];

  return streamLLM({
    system: SYSTEM_PROMPT,
    messages,
    maxTokens: 1500,
    onChunk
  });
};
