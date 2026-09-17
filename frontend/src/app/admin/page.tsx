'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  DollarSign,
  ShoppingCart,
  Package,
  AlertTriangle,
  TrendingUp,
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Boxes,
  Clock,
  Truck,
  CheckCircle2,
  X,
  PlusCircle,
  History,
  ShieldCheck,
  Zap,
  RefreshCw,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { fetchApi } from '@/lib/api';
import { formatVND, formatDate } from '@/lib/utils';
import { useTheme } from '@/lib/useTheme';
import { useAuthStore } from '@/store/authStore';
import { getAdminRoleInfo } from '@/lib/rbac';
import AccessDenied from '@/components/admin/AccessDenied';

const COLORS_DARK = ['#00F0FF', '#818cf8', '#10b981', '#fbbf24'];
const COLORS_LIGHT = ['#0891b2', '#4f46e5', '#059669', '#d97706'];

const CustomPieTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    const item = data.payload || {};
    const name = item.name || data.name || 'Sản phẩm';
    const quantity = item.quantity ?? data.value ?? 0;
    const color = item.color || data.payload?.fill || data.color || '#0891b2';
    const percent =
      item.percent !== undefined && item.percent !== null
        ? item.percent
        : data.percent !== undefined && data.percent !== null
        ? Math.round(data.percent * 100)
        : null;

    return (
      <div className="bg-white/95 dark:bg-surface-elevated/95 backdrop-blur-md hairline-border px-3.5 py-2 rounded-lg shadow-xl flex items-center gap-2.5 pointer-events-none z-50">
        <span
          className="w-2.5 h-2.5 rounded-full flex-shrink-0 shadow-sm ring-1 ring-black/10 dark:ring-white/20"
          style={{ backgroundColor: color }}
        />
        <div className="flex items-center gap-2 text-xs">
          <span className="font-semibold text-slate-800 dark:text-slate-200">{name}:</span>
          <span className="font-bold text-slate-900 dark:text-white tabular-nums font-mono">{quantity} chiếc</span>
          {percent !== null && (
            <span className="font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-surface-elevated px-1.5 py-0.5 rounded border border-slate-300 dark:border-white/10 text-[11px] tabular-nums font-mono">
              {percent}%
            </span>
          )}
        </div>
      </div>
    );
  }
  return null;
};

const CustomAreaTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 dark:bg-surface-elevated/95 backdrop-blur-md hairline-border px-3.5 py-2 rounded-lg shadow-xl space-y-1 pointer-events-none z-50">
        <p className="text-[11px] font-mono text-slate-600 dark:text-slate-400 font-bold">{label}</p>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-slate-900 dark:bg-signal-cyan shadow-sm" />
          <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Doanh thu:</span>
          <span className="text-xs font-bold text-slate-950 dark:text-white tabular-nums font-mono">
            {formatVND(Number(payload[0].value))}
          </span>
        </div>
      </div>
    );
  }
  return null;
};

/* =========================================================================
 * 1. WAREHOUSE DASHBOARD COMPONENT (For warehouse@techgear.vn)
 * ========================================================================= */
function WarehouseDashboard({ user }: { user: any }) {
  const [products, setProducts] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [changeAmount, setChangeAmount] = useState<number>(10);
  const [reason, setReason] = useState<'restock' | 'manual_adjustment'>('restock');
  const [note, setNote] = useState('');
  const [modalLoading, setModalLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const loadWarehouseData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchApi('/admin/inventory');
      if (res.success && res.data) {
        setProducts(res.data.products || []);
        setLogs(res.data.recentLogs || []);
      }
    } catch {
      // error handled
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWarehouseData();
  }, [loadWarehouseData]);

  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    setModalLoading(true);
    try {
      const res = await fetchApi(`/products/${selectedProduct._id}/stock`, {
        method: 'PATCH',
        body: JSON.stringify({
          changeAmount: Number(changeAmount),
          reason,
          note: note.trim(),
        }),
      });
      if (res.success) {
        setFeedback(`Đã cập nhật tồn kho cho "${selectedProduct.name}"!`);
        setSelectedProduct(null);
        setNote('');
        loadWarehouseData();
        setTimeout(() => setFeedback(null), 3500);
      } else {
        alert(res.message || 'Không thể cập nhật tồn kho');
      }
    } catch {
      alert('Lỗi kết nối máy chủ');
    } finally {
      setModalLoading(false);
    }
  };

  const totalSKUs = products.length;
  const lowStockItems = products.filter((p) => p.stock > 0 && p.stock < 5);
  const outOfStockItems = products.filter((p) => p.stock === 0);
  const healthyStockItems = products.filter((p) => p.stock >= 5);

  return (
    <div className="space-y-6 pb-12">
      {/* 1. TOP HEADER BANNER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-amber-500/10 border border-amber-500/25 surface-bevel">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-500/20 text-amber-800 dark:text-amber-200 border border-amber-500/30">
              Nhân Viên Kho (Warehouse)
            </span>
            <span className="text-xs text-amber-700 dark:text-amber-300 font-medium">Quyền: Quản lý kho, nhập hàng (`inventory`)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1 flex items-center gap-2">
            <Boxes className="w-7 h-7 text-amber-600 dark:text-amber-400" />
            <span>Bàn Làm Việc Kho Hàng</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium mt-1">
            Xin chào <strong className="text-slate-900 dark:text-white">{user?.fullName || 'Nhân viên Kho'}</strong>. Kiểm tra các cảnh báo tồn kho thấp và nhập hàng kịp thời.
          </p>
        </div>
      </div>

      {/* 2. CÁC CHỨC NĂNG CHÍNH DÀNH CHO NHÂN VIÊN KHO */}
      <div className="p-4 rounded-2xl bg-surface-card hairline-border surface-bevel shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b hairline-border pb-2.5">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <h2 className="text-xs font-mono uppercase font-bold text-slate-700 dark:text-slate-300 tracking-wider">
              Chức Năng Chính - Nhân Viên Kho Hàng
            </h2>
          </div>
          <span className="text-[11px] font-mono text-slate-500">3 phân hệ nghiệp vụ</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Chức năng 1: Quản lý kho & nhập hàng */}
          <Link
            href="/admin/inventory"
            className="flex items-center justify-between p-3.5 rounded-xl border hairline-border bg-surface-subtle/30 dark:bg-surface-elevated/40 hover:bg-amber-500/10 hover:border-amber-500/30 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 group-hover:scale-105 transition-transform">
                <Boxes className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                  Quản Lý Kho & Nhập Hàng
                </p>
                <p className="text-[11px] text-slate-500 font-mono">Danh mục &amp; kiểm kê kho</p>
              </div>
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-amber-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
          </Link>

          {/* Chức năng 2: Cảnh báo tồn kho thấp */}
          <Link
            href="/admin/inventory?lowStock=true"
            className="flex items-center justify-between p-3.5 rounded-xl border hairline-border bg-surface-subtle/30 dark:bg-surface-elevated/40 hover:bg-amber-500/10 hover:border-amber-500/30 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-600 dark:text-rose-400 group-hover:scale-105 transition-transform">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                  Cảnh Báo Tồn Kho Thấp
                </p>
                <p className="text-[11px] text-rose-600 dark:text-rose-400 font-mono font-bold">
                  {lowStockItems.length + outOfStockItems.length} SKU cần nhập gấp
                </p>
              </div>
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-amber-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
          </Link>

          {/* Chức năng 3: Hàng chờ nhập hàng khẩn cấp */}
          <a
            href="#urgent-restock"
            className="flex items-center justify-between p-3.5 rounded-xl border hairline-border bg-surface-subtle/30 dark:bg-surface-elevated/40 hover:bg-amber-500/10 hover:border-amber-500/30 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-600 dark:text-amber-300 group-hover:scale-105 transition-transform">
                <PlusCircle className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                  Hàng Chờ Nhập Khẩn Cấp
                </p>
                <p className="text-[11px] text-slate-500 font-mono">Bổ sung nhanh tức thì</p>
              </div>
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-amber-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
          </a>
        </div>
      </div>

      {feedback && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* 4 Warehouse KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-surface-card hairline-border surface-bevel shadow-sm">
          <span className="text-xs font-mono font-bold text-slate-500 uppercase">Tổng SKU Trong Kho</span>
          <p className="text-3xl font-black font-mono mt-1 text-slate-900 dark:text-white">{totalSKUs}</p>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">Toàn bộ 4 danh mục</span>
        </div>

        <div className="p-5 rounded-2xl bg-surface-card hairline-border surface-bevel shadow-sm border-l-4 border-l-amber-500">
          <span className="text-xs font-mono font-bold text-amber-700 dark:text-amber-400 uppercase flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Sắp Hết Hàng (&lt; 5)</span>
          </span>
          <p className="text-3xl font-black font-mono mt-1 text-amber-600 dark:text-amber-400">{lowStockItems.length}</p>
          <span className="text-[11px] text-amber-700/80 dark:text-amber-400/80 mt-1 block">Cần nhập thêm hàng</span>
        </div>

        <div className="p-5 rounded-2xl bg-surface-card hairline-border surface-bevel shadow-sm border-l-4 border-l-rose-500">
          <span className="text-xs font-mono font-bold text-rose-700 dark:text-rose-400 uppercase flex items-center gap-1.5">
            <X className="w-3.5 h-3.5" />
            <span>Đã Hết Hàng (0)</span>
          </span>
          <p className="text-3xl font-black font-mono mt-1 text-rose-600 dark:text-rose-400">{outOfStockItems.length}</p>
          <span className="text-[11px] text-rose-700/80 dark:text-rose-400/80 mt-1 block">Không thể bán</span>
        </div>

        <div className="p-5 rounded-2xl bg-surface-card hairline-border surface-bevel shadow-sm border-l-4 border-l-emerald-500">
          <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400 uppercase flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Tồn Kho Ổn Định</span>
          </span>
          <p className="text-3xl font-black font-mono mt-1 text-emerald-600 dark:text-emerald-400">{healthyStockItems.length}</p>
          <span className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80 mt-1 block">Tồn kho &gt;= 5 chiếc</span>
        </div>
      </div>

      {/* Urgent Restock Queue */}
      <div id="urgent-restock" className="rounded-2xl hairline-border surface-bevel bg-surface-card p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b hairline-border">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <div>
              <h2 className="font-black text-base text-slate-900 dark:text-white">
                Sản Phẩm Cần Nhập Hàng Khẩn Cấp (Tồn &lt; 5 chiếc)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Nhấp vào nút &ldquo;Nhập Hàng Nhanh&rdquo; để bổ sung tồn kho ngay lập tức.
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
            {lowStockItems.length + outOfStockItems.length} sản phẩm
          </span>
        </div>

        {loading ? (
          <div className="py-10 text-center text-xs font-mono text-slate-500">Đang kiểm tra tồn kho...</div>
        ) : [...outOfStockItems, ...lowStockItems].length === 0 ? (
          <div className="py-8 text-center text-xs text-emerald-600 font-semibold flex flex-col items-center gap-2">
            <CheckCircle2 className="w-8 h-8" />
            <span>Kho hàng đang trong trạng thái tối ưu! Không có sản phẩm nào dưới 5 chiếc.</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b hairline-border text-slate-500 font-mono text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="pb-3 px-3">Sản Phẩm</th>
                  <th className="pb-3 px-3">Danh Mục</th>
                  <th className="pb-3 px-3">Giá Bán</th>
                  <th className="pb-3 px-3">Tồn Kho Hiện Tại</th>
                  <th className="pb-3 px-3 text-right">Hành Động</th>
                </tr>
              </thead>
              <tbody className="divide-y hairline-border">
                {[...outOfStockItems, ...lowStockItems].map((prod) => (
                  <tr key={prod._id} className="hover:bg-surface-subtle/40 transition-colors">
                    <td className="py-3 px-3">
                      <p className="font-bold text-slate-900 dark:text-white">{prod.name}</p>
                      <span className="text-[10px] font-mono text-slate-500">{prod.brand} • {prod.sku || prod._id.slice(-6)}</span>
                    </td>
                    <td className="py-3 px-3 font-mono capitalize">{prod.category}</td>
                    <td className="py-3 px-3 font-mono font-bold">{formatVND(prod.price)}</td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-mono font-black ${
                          prod.stock === 0
                            ? 'bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30'
                            : 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        <AlertTriangle className="w-3 h-3" />
                        {prod.stock === 0 ? 'Hết hàng (0)' : `Còn ${prod.stock} chiếc`}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => {
                          setSelectedProduct(prod);
                          setChangeAmount(10);
                          setReason('restock');
                          setNote('Nhập hàng nhanh từ Dashboard Kho');
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-mono font-bold text-xs shadow-sm transition-all"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        <span>Nhập Hàng Nhanh</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent Inventory Audit Logs */}
      <div className="rounded-2xl hairline-border surface-bevel bg-surface-card p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b hairline-border">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-slate-500" />
            <h2 className="font-black text-base text-slate-900 dark:text-white">
              Nhật Ký Xuất Nhập & Kiểm Kê Kho Gần Đây
            </h2>
          </div>
          <Link
            href="/admin/inventory"
            className="text-xs font-mono font-bold text-cyan-600 dark:text-signal-cyan hover:underline"
          >
            Xem toàn bộ lịch sử →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b hairline-border text-slate-500 font-mono text-[11px] uppercase tracking-wider">
              <tr>
                <th className="pb-3 px-3">Thời Gian</th>
                <th className="pb-3 px-3">Mã / Sản Phẩm</th>
                <th className="pb-3 px-3">Phân Loại</th>
                <th className="pb-3 px-3">Số Lượng Thay Đổi</th>
                <th className="pb-3 px-3">Tồn Sau Điều Chỉnh</th>
                <th className="pb-3 px-3">Ghi Chú</th>
              </tr>
            </thead>
            <tbody className="divide-y hairline-border">
              {logs.slice(0, 8).map((log) => (
                <tr key={log._id} className="hover:bg-surface-subtle/40 transition-colors">
                  <td className="py-2.5 px-3 font-mono text-slate-500 whitespace-nowrap">
                    {formatDate(log.createdAt)}
                  </td>
                  <td className="py-2.5 px-3 font-medium text-slate-900 dark:text-white truncate max-w-[200px]" title={log.productName || log.productId}>
                    {log.productName || log.productId}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-slate-100 dark:bg-surface-elevated text-slate-700 dark:text-slate-300">
                      {log.reason === 'restock'
                        ? 'Nhập hàng'
                        : log.reason === 'order_deduction'
                        ? 'Xuất đơn hàng'
                        : log.reason === 'order_cancellation'
                        ? 'Hoàn trả kho'
                        : 'Kiểm kê'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-mono font-bold">
                    <span className={log.changeAmount > 0 ? 'text-emerald-600' : 'text-rose-600'}>
                      {log.changeAmount > 0 ? `+${log.changeAmount}` : log.changeAmount}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-mono font-bold text-slate-900 dark:text-white">
                    {log.resultingStock !== undefined ? log.resultingStock : '-'}
                  </td>
                  <td className="py-2.5 px-3 text-slate-500 truncate max-w-[180px]">
                    {log.note || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stock Adjust Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-surface-card hairline-border surface-bevel p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b hairline-border">
              <h3 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Boxes className="w-4 h-4 text-amber-500" />
                <span>Nhập Hàng Nhanh / Điều Chỉnh Tồn Kho</span>
              </h3>
              <button
                onClick={() => setSelectedProduct(null)}
                className="p-1 rounded-lg text-slate-400 hover:bg-surface-elevated"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-surface-subtle/30 dark:bg-surface-elevated/50 space-y-1">
              <p className="font-bold text-xs text-slate-900 dark:text-white">{selectedProduct.name}</p>
              <div className="flex items-center gap-2 text-[11px] font-mono text-slate-500">
                <span>Tồn hiện tại: <strong className="text-amber-500 font-bold">{selectedProduct.stock}</strong> chiếc</span>
                <span>• Giá: {formatVND(selectedProduct.price)}</span>
              </div>
            </div>

            <form onSubmit={handleAdjustStock} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Mục Đích Điều Chỉnh
                </label>
                <select
                  value={reason}
                  onChange={(e: any) => setReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-surface-subtle/40 dark:bg-surface-elevated hairline-border font-mono text-slate-900 dark:text-white"
                >
                  <option value="restock">Nhập thêm hàng từ nhà cung cấp (Restock)</option>
                  <option value="manual_adjustment">Kiểm kê sai lệch / Điều chỉnh thủ công</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Số lượng nhập thêm (+ chiếc)
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={changeAmount}
                  onChange={(e) => setChangeAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg bg-surface-subtle/40 dark:bg-surface-elevated hairline-border font-mono font-bold text-sm text-slate-900 dark:text-white"
                />
                <p className="text-[10px] text-slate-500 mt-1 font-mono">
                  Tồn kho mới dự kiến: <strong className="text-emerald-500 font-bold">{selectedProduct.stock + Number(changeAmount)} chiếc</strong>
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Ghi chú chứng từ / Lô hàng
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Nhập lô hàng đợt 2 theo phiếu XK-09..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-surface-subtle/40 dark:bg-surface-elevated hairline-border text-slate-900 dark:text-white placeholder:text-slate-400"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedProduct(null)}
                  className="flex-1 py-2 rounded-lg hairline-border bg-surface-subtle/30 dark:bg-surface-elevated font-medium text-slate-700 dark:text-slate-300"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="flex-1 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold transition-all disabled:opacity-50"
                >
                  {modalLoading ? 'Đang cập nhật...' : 'Xác Nhận Nhập Kho'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================================
 * 2. ORDERS DASHBOARD COMPONENT (For orders@techgear.vn)
 * ========================================================================= */
function OrdersDashboard({ user }: { user: any }) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchApi('/orders?limit=50');
      if (res.success && res.data) {
        setOrders(res.data.orders || []);
      }
    } catch {
      // error handled
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
    const interval = setInterval(() => {
      loadOrders();
    }, 10000);
    return () => {
      clearInterval(interval);
    };
  }, [loadOrders]);

  const showToast = (message: string) => {
    setFeedback(message);
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleAutoVerifyPayment = async (orderId: string) => {
    setActionLoadingId(orderId);
    try {
      const res = await fetchApi(`/orders/${orderId}/verify-payment`, { method: 'POST' });
      if (res.success && res.data) {
        setOrders((prev) => prev.map((o) => (o._id === orderId ? { ...o, ...res.data } : o)));
        showToast('Đã xác nhận thanh toán & chuyển đơn sang "Đang xử lý"!');
      } else {
        alert(res.message || 'Lỗi xác thực');
      }
    } catch {
      alert('Không thể kết nối máy chủ');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleAutoAdvance = async (order: any) => {
    setActionLoadingId(order._id);
    let nextStatus = '';
    if (order.orderStatus === 'pending') nextStatus = 'processing';
    else if (order.orderStatus === 'processing') nextStatus = 'shipping';
    else if (order.orderStatus === 'shipping') nextStatus = 'delivered';

    if (!nextStatus) {
      setActionLoadingId(null);
      return;
    }

    try {
      const res = await fetchApi(`/orders/${order._id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ orderStatus: nextStatus }),
      });
      if (res.success && res.data) {
        setOrders((prev) => prev.map((o) => (o._id === order._id ? { ...o, ...res.data } : o)));
        showToast(`Đã chuyển đơn sang trạng thái "${nextStatus}" thành công!`);
      } else {
        alert(res.message || 'Không thể chuyển trạng thái');
      }
    } catch {
      alert('Không thể kết nối máy chủ');
    } finally {
      setActionLoadingId(null);
    }
  };

  const pendingCount = orders.filter((o) => o.orderStatus === 'pending').length;
  const processingCount = orders.filter((o) => o.orderStatus === 'processing').length;
  const shippingCount = orders.filter((o) => o.orderStatus === 'shipping').length;
  const deliveredCount = orders.filter((o) => o.orderStatus === 'delivered').length;

  const [filterTab, setFilterTab] = useState<'all' | 'urgent' | 'shipping' | 'delivered'>('all');

  const displayedOrders = orders.filter((o) => {
    if (filterTab === 'urgent') return o.orderStatus === 'pending' || o.orderStatus === 'processing';
    if (filterTab === 'shipping') return o.orderStatus === 'shipping';
    if (filterTab === 'delivered') return o.orderStatus === 'delivered';
    return true;
  });

  const urgentQueue = orders.filter(
    (o) => o.orderStatus === 'pending' || o.orderStatus === 'processing' || o.orderStatus === 'shipping'
  );

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
            <span>Bàn Làm Việc Xử Lý Đơn Hàng</span>
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
          <span className="text-[11px] font-mono text-slate-500">3 phân hệ nghiệp vụ</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Chức năng 1: Quản lý đơn hàng chi tiết */}
          <Link
            href="/admin/orders"
            className="flex items-center justify-between p-3.5 rounded-xl border hairline-border bg-surface-subtle/30 dark:bg-surface-elevated/40 hover:bg-cyan-500/10 hover:border-cyan-500/30 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-600 dark:text-cyan-400 group-hover:scale-105 transition-transform">
                <ShoppingCart className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                  Quản Lý Đơn Hàng Chi Tiết
                </p>
                <p className="text-[11px] text-slate-500 font-mono">Toàn bộ 50 đơn gần nhất</p>
              </div>
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-cyan-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
          </Link>

          {/* Chức năng 2: Hàng chờ cần xử lý ngay */}
          <Link
            href="/admin/orders?status=pending"
            className="flex items-center justify-between p-3.5 rounded-xl border hairline-border bg-surface-subtle/30 dark:bg-surface-elevated/40 hover:bg-cyan-500/10 hover:border-cyan-500/30 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 group-hover:scale-105 transition-transform">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                  Hàng Chờ Cần Xử Lý Ngay
                </p>
                <p className="text-[11px] text-amber-600 dark:text-amber-400 font-mono font-bold">
                  {urgentQueue.length} đơn chờ duyệt/xử lý
                </p>
              </div>
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-cyan-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
          </Link>

          {/* Chức năng 3: Quy trình 5 mốc tiến trình */}
          <a
            href="#progression-map"
            className="flex items-center justify-between p-3.5 rounded-xl border hairline-border bg-surface-subtle/30 dark:bg-surface-elevated/40 hover:bg-cyan-500/10 hover:border-cyan-500/30 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-105 transition-transform">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  Quy Trình 5 Bước Chuẩn
                </p>
                <p className="text-[11px] text-slate-500 font-mono">Chờ TT &rarr; Giao hàng</p>
              </div>
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-cyan-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
          </a>
        </div>
      </div>

      {feedback && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* 4 Orders KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-surface-card hairline-border surface-bevel shadow-sm border-l-4 border-l-amber-500">
          <span className="text-xs font-mono font-bold text-amber-700 dark:text-amber-400 uppercase flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>Chờ Xác Nhận</span>
          </span>
          <p className="text-3xl font-black font-mono mt-1 text-amber-600 dark:text-amber-400">{pendingCount}</p>
          <span className="text-[11px] text-amber-700/80 dark:text-amber-400/80 mt-1 block">Cần kiểm tra & duyệt</span>
        </div>

        <div className="p-5 rounded-2xl bg-surface-card hairline-border surface-bevel shadow-sm border-l-4 border-l-cyan-500">
          <span className="text-xs font-mono font-bold text-cyan-700 dark:text-cyan-400 uppercase flex items-center gap-1.5">
            <Package className="w-3.5 h-3.5" />
            <span>Đang Xử Lý & Đóng Gói</span>
          </span>
          <p className="text-3xl font-black font-mono mt-1 text-cyan-600 dark:text-cyan-400">{processingCount}</p>
          <span className="text-[11px] text-cyan-700/80 dark:text-cyan-400/80 mt-1 block">Chuẩn bị bàn giao ship</span>
        </div>

        <div className="p-5 rounded-2xl bg-surface-card hairline-border surface-bevel shadow-sm border-l-4 border-l-indigo-500">
          <span className="text-xs font-mono font-bold text-indigo-700 dark:text-indigo-400 uppercase flex items-center gap-1.5">
            <Truck className="w-3.5 h-3.5" />
            <span>Đang Giao Hàng (Chờ Khách Nhận)</span>
          </span>
          <p className="text-3xl font-black font-mono mt-1 text-indigo-600 dark:text-indigo-400">{shippingCount}</p>
          <span className="text-[11px] text-indigo-700/80 dark:text-indigo-400/80 mt-1 block">Đang trên đường giao</span>
        </div>

        <div className="p-5 rounded-2xl bg-surface-card hairline-border surface-bevel shadow-sm border-l-4 border-l-emerald-500">
          <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400 uppercase flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>✓ ĐÃ GIAO (HOÀN TẤT)</span>
          </span>
          <p className="text-3xl font-black font-mono mt-1 text-emerald-600 dark:text-emerald-400">{deliveredCount}</p>
          <span className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80 mt-1 block">Hoàn tất quy trình</span>
        </div>
      </div>

      {/* Realtime Order Progression Queue & Controls */}
      <div className="rounded-2xl hairline-border surface-bevel bg-surface-card p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b hairline-border">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-cyan-500" />
            <div>
              <h2 className="font-black text-base text-slate-900 dark:text-white">
                Danh Sách Tiến Trình Đơn Hàng (Real-time Sync)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tự động đồng bộ mỗi 10 giây. Khi khách hàng xác nhận nhận hàng, trạng thái sẽ tự động cập nhật sang &ldquo;✓ ĐÃ GIAO (HOÀN TẤT)&rdquo;.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => loadOrders()}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 text-xs font-mono font-bold transition-all shadow-sm active:translate-y-0.5 disabled:opacity-50"
              title="Làm mới danh sách đơn hàng tức thì"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Làm mới</span>
            </button>
            <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30">
              {displayedOrders.length} đơn hiển thị
            </span>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            type="button"
            onClick={() => setFilterTab('all')}
            className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
              filterTab === 'all'
                ? 'bg-cyan-600 text-white shadow-xs'
                : 'bg-surface-subtle/50 dark:bg-surface-elevated text-slate-600 dark:text-slate-300 hover:bg-surface-subtle'
            }`}
          >
            Tất cả ({orders.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('urgent')}
            className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
              filterTab === 'urgent'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-surface-subtle/50 dark:bg-surface-elevated text-slate-600 dark:text-slate-300 hover:bg-surface-subtle'
            }`}
          >
            Cần xử lý ({pendingCount + processingCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('shipping')}
            className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
              filterTab === 'shipping'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-surface-subtle/50 dark:bg-surface-elevated text-slate-600 dark:text-slate-300 hover:bg-surface-subtle'
            }`}
          >
            Đang giao hàng (Chờ khách nhận) ({shippingCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('delivered')}
            className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
              filterTab === 'delivered'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-surface-subtle/50 dark:bg-surface-elevated text-slate-600 dark:text-slate-300 hover:bg-surface-subtle'
            }`}
          >
            ✓ ĐÃ GIAO (HOÀN TẤT) ({deliveredCount})
          </button>
        </div>

        {loading ? (
          <div className="py-10 text-center text-xs font-mono text-slate-500">Đang tải đơn hàng...</div>
        ) : displayedOrders.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500 font-semibold flex flex-col items-center gap-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            <span>Không có đơn hàng nào trong phân loại này.</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b hairline-border text-slate-500 font-mono text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="pb-3 px-3">Mã Đơn</th>
                  <th className="pb-3 px-3">Khách Hàng</th>
                  <th className="pb-3 px-3">Tổng Tiền</th>
                  <th className="pb-3 px-3">Thanh Toán</th>
                  <th className="pb-3 px-3">Trạng Thái Đơn</th>
                  <th className="pb-3 px-3 text-right">Hành Động Nhanh</th>
                </tr>
              </thead>
              <tbody className="divide-y hairline-border">
                {displayedOrders.map((order) => (
                  <tr key={order._id} className="hover:bg-surface-subtle/40 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-slate-900 dark:text-white">
                      {order.orderCode}
                    </td>
                    <td className="py-3 px-3">
                      <p className="font-semibold text-slate-900 dark:text-white">{order.customerInfo?.name || 'Khách lẻ'}</p>
                      <span className="text-[10px] font-mono text-slate-500">{order.customerInfo?.phone || '-'}</span>
                    </td>
                    <td className="py-3 px-3 font-mono font-bold">{formatVND(order.totalAmount)}</td>
                    <td className="py-3 px-3">
                      {order.paymentMethod === 'ONLINE' && order.paymentStatus === 'pending' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40 animate-pulse">
                          <Clock className="w-3 h-3" />
                          Chờ đối soát chuyển khoản
                        </span>
                      ) : (
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                            order.paymentStatus === 'paid'
                              ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                              : 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          {order.paymentStatus === 'paid' ? 'Đã TT' : 'Chưa TT'} ({order.paymentMethod})
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      {order.orderStatus === 'pending' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-mono font-bold uppercase bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                          Chờ xác nhận
                        </span>
                      )}
                      {order.orderStatus === 'processing' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-mono font-bold uppercase bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30">
                          Đang xử lý
                        </span>
                      )}
                      {order.orderStatus === 'shipping' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-mono font-bold uppercase bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30">
                          Đang giao hàng (Chờ khách nhận)
                        </span>
                      )}
                      {order.orderStatus === 'delivered' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-mono font-bold uppercase bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                          ✓ ĐÃ GIAO (HOÀN TẤT)
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {order.paymentStatus !== 'paid' && (
                          <button
                            disabled={actionLoadingId === order._id}
                            onClick={() => handleAutoVerifyPayment(order._id)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-mono font-bold text-[10px] transition-all disabled:opacity-50 flex items-center gap-1 shadow-sm active:scale-95"
                            title="Xác nhận đã nhận tiền qua chuyển khoản MB Bank và chuyển trạng thái sang Paid"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Xác nhận đã nhận tiền (Duyệt Paid)</span>
                          </button>
                        )}
                        {order.orderStatus === 'pending' && (
                          <button
                            disabled={actionLoadingId === order._id}
                            onClick={() => handleAutoAdvance(order)}
                            className="px-2.5 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-mono font-bold text-[10px] transition-all disabled:opacity-50 flex items-center gap-1"
                          >
                            <Zap className="w-3 h-3" />
                            <span>Duyệt Đơn</span>
                          </button>
                        )}
                        {order.orderStatus === 'processing' && (
                          <button
                            disabled={actionLoadingId === order._id}
                            onClick={() => handleAutoAdvance(order)}
                            className="px-2.5 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-mono font-bold text-[10px] transition-all disabled:opacity-50 flex items-center gap-1"
                          >
                            <Zap className="w-3 h-3" />
                            <span>Giao Hàng</span>
                          </button>
                        )}
                        {order.orderStatus === 'shipping' && (
                          <button
                            disabled={actionLoadingId === order._id}
                            onClick={() => handleAutoAdvance(order)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600/90 hover:bg-emerald-700 text-white font-mono font-bold text-[10px] transition-all disabled:opacity-50 flex items-center gap-1"
                            title="Nhân viên xác nhận thay thế khi khách nhận hàng trực tiếp"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Ghi đè: Đã giao</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 5-stage Progression Map */}
      <div id="progression-map" className="p-5 rounded-2xl hairline-border surface-bevel bg-surface-card shadow-sm space-y-3">
        <h3 className="text-xs font-mono uppercase font-bold text-slate-500">Quy Trình Xử Lý Tiến Trình 5 Mốc Chuẩn SRS:</h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs font-mono font-bold">
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300">
            1. Chờ xác nhận
          </div>
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-700 dark:text-cyan-300">
            2. Đang xử lý
          </div>
          <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-700 dark:text-indigo-300">
            3. Đang giao hàng (Chờ khách nhận)
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300">
            4. ✓ ĐÃ GIAO (HOÀN TẤT)
          </div>
          <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300">
            5. Đã hủy (Hoàn kho)
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
 * 3. SUPER ADMIN DASHBOARD COMPONENT (For admin@techgear.vn)
 * ========================================================================= */
function SuperAdminDashboard({ user }: { user: any }) {
  const { isDark } = useTheme();
  const chartColor = isDark ? '#00F0FF' : '#0891b2';
  const gridColor = isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0';
  const axisColor = isDark ? '#475569' : '#64748b';
  const tickColor = isDark ? '#94a3b8' : '#334155';
  const pieColors = isDark ? COLORS_DARK : COLORS_LIGHT;

  const [activeTab, setActiveTab] = useState<'finance' | 'warehouse' | 'orders'>('finance');
  const [summary, setSummary] = useState<any>(null);
  const [period, setPeriod] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');
  const [periodicData, setPeriodicData] = useState<any[]>([]);
  const [quarterlyData, setQuarterlyData] = useState<any[]>([]);
  const [dailyCategoryData, setDailyCategoryData] = useState<any[]>([]);
  const [dailyTotalSold, setDailyTotalSold] = useState(0);
  const [loading, setLoading] = useState(true);

  // Load KPI Summary
  useEffect(() => {
    async function loadSummary() {
      const res = await fetchApi('/admin/summary');
      if (res.success && res.data) {
        setSummary(res.data);
      }
    }
    loadSummary();
  }, []);

  // Load Periodic Revenue
  useEffect(() => {
    async function loadPeriodic() {
      const res = await fetchApi(`/admin/periodic-revenue?period=${period}`);
      if (res.success && res.data) {
        setPeriodicData(res.data);
      }
    }
    loadPeriodic();
  }, [period]);

  // Load Quarterly Revenue
  useEffect(() => {
    async function loadQuarterly() {
      const res = await fetchApi('/admin/quarterly-revenue');
      if (res.success && res.data) {
        setQuarterlyData(res.data.quarters || []);
      }
    }
    loadQuarterly();
  }, []);

  // Load Daily Category Stats
  useEffect(() => {
    async function loadDailyCategories() {
      setLoading(true);
      const res = await fetchApi('/admin/daily-categories');
      if (res.success && res.data) {
        const total = res.data.totalProductsSoldToday || 0;
        const categories = (res.data.categories || []).map((cat: any) => ({
          ...cat,
          percent: total > 0 ? Math.round((cat.quantity / total) * 100) : 0,
        }));
        setDailyCategoryData(categories);
        setDailyTotalSold(total);
      }
      setLoading(false);
    }
    loadDailyCategories();
  }, []);

  return (
    <div className="space-y-6 pb-10">
      {/* Top Welcome Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30">
              Super Admin
            </span>
            <span className="text-xs text-rose-700 dark:text-rose-300 font-medium">Toàn quyền quản trị hệ thống (`all`)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2 mt-1">
            <span>Báo Cáo Doanh Thu & Thống Kê Tổng Quan</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium mt-1">
            Theo dõi chi tiết hiệu suất kinh doanh, tăng trưởng doanh thu 4 quý và quản lý toàn diện các phân hệ.
          </p>
        </div>

        {/* Tab switcher for Super Admin to inspect all departments */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-surface-card hairline-border surface-bevel self-start sm:self-auto shadow-sm text-xs font-mono font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('finance')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'finance'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            📊 Doanh Thu & KPI
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('warehouse')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'warehouse'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            🏬 Kho Hàng
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('orders')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'orders'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            🛒 Đơn Hàng
          </button>
        </div>
      </div>

      {activeTab === 'warehouse' ? (
        <WarehouseDashboard user={user} />
      ) : activeTab === 'orders' ? (
        <OrdersDashboard user={user} />
      ) : (
        <>
          {/* 4 KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-xl hairline-border surface-bevel bg-surface-card p-5 space-y-2 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase text-slate-700 dark:text-slate-300 font-bold">Tổng Doanh Thu</span>
                <div className="w-8 h-8 rounded-lg bg-surface-elevated hairline-border surface-bevel flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-slate-900 dark:text-black" />
                </div>
              </div>
              <p className="text-2xl font-black text-slate-950 dark:text-white tabular-nums font-mono">
                {summary ? formatVND(summary.totalRevenue) : '...'}
              </p>
              <div className="flex items-center gap-1.5 text-[11px] font-mono font-medium text-emerald-700 dark:text-signal-emerald">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Hôm nay: {summary ? formatVND(summary.todayStats?.revenue || 0) : '0 ₫'}</span>
              </div>
            </div>

            <div className="rounded-xl hairline-border surface-bevel bg-surface-card p-5 space-y-2 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase text-slate-700 dark:text-slate-300 font-bold">Tổng Đơn Hàng</span>
                <div className="w-8 h-8 rounded-lg bg-surface-elevated hairline-border surface-bevel flex items-center justify-center">
                  <ShoppingCart className="w-4 h-4 text-slate-900 dark:text-black" />
                </div>
              </div>
              <p className="text-2xl font-black text-slate-950 dark:text-white tabular-nums font-mono">
                {summary ? summary.totalOrders : '...'}
              </p>
              <div className="flex items-center gap-1.5 text-[11px] font-mono font-medium text-slate-700 dark:text-slate-300">
                <Calendar className="w-3.5 h-3.5" />
                <span>Hôm nay: {summary?.todayStats?.ordersCount || 0} đơn</span>
              </div>
            </div>

            <div className="rounded-xl hairline-border surface-bevel bg-surface-card p-5 space-y-2 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase text-slate-700 dark:text-slate-300 font-bold">Sản Phẩm Bán Hôm Nay</span>
                <div className="w-8 h-8 rounded-lg bg-surface-elevated hairline-border surface-bevel flex items-center justify-center">
                  <Package className="w-4 h-4 text-slate-900 dark:text-black" />
                </div>
              </div>
              <p className="text-2xl font-black text-slate-950 dark:text-white tabular-nums font-mono">
                {summary ? summary.todayStats?.productsSold || 0 : '...'}
              </p>
              <div className="flex items-center gap-1.5 text-[11px] font-mono font-medium text-slate-700 dark:text-slate-300">
                <Layers className="w-3.5 h-3.5" />
                <span>Tổng danh mục: {summary?.totalProducts || 24}</span>
              </div>
            </div>

            <div className="rounded-xl hairline-border surface-bevel bg-surface-card p-5 space-y-2 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase text-slate-700 dark:text-slate-300 font-bold">Cảnh Báo Tồn Kho</span>
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-amber-700 dark:text-signal-amber" />
                </div>
              </div>
              <p className="text-2xl font-black text-amber-800 dark:text-signal-amber tabular-nums font-mono">
                {summary ? summary.lowStockCount : '...'}
              </p>
              <div className="flex items-center gap-1.5 text-[11px] font-mono font-medium text-amber-800 dark:text-signal-amber">
                <span>Tồn &lt; 5 chiếc (cần nhập thêm)</span>
              </div>
            </div>
          </div>

          {/* Periodic Revenue Chart Section */}
          <div className="rounded-xl hairline-border surface-bevel bg-surface-card p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="font-mono font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-slate-900 dark:text-black" />
                  <span>Biểu Đồ Doanh Thu Định Kỳ</span>
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  Theo dõi xu hướng dòng tiền theo Tuần (7 ngày), Tháng (12 tháng), hoặc Năm.
                </p>
              </div>

              <div className="flex items-center gap-1 bg-surface-subtle/50 dark:bg-surface-elevated p-1 rounded-lg hairline-border self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setPeriod('weekly')}
                  className={`px-3 py-1 rounded-md text-xs font-mono font-bold transition-all ${
                    period === 'weekly'
                      ? 'bg-white dark:bg-surface-card text-slate-950 dark:text-white surface-bevel shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Tuần
                </button>
                <button
                  type="button"
                  onClick={() => setPeriod('monthly')}
                  className={`px-3 py-1 rounded-md text-xs font-mono font-bold transition-all ${
                    period === 'monthly'
                      ? 'bg-white dark:bg-surface-card text-slate-950 dark:text-white surface-bevel shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Tháng
                </button>
                <button
                  type="button"
                  onClick={() => setPeriod('yearly')}
                  className={`px-3 py-1 rounded-md text-xs font-mono font-bold transition-all ${
                    period === 'yearly'
                      ? 'bg-white dark:bg-surface-card text-slate-950 dark:text-white surface-bevel shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Năm
                </button>
              </div>
            </div>

            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={periodicData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={chartColor} stopOpacity={0.4} />
                      <stop offset="95%" stopColor={chartColor} stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis dataKey="label" stroke={axisColor} tick={{ fill: tickColor, fontSize: 11 }} />
                  <YAxis
                    stroke={axisColor}
                    tick={{ fill: tickColor, fontSize: 11 }}
                    tickFormatter={(v) => `${(v / 1000000).toFixed(0)}Tr`}
                  />
                  <Tooltip content={<CustomAreaTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke={chartColor}
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorRev)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Quarterly Revenue Section */}
          <div className="space-y-3">
            <div>
              <h2 className="font-mono font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-900 dark:text-black" />
                <span>Doanh Thu Theo Quý (Năm Hiện Tại)</span>
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                So sánh tỷ lệ tăng trưởng doanh thu giữa 4 quý kinh doanh (Q1, Q2, Q3, Q4).
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {quarterlyData.map((q) => {
                const isPositive = q.growthPercent >= 0;
                return (
                  <div
                    key={q.quarter}
                    className="rounded-xl hairline-border surface-bevel bg-surface-card p-5 space-y-2 shadow-sm relative overflow-hidden"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-xs text-slate-700 dark:text-slate-300 uppercase">
                        Quý {q.quarter}
                      </span>
                      {q.growthPercent !== null && (
                        <span
                          className={`flex items-center gap-0.5 text-[11px] font-mono font-bold px-2 py-0.5 rounded-full ${
                            isPositive
                              ? 'bg-emerald-500/10 text-emerald-700 dark:text-signal-emerald'
                              : 'bg-rose-500/10 text-rose-700 dark:text-signal-rose'
                          }`}
                        >
                          {isPositive ? (
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          ) : (
                            <ArrowDownRight className="w-3.5 h-3.5" />
                          )}
                          <span>
                            {isPositive ? '+' : ''}
                            {q.growthPercent}%
                          </span>
                        </span>
                      )}
                    </div>

                    <p className="text-xl font-black text-slate-950 dark:text-white tabular-nums font-mono">
                      {formatVND(q.revenue)}
                    </p>
                    <p className="text-[11px] font-mono text-slate-600 dark:text-slate-400">
                      Số đơn hoàn tất: <strong className="text-slate-900 dark:text-white">{q.ordersCount}</strong>
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Daily Category Distribution (Donut Chart) */}
          <div className="rounded-xl hairline-border surface-bevel bg-surface-card p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="font-mono font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-slate-900 dark:text-black" />
                  <span>Sản Phẩm Bán Trong Ngày Theo 4 Danh Mục</span>
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  Phân tích tỷ trọng thiết bị bán ra hôm nay (Màn hình, Bàn phím cơ, Chuột, Tai nghe).
                </p>
              </div>

              <span className="font-mono text-xs font-bold text-slate-900 dark:text-white bg-surface-subtle/60 dark:bg-surface-elevated px-3 py-1 rounded-md hairline-border self-start sm:self-auto">
                Tổng hôm nay: {dailyTotalSold} sản phẩm
              </span>
            </div>

            {loading ? (
              <div className="h-64 flex items-center justify-center text-xs font-mono text-slate-500">
                Đang thống kê dữ liệu hôm nay...
              </div>
            ) : dailyTotalSold === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center text-center p-6 space-y-2">
                <Package className="w-8 h-8 text-slate-400" />
                <p className="text-xs font-mono text-slate-600 dark:text-slate-400 font-bold">
                  Hôm nay chưa có đơn hàng nào phát sinh sản phẩm bán ra.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={dailyCategoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="quantity"
                      >
                        {dailyCategoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomPieTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-3">
                  {dailyCategoryData.map((cat, idx) => {
                    const color = pieColors[idx % pieColors.length];
                    return (
                      <div
                        key={cat.category}
                        className="flex items-center justify-between p-3 rounded-xl bg-surface-subtle/30 dark:bg-surface-elevated hairline-border"
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: color }}
                          />
                          <div>
                            <p className="text-xs font-bold text-slate-900 dark:text-white">{cat.name}</p>
                            <p className="text-[10px] font-mono text-slate-500">
                              Doanh thu: {formatVND(cat.revenue)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                            {cat.quantity} chiếc
                          </p>
                          <span className="text-[10px] font-mono font-bold text-slate-500">
                            {cat.percent}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/* =========================================================================
 * MAIN EXPORT: Dynamically routes to the corresponding Role Workspace
 * ========================================================================= */
export default function AdminDashboardPage() {
  const { user, isAdmin, hasPermission } = useAuthStore();
  const roleInfo = getAdminRoleInfo(user);

  // 1. Warehouse Staff (explicit role or inventory permission without orders)
  if (roleInfo.id === 'warehouse' || (hasPermission('inventory') && !hasPermission('orders') && !isAdmin())) {
    return <WarehouseDashboard user={user} />;
  }

  // 2. Orders Staff (explicit role or orders permission without inventory)
  if (roleInfo.id === 'orders' || (hasPermission('orders') && !hasPermission('inventory') && !isAdmin())) {
    return <OrdersDashboard user={user} />;
  }

  // 3. Super Admin (or staff with explicit reports/all permission)
  if (isAdmin() || hasPermission('all') || hasPermission('reports') || user?.email === 'admin@techgear.vn') {
    return <SuperAdminDashboard user={user} />;
  }

  // 4. Custom staff with inventory permission
  if (hasPermission('inventory')) {
    return <WarehouseDashboard user={user} />;
  }

  // 5. Custom staff with orders permission
  if (hasPermission('orders')) {
    return <OrdersDashboard user={user} />;
  }

  // 6. Access Denied for unauthorized users
  return <AccessDenied customMessage="Tài khoản của bạn chưa được phân quyền truy cập bảng điều khiển này." />;
}
