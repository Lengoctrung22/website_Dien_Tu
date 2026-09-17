'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ShoppingCart,
  Search,
  CheckCircle2,
  Eye,
  X,
  Zap,
  Truck,
  PackageCheck,
  RefreshCw,
  Clock,
  RotateCcw,
  Check,
  AlertTriangle,
  Package,
  ArrowUpRight,
} from 'lucide-react';
import { fetchApi } from '@/lib/api';
import { formatVND, formatDate, ORDER_STATUS_MAP } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import AccessDenied from '@/components/admin/AccessDenied';

function OrdersContent({ initialStatus }: { initialStatus: string }) {
  const { user, hasPermission } = useAuthStore();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoSync, setAutoSync] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const loadOrders = useCallback(async (silent = false) => {
    if (!hasPermission('orders')) return;
    if (!silent) setLoading(true);
    else setIsRefreshing(true);

    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      if (statusFilter) params.set('status', statusFilter);
      params.set('limit', '50');

      const res = await fetchApi(`/orders?${params.toString()}`);
      if (res.success && res.data) {
        setOrders(res.data.orders || []);
      }
    } catch {
      // ignore silent fetch error
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [search, statusFilter, hasPermission]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadOrders();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadOrders]);

  // Auto-sync polling every 10 seconds
  useEffect(() => {
    if (!autoSync) return;
    const interval = setInterval(() => {
      loadOrders(true);
    }, 10000);
    return () => clearInterval(interval);
  }, [autoSync, loadOrders]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  // 1. Automatic Payment Verification
  const handleAutoVerifyPayment = async (orderId: string) => {
    setActionLoadingId(orderId);
    try {
      const res = await fetchApi(`/orders/${orderId}/verify-payment`, {
        method: 'POST',
      });
      if (res.success && res.data) {
        setOrders((prev) =>
          prev.map((o) => (o._id === orderId ? { ...o, ...res.data } : o))
        );
        showToast(res.message || 'Tự động xác nhận thanh toán thành công và chuyển đơn sang "Đang xử lý"!');
      } else {
        showToast(res.message || 'Không thể xác nhận thanh toán tự động', 'error');
      }
    } catch {
      showToast('Lỗi kết nối khi xác thực thanh toán', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  // 2. Auto-Advance Next Order Progression
  const handleAutoAdvance = async (order: any) => {
    setActionLoadingId(order._id);
    try {
      const res = await fetchApi(`/orders/${order._id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ autoAdvance: true }),
      });
      if (res.success && res.data) {
        setOrders((prev) =>
          prev.map((o) => (o._id === order._id ? { ...o, ...res.data } : o))
        );
        showToast(res.message || 'Đã tự động chuyển trạng thái đơn hàng sang bước tiếp theo!');
      } else {
        showToast(res.message || 'Không thể tự động chuyển trạng thái', 'error');
      }
    } catch {
      showToast('Lỗi kết nối khi cập nhật tiến trình', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  // 3. Manual Specific Status Transition
  const handleStatusChange = async (orderId: string, orderStatus: string) => {
    setActionLoadingId(orderId);
    try {
      const res = await fetchApi(`/orders/${orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ orderStatus }),
      });
      if (res.success && res.data) {
        setOrders((prev) =>
          prev.map((o) => (o._id === orderId ? { ...o, ...res.data } : o))
        );
        showToast(res.message || `Đã cập nhật sang "${ORDER_STATUS_MAP[orderStatus]?.label || orderStatus}"!`);
      } else {
        showToast(res.message || 'Không thể cập nhật trạng thái đơn hàng', 'error');
        loadOrders();
      }
    } catch {
      showToast('Lỗi kết nối khi cập nhật trạng thái', 'error');
      loadOrders();
    } finally {
      setActionLoadingId(null);
    }
  };

  const getOrderStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-mono font-bold uppercase tracking-wider bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
            <Clock className="w-3 h-3" />
            Chờ xác nhận
          </span>
        );
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-mono font-bold uppercase tracking-wider bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30">
            <Zap className="w-3 h-3" />
            Đang xử lý
          </span>
        );
      case 'shipping':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-mono font-bold uppercase tracking-wider bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30">
            <Truck className="w-3 h-3" />
            Đang giao hàng (Chờ khách nhận)
          </span>
        );
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-mono font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
            <Check className="w-3 h-3" />
            ✓ ĐÃ GIAO (HOÀN TẤT)
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-mono font-bold uppercase tracking-wider bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30">
            <RotateCcw className="w-3 h-3" />
            Đã hủy (Hoàn kho)
          </span>
        );
      default:
        return <span>{status}</span>;
    }
  };

  const getPaymentStatusBadge = (status: string, paymentMethod?: string) => {
    if ((paymentMethod === 'ONLINE' || paymentMethod === 'QR') && status === 'pending') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40 animate-pulse">
          <Clock className="w-3 h-3" />
          Chờ đối soát chuyển khoản
        </span>
      );
    }
    switch (status) {
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-emerald-500/15 text-emerald-700 dark:text-signal-emerald border border-emerald-500/25">
            Đã thanh toán
          </span>
        );
      case 'unpaid':
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/25">
            Chưa thanh toán
          </span>
        );
      case 'refunded':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-rose-500/15 text-rose-700 dark:text-signal-rose border border-rose-500/25">
            Đã hoàn tiền
          </span>
        );
      default:
        return <span className="font-mono text-xs">{status}</span>;
    }
  };

  // Metrics summary
  const totalOrders = orders.length;
  const pendingOrders = orders.filter((o) => o.orderStatus === 'pending' || o.paymentStatus === 'pending').length;
  const shippingOrders = orders.filter((o) => o.orderStatus === 'shipping' || o.orderStatus === 'processing').length;
  const paidRevenue = orders
    .filter((o) => o.paymentStatus === 'paid')
    .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  if (!hasPermission('orders')) {
    return <AccessDenied requiredPermission="orders" />;
  }

  return (
    <div className="space-y-6 pb-12">
      {/* 1. TOP HEADER BANNER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-cyan-500/10 border border-cyan-500/25 surface-bevel">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-cyan-500/20 text-cyan-800 dark:text-cyan-200 border border-cyan-500/30">
              Nhân Viên Đơn Hàng (Orders)
            </span>
            <span className="text-xs text-cyan-700 dark:text-cyan-300 font-medium">Quyền: Xử lý tiến trình đơn hàng (`orders`)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1 flex items-center gap-2">
            <ShoppingCart className="w-7 h-7 text-cyan-600 dark:text-cyan-400" />
            <span>Quản Lý Tiến Trình Đơn Hàng Tự Động</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium mt-1">
            Xin chào <strong className="text-slate-900 dark:text-white">{user?.fullName || 'Nhân viên Đơn hàng'}</strong>. Tiếp nhận đơn mới, xác thực thanh toán và đẩy đơn vận chuyển.
          </p>
        </div>
      </div>

      {/* 2. CÁC CHỨC NĂNG CHÍNH DÀNH CHO NHÂN VIÊN ĐƠN HÀNG */}
      <div className="p-4 rounded-2xl bg-surface-card hairline-border surface-bevel shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b hairline-border pb-2.5">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
            <h2 className="text-xs font-mono uppercase font-bold text-slate-700 dark:text-slate-300 tracking-wider">
              Chức Năng Chính - Nhân Viên Đơn Hàng
            </h2>
          </div>
          <span className="text-[11px] font-mono text-slate-500">Phân hệ xử lý đơn hàng</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Chức năng 1: Tổng quan đơn hàng */}
          <Link
            href="/admin"
            className="flex items-center justify-between p-3.5 rounded-xl border hairline-border bg-surface-subtle/30 dark:bg-surface-elevated/40 hover:bg-cyan-500/10 hover:border-cyan-500/30 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-600 dark:text-cyan-400 group-hover:scale-105 transition-transform">
                <ShoppingCart className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                  Tổng Quan Đơn Hàng (KPI)
                </p>
                <p className="text-[11px] text-slate-500 font-mono">Bảng điều khiển &amp; KPI</p>
              </div>
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-cyan-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
          </Link>

          {/* Chức năng 2: Danh sách & quản lý đơn */}
          <div className="flex items-center justify-between p-3.5 rounded-xl border border-cyan-500/40 bg-cyan-500/10 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-700 dark:text-cyan-300">
                <Package className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  Danh Sách &amp; Quản Lý Đơn
                </p>
                <p className="text-[11px] text-cyan-700 dark:text-cyan-300 font-mono font-bold">
                  {orders.length} đơn hàng trong danh sách
                </p>
              </div>
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-800 dark:text-cyan-200">
              Đang xem
            </span>
          </div>

          {/* Chức năng 3: Hàng chờ cần xử lý ngay */}
          <button
            type="button"
            onClick={() => setStatusFilter(statusFilter === 'pending' ? '' : 'pending')}
            className={`flex items-center justify-between p-3.5 rounded-xl border hairline-border transition-all text-left ${
              statusFilter === 'pending'
                ? 'border-amber-500/40 bg-amber-500/15'
                : 'bg-surface-subtle/30 dark:bg-surface-elevated/40 hover:bg-cyan-500/10 hover:border-cyan-500/30'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  Hàng Chờ Cần Xử Lý Ngay
                </p>
                <p className="text-[11px] text-amber-600 dark:text-amber-400 font-mono font-bold">
                  {pendingOrders} đơn chờ duyệt
                </p>
              </div>
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/15 text-amber-700 dark:text-amber-300">
              {statusFilter === 'pending' ? 'Đang lọc' : 'Lọc ngay'}
            </span>
          </button>
        </div>
      </div>

      {/* Top Header & Real-time Auto-Sync Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>Danh Sách Đơn Hàng &amp; Điều Khiển Đồng Bộ</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Tự động đồng bộ mỗi 10 giây hoặc bấm &ldquo;Làm mới&rdquo; để cập nhật dữ liệu tức thì.
          </p>
        </div>

        {/* Real-time controls */}
        <div className="flex items-center gap-3 self-start md:self-auto">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-card border hairline-border shadow-sm text-xs font-mono">
            <span
              className={`w-2 h-2 rounded-full ${
                autoSync ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
              }`}
            />
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {autoSync ? 'Tự động đồng bộ: BẬT' : 'Tự động đồng bộ: TẮT'}
            </span>
            <button
              onClick={() => setAutoSync(!autoSync)}
              className="ml-1 text-[11px] font-bold text-cyan-600 dark:text-signal-cyan hover:underline"
            >
              ({autoSync ? 'Tắt' : 'Bật'})
            </button>
          </div>

          <button
            onClick={() => loadOrders(false)}
            disabled={loading || isRefreshing}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 text-xs font-mono font-bold transition-all shadow-sm active:translate-y-0.5 disabled:opacity-50"
            title="Làm mới danh sách đơn hàng"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {/* 4 Metric Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-surface-card border hairline-border surface-bevel shadow-sm">
          <span className="text-[10px] font-mono font-bold uppercase text-slate-500 tracking-wider block">Tổng đơn hàng</span>
          <p className="text-2xl font-black text-slate-900 dark:text-white font-mono tabular-nums mt-1">{totalOrders}</p>
          <span className="text-[11px] text-slate-500 font-medium">Toàn hệ thống</span>
        </div>

        <div className="p-4 rounded-xl bg-surface-card border hairline-border surface-bevel shadow-sm">
          <span className="text-[10px] font-mono font-bold uppercase text-amber-600 tracking-wider block">Cần xử lý / Chưa TT</span>
          <p className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono tabular-nums mt-1">{pendingOrders}</p>
          <span className="text-[11px] text-slate-500 font-medium">Chờ duyệt & thanh toán</span>
        </div>

        <div className="p-4 rounded-xl bg-surface-card border hairline-border surface-bevel shadow-sm">
          <span className="text-[10px] font-mono font-bold uppercase text-blue-600 tracking-wider block">Đang đóng gói / Giao</span>
          <p className="text-2xl font-black text-blue-600 dark:text-blue-400 font-mono tabular-nums mt-1">{shippingOrders}</p>
          <span className="text-[11px] text-slate-500 font-medium">Đang trong tiến trình</span>
        </div>

        <div className="p-4 rounded-xl bg-surface-card border hairline-border surface-bevel shadow-sm">
          <span className="text-[10px] font-mono font-bold uppercase text-emerald-600 tracking-wider block">Doanh thu thực nhận</span>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono tabular-nums mt-1">{formatVND(paidRevenue)}</p>
          <span className="text-[11px] text-slate-500 font-medium">Đã thanh toán thành công</span>
        </div>
      </div>

      {/* Feedback Alert Toast */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 shadow-sm transition-all ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30'
              : 'bg-rose-500/10 text-rose-800 dark:text-rose-300 border border-rose-500/30'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
          ) : (
            <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-600" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Filter and Table Card */}
      <div className="rounded-2xl hairline-border surface-bevel bg-surface-card p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex gap-2 max-w-md w-full">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Tìm theo mã đơn (#TG...), tên, SĐT khách hàng..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadOrders(false)}
                className="w-full pl-8 pr-3 py-2 text-xs rounded-lg bg-surface-subtle/40 dark:bg-surface-elevated hairline-border text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus:border-slate-500 dark:focus:border-signal-cyan"
              />
              <Search className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            </div>
            <button
              onClick={() => loadOrders(false)}
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
              <option value="shipping" className="bg-surface-card text-slate-900 dark:text-white">Đang giao hàng (Chờ khách nhận)</option>
              <option value="delivered" className="bg-surface-card text-slate-900 dark:text-white">✓ ĐÃ GIAO (HOÀN TẤT)</option>
              <option value="cancelled" className="bg-surface-card text-slate-900 dark:text-white">Đã hủy</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-600 dark:text-slate-400 font-mono font-medium flex flex-col items-center gap-2">
            <RefreshCw className="w-5 h-5 animate-spin text-slate-400" />
            <span>Đang tải danh sách đơn hàng...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b hairline-border text-slate-900 dark:text-slate-200 font-mono text-[11px] uppercase tracking-wider font-extrabold">
                <tr>
                  <th className="pb-3 px-3">Mã Đơn & Ngày</th>
                  <th className="pb-3 px-3">Khách Hàng</th>
                  <th className="pb-3 px-3">Tổng Tiền</th>
                  <th className="pb-3 px-3">Thanh Toán (Tự Động)</th>
                  <th className="pb-3 px-3">Tiến Trình Đơn (Tự Động)</th>
                  <th className="pb-3 px-3 text-right">Chi Tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y hairline-border">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-600 dark:text-slate-400 font-mono font-medium">
                      Chưa có đơn hàng nào phù hợp với bộ lọc tìm kiếm.
                    </td>
                  </tr>
                ) : (
                  orders.map((o) => {
                    const isOrderActionLoading = actionLoadingId === o._id;
                    const canAdvance = o.orderStatus === 'pending' || o.orderStatus === 'processing' || o.orderStatus === 'shipping';
                    const canCancel = o.orderStatus !== 'delivered' && o.orderStatus !== 'cancelled';

                    return (
                      <tr key={o._id} className="hover:bg-surface-subtle/30 dark:hover:bg-surface-elevated/40 transition-colors">
                        {/* Order Code & Date */}
                        <td className="py-3 px-3">
                          <span className="font-mono font-bold text-slate-950 dark:text-white block tracking-tight">
                            #{o.orderCode?.replace(/^#/, '')}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono tabular-nums font-semibold">
                            {formatDate(o.createdAt)}
                          </span>
                        </td>

                        {/* Customer */}
                        <td className="py-3 px-3">
                          <p className="font-semibold text-slate-900 dark:text-slate-100">
                            {o.customerInfo?.name}
                          </p>
                          <span className="text-[10px] text-slate-500 font-mono tabular-nums font-semibold block">
                            {o.customerInfo?.phone}
                          </span>
                          {o.userId && typeof o.userId === 'object' && o.userId.fullName && (
                            <span
                              className="text-[10px] text-cyan-600 dark:text-cyan-400 font-mono block mt-0.5"
                              title={`Tài khoản đặt: ${o.userId.fullName} (${o.userId.email})`}
                            >
                              TK: {o.userId.fullName}
                              {o.userId.fullName !== o.customerInfo?.name ? ` (${o.userId.email})` : ''}
                            </span>
                          )}
                        </td>

                        {/* Total Amount & Items */}
                        <td className="py-3 px-3">
                          <span className="font-bold text-slate-950 dark:text-white font-mono tabular-nums block">
                            {formatVND(o.totalAmount)}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono tabular-nums">
                            {o.items?.reduce((sum: number, i: any) => sum + i.quantity, 0)} sản phẩm
                          </span>
                        </td>

                        {/* 1. Payment Status (Auto-Confirmation) */}
                        <td className="py-3 px-3">
                          <div className="flex flex-col gap-1.5 items-start">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-surface-subtle text-slate-700 dark:text-slate-300">
                                {o.paymentMethod || 'COD'}
                              </span>
                              {getPaymentStatusBadge(o.paymentStatus, o.paymentMethod)}
                            </div>

                            {/* Auto Verify Payment Action Button if pending */}
                            {o.paymentStatus === 'pending' && canCancel && (
                              <button
                                onClick={() => handleAutoVerifyPayment(o._id)}
                                disabled={isOrderActionLoading}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-[10px] font-bold shadow-sm transition-all active:scale-95 disabled:opacity-50"
                                title="Xác nhận đã nhận tiền chuyển khoản MB Bank và chuyển trạng thái sang Paid"
                              >
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Xác nhận đã nhận tiền (Duyệt Paid)</span>
                              </button>
                            )}

                            {/* Transaction ID if paid online */}
                            {o.vnpayTransactionNo && (
                              <span className="text-[9px] font-mono text-slate-400">
                                Ref: {o.vnpayTransactionNo}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* 2. Order Progression (Auto-Advance & Smart Action) */}
                        <td className="py-3 px-3">
                          <div className="flex flex-col gap-1.5 items-start">
                            <div className="flex items-center gap-2">
                              {getOrderStatusBadge(o.orderStatus)}
                            </div>

                            {/* 1-Click Smart Action Button */}
                            {canAdvance && (
                              <div className="flex items-center gap-1.5">
                                {o.orderStatus === 'pending' && (
                                  <button
                                    onClick={() => handleAutoAdvance(o)}
                                    disabled={isOrderActionLoading}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-mono text-[10px] font-bold shadow-sm transition-all active:scale-95 disabled:opacity-50"
                                  >
                                    <Zap className="w-3 h-3" />
                                    <span>Xác nhận & Đóng gói</span>
                                  </button>
                                )}

                                {o.orderStatus === 'processing' && (
                                  <button
                                    onClick={() => handleAutoAdvance(o)}
                                    disabled={isOrderActionLoading}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-mono text-[10px] font-bold shadow-sm transition-all active:scale-95 disabled:opacity-50"
                                  >
                                    <Truck className="w-3 h-3" />
                                    <span>Xuất kho giao hàng</span>
                                  </button>
                                )}

                                {o.orderStatus === 'shipping' && (
                                  <button
                                    onClick={() => handleAutoAdvance(o)}
                                    disabled={isOrderActionLoading}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600/90 hover:bg-emerald-700 text-white font-mono text-[10px] font-bold shadow-sm transition-all active:scale-95 disabled:opacity-50"
                                    title="Nhân viên xác nhận thay thế khi khách nhận hàng trực tiếp"
                                  >
                                    <PackageCheck className="w-3 h-3" />
                                    <span>Ghi đè: Đã giao</span>
                                  </button>
                                )}

                                {/* Manual Cancel Button */}
                                <button
                                  onClick={() => {
                                    if (confirm(`Bạn có chắc muốn hủy đơn hàng #${o.orderCode}? Tồn kho sẽ được tự động hoàn lại.`)) {
                                      handleStatusChange(o._id, 'cancelled');
                                    }
                                  }}
                                  className="text-[10px] font-mono text-rose-600 hover:underline px-1 py-0.5"
                                >
                                  Hủy
                                </button>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* View Details */}
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => setSelectedOrder(o)}
                            className="p-1.5 rounded-lg text-slate-700 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-surface-elevated transition-colors"
                            title="Xem chi tiết đơn hàng"
                          >
                            <Eye className="w-4 h-4" />
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
                <span className="font-mono text-slate-950 dark:text-white font-bold">#{selectedOrder.orderCode}</span>
              </h3>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-surface-elevated transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Statuses and Actions Inside Modal */}
            <div className="p-3.5 rounded-xl bg-surface-subtle/30 dark:bg-surface-elevated/70 hairline-border text-xs space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-mono">Phương thức:</span>
                <span className="font-mono font-bold">{selectedOrder.paymentMethod}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-mono">Thanh toán:</span>
                <div>{getPaymentStatusBadge(selectedOrder.paymentStatus, selectedOrder.paymentMethod)}</div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-mono">Trạng thái:</span>
                <div>{getOrderStatusBadge(selectedOrder.orderStatus)}</div>
              </div>
              {selectedOrder.vnpayTransactionNo && (
                <div className="flex justify-between items-center pt-1 border-t hairline-border">
                  <span className="text-slate-500 font-mono">Mã GD Cổng TT:</span>
                  <span className="font-mono font-bold text-cyan-600">{selectedOrder.vnpayTransactionNo}</span>
                </div>
              )}
            </div>

            <div className="p-3.5 rounded-xl bg-surface-subtle/30 dark:bg-surface-elevated/70 hairline-border text-xs space-y-1">
              <p><strong>Người nhận hàng:</strong> {selectedOrder.customerInfo?.name}</p>
              {selectedOrder.userId && typeof selectedOrder.userId === 'object' && selectedOrder.userId.fullName && (
                <p>
                  <strong>Tài khoản đặt:</strong>{' '}
                  <span className="text-cyan-700 dark:text-cyan-400 font-semibold">
                    {selectedOrder.userId.fullName}
                  </span>{' '}
                  <span className="text-slate-500 font-mono">({selectedOrder.userId.email})</span>
                </p>
              )}
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
              className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-mono font-bold text-xs hover:bg-slate-800 transition-colors shadow-sm"
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function OrdersContainer() {
  const searchParams = useSearchParams();
  const statusParam = searchParams.get('status') || '';
  return <OrdersContent key={statusParam} initialStatus={statusParam} />;
}

export default function AdminOrdersPage() {
  const { hasPermission } = useAuthStore();

  if (!hasPermission('orders')) {
    return <AccessDenied requiredPermission="orders" />;
  }

  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-xs font-mono font-medium text-slate-600 dark:text-slate-400">
          Đang tải danh sách đơn hàng...
        </div>
      }
    >
      <OrdersContainer />
    </Suspense>
  );
}
