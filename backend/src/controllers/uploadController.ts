import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import {
  UPLOAD_DIR,
  ALLOWED_IMAGE_EXTENSIONS,
  ALLOWED_IMAGE_MIME_TYPES,
  MAX_FILE_SIZE_BYTES,
} from '../config/upload';
import { ENV } from '../config/env';

// Configure Multer Disk Storage
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const rawExt = path.extname(file.originalname);
    const ext = rawExt.toLowerCase();
    const rawBase = path.basename(file.originalname, rawExt);
    const normalized = rawBase
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[đĐ]/g, 'd')
      .replace(/[^a-z0-9_-]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 50);
    const cleanBaseName = normalized || 'image';
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${cleanBaseName}-${uniqueSuffix}${ext}`);
  },
});

// File validation filter
const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const mimeType = (file.mimetype || '').toLowerCase();
  const isExtValid = ALLOWED_IMAGE_EXTENSIONS.includes(ext);
  const isMimeValid = ALLOWED_IMAGE_MIME_TYPES.includes(mimeType);

  if (isExtValid && isMimeValid) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Định dạng tệp không được hỗ trợ (${ext || file.mimetype}). Chỉ chấp nhận: PNG, JPG, JPEG, WEBP, GIF.`
      )
    );
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
    files: 10,
  },
  fileFilter,
});

// Middleware to handle multipart upload and gracefully capture multer errors
export const handleUploadMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Use upload.any() so it accepts any field name: 'image', 'file', 'images', etc.
  const uploadHandler = upload.any();

  uploadHandler(req, res, (err: any) => {
    if (err) {
      if (req.files && Array.isArray(req.files)) {
        req.files.forEach((f: Express.Multer.File) => {
          if (f.path && fs.existsSync(f.path)) {
            try {
              fs.unlinkSync(f.path);
            } catch {}
          }
        });
      }
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'Dung lượng tệp vượt quá giới hạn cho phép (Tối đa 10MB)',
        });
      }
      if (err.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({
          success: false,
          message: 'Số lượng tệp vượt quá giới hạn cho phép (Tối đa 10 tệp trong một lần tải lên)',
        });
      }
      return res.status(400).json({
        success: false,
        message: err.message || 'Lỗi khi tải lên hình ảnh',
      });
    }
    next();
  });
};

const hasValidImageMagicBytes = (filePath: string): boolean => {
  try {
    const fd = fs.openSync(filePath, 'r');
    const buffer = Buffer.alloc(12);
    const bytesRead = fs.readSync(fd, buffer, 0, 12, 0);
    fs.closeSync(fd);

    if (bytesRead < 4) return false;

    // PNG: 89 50 4E 47 0D 0A 1A 0A
    if (
      bytesRead >= 8 &&
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47 &&
      buffer[4] === 0x0d &&
      buffer[5] === 0x0a &&
      buffer[6] === 0x1a &&
      buffer[7] === 0x0a
    ) {
      return true;
    }

    // JPEG: FF D8 FF
    if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
      return true;
    }

    // GIF: GIF87a or GIF89a
    const header6 = buffer.subarray(0, 6).toString('ascii');
    if (header6 === 'GIF87a' || header6 === 'GIF89a') {
      return true;
    }

    // WEBP: RIFF....WEBP
    if (
      bytesRead >= 12 &&
      buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
      buffer.subarray(8, 12).toString('ascii') === 'WEBP'
    ) {
      return true;
    }

    return false;
  } catch {
    return false;
  }
};

// Route Controller
export const uploadImage = (req: Request, res: Response) => {
  const files = (req.files as Express.Multer.File[]) || (req.file ? [req.file] : []);

  if (!files || files.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Vui lòng chọn ít nhất một tệp hình ảnh để tải lên',
    });
  }

  // Reject 0-byte corrupt/empty files or invalid magic bytes and clean up disk
  for (const file of files) {
    if (!file.size || file.size === 0) {
      files.forEach((f) => {
        if (f.path && fs.existsSync(f.path)) {
          try {
            fs.unlinkSync(f.path);
          } catch {}
        }
      });
      return res.status(400).json({
        success: false,
        message: 'Tệp hình ảnh rỗng hoặc không hợp lệ (0 bytes)',
      });
    }

    if (!file.path || !hasValidImageMagicBytes(file.path)) {
      files.forEach((f) => {
        if (f.path && fs.existsSync(f.path)) {
          try {
            fs.unlinkSync(f.path);
          } catch {}
        }
      });
      return res.status(400).json({
        success: false,
        message: 'Nội dung tệp không phải hình ảnh hợp lệ (Magic Bytes không khớp PNG, JPG, GIF, WEBP)',
      });
    }
  }

  const rawProto = String(req.headers['x-forwarded-proto'] || req.protocol || 'http')
    .split(',')[0]
    .trim()
    .toLowerCase();
  const protocol = rawProto === 'https' ? 'https' : 'http';
  const rawHost = String(req.get('host') || '').trim();
  const host = /^[a-zA-Z0-9.-]+(:[0-9]+)?$/.test(rawHost) ? rawHost : `localhost:${ENV.PORT}`;

  const uploadedFiles = files.map((file) => ({
    filename: file.filename,
    originalName: file.originalname,
    mimetype: file.mimetype,
    size: file.size,
    relativeUrl: `/uploads/${file.filename}`,
    url: `${protocol}://${host}/uploads/${file.filename}`,
  }));

  const primary = uploadedFiles[0];

  return res.status(200).json({
    success: true,
    message: 'Tải lên hình ảnh thành công',
    data: {
      url: primary.url,
      relativeUrl: primary.relativeUrl,
      filename: primary.filename,
      originalName: primary.originalName,
      mimetype: primary.mimetype,
      size: primary.size,
      files: uploadedFiles,
    },
  });
};
