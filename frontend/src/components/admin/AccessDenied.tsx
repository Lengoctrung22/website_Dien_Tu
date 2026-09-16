'use client';

import { ShieldX, ArrowLeft, LogOut } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { getAdminRoleInfo } from '@/lib/rbac';

interface AccessDeniedProps {
  requiredPermission?: string;
  customMessage?: string;
}

const PERMISSION_LABELS: Record<string, string> = {
  reports: 'Báo Cáo Doanh Thu & Thống Kê',
  inventory: 'Quản Lý Kho Hàng & Nhập Hàng',
  orders: 'Quản Lý & Xử Lý Đơn Hàng',
  products: 'Quản Lý Sản Phẩm & Ghim HOT',
  admin_only: 'Quản Trị Viên Hệ Thống (Super Admin)',
};

export default function AccessDenied({ requiredPermission, customMessage }: AccessDeniedProps) {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const roleInfo = getAdminRoleInfo(user);
  const label = requiredPermission ? PERMISSION_LABELS[requiredPermission] || requiredPermission : '';

  const handleLogout = () => {
    logout();
    router.push('/auth/login');
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="text-center space-y-4 max-w-md w-full mx-auto p-8 rounded-2xl bg-surface-card hairline-border surface-bevel shadow-sm">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
          <ShieldX className="w-8 h-8 text-rose-600 dark:text-signal-rose" />
        </div>

        <div className="space-y-1">
          <span className={`inline-block text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${roleInfo.badgeBg} ${roleInfo.badgeText} ${roleInfo.badgeBorder}`}>
            {roleInfo.badgeLabel}
          </span>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">
            Không Có Quyền Truy Cập
          </h2>
        </div>

        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
          {customMessage ? (
            customMessage
          ) : (
            <>
              Tài khoản của bạn thuộc vai trò <strong className="text-slate-900 dark:text-white font-bold">{roleInfo.name}</strong> không có quyền truy cập chức năng{' '}
              {label && (
                <span className="font-bold text-slate-900 dark:text-white">&ldquo;{label}&rdquo;</span>
              )}
              . Chức năng này được bảo vệ bởi hệ thống phân quyền RBAC.
            </>
          )}
        </p>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/admin"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold hover:opacity-90 transition-opacity shadow-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Về Bàn Làm Việc Của Bạn</span>
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-rose-500/30 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-signal-rose hover:bg-rose-100 dark:hover:bg-rose-900/40 text-xs font-bold font-mono transition-all shadow-sm cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Đăng xuất</span>
          </button>
        </div>
      </div>
    </div>
  );
}
