import { Router } from 'express';
import {
  getActiveBanners,
  getAllBannersAdmin,
  getBannerById,
  createBanner,
  updateBanner,
  deleteBanner,
  reorderBanners,
} from '../controllers/bannerController';
import { authenticateToken, requireRole, requirePermission } from '../middlewares/auth';

const router = Router();

// 1. Public route: Fetch active banners for homepage hero slider
router.get('/', getActiveBanners);

// 2. Admin & Staff routes (Protected by RBAC 'products' permission)
const adminStaffProductsAuth = [
  authenticateToken,
  requireRole(['admin', 'staff']),
  requirePermission('products'),
];

router.get('/admin', ...adminStaffProductsAuth, getAllBannersAdmin);
router.post('/', ...adminStaffProductsAuth, createBanner);
router.patch('/reorder', ...adminStaffProductsAuth, reorderBanners);
router.get('/:id', ...adminStaffProductsAuth, getBannerById);
router.put('/:id', ...adminStaffProductsAuth, updateBanner);
router.delete('/:id', ...adminStaffProductsAuth, deleteBanner);

export default router;
