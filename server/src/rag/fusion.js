// Reciprocal Rank Fusion: combines multiple ranked candidate lists (e.g. dense + BM25)
// into one ranking, using each item's RANK in each list rather than raw scores — this is
// what makes it robust to dense/sparse scores living on totally different scales.
// score(id) = sum over lists containing id of 1 / (k + rank_in_that_list)
export const reciprocalRankFusion = (rankedLists, { k = 60, topK = 15 } = {}) => {
  const scores = new Map();
  const items = new Map();

  for (const list of rankedLists) {
    list.forEach((item, rank) => {
      const id = item.id;
      scores.set(id, (scores.get(id) || 0) + 1 / (k + rank + 1));
      if (!items.has(id)) items.set(id, item);
    });
  }

  return [...scores.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, topK)
    .map(([id, score]) => ({ ...items.get(id), fusedScore: score }));
};

const cosineSimilarity = (a, b) => {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
};

// Maximal Marginal Relevance: greedily picks candidates that are both relevant to the
// query AND dissimilar to what's already been picked, so the final context isn't five
// near-duplicate chunks all saying the same thing. Requires embeddings on candidates —
// falls back to relevance-only ordering (skips diversification) if any are missing.
export const mmrSelect = (candidates, { lambda = 0.7, topK = 6 } = {}) => {
  if (candidates.length === 0) return [];
  if (candidates.some((c) => !c.embedding)) return candidates.slice(0, topK);

  const maxRelevance = Math.max(...candidates.map((c) => c.relevanceScore), 1e-9);
  const remaining = [...candidates];
  const selected = [];

  while (remaining.length > 0 && selected.length < topK) {
    let bestIdx = 0;
    let bestScore = -Infinity;

    remaining.forEach((cand, i) => {
      const relevance = cand.relevanceScore / maxRelevance;
      const maxSimToSelected = selected.length === 0
        ? 0
        : Math.max(...selected.map((s) => cosineSimilarity(cand.embedding, s.embedding)));
      const mmrScore = lambda * relevance - (1 - lambda) * maxSimToSelected;
      if (mmrScore > bestScore) { bestScore = mmrScore; bestIdx = i; }
    });

    selected.push(remaining[bestIdx]);
    remaining.splice(bestIdx, 1);
  }
  return selected;
};
