import { describe, it, expect } from 'vitest';
import { buildBM25Index, bm25Search } from './bm25.js';

describe('BM25 retrieval', () => {
  const docs = [
    { id: 'd1', text: 'Redis is an in-memory data store used for caching.' },
    { id: 'd2', text: 'PostgreSQL is a relational database with strong ACID guarantees.' },
    { id: 'd3', text: 'Cache eviction policies include LRU and TTL expiration.' }
  ];

  it('retrieves the document with the exact keyword match first', () => {
    const index = buildBM25Index(docs);
    const results = bm25Search(index, 'PostgreSQL relational database', 3);
    expect(results[0].id).toBe('d2');
  });

  it('finds exact acronym matches that a paraphrased dense query might miss', () => {
    const index = buildBM25Index(docs);
    const results = bm25Search(index, 'TTL LRU', 3);
    expect(results[0].id).toBe('d3');
  });

  it('returns nothing for a query with zero term overlap', () => {
    const index = buildBM25Index(docs);
    const results = bm25Search(index, 'quantum entanglement physics', 3);
    expect(results).toHaveLength(0);
  });

  it('handles an empty corpus without throwing', () => {
    const index = buildBM25Index([]);
    expect(bm25Search(index, 'anything', 5)).toEqual([]);
  });
});
