import { describe, it, expect } from 'vitest';
import { studyCollectionName, codeCollectionName } from './chroma.js';

// The actual cross-tenant isolation guarantee lives at the controller layer (every route
// checks `StudyPlan.findOne({ _id, user: req.user._id })` — verified live throughout this
// project's testing, e.g. deleting another user's study plan returns 404, not the data).
// This test covers the piece that isolation logic depends on: that two different plans/
// projects always get distinct Chroma collection names, so no accidental name collision
// could route one user's query into another user's vectors regardless of the ownership
// check above it.
describe('collection naming (isolation boundary)', () => {
  it('produces distinct collection names for distinct study plans', () => {
    expect(studyCollectionName('plan-a')).not.toBe(studyCollectionName('plan-b'));
  });

  it('produces distinct collection names for distinct projects', () => {
    expect(codeCollectionName('project-a')).not.toBe(codeCollectionName('project-b'));
  });

  it('study and code collections for the same id never collide with each other', () => {
    expect(studyCollectionName('same-id')).not.toBe(codeCollectionName('same-id'));
  });

  it('is deterministic — the same id always maps to the same collection', () => {
    expect(studyCollectionName('plan-x')).toBe(studyCollectionName('plan-x'));
  });
});
