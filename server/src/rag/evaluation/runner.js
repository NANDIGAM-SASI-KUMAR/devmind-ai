import { runRagPipeline } from '../pipeline.js';
import { EVAL_DATASET } from './dataset.js';
import { recallAtK, reciprocalRank, ndcgAtK, average } from './retrievalMetrics.js';
import { refusalCorrectness, citationAccuracy, answerRelevance } from './generationMetrics.js';

const percentile = (values, p) => {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[Math.max(0, idx)];
};

// Runs the full labeled dataset through the real pipeline (not a mock) in the given mode,
// using debug:true to get both the final answer AND the retrieved candidates from one
// pipeline run — no separate retrieval-only pass needed. `generate(question, context)` is
// supplied by the caller so this stays reusable across different generation agents.
export const runEvaluation = async ({ collectionName, generate, mode = 'advanced', dataset = EVAL_DATASET }) => {
  const perQuestion = [];

  for (const item of dataset) {
    const t0 = Date.now();
    let result;
    try {
      result = await runRagPipeline({
        collectionName,
        query: item.question,
        generate: (context) => generate(item.question, context),
        mode,
        debug: true
      });
    } catch (err) {
      result = { answer: '', citations: [], grounded: false, insufficientEvidence: true, debug: { candidates: [] } };
      console.error(`Eval question ${item.id} failed:`, err.message);
    }
    const latencyMs = Date.now() - t0;
    const candidates = result.debug?.candidates || [];

    perQuestion.push({
      id: item.id,
      category: item.category,
      latencyMs,
      recallAt1: recallAtK(candidates, item.expectedSections, 1),
      recallAt5: recallAtK(candidates, item.expectedSections, 5),
      recallAt10: recallAtK(candidates, item.expectedSections, 10),
      mrr: reciprocalRank(candidates, item.expectedSections),
      ndcgAt10: ndcgAtK(candidates, item.expectedSections, 10),
      refusalCorrectness: refusalCorrectness(result, item.expectAnswerable),
      citationAccuracy: citationAccuracy(result, item.expectedSections),
      answerRelevance: answerRelevance(result, item.expectedKeywords, item.expectAnswerable),
      timings: result.debug?.trace || {}
    });
  }

  const latencies = perQuestion.map((q) => q.latencyMs);
  return {
    mode,
    perQuestion,
    aggregate: {
      recallAt1: average(perQuestion.map((q) => q.recallAt1)),
      recallAt5: average(perQuestion.map((q) => q.recallAt5)),
      recallAt10: average(perQuestion.map((q) => q.recallAt10)),
      mrr: average(perQuestion.map((q) => q.mrr)),
      ndcgAt10: average(perQuestion.map((q) => q.ndcgAt10)),
      refusalCorrectness: average(perQuestion.map((q) => q.refusalCorrectness)),
      citationAccuracy: average(perQuestion.map((q) => q.citationAccuracy)),
      answerRelevance: average(perQuestion.map((q) => q.answerRelevance)),
      avgLatencyMs: Math.round(average(latencies)),
      p50LatencyMs: percentile(latencies, 50),
      p95LatencyMs: percentile(latencies, 95)
    }
  };
};
