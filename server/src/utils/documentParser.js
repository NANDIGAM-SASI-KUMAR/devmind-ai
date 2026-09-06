import fs from 'fs/promises';
import path from 'path';

export const extractText = async (filePath, originalName) => {
  const ext = path.extname(originalName).toLowerCase();

  if (ext === '.pdf') {
    const { PDFParse } = await import('pdf-parse');
    const buffer = await fs.readFile(filePath);
    const parser = new PDFParse({ data: buffer });
    try {
      const result = await parser.getText();
      return result.text;
    } finally {
      await parser.destroy();
    }
  }

  if (ext === '.docx') {
    const mammoth = await import('mammoth');
    const buffer = await fs.readFile(filePath);
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  // .txt, .md, and anything else plain-text
  return fs.readFile(filePath, 'utf8');
};

export const ALLOWED_MATERIAL_EXTENSIONS = new Set(['.pdf', '.docx', '.txt', '.md']);
