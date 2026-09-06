// Ground truth here is binary relevance by section (a chunk is relevant if its section is
// in expectedSections) — so nDCG below uses binary gains rather than graded relevance.
// That's a legitimate simplification for this dataset, not a shortcut around a harder
// metric we don't understand: without graded relevance judgments, binary-gain nDCG is the
// correct form of the metric to use.

const sectionsOf = (retrieved) => retrieved.map((c) => c.section || c.metadata?.heading || c.metadata?.section || '');

export const recallAtK = (retrievedCandidates, expectedSections, k) => {
  if (expectedSections.length === 0) return null; // not meaningful for "not covered" questions
  const topK = sectionsOf(retrievedCandidates).slice(0, k);
  return expectedSections.some((s) => topK.includes(s)) ? 1 : 0;
};

export const reciprocalRank = (retrievedCandidates, expectedSections) => {
  if (expectedSections.length === 0) return null;
  const sections = sectionsOf(retrievedCandidates);
  const rank = sections.findIndex((s) => expectedSections.includes(s));
  return rank === -1 ? 0 : 1 / (rank + 1);
};

export const ndcgAtK = (retrievedCandidates, expectedSections, k) => {
  if (expectedSections.length === 0) return null;
  const sections = sectionsOf(retrievedCandidates).slice(0, k);

  const dcg = sections.reduce((sum, s, i) => sum + (expectedSections.includes(s) ? 1 / Math.log2(i + 2) : 0), 0);
  const idealHits = Math.min(expectedSections.length, k);
  const idcg = Array.from({ length: idealHits }, (_, i) => 1 / Math.log2(i + 2)).reduce((a, b) => a + b, 0);

  return idcg === 0 ? 0 : dcg / idcg;
};

// Averages a metric across dataset results, ignoring entries where it's not meaningful
// (null — e.g. Recall@K for a "not covered" question that has no expected section).
export const average = (values) => {
  const usable = values.filter((v) => v !== null && v !== undefined);
  if (usable.length === 0) return null;
  return usable.reduce((a, b) => a + b, 0) / usable.length;
};
