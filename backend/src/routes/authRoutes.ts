import { Router } from 'express';
import { register, login, getMe, updateProfile } from '../controllers/authController';
import { authenticateToken } from '../middlewares/auth';
import { authRateLimiter } from '../middlewares/rateLimiter';

const router = Router();

router.post('/register', authRateLimiter, register);
router.post('/login', authRateLimiter, login);
router.get('/me', authenticateToken, getMe);
router.put('/profile', authenticateToken, updateProfile);

export default router;
