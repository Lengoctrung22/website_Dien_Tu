import { Router } from 'express';
import { handleChat } from '../controllers/chatController';
import { chatRateLimiter } from '../middlewares/rateLimiter';

const router = Router();

router.post('/', chatRateLimiter, handleChat);

export default router;
