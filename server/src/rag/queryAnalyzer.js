// Decides whether a query is worth expanding — entirely deterministic, no LLM call, so
// classifying a query costs nothing even though acting on the "ambiguous"/"complex" result
// does (one extra LLM call to generate variants). A specific, well-formed question gets
// zero extra latency; only genuinely underspecified or multi-part queries pay for it.

const VAGUE_PRONOUN = /\b(it|this|that|they|these|those|its)\b/i;
const COMPARISON_WORDS = /\b(compare|comparison|versus|\bvs\.?\b|difference between|similarit(?:y|ies))\b/i;

export const analyzeQuery = (query) => {
  const trimmed = query.trim();
  const wordCount = trimmed.split(/\s+/).filter(Boolean).length;

  if (COMPARISON_WORDS.test(trimmed)) {
    return { type: 'complex', shouldExpand: true, reason: 'comparison query — likely benefits from targeted sub-queries per concept being compared' };
  }
  // A pronoun only makes a query ambiguous if it's short enough that the pronoun probably
  // has no clear antecedent within the query itself (e.g. "how does it work?" vs a longer,
  // already-specific sentence that happens to contain "this").
  if (VAGUE_PRONOUN.test(trimmed) && wordCount <= 8) {
    return { type: 'ambiguous', shouldExpand: true, reason: 'short query with an unresolved pronoun reference' };
  }
  if (wordCount <= 3) {
    return { type: 'ambiguous', shouldExpand: true, reason: 'very short query, likely underspecified' };
  }
  return { type: 'simple', shouldExpand: false, reason: 'specific enough that expansion is unlikely to change retrieval' };
};
