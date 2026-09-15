'use client';

import { useState, useEffect } from 'react';
import {
  ShoppingCart,
  Search,
  CheckCircle2,
  Eye,
  X,
} from 'lucide-react';
import { fetchApi } from '@/lib/api';
import { formatVND, formatDate, ORDER_STATUS_MAP } from '@/lib/utils';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const loadOrders = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search.trim()) params.set('search', search.trim());
    if (statusFilter) params.set('status', statusFilter);
    params.set('limit', '50');

    const res = await fetchApi(`/orders?${params.toString()}`);
    if (res.success && res.data) {
      setOrders(res.data.orders || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    setTimeout(() => loadOrders(), 0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const handleStatusChange = async (orderId: string, orderStatus: string) => {
    try {
      const res = await fetchApi(`/orders/${orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ orderStatus }),
      });
      if (res.success) {
        setOrders(orders.map((o) => (o._id === orderId ? { ...o, orderStatus } : o)));
        setFeedback(`Đã cập nhật đơn hàng sang: "${ORDER_STATUS_MAP[orderStatus]?.label || orderStatus}"!`);
        setTimeout(() => setFeedback(null), 3000);
      } else {
        alert(res.message || 'Không thể cập nhật trạng thái đơn hàng');
        setTimeout(() => loadOrders(), 0);
      }
    } catch {
      alert('Không thể cập nhật trạng thái đơn hàng');
      setTimeout(() => loadOrders(), 0);
    }
  };

  const handlePaymentStatusChange = async (orderId: string, paymentStatus: string) => {
    try {
      const res = await fetchApi(`/orders/${orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ paymentStatus }),
      });
      if (res.success) {
        setOrders(orders.map((o) => (o._id === orderId ? { ...o, paymentStatus } : o)));
        setFeedback(`Đã cập nhật trạng thái thanh toán!`);
        setTimeout(() => setFeedback(null), 3000);
      } else {
        alert(res.message || 'Không thể cập nhật trạng thái thanh toán');
        setTimeout(() => loadOrders(), 0);
      }
    } catch {
      alert('Không thể cập nhật trạng thái thanh toán');
      setTimeout(() => loadOrders(), 0);
    }
  };

  const getOrderStatusClass = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-500/10 text-amber-700 dark:text-signal-amber border border-amber-500/30 font-bold';
      case 'processing':
        return 'bg-slate-100 text-slate-950 dark:bg-surface-elevated dark:text-white border border-slate-300 dark:border-white/10 font-bold';
      case 'shipping':
        return 'bg-slate-100 text-slate-950 dark:bg-surface-elevated dark:text-white border border-slate-300 dark:border-white/10 font-bold';
      case 'delivered':
        return 'bg-emerald-500/10 text-emerald-700 dark:text-signal-emerald border border-emerald-500/30 font-bold';
      case 'cancelled':
        return 'bg-rose-500/10 text-rose-700 dark:text-signal-rose border border-rose-500/30 font-bold';
      default:
        return 'bg-surface-subtle text-slate-700 dark:text-slate-400 hairline-border font-bold';
    }
  };

  const getPaymentStatusClass = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-emerald-500/10 text-emerald-700 dark:text-signal-emerald border border-emerald-500/30 font-bold';
      case 'pending':
        return 'bg-amber-500/10 text-amber-700 dark:text-signal-amber border border-amber-500/30 font-bold';
      case 'failed':
        return 'bg-rose-500/10 text-rose-700 dark:text-signal-rose border border-rose-500/30 font-bold';
      default:
        return 'bg-surface-subtle text-slate-700 dark:text-slate-400 hairline-border font-bold';
    }
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-slate-900 dark:text-signal-cyan" />
            <span>Quản Lý Tiến Trình Đơn Hàng</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium mt-1">
            Theo dõi, xử lý và cập nhật các mốc tiến trình đơn hàng (Chờ xác nhận → Xử lý → Giao hàng → Đã giao / Hủy).
          </p>
        </div>
      </div>

      {feedback && (
        <div className="p-3 rounded-lg bg-emerald-500/10 hairline-border border-emerald-500/20 text-emerald-700 dark:text-signal-emerald text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600 dark:text-signal-emerald" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Filters & Orders Table */}
      <div className="rounded-xl hairline-border surface-bevel bg-surface-card p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex gap-2 max-w-md w-full">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Tìm mã đơn hoặc số điện thoại..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadOrders()}
                className="w-full pl-8 pr-3 py-2 text-xs rounded-lg bg-surface-subtle/40 dark:bg-surface-elevated hairline-border text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus:border-slate-500 dark:focus:border-signal-cyan"
              />
              <Search className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            </div>
            <button
              onClick={loadOrders}
              className="px-3.5 py-2 rounded-lg bg-slate-100 dark:bg-surface-elevated text-slate-950 dark:text-white hairline-border border-slate-300 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-surface-subtle text-xs font-mono font-bold transition-colors shadow-sm"
            >
              Lọc
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-700 dark:text-slate-300 font-bold">Trạng thái:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-lg text-xs font-mono font-bold bg-surface-subtle/40 dark:bg-surface-elevated hairline-border text-slate-900 dark:text-white focus:outline-none focus:border-slate-500 dark:focus:border-signal-cyan"
            >
              <option value="" className="bg-surface-card text-slate-900 dark:text-white">Tất cả trạng thái</option>
              <option value="pending" className="bg-surface-card text-slate-900 dark:text-white">Chờ xác nhận</option>
              <option value="processing" className="bg-surface-card text-slate-900 dark:text-white">Đang xử lý</option>
              <option value="shipping" className="bg-surface-card text-slate-900 dark:text-white">Đang giao hàng</option>
              <option value="delivered" className="bg-surface-card text-slate-900 dark:text-white">Đã giao</option>
              <option value="cancelled" className="bg-surface-card text-slate-900 dark:text-white">Đã hủy</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-600 dark:text-slate-400 font-mono font-medium">Đang tải đơn hàng...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b hairline-border text-slate-900 dark:text-slate-200 font-mono text-[11px] uppercase tracking-wider font-extrabold">
                <tr>
                  <th className="pb-2.5 px-3">Mã Đơn & Ngày</th>
                  <th className="pb-2.5 px-3">Khách Hàng</th>
                  <th className="pb-2.5 px-3">Số Lượng</th>
                  <th className="pb-2.5 px-3">Tổng Tiền</th>
                  <th className="pb-2.5 px-3">Thanh Toán</th>
                  <th className="pb-2.5 px-3">Trạng Thái Đơn</th>
                  <th className="pb-2.5 px-3 text-right">Chi Tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y hairline-border">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-600 dark:text-slate-400 font-mono font-medium">
                      Chưa có đơn hàng nào trong hệ thống. Đơn hàng mới của khách sẽ hiển thị tại đây.
                    </td>
                  </tr>
                ) : (
                  orders.map((o) => {
                    return (
                      <tr key={o._id} className="hover:bg-surface-subtle/30 dark:hover:bg-surface-elevated/40 transition-colors">
                        <td className="py-2.5 px-3">
                          <span className="font-mono font-bold text-slate-950 dark:text-white block tracking-tight">
                            #{o.orderCode?.replace(/^#/, '')}
                          </span>
                          <span className="text-[10px] text-slate-700 dark:text-slate-300 font-mono tabular-nums font-semibold">{formatDate(o.createdAt)}</span>
                        </td>

                        <td className="py-2.5 px-3">
                          <p className="font-semibold text-slate-900 dark:text-slate-100">
                            {o.customerInfo?.name}
                          </p>
                          <span className="text-[10px] text-slate-700 dark:text-slate-300 font-mono tabular-nums font-semibold">
                            {o.customerInfo?.phone}
                          </span>
                        </td>

                        <td className="py-2.5 px-3 font-medium text-slate-700 dark:text-slate-300 font-mono tabular-nums">
                          {o.items?.reduce((sum: number, i: any) => sum + i.quantity, 0)} sản phẩm
                        </td>

                        <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white font-mono tabular-nums">
                          {formatVND(o.totalAmount)}
                        </td>

                        <td className="py-2.5 px-3">
                          <select
                            value={o.paymentStatus}
                            onChange={(e) => handlePaymentStatusChange(o._id, e.target.value)}
                            className={`px-2 py-0.5 rounded-lg font-mono font-bold text-[10px] focus:outline-none cursor-pointer ${getPaymentStatusClass(
                              o.paymentStatus
                            )}`}
                          >
                            <option value="pending" className="bg-surface-card text-slate-900 dark:text-white">Chưa thanh toán</option>
                            <option value="paid" className="bg-surface-card text-slate-900 dark:text-white">Đã thanh toán</option>
                            <option value="failed" className="bg-surface-card text-slate-900 dark:text-white">Thất bại</option>
                          </select>
                        </td>

                        <td className="py-2.5 px-3">
                          <select
                            value={o.orderStatus}
                            onChange={(e) => handleStatusChange(o._id, e.target.value)}
                            className={`px-2 py-0.5 rounded-lg font-mono font-bold text-[10px] focus:outline-none cursor-pointer ${getOrderStatusClass(
                              o.orderStatus
                            )}`}
                          >
                            <option value="pending" className="bg-surface-card text-slate-900 dark:text-white">Chờ xác nhận</option>
                            <option value="processing" className="bg-surface-card text-slate-900 dark:text-white">Đang xử lý</option>
                            <option value="shipping" className="bg-surface-card text-slate-900 dark:text-white">Đang giao hàng</option>
                            <option value="delivered" className="bg-surface-card text-slate-900 dark:text-white">Đã giao</option>
                            <option value="cancelled" className="bg-surface-card text-slate-900 dark:text-white">Hủy đơn (hoàn kho)</option>
                          </select>
                        </td>

                        <td className="py-2.5 px-3 text-right">
                          <button
                            onClick={() => setSelectedOrder(o)}
                            className="p-1.5 rounded-lg text-slate-700 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-surface-elevated transition-colors"
                            title="Xem chi tiết"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-surface-card hairline-border surface-bevel p-6 space-y-4 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between pb-3 border-b hairline-border">
              <h3 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <span>Chi Tiết Đơn Hàng</span>
                <span className="font-mono text-slate-950 dark:text-white font-bold">{selectedOrder.orderCode}</span>
              </h3>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-surface-elevated transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-surface-subtle/30 dark:bg-surface-elevated/70 hairline-border text-xs space-y-1">
              <p><strong>Khách hàng:</strong> {selectedOrder.customerInfo?.name}</p>
              <p><strong>Số điện thoại:</strong> <span className="font-mono tabular-nums">{selectedOrder.customerInfo?.phone}</span></p>
              <p><strong>Địa chỉ:</strong> {selectedOrder.customerInfo?.address}</p>
              {selectedOrder.customerInfo?.note && (
                <p className="italic text-slate-600 dark:text-slate-400 font-medium">Ghi chú: {selectedOrder.customerInfo.note}</p>
              )}
            </div>

            <div className="space-y-2 text-xs">
              <h4 className="font-bold text-slate-700 dark:text-slate-300">Danh sách sản phẩm:</h4>
              <div className="divide-y hairline-border rounded-xl hairline-border overflow-hidden">
                {selectedOrder.items?.map((item: any, i: number) => (
                  <div key={i} className="p-2.5 flex justify-between items-center hover:bg-surface-subtle/20">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">{item.name}</p>
                      <span className="text-slate-600 dark:text-slate-400 font-mono text-[11px] tabular-nums font-medium">
                        {formatVND(item.price)} × {item.quantity}
                      </span>
                    </div>
                    <span className="font-bold text-slate-950 dark:text-white font-mono tabular-nums">
                      {formatVND(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t hairline-border flex justify-between items-center text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-300">Tổng thanh toán:</span>
              <span className="text-base font-black text-slate-950 dark:text-white font-mono tabular-nums">
                {formatVND(selectedOrder.totalAmount)}
              </span>
            </div>

            <button
              onClick={() => setSelectedOrder(null)}
              className="w-full py-2 rounded-lg bg-surface-subtle/40 dark:bg-surface-elevated hairline-border text-xs font-mono font-bold text-slate-700 dark:text-slate-200 hover:bg-surface-subtle transition-colors"
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
