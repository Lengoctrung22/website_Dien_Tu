import { Router } from 'express';
import {
  createOrder,
  lookupOrder,
  getMyOrders,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  confirmOrderReceipt,
  handleVnpayReturn,
  handleVnpayIpn,
  handlePaymentWebhook,
  verifyOrderPayment,
  notifyPaid,
} from '../controllers/orderController';
import { authenticateToken, optionalAuthenticateToken, requireRole, requirePermission } from '../middlewares/auth';
import { orderRateLimiter } from '../middlewares/rateLimiter';

const router = Router();

// Public / Customer order lookup
router.get('/lookup', lookupOrder);

// Create order with rate limiting (optional auth for guest checkout or logged in user)
router.post('/', orderRateLimiter, optionalAuthenticateToken, createOrder);

// Customer order history
router.get('/my-orders', authenticateToken, getMyOrders);

// Admin & Staff list orders — requires 'orders' permission
router.get('/', authenticateToken, requireRole(['admin', 'staff']), requirePermission('orders'), getAllOrders);

// Order details
router.get('/:id', optionalAuthenticateToken, getOrderById);

// Update status (admin/staff) — requires 'orders' permission
router.patch('/:id/status', authenticateToken, requireRole(['admin', 'staff']), requirePermission('orders'), updateOrderStatus);
router.post('/:id/verify-payment', authenticateToken, requireRole(['admin', 'staff']), requirePermission('orders'), verifyOrderPayment);

// Customer notifies online transfer completed
router.post('/:id/notify-paid', optionalAuthenticateToken, notifyPaid);

// Customer / Guest confirm receipt
router.post('/:id/confirm-receipt', optionalAuthenticateToken, confirmOrderReceipt);

// VNPAY & Online Payment Callbacks / Webhooks
router.get('/payment/vnpay-return', handleVnpayReturn);
router.get('/payment/vnpay-ipn', handleVnpayIpn);
router.post('/payment/vnpay-ipn', handleVnpayIpn);
router.post('/payment/webhook', handlePaymentWebhook);

export default router;
