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
import { authenticateToken, requireRole } from '../middlewares/auth';

const router = Router();

router.get('/', getProducts);
router.get('/filters', getFilterMetadata);
router.get('/:slugOrId', getProductBySlugOrId);

// Protected routes (Admin & Staff)
router.post('/', authenticateToken, requireRole(['admin', 'staff']), createProduct);
router.patch('/hot/reorder', authenticateToken, requireRole(['admin', 'staff']), reorderHotProducts);
router.put('/:id', authenticateToken, requireRole(['admin', 'staff']), updateProduct);
router.delete('/:id', authenticateToken, requireRole(['admin']), deleteProduct);
router.patch('/:id/hot', authenticateToken, requireRole(['admin', 'staff']), toggleHotStatus);
router.patch('/:id/stock', authenticateToken, requireRole(['admin', 'staff']), updateStock);

export default router;
