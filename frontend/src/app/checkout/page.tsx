'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  CreditCard,
  Truck,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ChevronLeft,
  QrCode,
} from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore, useIsAuthHydrated } from '@/store/authStore';
import { fetchApi } from '@/lib/api';
import { formatVND } from '@/lib/utils';

export default function CheckoutPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const isHydrated = useIsAuthHydrated();
  const { items, clearCart, getTotalPrice } = useCartStore();
  const { user } = useAuthStore();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    note: '',
  });

  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'ONLINE'>('COD');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (user) {
      const defaultName = user.fullName || (user as any).name || '';
      const defaultPhone = user.phone || '';
      setFormData((prev) => ({
        ...prev,
        name: prev.name && prev.name.trim() !== '' ? prev.name : defaultName,
        phone: prev.phone && prev.phone.trim() !== '' ? prev.phone : defaultPhone,
      }));
    }
  }, [user, isHydrated]);

  if (!mounted) {
    return <div className="p-12 text-center text-sm">Đang tải biểu mẫu đặt hàng...</div>;
  }

  if (items.length === 0) {
    return (
      <div className="max-w-md mx-auto py-20 px-4 text-center space-y-4">
        <h2 className="text-xl font-black text-slate-900 dark:text-white">Giỏ hàng của bạn đang trống</h2>
        <p className="text-xs font-mono text-slate-600 dark:text-slate-400 font-medium">Vui lòng chọn sản phẩm vào giỏ trước khi tiến hành thanh toán.</p>
        <Link
          href="/products"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white dark:bg-signal-cyan dark:text-slate-950 dark:hover:bg-cyan-400 rounded-xl text-xs font-mono font-bold shadow-md surface-bevel active:translate-y-0.5 transition-all"
        >
          <span>Xem sản phẩm</span>
        </Link>
      </div>
    );
  }

  const subtotal = getTotalPrice();
  const shippingFee = subtotal >= 1000000 || subtotal === 0 ? 0 : 30000;
  const finalTotal = subtotal + shippingFee;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const finalName = (formData.name.trim() || user?.fullName || (user as any)?.name || '').trim();
    const finalPhone = (formData.phone.trim() || user?.phone || '').trim();
    const finalAddress = formData.address.trim();

    if (!finalName || !finalPhone || !finalAddress) {
      setErrorMsg('Vui lòng điền đầy đủ họ tên, số điện thoại và địa chỉ nhận hàng');
      return;
    }

    setIsSubmitting(true);

    try {
      const orderPayload = {
        customerInfo: {
          name: finalName,
          phone: finalPhone,
          address: finalAddress,
          note: formData.note.trim(),
        },
        items: items.map((i) => ({
          productId: i.product._id,
          name: i.product.name,
          quantity: i.quantity,
          price: i.product.discountPrice && i.product.discountPrice > 0 ? i.product.discountPrice : i.product.price,
          category: i.product.category,
        })),
        paymentMethod,
      };

      const res = await fetchApi('/orders', {
        method: 'POST',
        body: JSON.stringify(orderPayload),
      });

      if (!res.success || !res.data) {
        setErrorMsg(res.message || 'Đặt hàng thất bại. Vui lòng thử lại!');
        setIsSubmitting(false);
        return;
      }

      const { order, paymentUrl } = res.data;
      clearCart();

      if (paymentMethod === 'ONLINE') {
        const targetUrl = paymentUrl || `/payment-qr?orderCode=${order.orderCode}`;
        router.push(targetUrl);
      } else {
        // COD order confirmed directly
        router.push(`/order-tracking?orderCode=${order.orderCode}&phone=${encodeURIComponent(finalPhone)}&newOrder=true`);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi kết nối máy chủ');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex items-center gap-2">
        <Link href="/cart" className="text-xs font-mono text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-black flex items-center gap-1 font-semibold transition-colors">
          <ChevronLeft className="w-4 h-4" />
          <span>Quay lại giỏ hàng</span>
        </Link>
      </div>

      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
          Thanh Toán Đơn Hàng
        </h1>
        <p className="text-xs sm:text-sm font-mono text-slate-600 dark:text-slate-400 mt-1">
          Hoàn tất thông tin nhận hàng và phương thức thanh toán an toàn
        </p>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/25 text-xs font-mono text-rose-700 dark:text-signal-rose flex items-center gap-2 font-bold">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Delivery Info & Payment Method (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* 1. Customer Information - Minimalist Stripe style */}
          <div className="rounded-2xl border hairline-border surface-bevel bg-surface-card p-6 space-y-4 shadow-sm">
            <div className="flex items-center gap-2 pb-3 border-b hairline-border">
              <span className="w-5 h-5 rounded-md bg-slate-100 dark:bg-surface-elevated text-slate-950 dark:text-white border border-slate-300 dark:border-white/10 flex items-center justify-center text-xs font-mono font-bold">
                1
              </span>
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Thông Tin Nhận Hàng // Shipping Address
              </h2>
            </div>

            {user && (
              <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse flex-shrink-0" />
                  <span className="text-slate-700 dark:text-slate-300">
                    Tài khoản: <strong className="text-slate-900 dark:text-white">{user.fullName}</strong> ({user.email})
                  </span>
                </div>
                <span className="text-[10px] font-mono font-bold text-cyan-700 dark:text-cyan-300 bg-cyan-500/20 px-2 py-0.5 rounded self-start sm:self-auto">
                  Đã tự động điền họ tên &amp; SĐT
                </span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Họ và tên người nhận <span className="text-rose-600 dark:text-signal-rose">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Nguyễn Văn A"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs rounded-lg bg-slate-50 dark:bg-surface-elevated border hairline-border text-slate-900 dark:text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-slate-500 dark:focus:border-signal-cyan/60 transition-colors font-medium"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Số điện thoại nhận hàng <span className="text-rose-600 dark:text-signal-rose">*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="Ví dụ: 0987654321"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs rounded-lg bg-slate-50 dark:bg-surface-elevated border hairline-border text-slate-900 dark:text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-slate-500 dark:focus:border-signal-cyan/60 font-mono transition-colors font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                Địa chỉ giao hàng chi tiết <span className="text-rose-600 dark:text-signal-rose">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs rounded-lg bg-slate-50 dark:bg-surface-elevated border hairline-border text-slate-900 dark:text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-slate-500 dark:focus:border-signal-cyan/60 transition-colors font-medium"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                Ghi chú cho shipper (Tùy chọn)
              </label>
              <textarea
                rows={2}
                placeholder="Giao giờ hành chính, gọi trước khi đến..."
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                className="w-full px-3.5 py-2 text-xs rounded-lg bg-slate-50 dark:bg-surface-elevated border hairline-border text-slate-900 dark:text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-slate-500 dark:focus:border-signal-cyan/60 resize-none transition-colors font-medium"
              />
            </div>
          </div>

          {/* 2. Payment Method Cards */}
          <div className="rounded-2xl border hairline-border surface-bevel bg-surface-card p-6 space-y-4 shadow-sm">
            <div className="flex items-center gap-2 pb-3 border-b hairline-border">
              <span className="w-5 h-5 rounded-md bg-slate-100 dark:bg-surface-elevated text-slate-950 dark:text-white border border-slate-300 dark:border-white/10 flex items-center justify-center text-xs font-mono font-bold">
                2
              </span>
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Phương Thức Thanh Toán // Payment Channel
              </h2>
            </div>

            <div className="space-y-3">
              {/* Option COD Card */}
              <label
                className={`flex items-start gap-3.5 p-4 rounded-xl border transition-all cursor-pointer ${
                  paymentMethod === 'COD'
                    ? 'border-slate-900 dark:border-signal-cyan/80 bg-slate-100/60 dark:bg-signal-cyan/10 surface-bevel shadow-sm ring-1 ring-slate-900/50 dark:ring-cyan-500/50'
                    : 'border hairline-border surface-bevel bg-surface-elevated/40 hover:bg-surface-elevated hover:border-slate-400 dark:hover:border-signal-cyan/30'
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  value="COD"
                  checked={paymentMethod === 'COD'}
                  onChange={() => setPaymentMethod('COD')}
                  className="mt-1 accent-slate-900 dark:accent-signal-cyan"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Truck className="w-4 h-4 text-emerald-700 dark:text-signal-emerald" />
                      <span className="font-bold text-xs text-slate-900 dark:text-white">
                        Thanh toán khi nhận hàng (COD)
                      </span>
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-surface-card border hairline-border text-slate-700 dark:text-slate-300">
                      TIỀN MẶT
                    </span>
                  </div>
                  <p className="text-[11px] font-mono text-slate-600 dark:text-slate-400 mt-1 font-medium">
                    Được mở hộp đồng kiểm chất lượng trước khi thanh toán tiền mặt trực tiếp cho nhân viên vận chuyển.
                  </p>
                </div>
              </label>

              {/* Option ONLINE / VietQR MB Bank Card */}
              <label
                className={`flex items-start gap-3.5 p-4 rounded-xl border transition-all cursor-pointer ${
                  paymentMethod === 'ONLINE'
                    ? 'border-slate-900 dark:border-signal-cyan/80 bg-slate-100/60 dark:bg-signal-cyan/10 surface-bevel shadow-sm ring-1 ring-slate-900/50 dark:ring-cyan-500/50'
                    : 'border hairline-border surface-bevel bg-surface-elevated/40 hover:bg-surface-elevated hover:border-slate-400 dark:hover:border-signal-cyan/30'
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  value="ONLINE"
                  checked={paymentMethod === 'ONLINE'}
                  onChange={() => setPaymentMethod('ONLINE')}
                  className="mt-1 accent-slate-900 dark:accent-signal-cyan"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <QrCode className="w-4 h-4 text-cyan-600 dark:text-signal-cyan" />
                      <span className="font-bold text-xs text-slate-900 dark:text-white">
                        Thanh toán trực tuyến (ONLINE / QR)
                      </span>
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border border-cyan-500/20">
                      VIETQR / MB BANK
                    </span>
                  </div>
                  <p className="text-[11px] font-mono text-slate-600 dark:text-slate-400 mt-1 font-medium">
                    Quét mã VietQR chuyển khoản nhanh 24/7 qua MB Bank (Ngân hàng Quân Đội), tự động điền số tiền và mã đơn hàng.
                  </p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Right Column: Order Items Summary (5 cols) */}
        <div className="lg:col-span-5 sticky top-24">
          <div className="rounded-2xl border hairline-border surface-bevel bg-surface-card p-6 space-y-5 shadow-xl">
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-900 dark:text-white pb-3 border-b hairline-border">
              Kiểm Tra Đơn Hàng ({items.length} món)
            </h2>

            {/* Items scroll area */}
            <div className="max-h-60 overflow-y-auto divide-y hairline-border pr-1">
              {items.map(({ product, quantity }) => {
                const price =
                  product.discountPrice && product.discountPrice > 0 ? product.discountPrice : product.price;
                return (
                  <div key={product._id} className="py-2.5 flex items-center gap-3">
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-surface-elevated border hairline-border">
                      <Image
                        src={product.images?.[0] || 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=200&q=80'}
                        alt={product.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                        {product.name}
                      </p>
                      <p className="text-[11px] font-mono text-slate-600 dark:text-slate-400 tabular-nums font-medium">
                        {formatVND(price)} × {quantity}
                      </p>
                    </div>
                    <div className="text-xs font-mono tabular-nums font-black text-slate-950 dark:text-white">
                      {formatVND(price * quantity)}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Cost Breakdown */}
            <div className="space-y-2 pt-3 border-t hairline-border text-xs font-mono">
              <div className="flex justify-between text-slate-700 dark:text-slate-400 font-medium">
                <span>Tạm tính tiền hàng:</span>
                <span className="font-bold tabular-nums text-slate-900 dark:text-white">{formatVND(subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-700 dark:text-slate-400 font-medium">
                <span>Phí vận chuyển:</span>
                <span className="font-bold tabular-nums text-emerald-700 dark:text-signal-emerald">
                  {shippingFee === 0 ? 'MIỄN PHÍ' : formatVND(shippingFee)}
                </span>
              </div>
              <div className="flex justify-between items-baseline pt-2 border-t hairline-border">
                <span className="text-xs font-mono uppercase tracking-wider font-bold text-slate-700 dark:text-slate-400">Tổng thanh toán:</span>
                <span className="text-2xl font-mono tabular-nums font-black text-slate-950 dark:text-white">
                  {formatVND(finalTotal)}
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-signal-cyan dark:text-slate-950 dark:hover:bg-cyan-400 font-black text-sm flex items-center justify-center gap-2 shadow-md disabled:opacity-50 active:translate-y-0.5 transition-all"
            >
              {isSubmitting ? (
                <span className="font-mono">Đang xử lý đơn hàng...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Xác Nhận Đặt Hàng Ngay</span>
                </>
              )}
            </button>

            <p className="text-[11px] font-mono text-slate-600 dark:text-slate-400 text-center leading-relaxed font-medium">
              Bằng việc xác nhận đặt hàng, bạn đồng ý với các điều khoản bảo hành và chính sách mua sắm của TECHGEAR PRO.
            </p>
          </div>
        </div>
      </form>
    </div>
  );
}
