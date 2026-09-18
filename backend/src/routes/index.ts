import { Router } from 'express';
import authRoutes from './authRoutes';
import productRoutes from './productRoutes';
import orderRoutes from './orderRoutes';
import adminRoutes from './adminRoutes';
import uploadRoutes from './uploadRoutes';
import bannerRoutes from './bannerRoutes';
import chatRoutes from './chatRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/orders', orderRoutes);
router.use('/admin', adminRoutes);
router.use('/upload', uploadRoutes);
router.use('/banners', bannerRoutes);
router.use('/chat', chatRoutes);

export default router;
