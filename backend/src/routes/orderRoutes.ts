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
import { orderRateLimiter, createRateLimiter } from '../middlewares/rateLimiter';

const router = Router();

const orderLookupLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 120,
  message: 'Bạn đã tra cứu đơn hàng quá nhiều lần. Vui lòng thử lại sau ít phút.',
});

const orderActionLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 120,
  message: 'Quá nhiều yêu cầu xác nhận đơn hàng. Vui lòng thử lại sau ít phút.',
});

// Public / Customer order lookup
router.get('/lookup', orderLookupLimiter, lookupOrder);

// Create order with rate limiting (optional auth for guest checkout or logged in user)
router.post('/', orderRateLimiter, optionalAuthenticateToken, createOrder);

// Customer order history
router.get('/my-orders', authenticateToken, getMyOrders);

// Admin & Staff list orders — requires 'orders' permission
router.get('/', authenticateToken, requireRole(['admin', 'staff']), requirePermission('orders'), getAllOrders);

// Order details
router.get('/:id', orderLookupLimiter, optionalAuthenticateToken, getOrderById);

// Update status (admin/staff) — requires 'orders' permission
router.patch('/:id/status', authenticateToken, requireRole(['admin', 'staff']), requirePermission('orders'), updateOrderStatus);
router.post('/:id/verify-payment', authenticateToken, requireRole(['admin', 'staff']), requirePermission('orders'), verifyOrderPayment);

// Customer notifies online transfer completed
router.post('/:id/notify-paid', orderActionLimiter, optionalAuthenticateToken, notifyPaid);

// Customer / Guest confirm receipt
router.post('/:id/confirm-receipt', orderActionLimiter, optionalAuthenticateToken, confirmOrderReceipt);

// VNPAY & Online Payment Callbacks / Webhooks
router.get('/payment/vnpay-return', handleVnpayReturn);
router.get('/payment/vnpay-ipn', handleVnpayIpn);
router.post('/payment/vnpay-ipn', handleVnpayIpn);
router.post('/payment/webhook', handlePaymentWebhook);

export default router;
