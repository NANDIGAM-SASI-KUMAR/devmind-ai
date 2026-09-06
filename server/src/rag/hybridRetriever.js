import { queryDenseWithEmbeddings, getAllChunksIn } from '../utils/chroma.js';
import { buildBM25Index, bm25Search } from './bm25.js';
import { reciprocalRankFusion, mmrSelect } from './fusion.js';
import { rerank } from './rerankerService.js';
import { expandQuery } from './queryExpansion.js';
import { analyzeQuery } from './queryAnalyzer.js';
import { computeRetrievalConfidence } from './confidence.js';
import { RAG_CONFIG } from './config.js';

const denseSearch = async (collectionName, query, topK) => {
  const results = await queryDenseWithEmbeddings(collectionName, query, topK);
  // Chroma's default distance is cosine distance, so similarity = 1 - distance.
  return results.map((r) => ({
    id: r.id,
    text: r.text,
    metadata: r.metadata,
    embedding: r.embedding,
    denseScore: r.distance != null ? 1 - r.distance : 0
  }));
};

const bm25SearchCollection = async (collectionName, query, topK) => {
  const allDocs = await getAllChunksIn(collectionName);
  if (allDocs.length === 0) return [];
  const index = buildBM25Index(allDocs.map((d) => ({ id: d.id, text: d.text })));
  const hits = bm25Search(index, query, topK);
  const byId = new Map(allDocs.map((d) => [d.id, d]));
  return hits.map((h) => ({ id: h.id, text: byId.get(h.id).text, metadata: byId.get(h.id).metadata, bm25Score: h.score }));
};

// The full pipeline: Query [+ QueryAnalyzer-gated expansion] -> Dense + BM25 -> RRF ->
// RerankerService -> MMR. Every stage after the base dense search is individually
// toggleable via rag/config.js, so this degrades gracefully to plain dense-only retrieval
// if everything else is off. Each candidate keeps its scores from every stage it passed
// through (denseScore, bm25Score, rrfScore, rerankScore/rerankScoreNormalized) rather than
// overwriting one generic "relevanceScore" — they're on different, incomparable scales and
// collapsing them early would hide that from anything inspecting the pipeline later
// (confidence calculation, debug mode, evaluation harness).
export const hybridRetrieve = async (collectionName, query, overrides = {}) => {
  const cfg = { ...RAG_CONFIG, ...overrides };
  const timings = {};
  const trace = {};

  const analysis = analyzeQuery(query);
  trace.queryType = analysis.type;
  trace.queryExpansionUsed = false;

  let queries = [query];
  if (cfg.queryExpansionEnabled && analysis.shouldExpand) {
    const t0 = Date.now();
    const variants = await expandQuery(query);
    if (variants.length > 0) {
      queries = [query, ...variants];
      trace.queryExpansionUsed = true;
    }
    timings.queryExpansionMs = Date.now() - t0;
  }

  const t1 = Date.now();
  const [denseLists, bm25Lists] = await Promise.all([
    Promise.all(queries.map((q) => denseSearch(collectionName, q, cfg.denseTopK))),
    cfg.bm25Enabled ? Promise.all(queries.map((q) => bm25SearchCollection(collectionName, q, cfg.bm25TopK))) : []
  ]);
  timings.retrievalMs = Date.now() - t1;

  const denseCandidates = denseLists.flat();
  const bm25Candidates = bm25Lists.flat();
  const denseIds = [...new Set(denseCandidates.map((c) => c.id))];
  const bm25Ids = [...new Set(bm25Candidates.map((c) => c.id))];
  trace.denseCandidateCount = denseIds.length;
  trace.bm25CandidateCount = bm25Ids.length;

  if (denseCandidates.length === 0 && bm25Candidates.length === 0) {
    return { candidates: [], timings, trace, confidence: 0 };
  }

  // Merge per-id so a candidate appearing in both dense and BM25 keeps both scores.
  const byId = new Map();
  for (const c of [...denseCandidates, ...bm25Candidates]) {
    const existing = byId.get(c.id) || { id: c.id, text: c.text, metadata: c.metadata, embedding: c.embedding };
    byId.set(c.id, { ...existing, ...c, embedding: existing.embedding || c.embedding });
  }

  const t2 = Date.now();
  const denseRanked = denseLists.map((list) => list.map((c) => byId.get(c.id)));
  const bm25Ranked = bm25Lists.map((list) => list.map((c) => byId.get(c.id)));
  const fused = reciprocalRankFusion([...denseRanked, ...bm25Ranked], { k: cfg.rrfK, topK: cfg.fusionTopK })
    .map((c) => ({ ...c, rrfScore: c.fusedScore }));
  timings.fusionMs = Date.now() - t2;
  trace.fusionCandidateCount = fused.length;

  let candidates = fused;
  let providerUsed = 'none';
  if (cfg.rerankerEnabled) {
    const t3 = Date.now();
    const wantForMmr = cfg.mmrEnabled ? cfg.rerankTopK * 2 : cfg.rerankTopK;
    const { results, providerUsed: usedProvider } = await rerank(query, fused, { topK: wantForMmr });
    candidates = results;
    providerUsed = usedProvider;
    timings.rerankingMs = Date.now() - t3;
  } else {
    candidates = fused.slice(0, cfg.mmrEnabled ? cfg.rerankTopK * 2 : cfg.rerankTopK);
  }
  trace.rerankedCandidateCount = candidates.length;
  trace.rerankerProviderUsed = providerUsed;

  // Relevance used by MMR and confidence: rerank score when available (most trustworthy),
  // else raw dense cosine similarity (has real absolute meaning), else RRF score as a last
  // resort. RRF's fused score is deliberately NOT preferred here even when available: with
  // rrfK=60, RRF scores compress to a narrow band around 1/60-1/66 regardless of how
  // relevant a candidate actually is (its whole purpose is combining RANKS, not preserving
  // similarity magnitude) — measured directly: using it as the relevance/confidence signal
  // when reranking is disabled made the confidence gate fail almost every query regardless
  // of true retrieval quality, even when the correct chunk was ranked first.
  const withRelevance = candidates.map((c) => ({
    ...c,
    relevanceScore: c.rerankScoreNormalized ?? c.denseScore ?? c.rrfScore ?? 0
  }));

  let finalCandidates = withRelevance;
  if (cfg.mmrEnabled) {
    const t4 = Date.now();
    finalCandidates = mmrSelect(withRelevance, { lambda: cfg.mmrLambda, topK: cfg.rerankTopK });
    timings.mmrMs = Date.now() - t4;
  } else {
    finalCandidates = withRelevance.slice(0, cfg.rerankTopK);
  }
  trace.finalContextCount = finalCandidates.length;

  const confidence = computeRetrievalConfidence(finalCandidates, { denseIds, bm25Ids });

  return { candidates: finalCandidates, timings, trace, confidence };
};
