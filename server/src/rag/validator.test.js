import { describe, it, expect } from 'vitest';
import { filterSupportedCitations } from './validator.js';

describe('filterSupportedCitations', () => {
  // Regression test for a real bug found while building this: matching on filename
  // (c.source) instead of section meant every citation from a single-document study plan
  // passed the filter trivially, since every supportingSource string also contains that
  // same filename. Section is the actual discriminating signal.
  it('does not let every citation pass just because they share the same source filename', () => {
    const citations = [
      { source: 'notes.pdf', section: 'Redis' },
      { source: 'notes.pdf', section: 'Normalization' }
    ];
    const supportingSources = ['Source: notes.pdf — Redis'];
    const result = filterSupportedCitations(citations, supportingSources);
    expect(result).toHaveLength(1);
    expect(result[0].section).toBe('Redis');
  });

  it('keeps all citations when the validator found no supporting sources to map (fails open, does not silently drop everything)', () => {
    const citations = [{ source: 'notes.pdf', section: 'Redis' }];
    expect(filterSupportedCitations(citations, [])).toEqual(citations);
  });

  it('falls back to source matching when a citation has no section', () => {
    const citations = [{ source: 'notes.pdf', section: '' }];
    const supportingSources = ['Source: notes.pdf'];
    expect(filterSupportedCitations(citations, supportingSources)).toHaveLength(1);
  });
});
