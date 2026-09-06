import { localRerank } from './localReranker.js';
import { rerankCandidates as llmRerank } from './reranker.js';
import { RAG_CONFIG } from './config.js';

// Min-max normalizes raw reranker scores to [0,1] WITHIN this batch. This is deliberately
// relative, not absolute: the local cross-encoder's raw logits and the LLM reranker's 0-10
// scores live on completely different, uncalibrated scales, and neither is a real
// probability. Normalizing within the batch gives a comparable, meaningful "how much
// better is this candidate than the others we retrieved" signal without pretending either
// raw scale means something on its own.
const normalizeScores = (scored) => {
  if (scored.length === 0) return scored;
  const values = scored.map((c) => c.rerankScore);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  return scored.map((c) => ({ ...c, rerankScoreNormalized: (c.rerankScore - min) / range }));
};

// RerankerService: one interface, two providers, selected via RERANKER_PROVIDER.
//   - "local" (default): a real cross-encoder run in-process via ONNX — no external call,
//     ~5-10ms per candidate. Preferred since it needs no paid API and is dramatically
//     faster than the LLM alternative.
//   - "llm": the original single-batched-call LLM reranker from Phase 1, kept available
//     as a fallback and for environments where local ONNX inference isn't practical.
// If the configured provider fails outright (e.g. local model couldn't load — no network
// on first run, disk issue, etc.), this falls back to the other provider rather than
// letting a reranker failure take down the whole request.
export const rerank = async (query, candidates, { topK, provider } = {}) => {
  const chosen = provider || RAG_CONFIG.rerankerProvider;
  const effectiveTopK = topK ?? RAG_CONFIG.rerankTopK;

  const runProvider = (p) => (p === 'local' ? localRerank(query, candidates, { topK: effectiveTopK }) : llmRerank(query, candidates, { topK: effectiveTopK }));

  try {
    const scored = await runProvider(chosen);
    return { results: normalizeScores(scored), providerUsed: chosen };
  } catch (err) {
    const fallback = chosen === 'local' ? 'llm' : 'local';
    console.error(`[rag] Reranker provider "${chosen}" failed (${err.message}), falling back to "${fallback}"`);
    try {
      const scored = await runProvider(fallback);
      return { results: normalizeScores(scored), providerUsed: fallback };
    } catch (fallbackErr) {
      console.error(`[rag] Fallback reranker "${fallback}" also failed (${fallbackErr.message}), skipping reranking entirely`);
      return { results: candidates.slice(0, effectiveTopK), providerUsed: 'none' };
    }
  }
};
