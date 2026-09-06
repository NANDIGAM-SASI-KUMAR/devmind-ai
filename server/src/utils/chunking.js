// Splits text into overlapping chunks, preferring paragraph boundaries so each
// chunk stays semantically coherent for embedding.
export const chunkText = (text, { chunkSize = 1000, overlap = 150 } = {}) => {
  const clean = text.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  if (!clean) return [];

  const paragraphs = clean.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const chunks = [];
  let current = '';

  for (const para of paragraphs) {
    if (para.length > chunkSize) {
      if (current) {
        chunks.push(current);
        current = '';
      }
      // Paragraph itself is too long — slide a window over it.
      for (let i = 0; i < para.length; i += chunkSize - overlap) {
        chunks.push(para.slice(i, i + chunkSize));
      }
      continue;
    }

    if ((current + '\n\n' + para).length > chunkSize) {
      if (current) chunks.push(current);
      current = para;
    } else {
      current = current ? `${current}\n\n${para}` : para;
    }
  }
  if (current) chunks.push(current);

  return chunks.filter((c) => c.trim().length > 0);
};
