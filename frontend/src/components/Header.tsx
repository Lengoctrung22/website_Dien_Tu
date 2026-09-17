'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShoppingBag,
  Search,
  User,
  ShieldCheck,
  PackageCheck,
  Menu,
  X,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';

export default function Header() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const totalItems = useCartStore((state) => state.getTotalItems());
  const { user, logout, isStaff } = useAuthStore();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Dismiss user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isUserMenuOpen]);

  // Keyboard shortcut: Ctrl + K / Cmd + K to focus search, Escape to blur/close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        const target = e.target as HTMLElement | null;
        if (
          target &&
          (target.tagName === 'INPUT' ||
            target.tagName === 'TEXTAREA' ||
            target.isContentEditable) &&
          target !== searchInputRef.current
        ) {
          return;
        }
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === 'Escape') {
        if (document.activeElement === searchInputRef.current) {
          searchInputRef.current?.blur();
        }
        setIsUserMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-white/90 dark:bg-surface-canvas/90 border-b hairline-border surface-bevel transition-colors">
      {/* Refined Monochromatic High-Tech Ticker Bar */}
      <div className="bg-slate-950 text-slate-300 dark:bg-surface-canvas/95 dark:text-slate-300 text-xs py-1.5 px-4 text-center font-mono tracking-wider flex items-center justify-center gap-2 border-b hairline-border">
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-signal-emerald animate-pulse flex-shrink-0" />
        <span className="text-[11px] uppercase tracking-wider truncate">
          <strong className="text-white font-bold">TECHGEAR PRO</strong>
          <span className="mx-2 text-slate-600">|</span>
          <span className="text-slate-200">MIỄN PHÍ VẬN CHUYỂN ĐƠN TỪ 1.000.000₫</span>
          <span className="hidden sm:inline">
            <span className="mx-2 text-slate-600">•</span>
            <span className="text-slate-200">BẢO HÀNH CHÍNH HÃNG 24 THÁNG</span>
          </span>
          <span className="hidden md:inline">
            <span className="mx-2 text-slate-600">•</span>
            <span className="text-slate-200">GIAO HỎA TỐC 2H</span>
          </span>
        </span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* High-Tech "TG" Monogram Branding */}
          <Link href="/" className="flex items-center gap-2.5 flex-shrink-0 group">
            <div className="w-9 h-9 rounded-lg bg-surface-card border hairline-border surface-bevel flex items-center justify-center text-slate-900 dark:text-white group-hover:border-slate-400 dark:group-hover:border-signal-cyan/50 group-hover:text-slate-950 dark:group-hover:text-black transition-all duration-200 shadow-sm">
              <span className="font-mono font-black text-sm tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-slate-900 to-indigo-600 dark:from-signal-cyan dark:to-indigo-400">TG</span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg tracking-tight text-slate-900 dark:text-white group-hover:text-slate-950 dark:group-hover:text-black transition-colors">
                  TECH<span className="text-slate-950 dark:text-black">GEAR</span>
                </span>
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border hairline-border bg-slate-100 dark:bg-surface-subtle text-slate-700 dark:text-slate-300 tracking-wider">
                  PRO
                </span>
              </div>
              <span className="text-[9px] font-mono tracking-widest text-slate-600 dark:text-slate-400 font-semibold uppercase -mt-0.5">High-Performance Gear</span>
            </div>
          </Link>

          {/* Desktop Search Bar (standard rounded-lg 8px, hairline-border, Ctrl + K badge) */}
          <form onSubmit={handleSearchSubmit} className="hidden md:flex flex-1 max-w-md relative mx-4">
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Tìm phím cơ, chuột gaming, màn hình 240Hz..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-20 py-2 text-xs sm:text-sm rounded-lg bg-slate-100/90 dark:bg-surface-card border hairline-border surface-bevel text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none focus:border-slate-500 dark:focus:border-signal-cyan/50 focus:ring-1 focus:ring-slate-400/20 dark:focus:ring-signal-cyan/20 transition-all font-sans"
            />
            <Search className="w-4 h-4 text-slate-500 dark:text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold text-slate-600 dark:text-slate-400 bg-slate-200/80 dark:bg-surface-subtle border hairline-border select-none">
              Ctrl + K
            </kbd>
          </form>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-6 text-xs font-mono uppercase tracking-wider text-slate-800 dark:text-slate-200 font-semibold">
            <Link href="/products" className="hover:text-slate-950 dark:hover:text-black transition-colors">
              Sản phẩm
            </Link>
            <Link href="/products?category=monitor" className="hover:text-slate-950 dark:hover:text-black transition-colors">
              Màn hình
            </Link>
            <Link href="/products?category=keyboard" className="hover:text-slate-950 dark:hover:text-black transition-colors">
              Bàn phím
            </Link>
            <Link href="/products?category=mouse" className="hover:text-slate-950 dark:hover:text-black transition-colors">
              Chuột
            </Link>
            <Link href="/products?category=headphone" className="hover:text-slate-950 dark:hover:text-black transition-colors">
              Tai nghe
            </Link>
            <Link href="/order-tracking" className="hover:text-slate-950 dark:hover:text-black transition-colors flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
              <PackageCheck className="w-3.5 h-3.5 text-slate-800 dark:text-black" />
              <span>Tra cứu</span>
            </Link>
          </nav>

          {/* Action Buttons: Cart, Auth */}
          <div className="flex items-center gap-2.5">
            {/* Cart Icon with tabular-nums hairline badge */}
            <Link
              href="/cart"
              className="relative p-2 rounded-lg border hairline-border bg-white dark:bg-surface-card hover:bg-slate-100 dark:hover:bg-surface-subtle surface-bevel text-slate-700 dark:text-slate-200 transition-all group"
              title="Giỏ hàng"
            >
              <ShoppingBag className="w-4 h-4 group-hover:text-slate-950 dark:group-hover:text-black transition-colors" />
              {isMounted && totalItems > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-signal-rose text-white text-[10px] font-mono font-bold rounded-full px-1 min-w-[18px] h-[18px] flex items-center justify-center tabular-nums border hairline-border shadow-sm">
                  {totalItems > 99 ? '99+' : totalItems}
                </span>
              )}
            </Link>

            {/* Auth / Profile */}
            {!isMounted ? (
              <div className="hidden sm:inline-flex items-center h-8 w-24 rounded-lg border hairline-border bg-slate-100/70 dark:bg-surface-subtle/50 animate-pulse" />
            ) : user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  aria-expanded={isUserMenuOpen}
                  className="flex items-center gap-2 py-1.5 px-3 rounded-lg border hairline-border bg-white dark:bg-surface-card hover:bg-slate-100 dark:hover:bg-surface-subtle surface-bevel text-xs font-mono font-semibold transition-all text-slate-800 dark:text-slate-100"
                >
                  <div className="w-5 h-5 rounded bg-slate-100 dark:bg-surface-elevated border border-slate-300 dark:border-white/10 flex items-center justify-center text-slate-950 dark:text-white text-[10px] font-mono font-bold uppercase">
                    {user.fullName.charAt(0)}
                  </div>
                  <span className="hidden sm:inline max-w-[100px] truncate">{user.fullName}</span>
                  <ChevronDown className="w-3 h-3 text-slate-500 dark:text-slate-400" />
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-surface-elevated rounded-xl shadow-2xl border hairline-border surface-bevel py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-4 py-2 border-b hairline-border">
                      <p className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold">Tài khoản</p>
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{user.fullName}</p>
                      <span className="inline-block mt-1 px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider rounded border hairline-border bg-slate-100 dark:bg-surface-elevated text-slate-950 dark:text-white border-slate-300 dark:border-white/10">
                        {user.role}
                      </span>
                    </div>

                    {isStaff() && (
                      <Link
                        href="/admin"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-xs font-mono text-slate-950 dark:text-white hover:bg-slate-100 dark:hover:bg-surface-subtle font-bold transition-colors"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        Trang Quản Trị (Admin)
                      </Link>
                    )}

                    <Link
                      href="/profile"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-xs font-mono text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-surface-subtle font-semibold transition-colors"
                    >
                      <User className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                      Thông tin & Lịch sử
                    </Link>

                    <button
                      onClick={() => {
                        logout();
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-xs font-mono text-rose-700 dark:text-signal-rose hover:bg-rose-50 dark:hover:bg-rose-950/20 text-left font-bold transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/auth/login"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold text-white bg-slate-900 hover:bg-slate-800 dark:bg-signal-cyan dark:text-slate-950 dark:hover:bg-cyan-300 rounded-lg transition-all surface-bevel border hairline-border tracking-wider uppercase shadow-sm"
              >
                <User className="w-3.5 h-3.5" />
                Đăng nhập
              </Link>
            )}

            {/* Mobile menu hamburger */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-surface-subtle border hairline-border surface-bevel"
              aria-label="Menu"
            >
              {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {isMobileMenuOpen && (
          <div className="lg:hidden py-4 border-t hairline-border space-y-3 animate-in fade-in duration-200">
            <form onSubmit={handleSearchSubmit} className="relative mb-3">
              <input
                type="text"
                placeholder="Tìm kiếm thiết bị gaming..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-lg bg-slate-100 dark:bg-surface-card border hairline-border surface-bevel text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none focus:border-slate-500 dark:focus:border-signal-cyan/50 focus:ring-1 focus:ring-slate-400/20"
              />
              <Search className="w-4 h-4 text-slate-500 dark:text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </form>

            <div className="flex flex-col space-y-1 text-xs font-mono uppercase tracking-wider">
              <Link
                href="/products"
                onClick={() => setIsMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-surface-subtle text-slate-800 dark:text-slate-200 font-semibold"
              >
                Tất cả sản phẩm
              </Link>
              <Link
                href="/products?category=monitor"
                onClick={() => setIsMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-surface-subtle text-slate-800 dark:text-slate-200 font-semibold"
              >
                Màn hình máy tính
              </Link>
              <Link
                href="/products?category=keyboard"
                onClick={() => setIsMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-surface-subtle text-slate-800 dark:text-slate-200 font-semibold"
              >
                Bàn phím cơ
              </Link>
              <Link
                href="/products?category=mouse"
                onClick={() => setIsMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-surface-subtle text-slate-800 dark:text-slate-200 font-semibold"
              >
                Chuột gaming
              </Link>
              <Link
                href="/products?category=headphone"
                onClick={() => setIsMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-surface-subtle text-slate-800 dark:text-slate-200 font-semibold"
              >
                Tai nghe cao cấp
              </Link>
              <Link
                href="/order-tracking"
                onClick={() => setIsMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-surface-subtle text-slate-950 dark:text-black font-bold"
              >
                Tra cứu đơn hàng
              </Link>
              {isMounted && !user && (
                <Link
                  href="/auth/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="mt-2 text-center py-2 bg-slate-900 hover:bg-slate-800 text-white dark:bg-signal-cyan dark:text-slate-950 rounded-lg font-bold uppercase tracking-wider border hairline-border surface-bevel shadow-sm"
                >
                  Đăng nhập / Đăng ký
                </Link>
              )}
              {isMounted && user && (
                <div className="pt-2 border-t hairline-border space-y-1">
                  <div className="px-3 py-1 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-white truncate">{user.fullName}</span>
                    <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-100 dark:bg-surface-elevated text-slate-700 dark:text-slate-300 border hairline-border">
                      {user.role}
                    </span>
                  </div>
                  {isStaff() && (
                    <Link
                      href="/admin"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-surface-subtle text-slate-950 dark:text-white font-bold flex items-center gap-2"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      Trang Quản Trị (Admin)
                    </Link>
                  )}
                  <Link
                    href="/profile"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-surface-subtle text-slate-800 dark:text-slate-200 font-semibold flex items-center gap-2"
                  >
                    <User className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                    Thông tin & Lịch sử
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-600 dark:text-signal-rose font-bold flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
