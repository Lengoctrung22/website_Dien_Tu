import { Router } from 'express';
import {
  handleUploadMiddleware,
  uploadImage,
} from '../controllers/uploadController';
import { authenticateToken, requireRole } from '../middlewares/auth';
import { uploadRateLimiter } from '../middlewares/rateLimiter';

const router = Router();

// POST /api/upload
// Supports multipart/form-data upload of images (admin/staff only)
router.post(
  '/',
  uploadRateLimiter,
  authenticateToken,
  requireRole(['admin', 'staff']),
  handleUploadMiddleware,
  uploadImage
);

export default router;
