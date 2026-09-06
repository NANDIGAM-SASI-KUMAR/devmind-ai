import { callLLM } from '../utils/llm.js';

// There's no hosted cross-encoder (e.g. BGE reranker, Cohere Rerank) wired into this
// project's infrastructure, and adding one means either a paid API key the user hasn't
// provisioned or hosting a model locally. This is an honest substitute: a single LLM call
// scoring every candidate against the query in one batch (one call, not one per candidate),
// which captures the same "query + candidate together" cross-attention idea a real
// cross-encoder uses, just via the LLM instead of a dedicated reranking model.
const RERANK_SYSTEM = `You are a retrieval reranker. Given a search query and a numbered list of candidate text passages, score how relevant each passage is to answering the query.

Respond with ONLY valid JSON (no markdown fences, no commentary) matching exactly:
{"scores":[{"index":number,"score":number}]}

Rules:
- "score" is 0-10, where 10 means the passage directly and completely answers the query, 0 means it's irrelevant.
- Score every passage listed, even if in doubt.
- Judge relevance to the query only — do not judge writing quality or completeness of the source document.`;

export const rerankCandidates = async (query, candidates, { topK = 6 } = {}) => {
  if (candidates.length === 0) return [];

  const listText = candidates.map((c, i) => `[${i}] ${c.text.slice(0, 600)}`).join('\n\n');
  try {
    const raw = await callLLM({
      system: RERANK_SYSTEM,
      messages: [{ role: 'user', content: `Query: ${query}\n\nCandidates:\n\n${listText}\n\nScore each candidate now.` }],
      maxTokens: Math.max(400, candidates.length * 20)
    });
    const parsed = JSON.parse(raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, ''));
    const scoreByIndex = new Map(parsed.scores.map((s) => [s.index, s.score]));

    return candidates
      .map((c, i) => ({ ...c, rerankScore: scoreByIndex.get(i) ?? 0 }))
      .sort((a, b) => b.rerankScore - a.rerankScore)
      .slice(0, topK);
  } catch (err) {
    console.error('Reranking failed, falling back to fusion order:', err.message);
    return candidates.slice(0, topK);
  }
};
