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
import { authenticateToken, requireRole, requirePermission } from '../middlewares/auth';

const router = Router();

// All admin routes require authentication and staff or admin role
router.use(authenticateToken, requireRole(['admin', 'staff']));

// Dashboard & Revenue reports — admin only (requirePermission('all') blocks staff without 'all')
router.get('/summary', requirePermission('reports'), getDashboardSummary);
router.get('/periodic-revenue', requirePermission('reports'), getPeriodicRevenue);
router.get('/quarterly-revenue', requirePermission('reports'), getQuarterlyRevenue);
router.get('/daily-categories', requirePermission('reports'), getDailyStatsByCategory);

// Inventory management — requires 'inventory' permission
router.get('/inventory', requirePermission('inventory'), getInventory);

// User & staff management — admin only
router.get('/users', requireRole(['admin']), getUsers);
router.post('/users/staff', requireRole(['admin']), createStaff);
router.patch('/users/:id', requireRole(['admin']), updateUserStatus);

export default router;
