import path from 'path';
import fs from 'fs';

export const UPLOAD_DIR = process.env.UPLOAD_DIR || path.resolve(__dirname, '../../uploads');

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

export const ALLOWED_IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp', '.gif'];
export const ALLOWED_IMAGE_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/pjpeg',
  'image/x-png',
  'image/webp',
  'image/gif',
];

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
