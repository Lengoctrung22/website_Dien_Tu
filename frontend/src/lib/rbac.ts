export type AdminRoleId = 'admin' | 'warehouse' | 'orders' | 'staff_general' | 'customer';

export interface RoleMetadata {
  id: AdminRoleId;
  name: string;
  badgeLabel: string;
  email: string;
  permissionKey: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  accentColor: string;
  description: string;
  responsibilities: string[];
}

export const SYSTEM_ROLES: Record<string, RoleMetadata> = {
  admin: {
    id: 'admin',
    name: 'Super Admin',
    badgeLabel: 'Super Admin (All)',
    email: 'admin@techgear.vn',
    permissionKey: 'all',
    badgeBg: 'bg-rose-500/15',
    badgeText: 'text-rose-700 dark:text-rose-300',
    badgeBorder: 'border-rose-500/30',
    accentColor: '#f43f5e',
    description: 'Toàn quyền quản trị hệ thống, báo cáo doanh thu, sản phẩm, kho hàng, đơn hàng và phân quyền RBAC.',
    responsibilities: [
      'Báo cáo doanh thu tài chính & phân tích tăng trưởng theo quý',
      'Quản lý danh mục thiết bị, upload hình ảnh và ghim sản phẩm HOT',
      'Giám sát toàn diện kho hàng và điều chỉnh tồn kho',
      'Quản lý toàn bộ tiến trình đơn hàng và hoàn tiền',
      'Quản lý người dùng, tạo nhân viên và phân quyền chi tiết (RBAC)',
    ],
  },
  warehouse: {
    id: 'warehouse',
    name: 'Nhân viên Kho (Warehouse)',
    badgeLabel: 'Nhân Viên Kho (Inventory)',
    email: 'warehouse@techgear.vn',
    permissionKey: 'inventory',
    badgeBg: 'bg-amber-500/15',
    badgeText: 'text-amber-700 dark:text-amber-300',
    badgeBorder: 'border-amber-500/30',
    accentColor: '#f59e0b',
    description: 'Quản lý kho hàng, kiểm kê sản phẩm, nhập hàng và tiếp nhận cảnh báo tồn kho thấp (< 5 chiếc).',
    responsibilities: [
      'Theo dõi số lượng tồn kho thời gian thực của toàn bộ 24+ sản phẩm',
      'Cảnh báo tự động sản phẩm sắp hết hàng (< 5 chiếc) và hết hàng',
      'Thực hiện điều chỉnh kho: Nhập thêm hàng (restock) hoặc Kiểm kê thủ công',
      'Ghi vết lịch sử xuất/nhập/kiểm kê kho (Inventory Audit Log)',
    ],
  },
  orders: {
    id: 'orders',
    name: 'Nhân viên Đơn hàng (Orders)',
    badgeLabel: 'Nhân Viên Đơn Hàng (Orders)',
    email: 'orders@techgear.vn',
    permissionKey: 'orders',
    badgeBg: 'bg-cyan-500/15',
    badgeText: 'text-cyan-700 dark:text-cyan-300',
    badgeBorder: 'border-cyan-500/30',
    accentColor: '#06b6d4',
    description: 'Xử lý tiến trình đơn hàng 5 giai đoạn, xác nhận thanh toán COD/Online và điều phối vận chuyển.',
    responsibilities: [
      'Tiếp nhận đơn hàng mới và kiểm tra thông tin khách hàng',
      'Cập nhật tiến trình đơn hàng: Chờ xác nhận → Xử lý → Vận chuyển → Đã giao',
      'Tự động xác thực thanh toán Online & xác nhận thu tiền COD khi giao thành công',
      'Theo dõi hàng chờ đơn hàng khẩn cấp cần xử lý ngay',
    ],
  },
};

/**
 * Determine the specific admin role from user object
 */
export function getAdminRoleInfo(user: { role?: string; permissions?: string[]; email?: string } | null): RoleMetadata {
  if (!user) {
    return {
      id: 'customer',
      name: 'Khách hàng',
      badgeLabel: 'Khách hàng',
      email: '',
      permissionKey: '',
      badgeBg: 'bg-slate-100 dark:bg-slate-800',
      badgeText: 'text-slate-600 dark:text-slate-400',
      badgeBorder: 'border-slate-300 dark:border-slate-700',
      accentColor: '#64748b',
      description: 'Khách hàng mua sắm',
      responsibilities: [],
    };
  }

  if (user.role === 'admin' || user.permissions?.includes('all') || user.email === 'admin@techgear.vn') {
    return SYSTEM_ROLES.admin;
  }

  if (
    user.role === 'warehouse' ||
    user.email === 'warehouse@techgear.vn' ||
    (user.permissions?.includes('inventory') && !user.permissions?.includes('orders'))
  ) {
    return SYSTEM_ROLES.warehouse;
  }

  if (
    user.role === 'orders' ||
    user.email === 'orders@techgear.vn' ||
    (user.permissions?.includes('orders') && !user.permissions?.includes('inventory'))
  ) {
    return SYSTEM_ROLES.orders;
  }

  // Fallback for general staff
  return {
    id: 'staff_general',
    name: 'Nhân viên',
    badgeLabel: `Nhân Viên (${user.permissions?.join(', ') || 'Staff'})`,
    email: user.email || '',
    permissionKey: user.permissions?.[0] || 'staff',
    badgeBg: 'bg-indigo-500/15',
    badgeText: 'text-indigo-700 dark:text-indigo-300',
    badgeBorder: 'border-indigo-500/30',
    accentColor: '#6366f1',
    description: 'Nhân viên hệ thống với phân quyền tùy chỉnh.',
    responsibilities: user.permissions || [],
  };
}
