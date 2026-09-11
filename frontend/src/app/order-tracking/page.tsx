'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
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

  const handleLookup = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg(null);

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

  useEffect(() => {
    if (initialOrderCode && initialPhone) {
      setTimeout(() => handleLookup(), 0);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialOrderCode, initialPhone]);

  // Order milestones definition
  const steps = [
    { key: 'pending', label: 'Chờ xác nhận', icon: Clock, desc: 'Đơn hàng vừa được tạo' },
    { key: 'processing', label: 'Đang xử lý', icon: Package, desc: 'Đóng gói & chuẩn bị hàng' },
    { key: 'shipping', label: 'Đang giao hàng', icon: Truck, desc: 'Bàn giao cho đơn vị vận chuyển' },
    { key: 'delivered', label: 'Đã giao hàng', icon: CheckCircle2, desc: 'Giao hàng thành công' },
  ];

  const getStepIndex = (status: string) => {
    switch (status) {
      case 'pending':
        return 0;
      case 'processing':
        return 1;
      case 'shipping':
        return 2;
      case 'delivered':
        return 3;
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
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
          Tra Cứu Tiến Trình Đơn Hàng
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          Nhập mã đơn hàng và số điện thoại mua hàng để theo dõi trạng thái vận chuyển theo thời gian thực.
        </p>
      </div>

      {/* New Order Banner */}
      {isNewOrder && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <span>
              <strong>Đặt hàng thành công!</strong> Đơn hàng <strong>{orderCode}</strong> đã được ghi nhận vào hệ thống.
            </span>
          </div>
        </div>
      )}

      {/* Lookup Form */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xl max-w-2xl mx-auto">
        <form onSubmit={handleLookup} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Mã đơn hàng
              </label>
              <input
                type="text"
                placeholder="Ví dụ: TG260911-1001"
                value={orderCode}
                onChange={(e) => setOrderCode(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono focus:outline-none focus:border-indigo-500 dark:focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Số điện thoại đặt hàng
              </label>
              <input
                type="tel"
                placeholder="Số điện thoại lúc đặt..."
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-indigo-500 dark:focus:border-cyan-400"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 disabled:opacity-50 transition-all"
          >
            <Search className="w-4 h-4" />
            <span>{loading ? 'Đang tra cứu...' : 'Tra Cứu Tiến Trình Đơn Hàng'}</span>
          </button>
        </form>

        {errorMsg && (
          <div className="mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* Order Status Display */}
      {order && (
        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-xl space-y-8 animate-in fade-in duration-300">
          {/* Top Order Meta */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-3">
                <span className="text-xl sm:text-2xl font-mono font-black text-indigo-600 dark:text-cyan-400">
                  {order.orderCode}
                </span>
                {isCancelled ? (
                  <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-rose-500/10 text-rose-500 border border-rose-500/20">
                    Đã Hủy Đơn
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                    {steps[currentStep]?.label || order.orderStatus}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5" />
                <span>Thời gian đặt: {formatDate(order.createdAt)}</span>
              </p>
            </div>

            <div className="text-right sm:text-right">
              <span className="text-xs text-slate-400 block">Tổng tiền đơn hàng:</span>
              <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                {formatVND(order.totalAmount)}
              </span>
            </div>
          </div>

          {/* Visual Step Progress Timeline */}
          {isCancelled ? (
            <div className="p-6 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/60 text-center space-y-2">
              <XCircle className="w-10 h-10 text-rose-500 mx-auto" />
              <h3 className="text-sm font-bold text-rose-600 dark:text-rose-400">
                Đơn hàng này đã bị hủy
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Nếu bạn có bất kỳ thắc mắc nào, vui lòng liên hệ hotline 1900 8888 để được đội ngũ CSKH hỗ trợ.
              </p>
            </div>
          ) : (
            <div className="py-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative">
                {steps.map((step, idx) => {
                  const isPassed = idx <= currentStep;
                  const isCurrent = idx === currentStep;
                  const StepIcon = step.icon;

                  return (
                    <div key={step.key} className="flex flex-col items-center text-center space-y-2 z-10">
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                          isPassed
                            ? 'bg-gradient-to-tr from-indigo-600 to-cyan-500 text-white shadow-lg shadow-indigo-500/25'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700'
                        } ${isCurrent ? 'ring-4 ring-cyan-400/20 scale-105' : ''}`}
                      >
                        <StepIcon className="w-6 h-6" />
                      </div>
                      <span className={`text-xs font-bold ${isPassed ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
                        {step.label}
                      </span>
                      <span className="text-[11px] text-slate-400 max-w-[130px] hidden sm:block">
                        {step.desc}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Details 2-Column Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100 dark:border-slate-800">
            {/* Customer & Shipping info */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-3 text-xs">
              <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-indigo-500 dark:text-cyan-400" />
                <span>Thông Tin Nhận Hàng</span>
              </h4>
              <div className="space-y-1.5 text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-semibold">{order.customerInfo?.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{order.customerInfo?.phone}</span>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5" />
                  <span>{order.customerInfo?.address}</span>
                </div>
                {order.customerInfo?.note && (
                  <p className="italic text-slate-400 text-[11px] pt-1">
                    Ghi chú: &quot;{order.customerInfo.note}&quot;
                  </p>
                )}
              </div>
            </div>

            {/* Payment info */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-3 text-xs">
              <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-indigo-500 dark:text-cyan-400" />
                <span>Thanh Toán & Hóa Đơn</span>
              </h4>
              <div className="space-y-1.5 text-slate-600 dark:text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-400">Hình thức:</span>
                  <span className="font-bold">
                    {order.paymentMethod === 'ONLINE' ? 'Trực tuyến (VNPAY / QR)' : 'COD (Tiền mặt khi nhận)'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Trạng thái thanh toán:</span>
                  <span
                    className={`font-bold ${
                      order.paymentStatus === 'paid' ? 'text-emerald-500' : 'text-amber-500'
                    }`}
                  >
                    {order.paymentStatus === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                  </span>
                </div>
                {order.vnpayTransactionNo && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Mã giao dịch VNPAY:</span>
                    <span className="font-mono">{order.vnpayTransactionNo}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">
              Danh Sách Mặt Hàng Trong Đơn ({order.items?.length})
            </h4>
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
              {order.items?.map((item: any, i: number) => (
                <div key={i} className="p-3.5 flex items-center justify-between gap-4 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-slate-100 dark:bg-slate-800">
                      <Image
                        src={item.image || 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=150&q=80'}
                        alt={item.name}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 dark:text-slate-200">{item.name}</p>
                      <p className="text-slate-400">
                        {formatVND(item.price)} × {item.quantity}
                      </p>
                    </div>
                  </div>
                  <span className="font-black text-indigo-600 dark:text-cyan-400">
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
    <Suspense fallback={<div className="p-12 text-center text-sm">Đang tải trang tra cứu...</div>}>
      <OrderTrackingContent />
    </Suspense>
  );
}
