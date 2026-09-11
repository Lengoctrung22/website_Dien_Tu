'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import {
  CheckCircle,
  XCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Zap,
} from 'lucide-react';
import { fetchApi } from '@/lib/api';
import { formatVND } from '@/lib/utils';

function PaymentResultContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const orderCode = searchParams.get('orderCode') || searchParams.get('vnp_TxnRef') || '';
  const responseCode = searchParams.get('vnp_ResponseCode');
  const paymentUrl = searchParams.get('paymentUrl');

  const [status, setStatus] = useState<'pending' | 'success' | 'failed'>('pending');
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Handle actual VNPAY return if present
  useEffect(() => {
    async function checkVnpayReturn() {
      if (responseCode) {
        if (responseCode === '00') {
          setStatus('success');
          setMessage('Thanh toán qua VNPAY thành công!');
          confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        } else {
          setStatus('failed');
          setMessage('Giao dịch qua VNPAY đã bị hủy hoặc không thành công.');
        }
      }
    }
    checkVnpayReturn();
  }, [responseCode]);

  // Fetch current order status
  useEffect(() => {
    async function loadOrder() {
      if (!orderCode) return;
      const res = await fetchApi(`/orders/lookup?orderCode=${orderCode}&phone=`);
      // or lookup if public
    }
  }, [orderCode]);

  // Mock Payment Test Action
  const handleMockPay = async (resultType: 'success' | 'failed') => {
    if (!orderCode) return;
    setLoading(true);
    try {
      const res = await fetchApi('/orders/payment/mock-pay', {
        method: 'POST',
        body: JSON.stringify({
          orderCode,
          status: resultType,
        }),
      });

      if (res.success && resultType === 'success') {
        setStatus('success');
        setMessage('Xác nhận thanh toán mô phỏng thành công!');
        setOrderDetails(res.data);
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
      } else {
        setStatus('failed');
        setMessage('Xác nhận mô phỏng thanh toán thất bại.');
      }
    } catch {
      setStatus('failed');
      setMessage('Lỗi khi thực hiện mô phỏng thanh toán.');
    }
    setLoading(false);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 sm:p-12 shadow-2xl space-y-8 text-center">
        {/* Status Icon */}
        <div className="flex justify-center">
          {status === 'success' ? (
            <div className="w-20 h-20 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center ring-8 ring-emerald-500/10 animate-in zoom-in">
              <CheckCircle className="w-12 h-12" />
            </div>
          ) : status === 'failed' ? (
            <div className="w-20 h-20 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center ring-8 ring-rose-500/10 animate-in zoom-in">
              <XCircle className="w-12 h-12" />
            </div>
          ) : (
            <div className="w-20 h-20 rounded-full bg-cyan-500/10 text-cyan-500 flex items-center justify-center ring-8 ring-cyan-500/10">
              <Clock className="w-12 h-12 animate-pulse" />
            </div>
          )}
        </div>

        {/* Title & Message */}
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {status === 'success'
              ? 'Thanh Toán Thành Công!'
              : status === 'failed'
              ? 'Thanh Toán Không Thành Công'
              : 'Chờ Xác Nhận Thanh Toán Trực Tuyến'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            {message ||
              'Đơn hàng của bạn đã được khởi tạo trong hệ thống. Bạn có thể tiến hành cổng VNPAY thật hoặc dùng Mock Test Mode bên dưới.'}
          </p>
        </div>

        {/* Order Details Card */}
        {orderCode && (
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 max-w-md mx-auto text-left text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500">Mã đơn hàng:</span>
              <span className="font-mono font-bold text-indigo-600 dark:text-cyan-400">{orderCode}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Phương thức:</span>
              <span className="font-semibold">Cổng thanh toán Trực tuyến (VNPAY Sandbox)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Trạng thái thanh toán:</span>
              <span
                className={`font-bold uppercase ${
                  status === 'success'
                    ? 'text-emerald-500'
                    : status === 'failed'
                    ? 'text-rose-500'
                    : 'text-amber-500'
                }`}
              >
                {status === 'success' ? 'Đã Thanh Toán' : status === 'failed' ? 'Thất Bại' : 'Đang Chờ'}
              </span>
            </div>
          </div>
        )}

        {/* Mock Payment Test Mode Box (For Instant Sandbox Testing) */}
        {status === 'pending' && (
          <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-950/30 to-slate-900 border border-indigo-500/30 text-left max-w-md mx-auto space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-cyan-400">
              <Zap className="w-4 h-4 fill-current" />
              <span>Chế Độ Kiểm Thử Tức Thì (Mock Payment Test Mode)</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Bạn có thể mô phỏng xác nhận thanh toán trực tuyến ngay tại đây mà không cần thẻ ATM ngân hàng thật:
            </p>
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                onClick={() => handleMockPay('success')}
                disabled={loading}
                className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Thành Công (Test Pass)</span>
              </button>

              <button
                onClick={() => handleMockPay('failed')}
                disabled={loading}
                className="py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Thất Bại (Test Fail)</span>
              </button>
            </div>

            {paymentUrl && (
              <div className="pt-2 text-center">
                <a
                  href={paymentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-indigo-400 hover:underline inline-flex items-center gap-1"
                >
                  <span>Mở cổng VNPAY Sandbox thật (nếu có tài khoản test) →</span>
                </a>
              </div>
            )}
          </div>
        )}

        {/* Next Actions */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link
            href={`/order-tracking?orderCode=${orderCode}`}
            className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-lg shadow-indigo-500/20 flex items-center gap-2"
          >
            <span>Tra cứu tiến trình đơn hàng</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href="/"
            className="px-6 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold"
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
    <Suspense fallback={<div className="p-12 text-center text-sm">Đang tải kết quả thanh toán...</div>}>
      <PaymentResultContent />
    </Suspense>
  );
}
