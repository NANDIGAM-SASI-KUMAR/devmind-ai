import { callLLM } from '../utils/llm.js';

const VALIDATOR_SYSTEM = `You are a strict fact-checker for a RAG system. You are given the evidence a model was allowed to use, and the answer it produced. Check whether the answer is fully supported by that evidence.

Respond with ONLY valid JSON (no markdown fences, no commentary) matching exactly:
{"grounded":boolean,"confidence":number,"unsupportedClaims":string[]}

Rules:
- "grounded" is true only if every factual claim in the answer is directly supported by the evidence — not plausible, not "probably true", but actually stated or clearly implied by the evidence text.
- "confidence" is 0-1, your certainty in the grounded judgment itself.
- "unsupportedClaims" lists any specific claim in the answer that the evidence does not support (empty array if fully grounded).
- An answer that honestly says the evidence is insufficient is grounded — refusing to answer is never an unsupported claim.`;

export const validateAnswer = async ({ answer, evidence }) => {
  try {
    const raw = await callLLM({
      system: VALIDATOR_SYSTEM,
      messages: [{ role: 'user', content: `Evidence:\n${evidence}\n\nAnswer to check:\n${answer}\n\nValidate now.` }],
      maxTokens: 400
    });
    const parsed = JSON.parse(raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, ''));
    return {
      grounded: parsed.grounded === true,
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.5,
      unsupportedClaims: Array.isArray(parsed.unsupportedClaims) ? parsed.unsupportedClaims : []
    };
  } catch (err) {
    console.error('Answer validation call failed:', err.message);
    // Fail toward caution, not blind trust: a mid confidence sits below the default
    // groundedness threshold, so a broken validator triggers a retry/fallback rather than
    // silently waving every answer through unchecked.
    return { grounded: false, confidence: 0.5, unsupportedClaims: [] };
  }
};
