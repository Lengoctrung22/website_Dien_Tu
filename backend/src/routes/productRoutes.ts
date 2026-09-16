import { Router } from 'express';
import {
  getProducts,
  getProductBySlugOrId,
  createProduct,
  updateProduct,
  deleteProduct,
  toggleHotStatus,
  reorderHotProducts,
  updateStock,
  getFilterMetadata,
} from '../controllers/productController';
import { authenticateToken, requireRole, requirePermission } from '../middlewares/auth';

const router = Router();

router.get('/', getProducts);
router.get('/filters', getFilterMetadata);
router.get('/:slugOrId', getProductBySlugOrId);

// Protected routes (Admin & Staff with permission)
router.post('/', authenticateToken, requireRole(['admin', 'staff']), requirePermission('products'), createProduct);
router.patch('/hot/reorder', authenticateToken, requireRole(['admin', 'staff']), requirePermission('products'), reorderHotProducts);
router.put('/:id', authenticateToken, requireRole(['admin', 'staff']), requirePermission('products'), updateProduct);
router.delete('/:id', authenticateToken, requireRole(['admin']), deleteProduct);
router.patch('/:id/hot', authenticateToken, requireRole(['admin', 'staff']), requirePermission('products'), toggleHotStatus);
router.patch('/:id/stock', authenticateToken, requireRole(['admin', 'staff']), requirePermission('inventory'), updateStock);

export default router;
