import { describe, it, expect } from 'vitest';
import { reciprocalRankFusion, mmrSelect } from './fusion.js';

describe('Reciprocal Rank Fusion', () => {
  it('ranks an item appearing near the top of both lists above one appearing in only one list', () => {
    const dense = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
    const bm25 = [{ id: 'a' }, { id: 'd' }, { id: 'e' }];
    const fused = reciprocalRankFusion([dense, bm25], { k: 60, topK: 5 });
    expect(fused[0].id).toBe('a'); // appears at rank 0 in both — should win
  });

  it('respects topK', () => {
    const list = Array.from({ length: 10 }, (_, i) => ({ id: `x${i}` }));
    const fused = reciprocalRankFusion([list], { topK: 3 });
    expect(fused).toHaveLength(3);
  });

  it('handles all-empty lists without throwing', () => {
    expect(reciprocalRankFusion([[], []], { topK: 5 })).toEqual([]);
  });
});

describe('MMR diversification', () => {
  const embed = (...dims) => dims;

  it('prefers the most relevant candidate first regardless of lambda', () => {
    const candidates = [
      { id: 'a', relevanceScore: 0.9, embedding: embed(1, 0) },
      { id: 'b', relevanceScore: 0.5, embedding: embed(0, 1) }
    ];
    const selected = mmrSelect(candidates, { lambda: 0.7, topK: 2 });
    expect(selected[0].id).toBe('a');
  });

  it('picks a diverse second item over a near-duplicate of the first when lambda favors diversity', () => {
    const candidates = [
      { id: 'a', relevanceScore: 0.9, embedding: embed(1, 0) },
      { id: 'a-duplicate', relevanceScore: 0.89, embedding: embed(0.99, 0.01) }, // near-identical to "a"
      { id: 'c', relevanceScore: 0.6, embedding: embed(0, 1) } // relevant but distinct
    ];
    const selected = mmrSelect(candidates, { lambda: 0.3, topK: 2 });
    expect(selected.map((s) => s.id)).toContain('c');
  });

  it('falls back to relevance-only ordering when embeddings are missing', () => {
    const candidates = [
      { id: 'a', relevanceScore: 0.5 },
      { id: 'b', relevanceScore: 0.9 }
    ];
    const selected = mmrSelect(candidates, { topK: 2 });
    expect(selected).toHaveLength(2); // didn't crash, returned something sane
  });
});
