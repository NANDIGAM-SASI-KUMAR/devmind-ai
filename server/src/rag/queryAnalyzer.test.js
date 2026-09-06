import { describe, it, expect } from 'vitest';
import { analyzeQuery } from './queryAnalyzer.js';

describe('QueryAnalyzer', () => {
  it('does not expand a specific, well-formed question', () => {
    const result = analyzeQuery('What is the time complexity of binary search on a sorted array?');
    expect(result.shouldExpand).toBe(false);
    expect(result.type).toBe('simple');
  });

  it('flags a short pronoun-referenced question as ambiguous', () => {
    const result = analyzeQuery('How does it work?');
    expect(result.shouldExpand).toBe(true);
    expect(result.type).toBe('ambiguous');
  });

  it('flags a very short query as ambiguous even without a pronoun', () => {
    const result = analyzeQuery('Redis caching');
    expect(result.shouldExpand).toBe(true);
  });

  it('flags a comparison query as complex', () => {
    const result = analyzeQuery('Compare the caching approaches described in the uploaded documents');
    expect(result.shouldExpand).toBe(true);
    expect(result.type).toBe('complex');
  });

  it('does not treat a long, specific sentence that happens to contain "this" as ambiguous', () => {
    const result = analyzeQuery('This document describes how Redis achieves low latency through in-memory storage and replication');
    expect(result.shouldExpand).toBe(false);
  });
});
