// Every tunable for the retrieval pipeline lives here, read once from env with safe
// defaults — nothing below is hard-coded elsewhere in the pipeline.
const bool = (val, fallback) => (val === undefined ? fallback : val === 'true');
const num = (val, fallback) => (val === undefined ? fallback : Number(val));

export const RAG_CONFIG = {
  bm25Enabled: bool(process.env.BM25_ENABLED, true),
  rerankerEnabled: bool(process.env.RERANKER_ENABLED, true),
  mmrEnabled: bool(process.env.MMR_ENABLED, true),
  queryExpansionEnabled: bool(process.env.QUERY_EXPANSION_ENABLED, false), // off by default — extra LLM call + latency per query

  denseTopK: num(process.env.DENSE_TOP_K, 20),
  bm25TopK: num(process.env.BM25_TOP_K, 20),
  fusionTopK: num(process.env.FUSION_TOP_K, 15),
  rerankTopK: num(process.env.RERANK_TOP_K, 6),
  mmrLambda: num(process.env.MMR_LAMBDA, 0.7), // higher = favor relevance; lower = favor diversity

  minRetrievalScore: num(process.env.MIN_RETRIEVAL_SCORE, 0.15), // below this, skip generation entirely
  minGroundednessScore: num(process.env.MIN_GROUNDEDNESS_SCORE, 0.6), // below this, regenerate once then fall back

  maxContextChars: num(process.env.RAG_MAX_CONTEXT_CHARS, 9000),
  rrfK: 60 // standard Reciprocal Rank Fusion constant
};
