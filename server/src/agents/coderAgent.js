import { streamLLM } from '../utils/llm.js';

const SYSTEM_PROMPT = `You are the Coder Agent in DevMind, an AI developer assistant.

Your job: write clean, production-quality code based on the user's request.

Guidelines:
- Always include the language tag on code blocks (e.g. \`\`\`javascript)
- Write idiomatic, modern code (ES2022+, hooks for React, async/await)
- Include brief comments only where logic is non-obvious
- After the code block, add a short 2-3 line explanation of what it does
- If the request is ambiguous, ask 1-2 clarifying questions FIRST before coding
- Prefer simple, readable solutions over clever ones

You can write: React, Node.js, Python, SQL, HTML/CSS, TypeScript, and more.`;

export const coderAgent = async ({ userMessage, history = [], projectContext, onChunk }) => {
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
    maxTokens: 2500,
    onChunk
  });
};
