import { Router } from 'express';
import {
  handleUploadMiddleware,
  uploadImage,
} from '../controllers/uploadController';
import { authenticateToken } from '../middlewares/auth';
import { uploadRateLimiter } from '../middlewares/rateLimiter';

const router = Router();

// POST /api/upload
// Supports multipart/form-data upload of images
router.post(
  '/',
  uploadRateLimiter,
  authenticateToken,
  handleUploadMiddleware,
  uploadImage
);

export default router;
