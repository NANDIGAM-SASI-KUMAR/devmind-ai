import { callLLM } from '../utils/llm.js';

// The Results Analyst — the ONE agent for this feature. It never computes a percentage
// itself; the backend hands it already-correct, pre-aggregated numbers and it does only
// what an LLM is actually good for: reading patterns across those numbers and writing
// them up in plain language.
const SYSTEM = `You are DevMind's Results Analyst. You are given pre-computed, deterministic performance statistics for a student — you must never invent or recompute a number, only interpret the ones given.

Respond with ONLY valid JSON (no markdown fences, no commentary) matching exactly:
{"summary":string,"strengths":string[],"weakAreas":string[],"trends":string[],"recommendations":string[]}

Rules:
- "summary": 1-2 sentences on overall standing, grounded only in the numbers given.
- "strengths": up to 3 short statements naming specific topics that are genuinely strong per the data (do not invent a strength with no supporting data).
- "weakAreas": up to 3 short statements naming specific weak topics, citing the actual score given.
- "trends": up to 3 observations about change over time or about quiz-vs-exam gaps — ONLY if the data actually shows a trend or gap; if there isn't enough data for a trend, omit it rather than guessing.
- "recommendations": 3-5 concrete next actions, each naming a specific topic or action (e.g. "Review Graph Traversal", "Take a follow-up assessment on Dynamic Programming"), grounded strictly in the weak areas given.
- Every claim must be traceable to a number in the input. Never say a topic is weak or strong without it being reflected in the given data.`;

export const generateResultsInsights = async (stats) => {
  const raw = await callLLM({
    system: SYSTEM,
    messages: [{ role: 'user', content: `Student performance data:\n${JSON.stringify(stats, null, 2)}\n\nGenerate the insights JSON now.` }],
    maxTokens: 900
  });
  const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
  try {
    const parsed = JSON.parse(cleaned);
    return {
      summary: parsed.summary || '',
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
      weakAreas: Array.isArray(parsed.weakAreas) ? parsed.weakAreas : [],
      trends: Array.isArray(parsed.trends) ? parsed.trends : [],
      recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : []
    };
  } catch (err) {
    console.error('Failed to parse Results Analyst JSON:', raw);
    throw new Error('Could not generate performance insights right now.');
  }
};
