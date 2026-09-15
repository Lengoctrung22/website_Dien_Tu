import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { Order } from '../models/Order';
import { Product } from '../models/Product';
import { User } from '../models/User';
import { InventoryLog } from '../models/InventoryLog';

export const getDashboardSummary = async (req: Request, res: Response) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalRevenueAgg,
      totalOrders,
      totalProducts,
      lowStockCount,
      todayOrders,
      todayProductsSoldAgg,
    ] = await Promise.all([
      // Total revenue from all non-cancelled, non-failed orders
      Order.aggregate([
        { $match: { orderStatus: { $ne: 'cancelled' }, paymentStatus: { $ne: 'failed' } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
      Order.countDocuments({ orderStatus: { $ne: 'cancelled' }, paymentStatus: { $ne: 'failed' } }),
      Product.countDocuments({ isActive: true }),
      Product.countDocuments({ isActive: true, stock: { $lt: 5 } }),
      Order.find({ createdAt: { $gte: today }, orderStatus: { $ne: 'cancelled' }, paymentStatus: { $ne: 'failed' } }),
      Order.aggregate([
        { $match: { createdAt: { $gte: today }, orderStatus: { $ne: 'cancelled' }, paymentStatus: { $ne: 'failed' } } },
        { $unwind: '$items' },
        { $group: { _id: null, count: { $sum: '$items.quantity' } } },
      ]),
    ]);

    const totalRevenue = totalRevenueAgg[0]?.total || 0;
    const todayRevenue = todayOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const todayProductsSold = todayProductsSoldAgg[0]?.count || 0;

    res.json({
      success: true,
      data: {
        totalRevenue,
        totalOrders,
        totalProducts,
        lowStockCount,
        todayStats: {
          ordersCount: todayOrders.length,
          revenue: todayRevenue,
          productsSold: todayProductsSold,
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getPeriodicRevenue = async (req: Request, res: Response) => {
  try {
    const { period = 'monthly', year } = req.query;
    const currentYear = year ? parseInt(String(year)) : new Date().getFullYear();

    let chartData: any[] = [];

    if (period === 'weekly') {
      // Last 7 days revenue
      const days = 7;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - (days - 1));
      startDate.setHours(0, 0, 0, 0);

      const orders = await Order.find({
        createdAt: { $gte: startDate },
        orderStatus: { $ne: 'cancelled' },
        paymentStatus: { $ne: 'failed' },
      });

      const dayMap: Record<string, { label: string; revenue: number; orders: number }> = {};
      for (let i = 0; i < days; i++) {
        const d = new Date(startDate);
        d.setDate(d.getDate() + i);
        const key = d.toISOString().slice(0, 10);
        const dayOfWeek = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][d.getDay()];
        dayMap[key] = { label: `${dayOfWeek} (${d.getDate()}/${d.getMonth() + 1})`, revenue: 0, orders: 0 };
      }

      orders.forEach((o) => {
        const key = o.createdAt.toISOString().slice(0, 10);
        if (dayMap[key]) {
          dayMap[key].revenue += o.totalAmount;
          dayMap[key].orders += 1;
        }
      });

      chartData = Object.values(dayMap);
    } else if (period === 'monthly') {
      // 12 months for selected year
      const startOfYear = new Date(currentYear, 0, 1);
      const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59);

      const orders = await Order.find({
        createdAt: { $gte: startOfYear, $lte: endOfYear },
        orderStatus: { $ne: 'cancelled' },
        paymentStatus: { $ne: 'failed' },
      });

      const monthMap = Array.from({ length: 12 }, (_, i) => ({
        label: `Thg ${i + 1}`,
        revenue: 0,
        orders: 0,
      }));

      orders.forEach((o) => {
        const m = o.createdAt.getMonth();
        monthMap[m].revenue += o.totalAmount;
        monthMap[m].orders += 1;
      });

      chartData = monthMap;
    } else if (period === 'yearly') {
      // Last 4 years
      const startYear = currentYear - 3;
      const startDate = new Date(startYear, 0, 1);

      const orders = await Order.find({
        createdAt: { $gte: startDate },
        orderStatus: { $ne: 'cancelled' },
        paymentStatus: { $ne: 'failed' },
      });

      const yearMap: Record<number, { label: string; revenue: number; orders: number }> = {};
      for (let y = startYear; y <= currentYear; y++) {
        yearMap[y] = { label: `Năm ${y}`, revenue: 0, orders: 0 };
      }

      orders.forEach((o) => {
        const y = o.createdAt.getFullYear();
        if (yearMap[y]) {
          yearMap[y].revenue += o.totalAmount;
          yearMap[y].orders += 1;
        }
      });

      chartData = Object.values(yearMap);
    }

    res.json({ success: true, data: chartData });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getQuarterlyRevenue = async (req: Request, res: Response) => {
  try {
    const { year } = req.query;
    const targetYear = year ? parseInt(String(year)) : new Date().getFullYear();

    const startOfYear = new Date(targetYear, 0, 1);
    const endOfYear = new Date(targetYear, 11, 31, 23, 59, 59);

    const orders = await Order.find({
      createdAt: { $gte: startOfYear, $lte: endOfYear },
      orderStatus: { $ne: 'cancelled' },
      paymentStatus: { $ne: 'failed' },
    });

    const quarters = [
      { quarter: 'Quý 1 (Q1)', months: 'Thg 1 - Thg 3', revenue: 0, orders: 0, productsSold: 0 },
      { quarter: 'Quý 2 (Q2)', months: 'Thg 4 - Thg 6', revenue: 0, orders: 0, productsSold: 0 },
      { quarter: 'Quý 3 (Q3)', months: 'Thg 7 - Thg 9', revenue: 0, orders: 0, productsSold: 0 },
      { quarter: 'Quý 4 (Q4)', months: 'Thg 10 - Thg 12', revenue: 0, orders: 0, productsSold: 0 },
    ];

    orders.forEach((o) => {
      const m = o.createdAt.getMonth();
      const qIdx = Math.floor(m / 3);
      if (quarters[qIdx]) {
        quarters[qIdx].revenue += o.totalAmount;
        quarters[qIdx].orders += 1;
        const itemsCount = o.items.reduce((sum, item) => sum + item.quantity, 0);
        quarters[qIdx].productsSold += itemsCount;
      }
    });

    // Calculate growth percentages
    const quartersWithGrowth = quarters.map((q, idx) => {
      let growthPercent = 0;
      if (idx > 0 && quarters[idx - 1].revenue > 0) {
        growthPercent = Math.round(((q.revenue - quarters[idx - 1].revenue) / quarters[idx - 1].revenue) * 100);
      }
      return {
        ...q,
        growthPercent,
      };
    });

    res.json({
      success: true,
      data: {
        year: targetYear,
        quarters: quartersWithGrowth,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getDailyStatsByCategory = async (req: Request, res: Response) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const ordersToday = await Order.find({
      createdAt: { $gte: today },
      orderStatus: { $ne: 'cancelled' },
      paymentStatus: { $ne: 'failed' },
    });

    const categoryMap: Record<string, { category: string; name: string; quantity: number; revenue: number; color: string }> = {
      monitor: { category: 'monitor', name: 'Màn hình máy tính', quantity: 0, revenue: 0, color: '#06b6d4' },
      keyboard: { category: 'keyboard', name: 'Bàn phím cơ', quantity: 0, revenue: 0, color: '#8b5cf6' },
      mouse: { category: 'mouse', name: 'Chuột gaming & văn phòng', quantity: 0, revenue: 0, color: '#10b981' },
      headphone: { category: 'headphone', name: 'Tai nghe cao cấp', quantity: 0, revenue: 0, color: '#f59e0b' },
    };

    let totalSold = 0;
    let totalRev = 0;

    ordersToday.forEach((order) => {
      order.items.forEach((item) => {
        const cat = item.category || 'keyboard';
        if (!categoryMap[cat]) {
          categoryMap[cat] = { category: cat, name: cat, quantity: 0, revenue: 0, color: '#94a3b8' };
        }
        categoryMap[cat].quantity += item.quantity;
        categoryMap[cat].revenue += item.price * item.quantity;
        totalSold += item.quantity;
        totalRev += item.price * item.quantity;
      });
    });

    res.json({
      success: true,
      data: {
        totalProductsSoldToday: totalSold,
        totalRevenueToday: totalRev,
        categories: Object.values(categoryMap),
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getInventory = async (req: Request, res: Response) => {
  try {
    const { lowStockOnly, search } = req.query;
    const filter: Record<string, any> = { isActive: true };

    if (lowStockOnly === 'true') {
      filter.stock = { $lt: 5 };
    }
    if (search) {
      filter.name = new RegExp(String(search), 'i');
    }

    const products = await Product.find(filter).sort({ stock: 1 });
    const logs = await InventoryLog.find().sort({ createdAt: -1 }).limit(30);

    res.json({
      success: true,
      data: {
        products,
        recentLogs: logs,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getUsers = async (req: Request, res: Response) => {
  try {
    const { role, search } = req.query;
    const filter: Record<string, any> = {};

    if (role) filter.role = role;
    if (search) {
      const s = new RegExp(String(search), 'i');
      filter.$or = [{ fullName: s }, { email: s }, { phone: s }];
    }

    const users = await User.find(filter).select('-passwordHash').sort({ createdAt: -1 });

    // Compute Customer Lifetime Value (LTV) for users
    const usersWithLTV = await Promise.all(
      users.map(async (u) => {
        const orders = await Order.find({
          userId: u._id,
          orderStatus: { $ne: 'cancelled' },
          paymentStatus: { $ne: 'failed' },
        });
        const totalSpent = orders.reduce((sum, o) => sum + o.totalAmount, 0);
        return {
          ...u.toObject(),
          ordersCount: orders.length,
          totalSpent,
        };
      })
    );

    res.json({ success: true, data: usersWithLTV });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createStaff = async (req: Request, res: Response) => {
  try {
    const { fullName, email, password, phone, role = 'staff', permissions = ['orders'] } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp đầy đủ họ tên, email và mật khẩu' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email đã tồn tại' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await User.create({
      fullName,
      email: email.toLowerCase(),
      phone: phone || '',
      passwordHash,
      role: role === 'admin' ? 'admin' : 'staff',
      permissions,
      isActive: true,
    });

    res.status(201).json({
      success: true,
      message: 'Tạo tài khoản nhân viên thành công',
      data: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        permissions: user.permissions,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateUserStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { isActive, role, permissions } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
    }

    if (isActive !== undefined) user.isActive = Boolean(isActive);
    if (role && ['customer', 'staff', 'admin'].includes(role)) user.role = role;
    if (permissions && Array.isArray(permissions)) user.permissions = permissions;

    await user.save();

    res.json({
      success: true,
      message: 'Cập nhật tài khoản người dùng thành công',
      data: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        permissions: user.permissions,
        isActive: user.isActive,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
