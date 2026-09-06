import { callLLM } from '../utils/llm.js';
import { withTimeout } from './withTimeout.js';

// Measured directly while building this: the Sarvam API's response time for the
// validation prompt is highly variable — usually 2-4s, occasionally 20-27s for no clear
// reason tied to answer length. Left unbounded, one slow call can make a single question
// take 30+ seconds end to end. Bounding it means a slow validator degrades to "treat as
// failed, fall back" instead of degrading total request latency unpredictably.
const VALIDATION_TIMEOUT_MS = 8000;

// Claim-level validation, not just an overall verdict: extracts each factual claim from
// the answer and checks it against the evidence individually, in ONE LLM call (not one
// call per claim — that would multiply latency and cost for no real benefit at this
// answer length). A claim being unsupported doesn't require the whole answer to be
// discarded; the caller can strip just that claim, or fall back if too much is unsupported.
const VALIDATOR_SYSTEM = `You are a strict fact-checker for a RAG system. You are given the evidence a model was allowed to use, and the answer it produced. Break the answer into its individual factual claims and check each one against the evidence.

Respond with ONLY valid JSON (no markdown fences, no commentary) matching exactly:
{"claims":[{"claim":string,"supported":boolean,"supportingSource":string}]}

Rules:
- Split the answer into its distinct factual claims — a claim is one verifiable statement, not the whole answer.
- "supported" is true only if the evidence directly states or clearly implies this specific claim — not "plausible", not "probably true elsewhere".
- "supportingSource" is the exact "Source: ..." label from the evidence that supports this claim (empty string if unsupported).
- A sentence that honestly states the evidence is insufficient, or that hedges appropriately, is itself a supported "claim" (refusing to answer beyond the evidence is never unsupported).
- If the answer has no factual claims at all (e.g. it's a refusal), return a single claim describing that with supported:true.`;

export const validateAnswer = async ({ answer, evidence }) => {
  try {
    const raw = await withTimeout(
      callLLM({
        system: VALIDATOR_SYSTEM,
        messages: [{ role: 'user', content: `Evidence:\n${evidence}\n\nAnswer to check:\n${answer}\n\nValidate now.` }],
        maxTokens: 700
      }),
      VALIDATION_TIMEOUT_MS
    );
    const parsed = JSON.parse(raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, ''));
    const claims = Array.isArray(parsed.claims) ? parsed.claims : [];

    const unsupportedClaims = claims.filter((c) => !c.supported).map((c) => c.claim);
    const supportedCount = claims.length - unsupportedClaims.length;
    // Groundedness confidence: the fraction of claims that are supported. An answer with
    // zero claims (shouldn't happen given the "refusal is a claim" rule, but defensively)
    // is treated as fully grounded rather than divide-by-zero.
    const confidence = claims.length === 0 ? 1 : supportedCount / claims.length;
    const supportingSources = [...new Set(claims.filter((c) => c.supported && c.supportingSource).map((c) => c.supportingSource))];

    return {
      grounded: unsupportedClaims.length === 0,
      confidence,
      unsupportedClaims,
      claims,
      supportingSources,
      timedOut: false
    };
  } catch (err) {
    console.error('Answer validation call failed:', err.message);
    // Fail toward caution, not blind trust: a mid confidence sits below the default
    // groundedness threshold, so a broken validator triggers a fallback rather than
    // silently waving every answer through unchecked. `timedOut` lets the caller
    // distinguish this from a genuine "unsupported claims found" verdict — regenerating
    // the answer doesn't fix a slow validator API, it just spends another full
    // generation+validation round-trip on what was likely already a fine answer.
    return {
      grounded: false,
      confidence: 0.5,
      unsupportedClaims: [],
      claims: [],
      supportingSources: [],
      timedOut: err.message.includes('timed out')
    };
  }
};

// Citation validation: a citation should only be shown if it actually backs a claim in the
// final answer, not merely because that source was retrieved. Matches on SECTION, not
// filename — a study plan with one document has every citation sharing the same source
// filename, so matching on filename alone is trivially true for every citation and filters
// nothing (measured directly while building this). Section is the actual discriminating
// signal; falls back to filename only when a citation has no section to match on.
export const filterSupportedCitations = (citations, supportingSources) => {
  if (supportingSources.length === 0) return citations; // validator found nothing to map (e.g. call failed) — don't silently drop everything
  return citations.filter((c) => {
    const label = c.section || c.source;
    return label && supportingSources.some((s) => s.includes(label));
  });
};
