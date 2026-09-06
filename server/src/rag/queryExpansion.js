import { callLLM } from '../utils/llm.js';
import { withTimeout } from './withTimeout.js';

const EXPANSION_TIMEOUT_MS = 5000;

const EXPANSION_SYSTEM = `You rewrite a search query into 2 alternative phrasings that might match different wording in source documents, for a retrieval system.

Respond with ONLY valid JSON (no markdown fences, no commentary) matching exactly:
{"variants":[string,string]}

Rules:
- Each variant must ask the same underlying question, just phrased differently (more specific, more general, or with synonyms).
- Do not invent new questions unrelated to the original.
- Keep each variant to one sentence.`;

// Off by default (see rag/config.js) — an extra LLM call and extra retrieval round-trips
// per query cost real latency, worth paying only when the caller opts in.
export const expandQuery = async (query) => {
  try {
    const raw = await withTimeout(
      callLLM({
        system: EXPANSION_SYSTEM,
        messages: [{ role: 'user', content: `Query: ${query}\n\nGenerate the variants JSON now.` }],
        maxTokens: 200
      }),
      EXPANSION_TIMEOUT_MS
    );
    const parsed = JSON.parse(raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, ''));
    return Array.isArray(parsed.variants) ? parsed.variants.filter(Boolean) : [];
  } catch (err) {
    console.error('Query expansion failed, using original query only:', err.message);
    return [];
  }
};
