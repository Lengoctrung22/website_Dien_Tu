'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  Boxes,
  ShoppingCart,
  Users,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  AlertTriangle,
  Clock,
  type LucideIcon,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { getAdminRoleInfo, type RoleMetadata } from '@/lib/rbac';

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: string;
  badgeColor?: string;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

function AdminNavLinks({
  navGroup,
  onLinkClick,
}: {
  navGroup: NavGroup;
  onLinkClick?: () => void;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const isItemActive = (href: string) => {
    if (href.includes('?')) {
      const [path, query] = href.split('?');
      if (pathname !== path) return false;
      const targetQuery = new URLSearchParams(query);
      for (const [key, val] of targetQuery.entries()) {
        if (searchParams.get(key) !== val) return false;
      }
      return true;
    }

    if (href === '/admin') {
      return pathname === '/admin';
    }

    if (href === '/admin/inventory') {
      return pathname === '/admin/inventory' && !searchParams.get('lowStock');
    }

    if (href === '/admin/orders') {
      return pathname === '/admin/orders' && !searchParams.get('status');
    }

    return pathname.startsWith(href);
  };

  return (
    <nav className="flex-1 flex flex-col gap-1 text-xs font-medium">
      <div className="px-2 pb-1.5 text-[10px] font-mono uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">
        {navGroup.title}
      </div>

      {navGroup.items.map((item) => {
        const Icon = item.icon;
        const active = isItemActive(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onLinkClick}
            aria-current={active ? 'page' : undefined}
            className={`flex items-center justify-between px-3 py-2.5 rounded-xl transition-all border-l-2 ${
              active
                ? 'bg-slate-100 dark:bg-surface-elevated text-slate-950 dark:text-white border-slate-900 dark:border-signal-cyan font-bold surface-bevel shadow-sm'
                : 'border-transparent text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-surface-elevated/50 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Icon
                className={`w-4 h-4 flex-shrink-0 ${
                  active
                    ? 'text-slate-950 dark:text-signal-cyan'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              />
              <span className="truncate">{item.label}</span>
            </div>

            {item.badge && (
              <span
                className={`ml-2 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase whitespace-nowrap border ${
                  item.badgeColor ||
                  'bg-slate-200 dark:bg-surface-elevated text-slate-700 dark:text-slate-300 border-slate-300 dark:border-white/10'
                }`}
              >
                {item.badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isStaff, isAdmin, hasPermission, logout } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  const roleInfo: RoleMetadata = getAdminRoleInfo(user);

  // Compute allowed navigation items dynamically for the current role & permissions
  const getNavGroup = (): NavGroup => {
    // 1. Warehouse Staff (role warehouse OR inventory permission without orders)
    if (
      roleInfo.id === 'warehouse' ||
      user?.role === 'warehouse' ||
      (hasPermission('inventory') && !hasPermission('orders') && !isAdmin())
    ) {
      return {
        title: 'Chức Năng Chính - Kho Hàng',
        items: [
          {
            href: '/admin',
            label: 'Tổng Quan Kho Hàng',
            icon: Boxes,
            badge: 'KPI',
          },
          {
            href: '/admin/inventory',
            label: 'Quản Lý Kho & Nhập Hàng',
            icon: Package,
            badge: 'Kho',
          },
          {
            href: '/admin/inventory?lowStock=true',
            label: 'Cảnh Báo Tồn Kho Thấp',
            icon: AlertTriangle,
            badge: '< 5 chiếc',
            badgeColor:
              'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
          },
        ],
      };
    }

    // 2. Orders Staff (role orders OR orders permission without inventory)
    if (
      roleInfo.id === 'orders' ||
      user?.role === 'orders' ||
      (hasPermission('orders') && !hasPermission('inventory') && !isAdmin())
    ) {
      return {
        title: 'Chức Năng Chính - Đơn Hàng',
        items: [
          {
            href: '/admin',
            label: 'Tổng Quan Đơn Hàng',
            icon: ShoppingCart,
            badge: 'KPI',
          },
          {
            href: '/admin/orders',
            label: 'Danh Sách & Quản Lý Đơn',
            icon: Package,
            badge: 'Đơn',
          },
          {
            href: '/admin/orders?status=pending',
            label: 'Hàng Chờ Cần Xử Lý',
            icon: Clock,
            badge: 'Chờ duyệt',
            badgeColor:
              'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/30',
          },
        ],
      };
    }

    // 3. Super Admin & Full Access
    const items: NavItem[] = [];

    if (isAdmin() || hasPermission('all') || hasPermission('reports')) {
      items.push({
        href: '/admin',
        label: 'Báo Cáo & Thống Kê',
        icon: LayoutDashboard,
      });
    }

    if (isAdmin() || hasPermission('products')) {
      items.push({
        href: '/admin/products',
        label: 'Quản Lý Sản Phẩm & Ghim HOT',
        icon: Package,
      });
    }

    if (isAdmin() || hasPermission('inventory')) {
      items.push({
        href: '/admin/inventory',
        label: 'Kho Hàng & Cảnh Báo Tồn',
        icon: Boxes,
      });
    }

    if (isAdmin() || hasPermission('orders')) {
      items.push({
        href: '/admin/orders',
        label: 'Quản Lý Đơn Hàng',
        icon: ShoppingCart,
      });
    }

    if (isAdmin()) {
      items.push({
        href: '/admin/users',
        label: 'Người Dùng & Phân Quyền RBAC',
        icon: Users,
      });
    }

    return {
      title: 'Phân Hệ Quản Trị Hệ Thống',
      items,
    };
  };

  const navGroup = getNavGroup();

  const handleLogout = () => {
    if (mobileOpen) setMobileOpen(false);
    logout();
    router.push('/auth/login');
  };

  useEffect(() => {
    const unsub = useAuthStore.persist?.onFinishHydration?.(() => {
      setIsHydrated(true);
    });
    const timer = setTimeout(() => {
      setIsHydrated(true);
    }, 0);
    return () => {
      unsub?.();
      clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    if (!user || !isStaff()) {
      router.push('/auth/login');
    }
  }, [isHydrated, user, isStaff, router]);

  if (!isHydrated || !user || !isStaff()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-canvas text-sm font-semibold text-slate-700 dark:text-slate-300">
        Đang kiểm tra quyền hạn quản trị...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-canvas text-slate-900 dark:text-slate-100 flex flex-col md:flex-row">
      {/* =========================================================================
       * 1. DESKTOP SIDEBAR: LOGOUT AT THE TOP, MAIN FUNCTIONS POSITIONED BELOW IT
       * ========================================================================= */}
      <aside className="hidden md:flex md:w-64 flex-col bg-surface-card border-r hairline-border p-5 space-y-5 flex-shrink-0 md:sticky md:top-0 md:h-screen md:overflow-y-auto">
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
                PRO
              </span>
            </div>
            <span className="text-[10px] font-mono uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider block">
              Bảng Quản Trị RBAC
            </span>
          </div>
        </div>

        {/* User Card with Role Badge + TOP LOGOUT ACTION */}
        <div className="p-3.5 rounded-xl bg-surface-elevated/70 hairline-border surface-bevel space-y-2.5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-surface-elevated text-slate-900 dark:text-white border border-slate-300 dark:border-white/10 flex items-center justify-center text-xs font-mono font-bold uppercase flex-shrink-0 shadow-sm">
              {(user?.fullName || user?.email || 'A').charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold truncate text-slate-900 dark:text-white" title={user?.fullName || user?.email}>
                {user?.fullName || 'Quản trị viên'}
              </p>
              <p className="text-[10px] font-mono text-slate-500 dark:text-slate-400 truncate" title={user?.email}>
                {user?.email}
              </p>
            </div>
          </div>

          <div className="pt-1.5 border-t border-slate-200/60 dark:border-white/5 flex items-center justify-between">
            <span className={`inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${roleInfo.badgeBg} ${roleInfo.badgeText} ${roleInfo.badgeBorder}`}>
              <ShieldCheck className="w-3 h-3 flex-shrink-0" />
              <span>{roleInfo.badgeLabel}</span>
            </span>
          </div>

          {/* CHỨC NĂNG ĐĂNG XUẤT ĐƯỢC CHUYỂN LÊN TRÊN HÀNG ĐẦU */}
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-rose-500/30 dark:border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-signal-rose hover:text-rose-800 dark:hover:text-rose-200 transition-all font-mono font-bold text-xs shadow-sm hover:shadow cursor-pointer active:scale-[0.99]"
            title="Đăng xuất khỏi tài khoản quản trị"
          >
            <LogOut className="w-3.5 h-3.5 flex-shrink-0" />
            <span>Đăng xuất</span>
          </button>
        </div>

        {/* CÁC CHỨC NĂNG CHÍNH ĐƯỢC ĐẶT Ở DƯỚI NÚT ĐĂNG XUẤT */}
        <Suspense fallback={<div className="flex-1" />}>
          <AdminNavLinks navGroup={navGroup} />
        </Suspense>

        {/* Notice: Bottom logout button has been removed and moved to the top */}
      </aside>

      {/* =========================================================================
       * 2. MAIN WORKSPACE WITH MOBILE BAR & CONTENT
       * ========================================================================= */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Mobile Bar */}
        <div className="md:hidden flex items-center justify-between p-3.5 bg-surface-card border-b hairline-border sticky top-0 z-40">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-surface-elevated hairline-border surface-bevel flex items-center justify-center flex-shrink-0">
              <span className="font-mono font-black text-slate-900 dark:text-white text-xs">TG</span>
            </div>
            <div>
              <span className="font-black text-xs text-slate-900 dark:text-white tracking-tight">ADMIN RBAC</span>
              <span className={`block text-[9px] font-mono font-bold ${roleInfo.badgeText}`}>
                {roleInfo.badgeLabel}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Top Logout Button on Mobile Bar */}
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-rose-500/30 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-signal-rose text-xs font-bold font-mono cursor-pointer"
              title="Đăng xuất"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="text-[11px]">Đăng xuất</span>
            </button>

            <button
              type="button"
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 rounded-lg hairline-border bg-surface-elevated text-slate-700 dark:text-slate-200 cursor-pointer"
              aria-label="Toggle Navigation Menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Drawer */}
        {mobileOpen && (
          <div className="md:hidden bg-surface-card border-b hairline-border p-4 space-y-4">
            {/* User Card at top with Logout */}
            <div className="p-3 rounded-xl bg-surface-elevated/70 hairline-border surface-bevel space-y-2.5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-surface-elevated text-slate-900 dark:text-white border border-slate-300 dark:border-white/10 flex items-center justify-center text-xs font-mono font-bold uppercase flex-shrink-0">
                  {(user?.fullName || user?.email || 'A').charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold truncate text-slate-900 dark:text-white">
                    {user?.fullName || 'Quản trị viên'}
                  </p>
                  <p className="text-[10px] font-mono text-slate-500 dark:text-slate-400 truncate">
                    {user?.email}
                  </p>
                </div>
              </div>

              <span className={`inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${roleInfo.badgeBg} ${roleInfo.badgeText} ${roleInfo.badgeBorder}`}>
                <ShieldCheck className="w-3 h-3 flex-shrink-0" />
                <span>{roleInfo.badgeLabel}</span>
              </span>

              {/* Mobile Drawer Logout at the Top */}
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-signal-rose border border-rose-500/25 font-mono font-bold text-xs cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5 flex-shrink-0" />
                <span>Đăng xuất tài khoản</span>
              </button>
            </div>

            {/* Main Functions positioned below Logout in Mobile Drawer */}
            <Suspense fallback={null}>
              <AdminNavLinks
                navGroup={navGroup}
                onLinkClick={() => setMobileOpen(false)}
              />
            </Suspense>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}
