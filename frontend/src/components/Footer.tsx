import Link from 'next/link';
import { Shield, Truck, RotateCcw, Headphones, CreditCard, Mail, Phone, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 transition-colors">
      {/* 4 Feature Highlights */}
      <div className="border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-cyan-400">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">Chính Hãng 100%</h4>
              <p className="text-xs text-slate-400">Bảo hành 24 tháng toàn diện</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">Giao Hàng Hỏa Tốc</h4>
              <p className="text-xs text-slate-400">Freeship đơn từ 1.000.000đ</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">Đổi Mới Trong 7 Ngày</h4>
              <p className="text-xs text-slate-400">Nếu phát sinh lỗi phần cứng</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Headphones className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">Hỗ Trợ 24/7</h4>
              <p className="text-xs text-slate-400">Tư vấn cấu hình chuyên nghiệp</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-400 p-0.5">
              <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center">
                <span className="font-black text-cyan-400 text-lg">TG</span>
              </div>
            </div>
            <span className="font-black text-xl text-white">TECH<span className="text-cyan-400">GEAR</span></span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Hệ thống phân phối thiết bị máy tính, phụ kiện gaming gear và công nghệ cao cấp hàng đầu Việt Nam. Tận tâm phục vụ cộng đồng đam mê công nghệ.
          </p>
          <div className="space-y-2 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-cyan-400 flex-shrink-0" />
              <span>Tòa nhà TechTower, 120 Cầu Giấy, Hà Nội</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-cyan-400 flex-shrink-0" />
              <span>Hotline CSKH: 1900 8888 (8:00 - 21:30)</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-cyan-400 flex-shrink-0" />
              <span>support@techgear.vn</span>
            </div>
          </div>
        </div>

        <div>
          <h4 className="font-bold text-white text-sm uppercase tracking-wider mb-4">Danh Mục Sản Phẩm</h4>
          <ul className="space-y-2.5 text-xs text-slate-400">
            <li><Link href="/products?category=monitor" className="hover:text-cyan-400 transition-colors">Màn hình gaming OLED / 240Hz</Link></li>
            <li><Link href="/products?category=keyboard" className="hover:text-cyan-400 transition-colors">Bàn phím cơ Custom & Rapid Trigger</Link></li>
            <li><Link href="/products?category=mouse" className="hover:text-cyan-400 transition-colors">Chuột thi đấu siêu nhẹ (Ultralight)</Link></li>
            <li><Link href="/products?category=headphone" className="hover:text-cyan-400 transition-colors">Tai nghe chống ồn chủ động (ANC)</Link></li>
            <li><Link href="/products?isHot=true" className="hover:text-cyan-400 transition-colors">Sản phẩm HOT & Bán chạy nhất</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold text-white text-sm uppercase tracking-wider mb-4">Chính Sách & Hỗ Trợ</h4>
          <ul className="space-y-2.5 text-xs text-slate-400">
            <li><Link href="/order-tracking" className="hover:text-cyan-400 transition-colors">Tra cứu tiến trình đơn hàng</Link></li>
            <li><Link href="#" className="hover:text-cyan-400 transition-colors">Chính sách bảo hành và đổi trả</Link></li>
            <li><Link href="#" className="hover:text-cyan-400 transition-colors">Chính sách vận chuyển & kiểm hàng</Link></li>
            <li><Link href="#" className="hover:text-cyan-400 transition-colors">Bảo mật thông tin khách hàng</Link></li>
            <li><Link href="#" className="hover:text-cyan-400 transition-colors">Hướng dẫn thanh toán VNPAY / MoMo / COD</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold text-white text-sm uppercase tracking-wider mb-4">Phương Thức Thanh Toán</h4>
          <p className="text-xs text-slate-400 mb-3">Hỗ trợ đa dạng phương thức an toàn, xác nhận giao dịch tức thời:</p>
          <div className="grid grid-cols-3 gap-2">
            <div className="p-2 bg-slate-800 rounded-lg text-center text-xs font-bold text-emerald-400 border border-slate-700">COD</div>
            <div className="p-2 bg-slate-800 rounded-lg text-center text-xs font-bold text-cyan-400 border border-slate-700">VNPAY</div>
            <div className="p-2 bg-slate-800 rounded-lg text-center text-xs font-bold text-pink-400 border border-slate-700">MOMO</div>
          </div>
          <div className="mt-4 p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-[11px] text-slate-400 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-indigo-400 flex-shrink-0" />
            <span>Mã hóa SSL 256-bit chuẩn PCI DSS quốc tế</span>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-800/80 py-4 text-center text-xs text-slate-500">
        © 2026 TECHGEAR PRO. All rights reserved. Hệ thống Thương Mại Điện Tử Phụ Kiện Máy Tính Cao Cấp.
      </div>
    </footer>
  );
}
