'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import {
  CheckCircle,
  XCircle,
  Clock,
  ArrowRight,
  CreditCard,
  AlertCircle,
} from 'lucide-react';
import { fetchApi } from '@/lib/api';
import { formatVND } from '@/lib/utils';

function PaymentResultContent() {
  const searchParams = useSearchParams();

  const orderCode = searchParams.get('orderCode') || searchParams.get('vnp_TxnRef') || '';
  const responseCode = searchParams.get('vnp_ResponseCode');
  const paymentUrl = searchParams.get('paymentUrl');

  const [status, setStatus] = useState<'pending' | 'success' | 'failed'>('pending');
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Process real VNPAY payment callback
  useEffect(() => {
    async function verifyVnpayCallback() {
      if (searchParams.has('vnp_ResponseCode')) {
        setLoading(true);
        try {
          const res = await fetchApi(`/orders/payment/vnpay-return?${searchParams.toString()}`);
          if (res.success && res.data) {
            setStatus('success');
            setMessage('Giao dịch thanh toán qua cổng VNPAY đã được ghi nhận thành công!');
            setOrderDetails(res.data);
            confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
          } else {
            setStatus('failed');
            setMessage(res.message || 'Giao dịch qua VNPAY không thành công hoặc chữ ký không hợp lệ.');
            if (res.data) setOrderDetails(res.data);
          }
        } catch {
          setStatus('failed');
          setMessage('Không thể kết nối đến máy chủ để xác thực giao dịch VNPAY.');
        }
        setLoading(false);
      } else if (orderCode) {
        // Direct view of order payment result
        try {
          const res = await fetchApi(`/orders/${orderCode}`);
          if (res.success && res.data) {
            setOrderDetails(res.data);
            if (res.data.paymentStatus === 'paid') {
              setStatus('success');
              setMessage('Đơn hàng đã được thanh toán thành công!');
            } else if (res.data.paymentStatus === 'failed') {
              setStatus('failed');
              setMessage('Đơn hàng thanh toán không thành công.');
            }
          }
        } catch {
          // ignore lookup error
        }
      }
    }
    verifyVnpayCallback();
  }, [searchParams, orderCode]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 sm:p-12 shadow-2xl space-y-8 text-center">
        {/* Status Icon */}
        <div className="flex justify-center">
          {loading ? (
            <div className="w-20 h-20 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center ring-8 ring-indigo-500/10">
              <Clock className="w-12 h-12 animate-spin" />
            </div>
          ) : status === 'success' ? (
            <div className="w-20 h-20 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-signal-emerald flex items-center justify-center ring-8 ring-emerald-500/10 animate-in zoom-in">
              <CheckCircle className="w-12 h-12" />
            </div>
          ) : status === 'failed' ? (
            <div className="w-20 h-20 rounded-full bg-rose-500/10 text-rose-600 dark:text-signal-rose flex items-center justify-center ring-8 ring-rose-500/10 animate-in zoom-in">
              <XCircle className="w-12 h-12" />
            </div>
          ) : (
            <div className="w-20 h-20 rounded-full bg-cyan-500/10 text-cyan-700 dark:text-signal-cyan flex items-center justify-center ring-8 ring-cyan-500/10">
              <Clock className="w-12 h-12 animate-pulse" />
            </div>
          )}
        </div>

        {/* Title & Message */}
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {loading
              ? 'Đang Xác Thực Giao Dịch...'
              : status === 'success'
              ? 'Thanh Toán Thành Công!'
              : status === 'failed'
              ? 'Thanh Toán Không Thành Công'
              : 'Chờ Xác Nhận Thanh Toán Trực Tuyến'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto">
            {message ||
              'Đơn hàng của bạn đã được khởi tạo trong hệ thống. Vui lòng hoàn tất thanh toán để chúng tôi tiến hành xử lý và giao hàng.'}
          </p>
        </div>

        {/* Order Details Card */}
        {orderCode && (
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 max-w-md mx-auto text-left text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-600 dark:text-slate-400 font-medium">Mã đơn hàng:</span>
              <span className="font-mono font-bold text-cyan-700 dark:text-signal-cyan">{orderCode}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600 dark:text-slate-400 font-medium">Phương thức:</span>
              <span className="font-semibold text-slate-850 dark:text-slate-200">Cổng thanh toán trực tuyến VNPAY</span>
            </div>
            {orderDetails?.totalAmount && (
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400 font-medium">Số tiền:</span>
                <span className="font-bold text-slate-900 dark:text-white font-mono">{formatVND(orderDetails.totalAmount)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-600 dark:text-slate-400 font-medium">Trạng thái thanh toán:</span>
              <span
                className={`font-bold uppercase ${
                  status === 'success'
                    ? 'text-emerald-700 dark:text-signal-emerald'
                    : status === 'failed'
                    ? 'text-rose-700 dark:text-signal-rose'
                    : 'text-amber-700 dark:text-signal-amber'
                }`}
              >
                {status === 'success' ? 'Đã Thanh Toán' : status === 'failed' ? 'Thất Bại' : 'Chờ Thanh Toán'}
              </span>
            </div>
          </div>
        )}

        {/* Real VNPAY Redirect Button if pending */}
        {status === 'pending' && paymentUrl && (
          <div className="pt-2 flex justify-center">
            <a
              href={paymentUrl}
              className="px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-signal-cyan dark:hover:bg-cyan-400 dark:text-slate-950 font-mono font-bold text-xs shadow-lg shadow-cyan-500/20 surface-bevel flex items-center gap-2 transition-all active:translate-y-0.5"
            >
              <CreditCard className="w-4 h-4" />
              <span>Tiếp Tục Thanh Toán Qua Cổng VNPAY</span>
            </a>
          </div>
        )}

        {/* Next Actions */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-4 border-t hairline-border">
          {orderCode && (
            <Link
              href={`/order-tracking?orderCode=${orderCode}${
                orderDetails?.customerInfo?.phone ? `&phone=${encodeURIComponent(orderDetails.customerInfo.phone)}` : ''
              }`}
              className="px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-signal-cyan dark:hover:bg-cyan-400 dark:text-slate-950 text-xs font-mono font-bold shadow-lg shadow-cyan-500/20 surface-bevel flex items-center gap-2 active:translate-y-0.5 transition-all"
            >
              <span>Tra cứu tiến trình đơn hàng</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}

          <Link
            href="/"
            className="px-6 py-3 rounded-xl bg-surface-elevated hover:bg-surface-subtle text-slate-800 dark:text-slate-200 text-xs font-mono font-bold border hairline-border surface-bevel transition-all"
          >
            Về trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function PaymentResultPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-sm text-slate-700 dark:text-slate-300 font-medium">Đang tải kết quả thanh toán...</div>}>
      <PaymentResultContent />
    </Suspense>
  );
}
