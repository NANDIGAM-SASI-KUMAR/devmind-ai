import { chunkText } from '../utils/chunking.js';

// Structure-aware chunking, honestly scoped to what the current parsers actually give us:
// pdf-parse and mammoth extract PLAIN TEXT — font size, bold, and other structural markup
// is already gone by the time it reaches here. So:
//   - Markdown files get REAL heading detection (the "#"/"##" syntax survives as plain text).
//   - PDF/DOCX/TXT get a heuristic approximation: a short, punctuation-free standalone line
//     sitting between blank lines is treated as a probable heading. This is not as reliable
//     as true structural extraction (that would need a heavier parser like Docling), but it's
//     honest about what it is and meaningfully better than no structure at all.
//   - If neither approach finds any headings, we fall back to grouping consecutive
//     paragraphs into pseudo-sections, so parent/child structure always exists.

const MD_HEADING = /^(#{1,4})\s+(.+)$/;
const HEURISTIC_HEADING = /^[^.!?:;]{1,80}$/; // short line, no sentence-ending punctuation

const groupParagraphsIntoSections = (text, paragraphsPerSection = 4) => {
  const paragraphs = text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const sections = [];
  for (let i = 0; i < paragraphs.length; i += paragraphsPerSection) {
    sections.push({ heading: '', body: paragraphs.slice(i, i + paragraphsPerSection).join('\n\n') });
  }
  return sections;
};

const detectSections = (text) => {
  const lines = text.split('\n');
  const sections = [];
  let current = { heading: '', body: [] };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) {
      current.body.push('');
      continue;
    }

    const mdMatch = line.match(MD_HEADING);
    const looksLikeHeading =
      !mdMatch &&
      HEURISTIC_HEADING.test(line) &&
      (lines[i - 1] === undefined || lines[i - 1].trim() === '') &&
      lines[i + 1]?.trim() !== '';

    if (mdMatch || looksLikeHeading) {
      const body = current.body.join('\n').trim();
      if (body) sections.push({ heading: current.heading, body });
      current = { heading: mdMatch ? mdMatch[2].trim() : line, body: [] };
    } else {
      current.body.push(lines[i]);
    }
  }
  const lastBody = current.body.join('\n').trim();
  if (lastBody) sections.push({ heading: current.heading, body: lastBody });

  const foundRealHeadings = sections.some((s) => s.heading);
  return foundRealHeadings ? sections : groupParagraphsIntoSections(text);
};

// Produces parent sections (larger, for generation context) and child chunks (smaller,
// for embedding/precise retrieval) linked by parentId. Children are what gets embedded;
// parent text is stored once per section, not duplicated into every child's vector record.
export const chunkStructured = (rawText, { parentMaxChars = 2500, childSize = 500, childOverlap = 75 } = {}) => {
  const clean = rawText.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  if (!clean) return { parents: [], children: [] };

  const sections = detectSections(clean);
  const parents = [];
  const children = [];
  let parentIndex = 0;

  for (const section of sections) {
    const pieces = chunkText(section.body, { chunkSize: parentMaxChars, overlap: 100 });
    for (const piece of pieces) {
      const parentId = `p${parentIndex++}`;
      parents.push({ parentId, heading: section.heading, section: section.heading, text: piece });

      const childTexts = chunkText(piece, { chunkSize: childSize, overlap: childOverlap });
      childTexts.forEach((childText) => {
        children.push({ parentId, heading: section.heading, section: section.heading, text: childText });
      });
    }
  }
  return { parents, children };
};
