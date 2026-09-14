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

// Route Controller
export const uploadImage = (req: Request, res: Response) => {
  const files = (req.files as Express.Multer.File[]) || (req.file ? [req.file] : []);

  if (!files || files.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Vui lòng chọn ít nhất một tệp hình ảnh để tải lên',
    });
  }

  // Reject 0-byte corrupt/empty files and clean up disk
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
  }

  const protocol = (req.headers['x-forwarded-proto'] as string) || req.protocol || 'http';
  const host = req.get('host') || `localhost:${ENV.PORT}`;

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
