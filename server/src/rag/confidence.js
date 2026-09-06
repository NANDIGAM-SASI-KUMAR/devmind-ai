// Retrieval-stage confidence, computed BEFORE generation — used to decide whether there's
// enough evidence to even attempt an answer. Combines three signals, each with a stated
// reason for its weight (none of this is an arbitrary single number):
//   - topScore (0.55): the single best candidate's normalized rerank relevance — the most
//     direct "do we actually have something relevant" signal.
//   - strongCountFactor (0.25): how many candidates clear a "strongly relevant" bar
//     (normalized score >= 0.5), saturating at 3 — guards against resting an answer on one
//     borderline chunk that happened to rerank highest by a small margin.
//   - agreementFactor (0.20): whether dense (semantic) and BM25 (lexical) retrieval,
//     which use fundamentally different signals, agree on any of the same chunks —
//     corroboration across independent methods is evidence the match is real, not an
//     artifact of one retrieval strategy. Disagreement isn't disqualifying (the two methods
//     are supposed to sometimes catch different things), just weighted lower.
export const computeRetrievalConfidence = (candidates, { denseIds = [], bm25Ids = [] } = {}) => {
  if (candidates.length === 0) return 0;

  const scores = candidates.map((c) => c.rerankScoreNormalized ?? c.relevanceScore ?? 0);
  const topScore = Math.max(...scores);
  const strongCount = scores.filter((s) => s >= 0.5).length;
  const strongCountFactor = Math.min(strongCount / 3, 1);

  let agreementFactor = 0.5; // neutral when we weren't given both lists to compare
  if (denseIds.length > 0 && bm25Ids.length > 0) {
    const denseSet = new Set(denseIds);
    const overlap = bm25Ids.filter((id) => denseSet.has(id)).length;
    agreementFactor = overlap > 0 ? Math.min(overlap / 3, 1) : 0.3;
  }

  const rawConfidence = topScore * 0.55 + strongCountFactor * 0.25 + agreementFactor * 0.2;

  // Absolute-scale sanity cap: rerankScoreNormalized is min-max normalized WITHIN this
  // batch, so an entirely off-topic batch can still show a "1.0" top score relative to
  // itself (measured directly — a quantum-computing question against a databases/caching
  // document scored a full 1.0 post-normalization despite zero real relevance, which
  // would have skipped the fast-fail path and always run generation unnecessarily). Dense
  // cosine similarity is NOT batch-relative — it has real absolute meaning — so it caps
  // confidence when even the best raw match isn't genuinely close. 0.5 is treated as
  // "clearly relevant" for this app's embedding model; below that, confidence scales down
  // proportionally rather than being capped off sharply, so this can be recalibrated
  // against the evaluation harness's labeled data if 0.5 proves too strict or too loose.
  const topDenseScore = Math.max(0, ...candidates.map((c) => c.denseScore ?? 0));
  const absoluteRelevanceCap = Math.min(1, topDenseScore / 0.5);

  return rawConfidence * absoluteRelevanceCap;
};

// Final confidence, computed AFTER generation + validation.
//   - groundednessConfidence (0.5): the validator's own confidence that the answer is
//     supported — weighted highest since it's the most direct anti-hallucination check,
//     evaluated against the actual generated text rather than just the retrieved evidence.
//   - retrievalConfidence (0.3): carries forward whether we had good evidence to begin with.
//   - citationSupportRatio (0.2): fraction of returned citations that actually back at
//     least one claim in the answer — penalizes citing sources that were retrieved but not
//     actually used, which the citation-validation step (rag/validator.js) computes.
export const computeFinalConfidence = (retrievalConfidence, { groundednessConfidence, citationSupportRatio }) =>
  retrievalConfidence * 0.3 + groundednessConfidence * 0.5 + citationSupportRatio * 0.2;
