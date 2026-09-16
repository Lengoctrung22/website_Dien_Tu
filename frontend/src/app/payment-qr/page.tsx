'use client';

import { Suspense, useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  QrCode,
  Building2,
  Copy,
  Check,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  RefreshCw,
  Eye,
  CreditCard,
  Sparkles,
} from 'lucide-react';
import { fetchApi } from '@/lib/api';
import { formatVND } from '@/lib/utils';

interface CustomerInfo {
  name: string;
  phone: string;
  address: string;
  note?: string;
}

interface OrderItem {
  productId: string;
  name: string;
  image?: string;
  quantity: number;
  price: number;
  category?: string;
}

interface OrderData {
  _id: string;
  orderCode: string;
  totalAmount: number;
  shippingFee: number;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: string;
  customerInfo: CustomerInfo;
  items: OrderItem[];
  createdAt: string;
}

function PaymentQRContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderCode = searchParams.get('orderCode');

  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(Boolean(orderCode));
  const [error, setError] = useState<string | null>(
    orderCode ? null : 'Không tìm thấy mã đơn hàng trong đường dẫn.'
  );
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [qrMode, setQrMode] = useState<'dynamic' | 'original'>('dynamic');
  const [isNotifying, setIsNotifying] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const BANK_INFO = {
    bankName: 'Ngân hàng Quân Đội (MB Bank)',
    bin: '970422',
    accountNumber: '010253534444',
    accountHolder: 'LE NGOC TRUNG',
  };

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    const timer = setTimeout(() => {
      setToastMessage(null);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!orderCode) return;

    let isMounted = true;
    async function loadOrder() {
      try {
        const res = await fetchApi<OrderData>(`/orders/${orderCode}`);
        if (!isMounted) return;
        if (res.success && res.data) {
          setOrder(res.data);
        } else {
          setError(res.message || 'Không thể tải thông tin đơn hàng');
        }
      } catch (err: any) {
        if (!isMounted) return;
        setError(err.message || 'Lỗi kết nối máy chủ');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadOrder();

    return () => {
      isMounted = false;
    };
  }, [orderCode]);

  const handleCopy = async (text: string, fieldId: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldId);
      showToast(`Đã sao chép ${label}!`);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopiedField(fieldId);
      showToast(`Đã sao chép ${label}!`);
      setTimeout(() => setCopiedField(null), 2000);
    }
  };

  const handleNotifyPaid = async () => {
    if (!order) return;

    setIsNotifying(true);
    try {
      const res = await fetchApi(`/orders/${order.orderCode}/notify-paid`, {
        method: 'POST',
      });

      if (res.success) {
        showToast('Xác nhận đã chuyển khoản thành công!');
        router.push(`/payment-result?orderCode=${order.orderCode}&notified=true`);
      } else {
        showToast(res.message || 'Không thể cập nhật trạng thái đơn hàng');
      }
    } catch (err: any) {
      showToast(err.message || 'Lỗi kết nối khi gửi thông báo');
    } finally {
      setIsNotifying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4 px-4">
        <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center animate-pulse">
          <RefreshCw className="w-6 h-6 text-cyan-500 animate-spin" />
        </div>
        <div className="text-center space-y-1">
          <p className="font-mono text-sm font-semibold text-slate-800 dark:text-slate-200">
            Đang khởi tạo cổng thanh toán VietQR MB Bank...
          </p>
          <p className="font-mono text-xs text-slate-500">Mã đơn: {orderCode || '...'}</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-md mx-auto my-16 px-4">
        <div className="rounded-2xl border hairline-border surface-bevel bg-surface-card p-6 text-center space-y-4 shadow-xl">
          <div className="w-12 h-12 mx-auto rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Không tìm thấy thông tin đơn hàng
          </h2>
          <p className="text-xs font-mono text-slate-600 dark:text-slate-400">
            {error || 'Mã đơn hàng không hợp lệ hoặc đã bị thay đổi.'}
          </p>
          <div className="pt-2 flex flex-col gap-2">
            <Link
              href="/checkout"
              className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-signal-cyan dark:hover:bg-cyan-400 text-white dark:text-slate-950 text-xs font-mono font-bold transition-all"
            >
              Quay lại giỏ hàng / Đặt lại
            </Link>
            <Link
              href="/"
              className="w-full py-2 px-4 rounded-xl border hairline-border hover:bg-slate-100 dark:hover:bg-surface-elevated text-xs font-mono text-slate-600 dark:text-slate-400 transition-all"
            >
              Về trang chủ
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const dynamicQrUrl = `https://img.vietqr.io/image/${BANK_INFO.bin}-${BANK_INFO.accountNumber}-compact2.png?amount=${order.totalAmount}&addInfo=${encodeURIComponent(order.orderCode)}&accountName=${encodeURIComponent(BANK_INFO.accountHolder)}`;

  const isAlreadyPaid = order.paymentStatus === 'paid';

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 animate-bounce">
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900/95 dark:bg-surface-elevated/95 border border-cyan-500/40 text-white shadow-2xl backdrop-blur-md text-xs font-mono">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Breadcrumb & Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href={`/order-tracking?orderCode=${order.orderCode}&phone=${encodeURIComponent(order.customerInfo?.phone || '')}`}
          className="text-xs font-mono text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại kiểm tra đơn hàng</span>
        </Link>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-mono font-bold uppercase bg-cyan-500/10 text-cyan-600 dark:text-signal-cyan border border-cyan-500/20">
            <Sparkles className="w-3 h-3" />
            VietQR MB Bank Gateway
          </span>
        </div>
      </div>

      {/* Header Banner */}
      <div className="rounded-2xl border hairline-border surface-bevel bg-surface-card p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <Building2 className="w-6 h-6 text-cyan-600 dark:text-signal-cyan" />
              Thanh Toán Quét Mã VietQR MB Bank
            </h1>
            <p className="text-xs font-mono text-slate-600 dark:text-slate-400">
              Mở ứng dụng ngân hàng bất kỳ để quét mã QR hoặc chuyển khoản theo thông tin bên dưới.
            </p>
          </div>
          <div className="flex items-center gap-3 self-start sm:self-auto">
            <div className="text-right">
              <p className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Mã đơn hàng</p>
              <p className="text-sm font-mono font-extrabold text-cyan-600 dark:text-signal-cyan">
                #{order.orderCode}
              </p>
            </div>
            <div className="h-8 w-px bg-slate-200 dark:bg-white/10" />
            <div className="text-right">
              <p className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Tổng tiền</p>
              <p className="text-sm font-mono font-extrabold text-emerald-600 dark:text-signal-emerald">
                {formatVND(order.totalAmount)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {isAlreadyPaid && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
            <div>
              <p className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-300">
                Đơn hàng đã được xác nhận thanh toán thành công!
              </p>
              <p className="text-[11px] font-mono text-slate-600 dark:text-slate-400">
                Nhân viên kho TechGear đang tiến hành đóng gói và giao hàng cho bạn.
              </p>
            </div>
          </div>
          <Link
            href={`/payment-result?orderCode=${order.orderCode}`}
            className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-mono font-bold hover:bg-emerald-700 transition-colors shrink-0"
          >
            Xem kết quả
          </Link>
        </div>
      )}

      {/* Main Grid: QR Code (Left) & Bank Transfer Info (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: QR Code & Mode Toggle (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-2xl border hairline-border surface-bevel bg-surface-card p-5 space-y-4 shadow-md text-center">
            {/* View Mode Toggle */}
            <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-surface-elevated border hairline-border w-full">
              <button
                type="button"
                onClick={() => setQrMode('dynamic')}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-mono font-bold transition-all flex items-center justify-center gap-1.5 ${
                  qrMode === 'dynamic'
                    ? 'bg-white dark:bg-slate-800 text-cyan-600 dark:text-signal-cyan shadow-sm border hairline-border'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>VietQR Động (Tự điền tiền)</span>
              </button>
              <button
                type="button"
                onClick={() => setQrMode('original')}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-mono font-bold transition-all flex items-center justify-center gap-1.5 ${
                  qrMode === 'original'
                    ? 'bg-white dark:bg-slate-800 text-cyan-600 dark:text-signal-cyan shadow-sm border hairline-border'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Mã QR Gốc MB Bank</span>
              </button>
            </div>

            {/* QR Image Frame */}
            <div className="relative mx-auto p-4 bg-white rounded-2xl border-2 border-slate-200 dark:border-cyan-500/30 shadow-inner flex flex-col items-center justify-center min-h-[300px]">
              {qrMode === 'dynamic' ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={dynamicQrUrl}
                  alt={`VietQR TechGear ${order.orderCode}`}
                  className="w-full max-w-[280px] h-auto object-contain rounded-lg"
                  loading="eager"
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src="/qr-payment.jpg"
                  alt="Mã QR MB Bank LE NGOC TRUNG"
                  className="w-full max-w-[280px] h-auto object-contain rounded-lg"
                  loading="eager"
                />
              )}

              <div className="mt-3 flex items-center gap-1.5 text-[10px] font-mono text-slate-500">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Quét bằng mọi App Ngân hàng hoặc Ví điện tử</span>
              </div>
            </div>

            {/* Scan Guidance Note */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-surface-elevated/40 border hairline-border text-left space-y-1">
              <p className="text-[11px] font-mono font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                <Clock className="w-3 h-3 text-cyan-500" />
                Hướng dẫn chuyển khoản nhanh:
              </p>
              <ol className="text-[10px] font-mono text-slate-600 dark:text-slate-400 list-decimal list-inside space-y-0.5">
                <li>Mở ứng dụng ngân hàng của bạn (MB, VCB, Techcombank, VPBank,...)</li>
                <li>Chọn Quét mã QR và hướng camera vào mã phía trên</li>
                <li>Kiểm tra thông tin số tiền ({formatVND(order.totalAmount)}) và nội dung ({order.orderCode})</li>
                <li>Xác nhận chuyển khoản và bấm nút bên dưới</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Right Column: Bank Account Details & Copy Buttons (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-2xl border hairline-border surface-bevel bg-surface-card p-6 space-y-5 shadow-md">
            <div className="flex items-center justify-between pb-3 border-b hairline-border">
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-cyan-600 dark:text-signal-cyan" />
                Thông Tin Tài Khoản Thụ Hưởng MB Bank
              </h2>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                24/7 NAPAS 247
              </span>
            </div>

            {/* Info Fields Grid */}
            <div className="space-y-3">
              {/* Field 1: Bank Name */}
              <div className="p-3.5 rounded-xl border hairline-border bg-surface-elevated/30 flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-mono uppercase text-slate-500">Ngân hàng nhận</span>
                  <p className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                    {BANK_INFO.bankName}
                  </p>
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-200 dark:bg-surface-card text-slate-700 dark:text-slate-300">
                  MB BANK
                </span>
              </div>

              {/* Field 2: Account Number (STK) */}
              <div className="p-3.5 rounded-xl border border-cyan-500/30 bg-cyan-500/5 flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-mono uppercase text-slate-500">Số tài khoản</span>
                  <p className="text-base sm:text-lg font-mono font-extrabold text-cyan-600 dark:text-signal-cyan tracking-wider">
                    {BANK_INFO.accountNumber}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(BANK_INFO.accountNumber, 'account', 'Số tài khoản')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all active:scale-95 shadow-sm ${
                    copiedField === 'account'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-900 hover:bg-slate-800 dark:bg-signal-cyan dark:hover:bg-cyan-400 text-white dark:text-slate-950'
                  }`}
                >
                  {copiedField === 'account' ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Đã chép</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Sao chép STK</span>
                    </>
                  )}
                </button>
              </div>

              {/* Field 3: Account Holder */}
              <div className="p-3.5 rounded-xl border hairline-border bg-surface-elevated/30 flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-mono uppercase text-slate-500">Chủ tài khoản</span>
                  <p className="text-xs sm:text-sm font-mono font-extrabold uppercase text-slate-900 dark:text-white">
                    {BANK_INFO.accountHolder}
                  </p>
                </div>
                <span className="text-[10px] font-mono text-slate-500">Người đại diện TechGear</span>
              </div>

              {/* Field 4: Amount */}
              <div className="p-3.5 rounded-xl border hairline-border bg-surface-elevated/30 flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-mono uppercase text-slate-500">Số tiền thanh toán</span>
                  <p className="text-base sm:text-lg font-mono font-extrabold text-emerald-600 dark:text-signal-emerald">
                    {formatVND(order.totalAmount)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(String(order.totalAmount), 'amount', 'Số tiền thanh toán')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all active:scale-95 border hairline-border ${
                    copiedField === 'amount'
                      ? 'bg-emerald-600 text-white'
                      : 'hover:bg-slate-100 dark:hover:bg-surface-elevated text-slate-800 dark:text-slate-200'
                  }`}
                >
                  {copiedField === 'amount' ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Đã chép</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Sao chép tiền</span>
                    </>
                  )}
                </button>
              </div>

              {/* Field 5: Transfer Content (Memo) */}
              <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/5 flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-mono uppercase text-amber-700 dark:text-amber-300 font-bold">
                    Nội dung chuyển khoản (bắt buộc)
                  </span>
                  <p className="text-base sm:text-lg font-mono font-extrabold text-slate-900 dark:text-white tracking-wider">
                    {order.orderCode}
                  </p>
                  <p className="text-[10px] font-mono text-slate-500">
                    *Vui lòng giữ nguyên mã đơn hàng làm nội dung để hệ thống tự động đối soát.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(order.orderCode, 'memo', 'Nội dung chuyển khoản')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all active:scale-95 shadow-sm ${
                    copiedField === 'memo'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold'
                  }`}
                >
                  {copiedField === 'memo' ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Đã chép</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Sao chép nội dung</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 space-y-2.5">
              <button
                type="button"
                disabled={isNotifying}
                onClick={handleNotifyPaid}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-sm font-mono font-extrabold shadow-lg shadow-emerald-600/20 transition-all active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isNotifying ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Đang gửi thông báo đối soát...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Tôi đã chuyển khoản thành công</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() =>
                  router.push(
                    `/order-tracking?orderCode=${order.orderCode}&phone=${encodeURIComponent(order.customerInfo?.phone || '')}`
                  )
                }
                className="w-full py-2.5 px-4 rounded-xl border hairline-border hover:bg-slate-100 dark:hover:bg-surface-elevated text-xs font-mono text-slate-700 dark:text-slate-300 transition-all text-center block"
              >
                Quay lại kiểm tra đơn hàng
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PaymentQRPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4 px-4">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center animate-pulse">
            <RefreshCw className="w-6 h-6 text-cyan-500 animate-spin" />
          </div>
          <p className="font-mono text-xs text-slate-500">Đang tải trang thanh toán VietQR...</p>
        </div>
      }
    >
      <PaymentQRContent />
    </Suspense>
  );
}
