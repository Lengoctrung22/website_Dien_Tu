'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import {
  Search,
  Package,
  Clock,
  Truck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Calendar,
  MapPin,
  CreditCard,
  User,
  Phone,
  PackageCheck,
} from 'lucide-react';
import { fetchApi } from '@/lib/api';
import { formatVND, formatDate } from '@/lib/utils';

function OrderTrackingContent() {
  const searchParams = useSearchParams();
  const initialOrderCode = searchParams.get('orderCode') || '';
  const initialPhone = searchParams.get('phone') || '';
  const isNewOrder = searchParams.get('newOrder') === 'true';

  const [orderCode, setOrderCode] = useState(initialOrderCode);
  const [phone, setPhone] = useState(initialPhone);
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [confirmingReceipt, setConfirmingReceipt] = useState(false);
  const [confirmSuccessMsg, setConfirmSuccessMsg] = useState<string | null>(null);

  const handleLookup = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg(null);
    setConfirmSuccessMsg(null);

    if (!orderCode.trim() || !phone.trim()) {
      setErrorMsg('Vui lòng nhập cả Mã đơn hàng và Số điện thoại đặt hàng');
      return;
    }

    setLoading(true);
    try {
      const res = await fetchApi(
        `/orders/lookup?orderCode=${encodeURIComponent(orderCode.trim())}&phone=${encodeURIComponent(
          phone.trim()
        )}`
      );

      if (res.success && res.data) {
        setOrder(res.data);
      } else {
        setOrder(null);
        setErrorMsg(res.message || 'Không tìm thấy đơn hàng với thông tin đã nhập.');
      }
    } catch {
      setErrorMsg('Không thể kết nối đến máy chủ.');
    }
    setLoading(false);
  };

  const handleConfirmReceipt = async () => {
    if (!order) return;
    if (!window.confirm('Bạn xác nhận đã nhận được kiện hàng này và muốn hoàn tất đơn hàng?')) {
      return;
    }

    setConfirmingReceipt(true);
    setErrorMsg(null);
    try {
      const res = await fetchApi(`/orders/${order._id}/confirm-receipt`, {
        method: 'POST',
        body: JSON.stringify({ phone: order.customerInfo?.phone || phone.trim() }),
      });

      if (res.success && res.data) {
        setOrder(res.data);
        setConfirmSuccessMsg(res.message || 'Xác nhận nhận hàng thành công! Đơn hàng đã hoàn tất.');
        setTimeout(() => setConfirmSuccessMsg(null), 6000);
      } else if (res.data && res.data.orderStatus === 'delivered') {
        setOrder(res.data);
        setConfirmSuccessMsg('Đơn hàng đã được xác nhận hoàn tất thành công!');
        setTimeout(() => setConfirmSuccessMsg(null), 6000);
      } else {
        setErrorMsg(res.message || 'Không thể xác nhận nhận hàng.');
      }
    } catch {
      setErrorMsg('Lỗi kết nối khi xác nhận nhận hàng.');
    } finally {
      setConfirmingReceipt(false);
    }
  };

  useEffect(() => {
    if (initialOrderCode && initialPhone) {
      setTimeout(() => handleLookup(), 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialOrderCode, initialPhone]);

  // Order milestones definition: 5-step timeline with hairline connector tracks
  const steps = [
    { key: 'pending', stepNum: '01', label: 'Tiếp nhận đơn', icon: Clock, desc: 'Đã ghi nhận đơn hàng' },
    { key: 'processing', stepNum: '02', label: 'Đóng gói & QC', icon: Package, desc: 'Kiểm tra kỹ thuật & đóng hộp' },
    { key: 'dispatched', stepNum: '03', label: 'Xuất kho', icon: Truck, desc: 'Bàn giao đơn vị vận chuyển' },
    { key: 'shipping', stepNum: '04', label: 'Đang giao hàng (Chờ nhận)', icon: MapPin, desc: 'Shipper đang giao hàng' },
    { key: 'delivered', stepNum: '05', label: '✓ Đã nhận hàng (Hoàn tất)', icon: CheckCircle2, desc: 'Giao hàng thành công' },
  ];

  const getStepIndex = (status: string) => {
    switch (status) {
      case 'pending':
        return 0;
      case 'processing':
        return 1;
      case 'shipping':
        return 3;
      case 'delivered':
        return 4;
      case 'cancelled':
        return -1;
      default:
        return 0;
    }
  };

  const currentStep = order ? getStepIndex(order.orderStatus) : 0;
  const isCancelled = order?.orderStatus === 'cancelled';

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider bg-slate-100 dark:bg-surface-card border hairline-border text-slate-950 dark:text-white mb-1">
          <Truck className="w-3 h-3" />
          REALTIME LOGISTICS TELEMETRY
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
          Tra Cứu Tiến Trình Đơn Hàng
        </h1>
        <p className="text-xs sm:text-sm font-mono text-slate-600 dark:text-slate-400 max-w-md mx-auto">
          Nhập mã đơn hàng và số điện thoại mua hàng để theo dõi trạng thái vận chuyển theo thời gian thực.
        </p>
      </div>

      {/* New Order Banner */}
      {isNewOrder && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-signal-emerald text-xs font-mono flex items-center justify-between gap-3 animate-in fade-in font-medium">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <span>
              <strong>Đặt hàng thành công!</strong> Đơn hàng <strong>{orderCode}</strong> đã được ghi nhận vào hệ thống.
            </span>
          </div>
        </div>
      )}

      {/* Lookup Form */}
      <div className="rounded-2xl border hairline-border surface-bevel bg-surface-card p-6 shadow-xl max-w-2xl mx-auto">
        <form onSubmit={handleLookup} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                Mã đơn hàng
              </label>
              <input
                type="text"
                placeholder="Ví dụ: TG260911-1001"
                value={orderCode}
                onChange={(e) => setOrderCode(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-lg bg-slate-50 dark:bg-surface-elevated border hairline-border font-mono text-slate-900 dark:text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-slate-500 dark:focus:border-signal-cyan/60 font-medium"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                Số điện thoại đặt hàng
              </label>
              <input
                type="tel"
                placeholder="Số điện thoại lúc đặt..."
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-lg bg-slate-50 dark:bg-surface-elevated border hairline-border font-mono text-slate-900 dark:text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-slate-500 dark:focus:border-signal-cyan/60 font-medium"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-signal-cyan dark:text-slate-950 dark:hover:bg-cyan-400 font-mono font-bold text-xs flex items-center justify-center gap-2 shadow-md disabled:opacity-50 active:translate-y-0.5 transition-all"
          >
            <Search className="w-4 h-4" />
            <span>{loading ? 'Đang tra cứu...' : 'Tra Cứu Tiến Trình Đơn Hàng'}</span>
          </button>
        </form>

        {errorMsg && (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-xs font-mono text-rose-700 dark:text-signal-rose flex items-center gap-2 font-bold">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* Order Status Display */}
      {order && (
        <div className="rounded-2xl border hairline-border surface-bevel bg-surface-card p-6 sm:p-8 shadow-xl space-y-8 animate-in fade-in duration-300">
          {/* Top Order Meta */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b hairline-border">
            <div>
              <div className="flex items-center gap-3">
                <span className="text-xl sm:text-2xl font-mono font-black text-slate-950 dark:text-white">
                  {order.orderCode}
                </span>
                {isCancelled ? (
                  <span className="px-3 py-1 rounded-md text-xs font-mono font-bold uppercase bg-rose-500/10 text-rose-700 dark:text-signal-rose border border-rose-500/25">
                    Đã Hủy Đơn
                  </span>
                ) : order.orderStatus === 'shipping' ? (
                  <span className="px-3 py-1 rounded-md text-xs font-mono font-bold uppercase bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30">
                    {steps[currentStep]?.label || 'Đang giao hàng (Chờ nhận)'}
                  </span>
                ) : order.orderStatus === 'delivered' ? (
                  <span className="px-3 py-1 rounded-md text-xs font-mono font-bold uppercase bg-emerald-500/15 text-emerald-700 dark:text-signal-emerald border border-emerald-500/30">
                    {steps[currentStep]?.label || '✓ Đã nhận hàng (Hoàn tất)'}
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-md text-xs font-mono font-bold uppercase bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30">
                    {steps[currentStep]?.label || order.orderStatus}
                  </span>
                )}
              </div>
              <p className="text-xs font-mono text-slate-600 dark:text-slate-400 mt-1 flex items-center gap-2 font-medium">
                <Calendar className="w-3.5 h-3.5" />
                <span>Thời gian đặt: {formatDate(order.createdAt)}</span>
              </p>
            </div>

            <div className="text-left sm:text-right font-mono">
              <span className="text-xs text-slate-600 dark:text-slate-400 block uppercase tracking-wider font-bold">Tổng tiền đơn hàng:</span>
              <span className="text-xl sm:text-2xl font-black tabular-nums text-slate-900 dark:text-white">
                {formatVND(order.totalAmount)}
              </span>
            </div>
          </div>

          {/* Customer Confirm Receipt Banner when order is shipping */}
          {order.orderStatus === 'shipping' && (
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-cyan-500/10 to-transparent border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-signal-emerald flex items-center justify-center flex-shrink-0">
                  <PackageCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    Đơn hàng đang trên đường giao đến bạn!
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 font-mono">
                    Nếu bạn đã nhận và kiểm tra kiện hàng, vui lòng nhấn xác nhận bên dưới để hoàn tất đơn.
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={confirmingReceipt}
                onClick={handleConfirmReceipt}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-mono font-bold text-xs shadow-md transition-all active:scale-95 disabled:opacity-50 flex-shrink-0"
              >
                <CheckCircle2 className={`w-4 h-4 ${confirmingReceipt ? 'animate-spin' : ''}`} />
                <span>{confirmingReceipt ? 'Đang xác nhận...' : 'Đã nhận được hàng'}</span>
              </button>
            </div>
          )}

          {/* Success Banner upon confirming */}
          {confirmSuccessMsg && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-signal-emerald text-xs font-mono flex items-center gap-2 font-bold animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{confirmSuccessMsg}</span>
            </div>
          )}

          {/* 5-Step Visual Progress Timeline with Hairline Connector Tracks */}
          {isCancelled ? (
            <div className="p-6 rounded-xl bg-rose-500/10 border border-rose-500/25 text-center space-y-2 font-mono">
              <XCircle className="w-10 h-10 text-rose-700 dark:text-signal-rose mx-auto" />
              <h3 className="text-sm font-bold text-rose-700 dark:text-signal-rose">
                Đơn hàng này đã bị hủy
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                Nếu bạn có bất kỳ thắc mắc nào, vui lòng liên hệ hotline 1900 8888 để được đội ngũ CSKH hỗ trợ.
              </p>
            </div>
          ) : (
            <div className="py-6 px-2">
              <div className="relative">
                {/* Horizontal Hairline Connector Track (sm+ desktop) */}
                <div className="absolute top-6 left-[10%] right-[10%] h-[2px] bg-slate-200 dark:bg-surface-subtle hidden sm:block z-0">
                  <div
                    className="h-full bg-cyan-600 dark:bg-signal-cyan transition-all duration-500"
                    style={{
                      width: `${(Math.max(0, currentStep) / (steps.length - 1)) * 100}%`,
                    }}
                  />
                </div>

                {/* Vertical Hairline Connector Track (mobile <sm) */}
                <div className="absolute top-6 bottom-6 left-6 w-[2px] -translate-x-1/2 bg-slate-200 dark:bg-surface-subtle block sm:hidden z-0">
                  <div
                    className="w-full bg-cyan-600 dark:bg-signal-cyan transition-all duration-500"
                    style={{
                      height: `${(Math.max(0, currentStep) / (steps.length - 1)) * 100}%`,
                    }}
                  />
                </div>

                {/* 5 Milestone Nodes */}
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-6 sm:gap-4 relative z-10">
                  {steps.map((step, idx) => {
                    const isPassed = idx <= currentStep;
                    const isCurrent = idx === currentStep;
                    const StepIcon = step.icon;

                    return (
                      <div key={step.key} className="flex sm:flex-col items-center sm:text-center gap-3 sm:gap-2">
                        <div className="relative flex-shrink-0">
                          <div
                            className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                              isPassed
                                ? 'bg-white dark:bg-surface-card border border-slate-900 dark:border-signal-cyan text-slate-950 dark:text-white surface-bevel shadow-sm'
                                : 'bg-slate-100 dark:bg-surface-elevated text-slate-500 dark:text-slate-400 border hairline-border'
                            } ${isCurrent ? 'ring-2 ring-slate-900 dark:ring-signal-cyan ring-offset-2 ring-offset-surface-canvas scale-105' : ''}`}
                          >
                            <StepIcon className="w-5 h-5" />
                          </div>
                          {isCurrent && (
                            <span className="w-2.5 h-2.5 rounded-full bg-slate-900 dark:bg-signal-cyan animate-ping absolute -top-1 -right-1" />
                          )}
                        </div>
                        <div className="space-y-0.5 text-left sm:text-center">
                          <span className="text-[10px] font-mono font-bold text-slate-600 dark:text-slate-400 block">
                            STEP {step.stepNum}
                          </span>
                          <span className={`text-xs font-mono font-bold block ${isPassed ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-500'}`}>
                            {step.label}
                          </span>
                          <span className="text-[11px] font-mono text-slate-600 dark:text-slate-400 sm:max-w-[130px] block font-medium">
                            {step.desc}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Details 2-Column Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t hairline-border">
            {/* Customer & Shipping info */}
            <div className="p-4 rounded-xl bg-surface-elevated border hairline-border surface-bevel space-y-3 text-xs font-mono">
              <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-slate-900 dark:text-black" />
                <span>Thông Tin Nhận Hàng</span>
              </h4>
              <div className="space-y-1.5 text-slate-700 dark:text-slate-300">
                <div className="flex items-center gap-2 text-slate-900 dark:text-slate-200">
                  <User className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                  <span className="font-bold">{order.customerInfo?.name}</span>
                </div>
                <div className="flex items-center gap-2 font-medium">
                  <Phone className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                  <span>{order.customerInfo?.phone}</span>
                </div>
                <div className="flex items-start gap-2 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 mt-0.5" />
                  <span>{order.customerInfo?.address}</span>
                </div>
                {order.customerInfo?.note && (
                  <p className="italic text-slate-600 dark:text-slate-400 text-[11px] pt-1">
                    Ghi chú: &quot;{order.customerInfo.note}&quot;
                  </p>
                )}
              </div>
            </div>

            {/* Payment info */}
            <div className="p-4 rounded-xl bg-surface-elevated border hairline-border surface-bevel space-y-3 text-xs font-mono">
              <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-slate-900 dark:text-black" />
                <span>Thanh Toán & Hóa Đơn</span>
              </h4>
              <div className="space-y-1.5 text-slate-700 dark:text-slate-300 font-medium">
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Hình thức:</span>
                  <span className="font-bold text-slate-900 dark:text-slate-200">
                    {order.paymentMethod === 'ONLINE' ? 'Trực tuyến (VNPAY / QR)' : 'COD (Tiền mặt khi nhận)'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Trạng thái thanh toán:</span>
                  <span
                    className={`font-bold ${
                      order.paymentStatus === 'paid' ? 'text-emerald-700 dark:text-signal-emerald' : 'text-amber-700 dark:text-signal-amber'
                    }`}
                  >
                    {order.paymentStatus === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                  </span>
                </div>
                {order.vnpayTransactionNo && (
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Mã giao dịch VNPAY:</span>
                    <span className="font-mono font-bold text-slate-950 dark:text-white">{order.vnpayTransactionNo}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="space-y-3">
            <h4 className="font-mono font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">
              Danh Sách Mặt Hàng Trong Đơn ({order.items?.length})
            </h4>
            <div className="rounded-xl border hairline-border surface-bevel overflow-hidden divide-y hairline-border bg-surface-card">
              {order.items?.map((item: any, i: number) => (
                <div key={i} className="p-3.5 flex items-center justify-between gap-4 text-xs font-mono">
                  <div className="flex items-center gap-3">
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-surface-elevated border hairline-border">
                      <Image
                        src={item.image || 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=150&q=80'}
                        alt={item.name}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 dark:text-slate-200 font-sans">{item.name}</p>
                      <p className="text-slate-600 dark:text-slate-400 tabular-nums font-medium">
                        {formatVND(item.price)} × {item.quantity}
                      </p>
                    </div>
                  </div>
                  <span className="font-black tabular-nums text-slate-950 dark:text-white">
                    {formatVND(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function OrderTrackingPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-sm font-mono">Đang tải trang tra cứu...</div>}>
      <OrderTrackingContent />
    </Suspense>
  );
}
