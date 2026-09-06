import { queryDenseWithEmbeddings, getAllChunksIn } from '../utils/chroma.js';
import { buildBM25Index, bm25Search } from './bm25.js';
import { reciprocalRankFusion, mmrSelect } from './fusion.js';
import { rerankCandidates } from './reranker.js';
import { expandQuery } from './queryExpansion.js';
import { RAG_CONFIG } from './config.js';

const denseSearch = async (collectionName, query, topK) => {
  const results = await queryDenseWithEmbeddings(collectionName, query, topK);
  // Chroma's default distance is cosine distance, so similarity = 1 - distance.
  return results.map((r) => ({
    id: r.id,
    text: r.text,
    metadata: r.metadata,
    embedding: r.embedding,
    relevanceScore: r.distance != null ? 1 - r.distance : 0
  }));
};

const bm25SearchCollection = async (collectionName, query, topK) => {
  const allDocs = await getAllChunksIn(collectionName);
  if (allDocs.length === 0) return [];
  const index = buildBM25Index(allDocs.map((d) => ({ id: d.id, text: d.text })));
  const hits = bm25Search(index, query, topK);
  const byId = new Map(allDocs.map((d) => [d.id, d]));
  return hits.map((h) => ({ id: h.id, text: byId.get(h.id).text, metadata: byId.get(h.id).metadata, relevanceScore: h.score }));
};

// The full pipeline: Query [+ expansion] -> Dense + BM25 -> RRF -> Reranker -> MMR.
// Every stage after the base dense search is individually toggleable via rag/config.js,
// so this degrades gracefully to plain dense-only retrieval if everything else is off.
export const hybridRetrieve = async (collectionName, query, overrides = {}) => {
  const cfg = { ...RAG_CONFIG, ...overrides };
  const timings = {};

  let queries = [query];
  if (cfg.queryExpansionEnabled) {
    const t0 = Date.now();
    queries = [query, ...(await expandQuery(query))];
    timings.queryExpansionMs = Date.now() - t0;
  }

  const t1 = Date.now();
  const [denseLists, bm25Lists] = await Promise.all([
    Promise.all(queries.map((q) => denseSearch(collectionName, q, cfg.denseTopK))),
    cfg.bm25Enabled ? Promise.all(queries.map((q) => bm25SearchCollection(collectionName, q, cfg.bm25TopK))) : []
  ]);
  timings.retrievalMs = Date.now() - t1;

  const allLists = [...denseLists, ...bm25Lists];
  if (allLists.every((l) => l.length === 0)) return { candidates: [], timings, topScore: 0 };

  const t2 = Date.now();
  const fused = reciprocalRankFusion(allLists, { k: cfg.rrfK, topK: cfg.fusionTopK })
    .map((c) => ({ ...c, relevanceScore: c.relevanceScore ?? c.fusedScore }));
  timings.fusionMs = Date.now() - t2;

  let candidates = fused;
  if (cfg.rerankerEnabled) {
    const t3 = Date.now();
    const wantForMmr = cfg.mmrEnabled ? cfg.rerankTopK * 2 : cfg.rerankTopK;
    candidates = (await rerankCandidates(query, fused, { topK: wantForMmr })).map((c) => ({ ...c, relevanceScore: c.rerankScore / 10 }));
    timings.rerankMs = Date.now() - t3;
  }

  if (cfg.mmrEnabled) {
    const t4 = Date.now();
    candidates = mmrSelect(candidates, { lambda: cfg.mmrLambda, topK: cfg.rerankTopK });
    timings.mmrMs = Date.now() - t4;
  } else {
    candidates = candidates.slice(0, cfg.rerankTopK);
  }

  const topScore = Math.max(0, ...candidates.map((c) => c.relevanceScore ?? 0));
  return { candidates, timings, topScore };
};
