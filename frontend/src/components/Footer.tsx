import Link from 'next/link';
import { Shield, Truck, RotateCcw, Headphones, CreditCard, Mail, Phone, MapPin, ChevronRight, Lock } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-900 dark:bg-surface-canvas text-slate-300 dark:text-slate-300 border-t border-slate-800 dark:border-white/[0.06] relative transition-colors">
      {/* 4 Feature Highlights Grid */}
      <div className="border-b border-slate-800 dark:border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-slate-800/60 dark:bg-surface-card/40 border border-slate-700/50 dark:border-white/[0.06] shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-slate-700/80 dark:bg-surface-subtle/80 border border-slate-600/50 dark:border-white/[0.06] flex items-center justify-center text-cyan-400 dark:text-cyan-400 flex-shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[9px] font-mono font-bold tabular-nums text-cyan-400 dark:text-cyan-400 uppercase tracking-widest block">AUTHENTIC // 100%</span>
              <h4 className="font-bold text-white dark:text-white text-xs uppercase tracking-tight">Chính Hãng 100%</h4>
              <p className="text-[11px] text-slate-400 dark:text-slate-400 mt-0.5">Bảo hành 24 tháng toàn diện</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-slate-800/60 dark:bg-surface-card/40 border border-slate-700/50 dark:border-white/[0.06] shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-slate-700/80 dark:bg-surface-subtle/80 border border-slate-600/50 dark:border-white/[0.06] flex items-center justify-center text-cyan-400 dark:text-cyan-400 flex-shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[9px] font-mono font-bold tabular-nums text-cyan-400 dark:text-cyan-400 uppercase tracking-widest block">LOGISTICS // EXPRESS</span>
              <h4 className="font-bold text-white dark:text-white text-xs uppercase tracking-tight">Giao Hàng Hỏa Tốc</h4>
              <p className="text-[11px] text-slate-400 dark:text-slate-400 mt-0.5">Freeship đơn từ 1.000.000₫</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-slate-800/60 dark:bg-surface-card/40 border border-slate-700/50 dark:border-white/[0.06] shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-slate-700/80 dark:bg-surface-subtle/80 border border-slate-600/50 dark:border-white/[0.06] flex items-center justify-center text-cyan-400 dark:text-cyan-400 flex-shrink-0">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[9px] font-mono font-bold tabular-nums text-cyan-400 dark:text-cyan-400 uppercase tracking-widest block">POLICY // 7-DAY RETURN</span>
              <h4 className="font-bold text-white dark:text-white text-xs uppercase tracking-tight">Đổi Mới Trong 7 Ngày</h4>
              <p className="text-[11px] text-slate-400 dark:text-slate-400 mt-0.5">Lỗi 1-đổi-1 phần cứng tức thì</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-slate-800/60 dark:bg-surface-card/40 border border-slate-700/50 dark:border-white/[0.06] shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-slate-700/80 dark:bg-surface-subtle/80 border border-slate-600/50 dark:border-white/[0.06] flex items-center justify-center text-cyan-400 dark:text-cyan-400 flex-shrink-0">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[9px] font-mono font-bold tabular-nums text-cyan-400 dark:text-cyan-400 uppercase tracking-widest block">SUPPORT // 24/7 PRO</span>
              <h4 className="font-bold text-white dark:text-white text-xs uppercase tracking-tight">Tư Vấn Chuyên Sâu</h4>
              <p className="text-[11px] text-slate-400 dark:text-slate-400 mt-0.5">Tối ưu cấu hình gear thi đấu</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Columns */}
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {/* Column 1: Brand & Contact Info */}
        <div className="space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-800 dark:bg-surface-card border border-slate-700/50 dark:border-white/[0.06] flex items-center justify-center text-white dark:text-white shadow-sm">
              <span className="font-mono font-black text-sm tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-cyan-400 to-indigo-400 dark:from-signal-cyan dark:to-indigo-400">TG</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-lg text-white dark:text-white tracking-tight">
                TECH<span className="text-cyan-400 dark:text-cyan-400">GEAR</span>
              </span>
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border border-slate-700/50 dark:border-white/[0.06] bg-slate-800 dark:bg-surface-subtle text-slate-400 dark:text-slate-400 tracking-wider">
                PRO
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-400 dark:text-slate-400 leading-relaxed font-sans">
            Hệ thống phân phối thiết bị máy tính, phụ kiện gaming gear và công nghệ cao cấp hàng đầu Việt Nam. Chuẩn mực phần cứng cho game thủ và chuyên gia sáng tạo.
          </p>

          <div className="space-y-2.5 pt-1 text-xs font-mono text-slate-400 dark:text-slate-400">
            <div className="flex items-start gap-2">
              <MapPin className="w-3.5 h-3.5 text-cyan-400 dark:text-cyan-400 flex-shrink-0 mt-0.5" />
              <span>Tòa nhà TechTower, 120 Cầu Giấy, Hà Nội</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-cyan-400 dark:text-cyan-400 flex-shrink-0" />
              <span>Hotline: <strong className="text-white dark:text-slate-200 font-bold">1900 8888</strong> (08:00 - 21:30)</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-cyan-400 dark:text-cyan-400 flex-shrink-0" />
              <span>support@techgear.vn</span>
            </div>
          </div>
        </div>

        {/* Column 2: Danh Mục Sản Phẩm */}
        <div>
          <h4 className="text-[11px] font-bold tracking-wider uppercase text-slate-200 dark:text-slate-200 mb-4 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 dark:bg-signal-cyan" />
            Danh Mục Sản Phẩm
          </h4>
          <ul className="space-y-2.5 text-xs font-mono text-slate-400 dark:text-slate-400">
            <li>
              <Link href="/products?category=monitor" className="hover:text-white dark:hover:text-white transition-colors flex items-center gap-1.5 group font-medium">
                <ChevronRight className="w-3 h-3 text-slate-500 dark:text-slate-400 group-hover:text-white dark:group-hover:text-white transition-colors" />
                Màn hình OLED / 240Hz
              </Link>
            </li>
            <li>
              <Link href="/products?category=keyboard" className="hover:text-white dark:hover:text-white transition-colors flex items-center gap-1.5 group font-medium">
                <ChevronRight className="w-3 h-3 text-slate-500 dark:text-slate-400 group-hover:text-white dark:group-hover:text-white transition-colors" />
                Bàn phím cơ & Rapid Trigger
              </Link>
            </li>
            <li>
              <Link href="/products?category=mouse" className="hover:text-white dark:hover:text-white transition-colors flex items-center gap-1.5 group font-medium">
                <ChevronRight className="w-3 h-3 text-slate-500 dark:text-slate-400 group-hover:text-white dark:group-hover:text-white transition-colors" />
                Chuột thi đấu Ultralight
              </Link>
            </li>
            <li>
              <Link href="/products?category=headphone" className="hover:text-white dark:hover:text-white transition-colors flex items-center gap-1.5 group font-medium">
                <ChevronRight className="w-3 h-3 text-slate-500 dark:text-slate-400 group-hover:text-white dark:group-hover:text-white transition-colors" />
                Tai nghe chống ồn chủ động
              </Link>
            </li>
            <li>
              <Link href="/products?isHot=true" className="hover:text-white dark:hover:text-white transition-colors flex items-center gap-1.5 group font-medium">
                <ChevronRight className="w-3 h-3 text-slate-500 dark:text-slate-400 group-hover:text-white dark:group-hover:text-white transition-colors" />
                Sản phẩm HOT & Bán chạy
              </Link>
            </li>
          </ul>
        </div>

        {/* Column 3: Chính Sách & Hỗ Trợ */}
        <div>
          <h4 className="text-[11px] font-bold tracking-wider uppercase text-slate-200 dark:text-slate-200 mb-4 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 dark:bg-signal-emerald" />
            Chính Sách & Hỗ Trợ
          </h4>
          <ul className="space-y-2.5 text-xs font-mono text-slate-400 dark:text-slate-400">
            <li>
              <Link href="/order-tracking" className="hover:text-white dark:hover:text-white transition-colors flex items-center gap-1.5 group font-medium">
                <ChevronRight className="w-3 h-3 text-slate-500 dark:text-slate-400 group-hover:text-white dark:group-hover:text-white transition-colors" />
                Tra cứu tiến trình đơn hàng
              </Link>
            </li>
            <li>
              <Link href="#" className="hover:text-white dark:hover:text-white transition-colors flex items-center gap-1.5 group font-medium">
                <ChevronRight className="w-3 h-3 text-slate-500 dark:text-slate-400 group-hover:text-white dark:group-hover:text-white transition-colors" />
                Chính sách bảo hành 24 tháng
              </Link>
            </li>
            <li>
              <Link href="#" className="hover:text-white dark:hover:text-white transition-colors flex items-center gap-1.5 group font-medium">
                <ChevronRight className="w-3 h-3 text-slate-500 dark:text-slate-400 group-hover:text-white dark:group-hover:text-white transition-colors" />
                Chính sách vận chuyển & kiểm hàng
              </Link>
            </li>
            <li>
              <Link href="#" className="hover:text-white dark:hover:text-white transition-colors flex items-center gap-1.5 group font-medium">
                <ChevronRight className="w-3 h-3 text-slate-500 dark:text-slate-400 group-hover:text-white dark:group-hover:text-white transition-colors" />
                Bảo mật thông tin khách hàng
              </Link>
            </li>
            <li>
              <Link href="#" className="hover:text-white dark:hover:text-white transition-colors flex items-center gap-1.5 group font-medium">
                <ChevronRight className="w-3 h-3 text-slate-500 dark:text-slate-400 group-hover:text-white dark:group-hover:text-white transition-colors" />
                Hướng dẫn thanh toán VNPAY / COD
              </Link>
            </li>
          </ul>
        </div>

        {/* Column 4: Phương Thức Thanh Toán & Bảo Mật */}
        <div>
          <h4 className="text-[11px] font-bold tracking-wider uppercase text-slate-200 dark:text-slate-200 mb-4 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 dark:bg-signal-amber" />
            Thanh Toán & Bảo Mật
          </h4>
          <p className="text-xs text-slate-400 dark:text-slate-400 mb-3 font-sans">
            Xác thực giao dịch thời gian thực qua các cổng thanh toán uy tín:
          </p>
          <div className="grid grid-cols-3 gap-2">
            <div className="p-2 rounded-lg bg-slate-800 dark:bg-surface-card border border-slate-700/50 dark:border-white/[0.06] text-center font-mono text-xs font-bold text-emerald-400 dark:text-signal-emerald shadow-sm">
              COD
            </div>
            <div className="p-2 rounded-lg bg-slate-800 dark:bg-surface-card border border-slate-700/50 dark:border-white/[0.06] text-center font-mono text-xs font-bold text-slate-200 dark:text-slate-200 shadow-sm">
              VNPAY
            </div>
            <div className="p-2 rounded-lg bg-slate-800 dark:bg-surface-card border border-slate-700/50 dark:border-white/[0.06] text-center font-mono text-xs font-bold text-rose-400 dark:text-signal-rose shadow-sm">
              MOMO
            </div>
          </div>
          <div className="mt-4 p-3 rounded-lg bg-slate-800 dark:bg-surface-card border border-slate-700/50 dark:border-white/[0.06] text-[11px] font-mono text-slate-400 dark:text-slate-400 flex items-center gap-2.5 shadow-sm">
            <Lock className="w-4 h-4 text-cyan-400 dark:text-cyan-400 flex-shrink-0" />
            <span>Mã hóa SSL 256-bit chuẩn PCI DSS quốc tế</span>
          </div>
        </div>
      </div>

      {/* Bottom Editorial Bar */}
      <div className="border-t border-slate-800 dark:border-white/[0.06] py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-mono text-slate-500 dark:text-slate-400">
        <div>
          © 2026 TECHGEAR PRO. All rights reserved. Hệ thống Thương Mại Điện Tử Phụ Kiện Máy Tính Cao Cấp.
        </div>
        <div className="flex items-center gap-4 text-[11px]">
          <span className="flex items-center gap-1.5 font-bold text-slate-300 dark:text-slate-300">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 dark:bg-signal-emerald animate-pulse" />
            SYS: ONLINE
          </span>
          <span className="text-slate-600 dark:text-slate-600">|</span>
          <span className="font-semibold text-slate-400 dark:text-slate-400">TLS 1.3 SECURED</span>
          <span className="text-slate-600 dark:text-slate-600">|</span>
          <span className="font-semibold text-slate-400 dark:text-slate-400">PCI-DSS VERIFIED</span>
        </div>
      </div>
    </footer>
  );
}
