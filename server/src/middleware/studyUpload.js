import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { ALLOWED_MATERIAL_EXTENSIONS } from '../utils/documentParser.js';

const UPLOAD_ROOT = path.join(process.cwd(), 'uploads', 'study');
if (!fs.existsSync(UPLOAD_ROOT)) fs.mkdirSync(UPLOAD_ROOT, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_ROOT),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${crypto.randomUUID()}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_MATERIAL_EXTENSIONS.has(ext)) {
    return cb(new Error(`File type ${ext || '(none)'} is not allowed. Use PDF, DOCX, TXT, or MD.`));
  }
  cb(null, true);
};

export const studyUpload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024, files: 1 } // 10MB per file
});

export const STUDY_UPLOAD_DIR = UPLOAD_ROOT;
