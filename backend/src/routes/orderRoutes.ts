import { Router } from 'express';
import {
  createOrder,
  lookupOrder,
  getMyOrders,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  handleVnpayReturn,
  handleMockPayment,
} from '../controllers/orderController';
import { authenticateToken, optionalAuthenticateToken, requireRole } from '../middlewares/auth';

const router = Router();

// Public / Customer order lookup
router.get('/lookup', lookupOrder);

// Create order (optional auth for guest checkout or logged in user)
router.post('/', optionalAuthenticateToken, createOrder);

// Customer order history
router.get('/my-orders', authenticateToken, getMyOrders);

// Admin & Staff list orders
router.get('/', authenticateToken, requireRole(['admin', 'staff']), getAllOrders);

// Order details
router.get('/:id', optionalAuthenticateToken, getOrderById);

// Update status (admin/staff)
router.patch('/:id/status', authenticateToken, requireRole(['admin', 'staff']), updateOrderStatus);

// VNPAY Callbacks
router.get('/payment/vnpay-return', handleVnpayReturn);
router.post('/payment/mock-pay', handleMockPayment);

export default router;
