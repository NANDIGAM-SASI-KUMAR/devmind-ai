// Every tunable for the retrieval pipeline lives here, read once from env with safe
// defaults — nothing below is hard-coded elsewhere in the pipeline.
const bool = (val, fallback) => (val === undefined ? fallback : val === 'true');
const num = (val, fallback) => (val === undefined ? fallback : Number(val));

export const RAG_CONFIG = {
  bm25Enabled: bool(process.env.BM25_ENABLED, true),
  rerankerEnabled: bool(process.env.RERANKER_ENABLED, true),
  // "local": real cross-encoder via ONNX, in-process, ~5-10ms/candidate, no external call.
  // "llm": one batched Sarvam call, ~2.3-2.7s total — kept as a configurable fallback.
  rerankerProvider: process.env.RERANKER_PROVIDER === 'llm' ? 'llm' : 'local',
  mmrEnabled: bool(process.env.MMR_ENABLED, true),
  queryExpansionEnabled: bool(process.env.QUERY_EXPANSION_ENABLED, true), // now gated by QueryAnalyzer, not always-on — see queryAnalyzer.js

  denseTopK: num(process.env.DENSE_TOP_K, 20),
  bm25TopK: num(process.env.BM25_TOP_K, 20),
  fusionTopK: num(process.env.FUSION_TOP_K, 15),
  rerankTopK: num(process.env.RERANK_TOP_K, 6),
  mmrLambda: num(process.env.MMR_LAMBDA, 0.7), // higher = favor relevance; lower = favor diversity

  // Retrieval confidence gate: below this top (normalized) rerank score, there's nothing
  // worth generating from — chosen as "clearly below the midpoint of the normalized 0-1
  // rerank range," i.e. even the best candidate is closer to the worst-in-batch than to a
  // strong match. See rag/confidence.js for the full documented confidence formula.
  minRetrievalScore: num(process.env.MIN_RETRIEVAL_SCORE, 0.15),
  // Groundedness gate: an answer needs high validator confidence to ship as-is. 0.6 was
  // chosen as "more likely grounded than not, with margin" — see rag/confidence.js.
  minGroundednessScore: num(process.env.MIN_GROUNDEDNESS_SCORE, 0.6),
  // Minimum number of candidates with normalized rerank score above 0.5 for an answer to
  // be considered "well supported" rather than resting on a single borderline chunk.
  minSupportingEvidence: num(process.env.MIN_SUPPORTING_EVIDENCE, 1),

  maxContextChars: num(process.env.RAG_MAX_CONTEXT_CHARS, 9000),
  rrfK: 60 // standard Reciprocal Rank Fusion constant
};
