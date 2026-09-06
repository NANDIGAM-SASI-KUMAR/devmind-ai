// A minimal, dependency-free BM25 implementation. Built fresh per query over a
// collection's chunks (fetched from Chroma via collection.get()) — at this app's scale
// (tens to a few hundred chunks per study plan/project) that's cheap and needs no
// separate persistent inverted index or new infrastructure.

const tokenize = (text) => text.toLowerCase().match(/[a-z0-9]+/g) || [];

export const buildBM25Index = (docs) => {
  // docs: [{ id, text }]
  const tokenizedDocs = docs.map((d) => ({ id: d.id, tokens: tokenize(d.text) }));
  const docLengths = tokenizedDocs.map((d) => d.tokens.length);
  const avgDocLength = docLengths.reduce((a, b) => a + b, 0) / (docLengths.length || 1);

  const termFreqs = tokenizedDocs.map((d) => {
    const tf = new Map();
    for (const t of d.tokens) tf.set(t, (tf.get(t) || 0) + 1);
    return tf;
  });

  const docFreq = new Map();
  for (const d of tokenizedDocs) {
    for (const t of new Set(d.tokens)) docFreq.set(t, (docFreq.get(t) || 0) + 1);
  }

  return { ids: tokenizedDocs.map((d) => d.id), termFreqs, docLengths, avgDocLength, docFreq, N: tokenizedDocs.length };
};

export const bm25Search = (index, query, topK, { k1 = 1.5, b = 0.75 } = {}) => {
  if (index.N === 0) return [];
  const qTokens = [...new Set(tokenize(query))];

  const scores = index.ids.map((id, i) => {
    let score = 0;
    for (const t of qTokens) {
      const df = index.docFreq.get(t) || 0;
      if (df === 0) continue;
      const idf = Math.log((index.N - df + 0.5) / (df + 0.5) + 1);
      const tf = index.termFreqs[i].get(t) || 0;
      const denom = tf + k1 * (1 - b + b * (index.docLengths[i] / (index.avgDocLength || 1)));
      score += idf * ((tf * (k1 + 1)) / (denom || 1));
    }
    return { id, score };
  });

  return scores.filter((s) => s.score > 0).sort((a, b) => b.score - a.score).slice(0, topK);
};
