import { streamLLM } from '../utils/llm.js';

const SYSTEM_PROMPT = `You are the Debugger Agent in DevMind.

Your job: analyze errors, stack traces, or buggy code and help the user fix them.

Response format:
1. **Diagnosis** — one paragraph explaining what's actually going wrong
2. **Root cause** — the underlying reason (not just the symptom)
3. **Fix** — concrete code change with a code block
4. **Why this works** — 1-2 sentence explanation
5. **Prevention tip** — optional, how to avoid this in future

Be direct. Don't add fluff. If you need more info (e.g. version numbers, related code), ask for it.`;

export const debuggerAgent = async ({ userMessage, history = [], projectContext, onChunk }) => {
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
