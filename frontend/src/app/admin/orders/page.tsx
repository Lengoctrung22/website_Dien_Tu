'use client';

import { useState, useEffect } from 'react';
import {
  ShoppingCart,
  Search,
  CheckCircle2,
  AlertCircle,
  Eye,
  X,
  Clock,
  Truck,
  Package,
} from 'lucide-react';
import { fetchApi } from '@/lib/api';
import { formatVND, formatDate, ORDER_STATUS_MAP, PAYMENT_STATUS_MAP } from '@/lib/utils';

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
      }
    } catch {
      alert('Không thể cập nhật trạng thái đơn hàng');
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
      }
    } catch {
      alert('Không thể cập nhật trạng thái thanh toán');
    }
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <ShoppingCart className="w-7 h-7 text-indigo-500 dark:text-cyan-400" />
            <span>Quản Lý Tiến Trình Đơn Hàng</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Theo dõi, xử lý và cập nhật các mốc tiến trình đơn hàng (Chờ xác nhận → Xử lý → Giao hàng → Đã giao / Hủy).
          </p>
        </div>
      </div>

      {feedback && (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Filters & Orders Table */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex gap-2 max-w-md w-full">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Tìm mã đơn hoặc số điện thoại..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadOrders()}
                className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
            <button
              onClick={loadOrders}
              className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold"
            >
              Lọc
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-semibold">Trạng thái:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="pending">Chờ xác nhận</option>
              <option value="processing">Đang xử lý</option>
              <option value="shipping">Đang giao hàng</option>
              <option value="delivered">Đã giao</option>
              <option value="cancelled">Đã hủy</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Đang tải đơn hàng...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                <tr>
                  <th className="pb-3 px-3">Mã Đơn & Ngày</th>
                  <th className="pb-3 px-3">Khách Hàng</th>
                  <th className="pb-3 px-3">Số Lượng</th>
                  <th className="pb-3 px-3">Tổng Tiền</th>
                  <th className="pb-3 px-3">Thanh Toán</th>
                  <th className="pb-3 px-3">Trạng Thái Đơn</th>
                  <th className="pb-3 px-3 text-right">Chi Tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {orders.map((o) => {
                  const statusInfo = ORDER_STATUS_MAP[o.orderStatus] || {
                    label: o.orderStatus,
                    color: 'text-slate-500',
                  };
                  return (
                    <tr key={o._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-3">
                        <span className="font-mono font-bold text-indigo-600 dark:text-cyan-400 block">
                          {o.orderCode}
                        </span>
                        <span className="text-[10px] text-slate-400">{formatDate(o.createdAt)}</span>
                      </td>

                      <td className="py-3 px-3">
                        <p className="font-bold text-slate-800 dark:text-slate-200">
                          {o.customerInfo?.name}
                        </p>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {o.customerInfo?.phone}
                        </span>
                      </td>

                      <td className="py-3 px-3 font-semibold text-slate-600 dark:text-slate-300">
                        {o.items?.reduce((sum: number, i: any) => sum + i.quantity, 0)} sản phẩm
                      </td>

                      <td className="py-3 px-3 font-black text-slate-900 dark:text-white">
                        {formatVND(o.totalAmount)}
                      </td>

                      <td className="py-3 px-3">
                        <select
                          value={o.paymentStatus}
                          onChange={(e) => handlePaymentStatusChange(o._id, e.target.value)}
                          className={`px-2 py-1 rounded-lg font-bold text-[10px] border focus:outline-none ${
                            o.paymentStatus === 'paid'
                              ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                              : 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                          }`}
                        >
                          <option value="pending">Chưa thanh toán</option>
                          <option value="paid">Đã thanh toán</option>
                          <option value="failed">Thất bại</option>
                        </select>
                      </td>

                      <td className="py-3 px-3">
                        <select
                          value={o.orderStatus}
                          onChange={(e) => handleStatusChange(o._id, e.target.value)}
                          className={`px-2 py-1 rounded-lg font-bold text-[10px] border focus:outline-none ${statusInfo.color}`}
                        >
                          <option value="pending">Chờ xác nhận</option>
                          <option value="processing">Đang xử lý</option>
                          <option value="shipping">Đang giao hàng</option>
                          <option value="delivered">Đã giao</option>
                          <option value="cancelled">Hủy đơn (hoàn kho)</option>
                        </select>
                      </td>

                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => setSelectedOrder(o)}
                          className="p-1.5 rounded-lg text-indigo-600 dark:text-cyan-400 hover:bg-indigo-50 dark:hover:bg-slate-800"
                          title="Xem chi tiết"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-black text-sm text-slate-900 dark:text-white">
                Chi Tiết Đơn Hàng {selectedOrder.orderCode}
              </h3>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs space-y-1">
              <p><strong>Khách hàng:</strong> {selectedOrder.customerInfo?.name}</p>
              <p><strong>Số điện thoại:</strong> {selectedOrder.customerInfo?.phone}</p>
              <p><strong>Địa chỉ:</strong> {selectedOrder.customerInfo?.address}</p>
              {selectedOrder.customerInfo?.note && (
                <p className="italic text-slate-400">Ghi chú: {selectedOrder.customerInfo.note}</p>
              )}
            </div>

            <div className="space-y-2 text-xs">
              <h4 className="font-bold text-slate-700 dark:text-slate-300">Danh sách sản phẩm:</h4>
              <div className="divide-y divide-slate-100 dark:divide-slate-800 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                {selectedOrder.items?.map((item: any, i: number) => (
                  <div key={i} className="p-2.5 flex justify-between items-center">
                    <div>
                      <p className="font-bold">{item.name}</p>
                      <span className="text-slate-400">
                        {formatVND(item.price)} × {item.quantity}
                      </span>
                    </div>
                    <span className="font-bold text-indigo-600 dark:text-cyan-400">
                      {formatVND(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
              <span className="font-bold">Tổng thanh toán:</span>
              <span className="text-base font-black text-indigo-600 dark:text-cyan-400">
                {formatVND(selectedOrder.totalAmount)}
              </span>
            </div>

            <button
              onClick={() => setSelectedOrder(null)}
              className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-200"
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
