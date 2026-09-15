'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  Boxes,
  ShoppingCart,
  Users,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

const NAV_ITEMS = [
  { href: '/admin', label: 'Báo Cáo & Thống Kê', icon: LayoutDashboard },
  { href: '/admin/products', label: 'Quản Lý Sản Phẩm & Ghim HOT', icon: Package },
  { href: '/admin/inventory', label: 'Kho Hàng & Cảnh Báo Tồn', icon: Boxes },
  { href: '/admin/orders', label: 'Quản Lý Đơn Hàng', icon: ShoppingCart },
  { href: '/admin/users', label: 'Người Dùng & Phân Quyền RBAC', icon: Users },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isStaff, logout } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setTimeout(() => setMounted(true), 0);
    if (!user || !isStaff()) {
      router.push('/auth/login');
    }
  }, [user, isStaff, router]);

  if (!mounted || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm font-semibold">
        Đang kiểm tra quyền quản trị...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-canvas text-slate-900 dark:text-slate-100 flex flex-col md:flex-row">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex md:w-64 flex-col bg-surface-card border-r hairline-border p-5 space-y-6 flex-shrink-0 min-h-screen">
        {/* Brand Admin */}
        <div className="flex items-center gap-2.5 pb-4 border-b hairline-border">
          <div className="w-8 h-8 rounded-lg bg-surface-elevated hairline-border surface-bevel flex items-center justify-center flex-shrink-0">
            <span className="font-mono font-black text-slate-900 dark:text-white text-sm tracking-tight">TG</span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-sm text-slate-900 dark:text-white tracking-tight">
                TECHGEAR
              </span>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-surface-elevated text-slate-900 dark:text-white border border-slate-300 dark:border-white/10">
                ADMIN
              </span>
            </div>
            <span className="text-[10px] font-mono uppercase font-bold text-slate-700 dark:text-slate-300 tracking-wider block">
              Bảng Quản Trị
            </span>
          </div>
        </div>

        {/* User Card */}
        <div className="p-3 rounded-xl bg-surface-elevated/70 hairline-border surface-bevel flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-surface-elevated text-slate-900 dark:text-white border border-slate-300 dark:border-white/10 flex items-center justify-center text-xs font-mono font-bold uppercase flex-shrink-0">
            {(user?.fullName || user?.email || 'Admin').charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold truncate text-slate-900 dark:text-white" title={user?.fullName || 'Quản trị viên'}>
              {user?.fullName || 'Quản trị viên'}
            </p>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                {user?.role || 'Staff'}
              </span>
              {user?.phone ? (
                <span className="text-[10px] font-mono tabular-nums text-slate-700 dark:text-slate-300 truncate font-medium" title={user.phone}>
                  • {user.phone}
                </span>
              ) : user?.email ? (
                <span className="text-[10px] font-mono text-slate-700 dark:text-slate-300 truncate font-medium" title={user.email}>
                  • {user.email}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 flex flex-col gap-1 text-xs font-medium">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-all border-l-2 ${
                  isActive
                    ? 'bg-slate-100 dark:bg-surface-elevated text-slate-950 dark:text-white border-slate-900 dark:border-signal-cyan font-bold surface-bevel shadow-sm'
                    : 'border-transparent text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-surface-elevated/50 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-slate-950 dark:text-black' : 'text-slate-600 dark:text-slate-400'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}

          <div className="pt-2 mt-1 border-t hairline-border">
            <button
              type="button"
              onClick={() => {
                logout();
                router.push('/auth/login');
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg border-l-2 border-transparent hover:border-rose-600 dark:hover:border-signal-rose transition-all text-xs font-semibold text-rose-700 dark:text-signal-rose hover:bg-rose-50 dark:hover:bg-signal-rose/10 hover:text-rose-800 dark:hover:text-rose-200 active:scale-[0.99] text-left cursor-pointer"
            >
              <LogOut className="w-4 h-4 flex-shrink-0" />
              <span>Đăng xuất</span>
            </button>
          </div>
        </nav>
      </aside>

      {/* Top Mobile Bar */}
      <div className="md:hidden flex items-center justify-between p-4 bg-surface-card border-b hairline-border sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-surface-elevated hairline-border surface-bevel flex items-center justify-center flex-shrink-0">
            <span className="font-mono font-black text-slate-900 dark:text-white text-xs">TG</span>
          </div>
          <span className="font-black text-sm text-slate-900 dark:text-white tracking-tight">ADMIN PRO</span>
        </div>
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-lg hairline-border bg-surface-elevated text-slate-700 dark:text-slate-200 cursor-pointer"
          aria-label="Toggle Navigation Menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="md:hidden bg-surface-card border-b hairline-border p-4 space-y-3">
          {/* User Card Mobile */}
          <div className="p-3 rounded-xl bg-surface-elevated/70 hairline-border surface-bevel flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-surface-elevated text-slate-900 dark:text-white border border-slate-300 dark:border-white/10 flex items-center justify-center text-xs font-mono font-bold uppercase flex-shrink-0">
              {(user?.fullName || user?.email || 'Admin').charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold truncate text-slate-900 dark:text-white" title={user?.fullName || 'Quản trị viên'}>
                {user?.fullName || 'Quản trị viên'}
              </p>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  {user?.role || 'Staff'}
                </span>
                {user?.phone ? (
                  <span className="text-[10px] font-mono tabular-nums text-slate-700 dark:text-slate-300 truncate font-medium" title={user.phone}>
                    • {user.phone}
                  </span>
                ) : user?.email ? (
                  <span className="text-[10px] font-mono text-slate-700 dark:text-slate-300 truncate font-medium" title={user.email}>
                    • {user.email}
                  </span>
                ) : null}
              </div>
            </div>
          </div>
          <nav className="flex flex-col gap-1 text-xs font-medium">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border-l-2 transition-all ${
                    isActive
                      ? 'bg-slate-100 dark:bg-surface-elevated text-slate-950 dark:text-white border-slate-900 dark:border-signal-cyan font-bold surface-bevel shadow-sm'
                      : 'border-transparent text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-surface-elevated/50 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-slate-950 dark:text-black' : 'text-slate-600 dark:text-slate-400'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
            <div className="pt-2 mt-1 border-t hairline-border">
              <button
                type="button"
                onClick={() => {
                  setMobileOpen(false);
                  logout();
                  router.push('/auth/login');
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg border-l-2 border-transparent hover:border-rose-600 dark:hover:border-signal-rose transition-all text-xs font-semibold text-rose-700 dark:text-signal-rose hover:bg-rose-50 dark:hover:bg-signal-rose/10 hover:text-rose-800 dark:hover:text-rose-200 active:scale-[0.99] text-left cursor-pointer"
              >
                <LogOut className="w-4 h-4 flex-shrink-0" />
                <span>Đăng xuất</span>
              </button>
            </div>
          </nav>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">{children}</main>
    </div>
  );
}
