import { localRerank } from './localReranker.js';
import { rerankCandidates as llmRerank } from './reranker.js';
import { RAG_CONFIG } from './config.js';

// Min-max normalizes raw reranker scores to [0,1] WITHIN this batch. This is deliberately
// relative, not absolute: the local cross-encoder's raw logits and the LLM reranker's 0-10
// scores live on completely different, uncalibrated scales, and neither is a real
// probability. Normalizing within the batch gives a comparable, meaningful "how much
// better is this candidate than the others we retrieved" signal without pretending either
// raw scale means something on its own.
// Regression note: with a single candidate (a genuinely common case — a study plan with
// one short document), min === max === the only score, so (score - min) / range is always
// 0 regardless of whether that one candidate is actually a great match or a terrible one —
// caught by testing against a real single-chunk document, where this silently zeroed out
// retrieval confidence for a correct, well-matched answer. Batch-relative normalization
// simply has nothing to normalize AGAINST with only one item, so it's skipped in that case:
// a lone candidate is treated as the best available (1.0), and the confidence formula's
// absolute dense-similarity cap (rag/confidence.js) — not this batch-relative score — is
// what actually decides whether it's good enough to answer from.
const normalizeScores = (scored) => {
  if (scored.length === 0) return scored;
  if (scored.length === 1) return [{ ...scored[0], rerankScoreNormalized: 1 }];
  const values = scored.map((c) => c.rerankScore);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  return scored.map((c) => ({ ...c, rerankScoreNormalized: (c.rerankScore - min) / range }));
};

// RerankerService: one interface, two providers, selected via RERANKER_PROVIDER.
//   - "local" (default): a real cross-encoder run in-process via ONNX — no external call,
//     ~5-10ms per candidate. Preferred since it needs no paid API and is dramatically
//     faster than the LLM alternative — but it loads a ~90MB model into memory, which is a
//     real constraint on a memory-limited host (e.g. Render's free tier).
//   - "llm": the original single-batched-call LLM reranker from Phase 1. No extra memory
//     footprint beyond the LLM calls the app already makes everywhere else.
// Fallback is intentionally ONE-DIRECTIONAL: local -> llm on failure (safe — llm has no
// extra resource cost), but llm -> local is NOT attempted. If an operator has explicitly
// chosen "llm" (e.g. to avoid the local model's memory footprint on a constrained host), a
// transient LLM API hiccup should degrade to "skip reranking, use fusion order" — not
// silently load a ~90MB model into memory anyway, which would defeat the entire reason
// "llm" was chosen and risk an OOM crash triggered by an unrelated API blip.
export const rerank = async (query, candidates, { topK, provider } = {}) => {
  const chosen = provider || RAG_CONFIG.rerankerProvider;
  const effectiveTopK = topK ?? RAG_CONFIG.rerankTopK;

  const runProvider = (p) => (p === 'local' ? localRerank(query, candidates, { topK: effectiveTopK }) : llmRerank(query, candidates, { topK: effectiveTopK }));
  const fallback = chosen === 'local' ? 'llm' : null;

  try {
    const scored = await runProvider(chosen);
    return { results: normalizeScores(scored), providerUsed: chosen };
  } catch (err) {
    if (!fallback) {
      console.error(`[rag] Reranker provider "${chosen}" failed (${err.message}), skipping reranking entirely (no safe fallback configured)`);
      return { results: candidates.slice(0, effectiveTopK), providerUsed: 'none' };
    }
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
