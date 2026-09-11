import { Router } from 'express';
import {
  getDashboardSummary,
  getPeriodicRevenue,
  getQuarterlyRevenue,
  getDailyStatsByCategory,
  getInventory,
  getUsers,
  createStaff,
  updateUserStatus,
} from '../controllers/adminController';
import { authenticateToken, requireRole } from '../middlewares/auth';

const router = Router();

// All admin routes require authentication and staff or admin role
router.use(authenticateToken, requireRole(['admin', 'staff']));

router.get('/summary', getDashboardSummary);
router.get('/periodic-revenue', getPeriodicRevenue);
router.get('/quarterly-revenue', getQuarterlyRevenue);
router.get('/daily-categories', getDailyStatsByCategory);
router.get('/inventory', getInventory);

// User & staff management
router.get('/users', getUsers);
router.post('/users/staff', requireRole(['admin']), createStaff);
router.patch('/users/:id', requireRole(['admin']), updateUserStatus);

export default router;
