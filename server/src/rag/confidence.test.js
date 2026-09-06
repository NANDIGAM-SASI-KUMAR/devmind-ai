import { describe, it, expect } from 'vitest';
import { computeRetrievalConfidence, computeFinalConfidence } from './confidence.js';

describe('computeRetrievalConfidence', () => {
  it('returns 0 for an empty candidate set', () => {
    expect(computeRetrievalConfidence([])).toBe(0);
  });

  it('gives high confidence for a strong, well-agreed match', () => {
    const candidates = [
      { rerankScoreNormalized: 0.95, denseScore: 0.8 },
      { rerankScoreNormalized: 0.6, denseScore: 0.5 }
    ];
    const confidence = computeRetrievalConfidence(candidates, { denseIds: ['a', 'b'], bm25Ids: ['a', 'c'] });
    expect(confidence).toBeGreaterThan(0.5);
  });

  // Regression test for a real bug found while building this: batch-relative min-max
  // normalization can make an entirely irrelevant candidate set show a "1.0" top
  // normalized score just because it's the least-bad of a bad batch. The absolute dense
  // similarity cap must catch this even when the (batch-relative) rerank score is high.
  it('caps confidence low when even the best match has poor absolute dense similarity', () => {
    const candidates = [
      { rerankScoreNormalized: 1.0, denseScore: 0.05 }, // "best of the batch" but genuinely unrelated
      { rerankScoreNormalized: 0.0, denseScore: 0.02 }
    ];
    const confidence = computeRetrievalConfidence(candidates, { denseIds: ['a', 'b'], bm25Ids: [] });
    expect(confidence).toBeLessThan(0.2);
  });

  it('does not divide by zero or crash when denseScore is missing on every candidate', () => {
    const candidates = [{ rerankScoreNormalized: 0.5 }];
    expect(() => computeRetrievalConfidence(candidates)).not.toThrow();
  });
});

describe('computeFinalConfidence', () => {
  it('weights groundedness most heavily', () => {
    const highGroundedness = computeFinalConfidence(0.3, { groundednessConfidence: 1.0, citationSupportRatio: 0.5 });
    const lowGroundedness = computeFinalConfidence(0.3, { groundednessConfidence: 0.0, citationSupportRatio: 0.5 });
    expect(highGroundedness).toBeGreaterThan(lowGroundedness);
    expect(highGroundedness - lowGroundedness).toBeCloseTo(0.5, 5); // groundedness weight is 0.5
  });
});
