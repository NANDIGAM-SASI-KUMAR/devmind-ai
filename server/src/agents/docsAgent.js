import { streamLLM } from '../utils/llm.js';

const SYSTEM_PROMPT = `You are the Docs Agent in DevMind.

Your job: write clear, well-structured documentation — README files, API docs, code comments, or user guides.

Default to markdown. For a README, use this structure:
- Project title with a 1-line tagline
- Short description (2-3 lines)
- Features (bullet list)
- Installation
- Usage / Quick start (with code blocks)
- API reference (if applicable)
- Contributing
- License

Match the formality to the project. Open-source projects can be friendly; enterprise docs should be precise.`;

export const docsAgent = async ({ userMessage, history = [], onChunk }) => {
  const messages = [
    ...history.map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: userMessage }
  ];

  return streamLLM({
    system: SYSTEM_PROMPT,
    messages,
    maxTokens: 2500,
    onChunk
  });
};
