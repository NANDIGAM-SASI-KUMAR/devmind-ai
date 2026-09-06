import RagParentChunk from '../models/RagParentChunk.js';
import { RAG_CONFIG } from './config.js';

// Cheap, non-LLM compression: keep only the sentences that share vocabulary with the
// query, in their original order. No extra API call, so it costs nothing to always apply
// to long parent sections before they go into the prompt.
const compressToRelevantSentences = (text, query, maxSentences = 6) => {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  if (sentences.length <= maxSentences) return text;

  const qTerms = new Set(query.toLowerCase().match(/[a-z0-9]+/g) || []);
  const scored = sentences.map((s) => {
    const terms = s.toLowerCase().match(/[a-z0-9]+/g) || [];
    return { s, overlap: terms.filter((t) => qTerms.has(t)).length };
  });
  const keep = new Set([...scored].sort((a, b) => b.overlap - a.overlap).slice(0, maxSentences).map((x) => x.s));
  return scored.filter((x) => keep.has(x.s)).map((x) => x.s.trim()).join(' ');
};

// Resolves each retrieved child chunk back to its parent section (falling back to the
// child's own text for older chunks indexed before parent/child chunking existed), dedupes
// by parent so the same section isn't repeated, compresses long sections, and enforces a
// total character budget — producing both the prompt context string and citation metadata.
export const buildContext = async (collectionName, candidates, query, { maxChars = RAG_CONFIG.maxContextChars } = {}) => {
  const parentIds = [...new Set(candidates.map((c) => c.metadata?.parentId).filter(Boolean))];
  const parents = parentIds.length > 0
    ? await RagParentChunk.find({ collectionName, parentId: { $in: parentIds } })
    : [];
  const parentById = new Map(parents.map((p) => [p.parentId, p]));

  const seen = new Set();
  const blocks = [];
  for (const c of candidates) {
    const parent = c.metadata?.parentId ? parentById.get(c.metadata.parentId) : null;
    const dedupeKey = parent ? parent.parentId : c.id;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);

    const rawText = parent ? parent.text : c.text;
    blocks.push({
      source: c.metadata?.originalName || 'uploaded material',
      heading: parent?.heading || c.metadata?.heading || '',
      relevance: Math.round((c.relevanceScore ?? 0) * 100) / 100,
      text: rawText.length > 800 ? compressToRelevantSentences(rawText, query) : rawText
    });
  }

  let total = 0;
  const bounded = [];
  for (const b of blocks) {
    if (total + b.text.length > maxChars) continue;
    bounded.push(b);
    total += b.text.length;
  }

  const contextString = bounded
    .map((b) => `Source: ${b.source}${b.heading ? ` — ${b.heading}` : ''}\nRelevance: ${b.relevance}\n\n${b.text}`)
    .join('\n\n---\n\n');

  const citations = bounded.map((b) => ({ source: b.source, section: b.heading, relevance: b.relevance }));

  return { contextString, citations };
};
