import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

const UPLOAD_ROOT = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOAD_ROOT)) fs.mkdirSync(UPLOAD_ROOT, { recursive: true });

const ALLOWED_EXTENSIONS = new Set([
  '.js', '.jsx', '.ts', '.tsx', '.json', '.md', '.txt',
  '.py', '.cpp', '.c', '.h', '.java', '.go', '.rs', '.rb', '.php',
  '.html', '.css', '.scss', '.yml', '.yaml', '.env.example', '.sql'
]);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_ROOT),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${crypto.randomUUID()}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return cb(new Error(`File type ${ext || '(none)'} is not allowed`));
  }
  cb(null, true);
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 1024 * 1024, files: 1 } // 1MB per file
});

export const UPLOAD_DIR = UPLOAD_ROOT;
