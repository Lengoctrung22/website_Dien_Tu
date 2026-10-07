import { Router } from 'express';
import {
  register,
  login,
  googleLogin,
  getMe,
  updateProfile,
  forgotPassword,
  resetPassword,
} from '../controllers/authController';
import { authenticateToken } from '../middlewares/auth';
import { authRateLimiter } from '../middlewares/rateLimiter';

const router = Router();

router.post('/register', authRateLimiter, register);
router.post('/login', authRateLimiter, login);
router.post('/google', authRateLimiter, googleLogin);
router.post('/forgot-password', authRateLimiter, forgotPassword);
router.post('/reset-password', authRateLimiter, resetPassword);
router.get('/me', authenticateToken, getMe);
router.put('/profile', authenticateToken, updateProfile);

export default router;
