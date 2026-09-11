import { Router } from 'express';
import {
  handleUploadMiddleware,
  uploadImage,
} from '../controllers/uploadController';
import { optionalAuthenticateToken } from '../middlewares/auth';
import { uploadRateLimiter } from '../middlewares/rateLimiter';

const router = Router();

// POST /api/upload
// Supports multipart/form-data upload of images
router.post(
  '/',
  uploadRateLimiter,
  optionalAuthenticateToken,
  handleUploadMiddleware,
  uploadImage
);

export default router;
