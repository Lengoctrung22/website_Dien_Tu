import { Router } from 'express';
import authRoutes from './authRoutes';
import productRoutes from './productRoutes';
import orderRoutes from './orderRoutes';
import adminRoutes from './adminRoutes';
import uploadRoutes from './uploadRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/orders', orderRoutes);
router.use('/admin', adminRoutes);
router.use('/upload', uploadRoutes);

export default router;
