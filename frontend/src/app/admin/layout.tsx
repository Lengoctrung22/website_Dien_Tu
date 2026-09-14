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
  ExternalLink,
  LogOut,
  ShieldCheck,
  Menu,
  X,
  Zap,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import ThemeToggle from '@/components/ThemeToggle';

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
    <div className="min-h-screen bg-slate-100 dark:bg-[#07090e] text-slate-900 dark:text-slate-100 flex flex-col md:flex-row">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex md:w-64 flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-5 space-y-6 flex-shrink-0 min-h-screen">
        {/* Brand Admin */}
        <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-400 p-0.5 shadow-md">
            <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center">
              <span className="font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400 text-lg">TG</span>
            </div>
          </div>
          <div>
            <span className="font-black text-base text-slate-900 dark:text-white block leading-tight">
              ADMIN PRO
            </span>
            <span className="text-[10px] uppercase font-bold text-cyan-500 tracking-wider">
              Bảng Quản Trị
            </span>
          </div>
        </div>

        {/* User Card */}
        <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/70 flex items-center gap-3 shadow-sm">
          <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold uppercase shadow-sm flex-shrink-0">
            {(user?.fullName || user?.email || 'Admin').charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold truncate text-slate-800 dark:text-white" title={user?.fullName || 'Quản trị viên'}>
              {user?.fullName || 'Quản trị viên'}
            </p>
            <span className="text-[10px] font-bold text-indigo-600 dark:text-cyan-400 uppercase tracking-wider block">
              {user?.role || 'Staff'}
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 space-y-1.5 text-xs font-bold">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
          <Link
            href="/"
            className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <span className="flex items-center gap-2">
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Về Storefront</span>
            </span>
            <ThemeToggle />
          </Link>

          <button
            onClick={() => {
              logout();
              router.push('/auth/login');
            }}
            className="w-full flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* Top Mobile Bar */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <span className="font-black text-sm text-indigo-600 dark:text-cyan-400">TG ADMIN PRO</span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-800"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="md:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 space-y-3">
          {/* User Card Mobile */}
          <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/70 flex items-center gap-3 shadow-sm">
            <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold uppercase shadow-sm flex-shrink-0">
              {(user?.fullName || user?.email || 'Admin').charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold truncate text-slate-800 dark:text-white" title={user?.fullName || 'Quản trị viên'}>
                {user?.fullName || 'Quản trị viên'}
              </p>
              <span className="text-[10px] font-bold text-indigo-600 dark:text-cyan-400 uppercase tracking-wider block">
                {user?.role || 'Staff'}
              </span>
            </div>
          </div>
          <nav className="space-y-1.5 text-xs font-bold">
            {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold ${
                  isActive ? 'bg-indigo-600 text-white' : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
            <Link
              href="/"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-500"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Về Storefront</span>
            </Link>
          </nav>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">{children}</main>
    </div>
  );
}
