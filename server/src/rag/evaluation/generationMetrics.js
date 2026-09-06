// Deterministic, dependency-free checks rather than an LLM-as-judge — the spec explicitly
// asks not to add a large dependency for a metric unless it provides meaningful value, and
// these are enough to catch the failure modes this dataset is designed to test: does the
// system refuse when it should, does it cite what it actually used, does the answer
// mention what the question was actually about.

// For "not covered" questions: did the system correctly refuse rather than answer
// confidently with invented content? This is the most important faithfulness check for a
// RAG system that's supposed to never hallucinate.
export const refusalCorrectness = (result, expectAnswerable) => {
  if (expectAnswerable) return null; // only meaningful for questions that should be refused
  const refused = result.insufficientEvidence === true || result.grounded === false;
  return refused ? 1 : 0;
};

// For answerable questions: does the returned citation set only include sources that were
// actually validated as supporting a claim (rag/validator.js's citation filtering)? A
// citation existing because a chunk was merely retrieved, not because it backs the answer,
// would show up here as a lower ratio.
export const citationAccuracy = (result, expectedSections) => {
  if (!expectedSections || expectedSections.length === 0) return null;
  if (result.citations.length === 0) return result.grounded ? 0 : null; // grounded answer with zero citations is a real miss; a refusal has none to check
  const relevant = result.citations.filter((c) => expectedSections.some((s) => c.section?.includes(s) || s.includes(c.section || '')));
  return relevant.length / result.citations.length;
};

// Crude but deterministic proxy for "did the answer actually address the topic": does the
// answer text contain at least one of the topic's expected keywords? Not a substitute for
// human judgment, but a real, reproducible signal that costs no extra LLM call.
export const answerRelevance = (result, expectedKeywords, expectAnswerable) => {
  if (!expectAnswerable || expectedKeywords.length === 0) return null;
  const lower = result.answer.toLowerCase();
  const hit = expectedKeywords.some((k) => lower.includes(k.toLowerCase()));
  return hit ? 1 : 0;
};
