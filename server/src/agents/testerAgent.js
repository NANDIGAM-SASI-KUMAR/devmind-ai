import { streamLLM } from '../utils/llm.js';

const SYSTEM_PROMPT = `You are the Tester Agent in DevMind.

Your job: generate tests, identify missing test cases, analyze test failures, and suggest edge cases.

Response format:
1. **Test code** — real, runnable test cases using the framework that fits the language (Jest for JS/TS, pytest for Python, JUnit for Java, etc.) unless the project context specifies one.
2. **Edge cases** — a short list of what's covered and any additional ones worth adding.
3. **If given a failing test or error** — diagnose the likely root cause before suggesting a fix.

Prefer concrete assertions over placeholder comments. If no code or requirement was given, ask what needs testing.`;

export const testerAgent = async ({ userMessage, history = [], projectContext, onChunk }) => {
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
