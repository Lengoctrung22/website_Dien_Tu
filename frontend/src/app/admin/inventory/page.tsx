'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Boxes,
  Package,
  AlertTriangle,
  Search,
  PlusCircle,
  History,
  CheckCircle2,
  X,
  ArrowUpRight,
} from 'lucide-react';
import { fetchApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import AccessDenied from '@/components/admin/AccessDenied';

function InventoryContent({ initialLowStock }: { initialLowStock: boolean }) {
  const { user } = useAuthStore();
  const [products, setProducts] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterLowStock, setFilterLowStock] = useState(initialLowStock);

  // Stock Adjustment Modal
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [changeAmount, setChangeAmount] = useState<number>(10);
  const [reason, setReason] = useState<'restock' | 'manual_adjustment'>('restock');
  const [note, setNote] = useState('');
  const [modalLoading, setModalLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const loadInventory = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterLowStock) params.set('lowStockOnly', 'true');
    if (search.trim()) params.set('search', search.trim());

    const res = await fetchApi(`/admin/inventory?${params.toString()}`);
    if (res.success && res.data) {
      setProducts(res.data.products || []);
      setLogs(res.data.recentLogs || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadInventory();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterLowStock]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadInventory();
  };

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
        loadInventory();
        setTimeout(() => setFeedback(null), 3000);
      } else {
        alert(res.message || 'Không thể cập nhật tồn kho');
      }
    } catch {
      alert('Không thể cập nhật tồn kho');
    }
    setModalLoading(false);
  };

  const lowStockCount = products.filter((p) => p.stock < 5).length;

  return (
    <div className="space-y-6 pb-10">
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
            <span>Quản Lý Kho Hàng & Cảnh Báo Tồn Kho</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium mt-1">
            Xin chào <strong className="text-slate-900 dark:text-white">{user?.fullName || 'Nhân viên Kho'}</strong>. Theo dõi tồn kho thời gian thực, tự động cảnh báo &lt; 5 chiếc và bổ sung hàng hóa.
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
          <span className="text-[11px] font-mono text-slate-500">Phân hệ nghiệp vụ kho</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Chức năng 1: Tổng quan kho hàng */}
          <Link
            href="/admin"
            className="flex items-center justify-between p-3.5 rounded-xl border hairline-border bg-surface-subtle/30 dark:bg-surface-elevated/40 hover:bg-amber-500/10 hover:border-amber-500/30 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 group-hover:scale-105 transition-transform">
                <Boxes className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                  Tổng Quan Kho Hàng (KPI)
                </p>
                <p className="text-[11px] text-slate-500 font-mono">Bảng điều khiển &amp; KPI</p>
              </div>
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-amber-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
          </Link>

          {/* Chức năng 2: Quản lý kho & kiểm kê */}
          <div className="flex items-center justify-between p-3.5 rounded-xl border border-amber-500/40 bg-amber-500/10 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-700 dark:text-amber-300">
                <Package className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  Quản Lý Kho &amp; Kiểm Kê
                </p>
                <p className="text-[11px] text-amber-700 dark:text-amber-300 font-mono font-bold">
                  {products.length} SKU đang hiển thị
                </p>
              </div>
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-800 dark:text-amber-200">
              Đang xem
            </span>
          </div>

          {/* Chức năng 3: Cảnh báo tồn kho thấp */}
          <button
            type="button"
            onClick={() => setFilterLowStock(!filterLowStock)}
            className={`flex items-center justify-between p-3.5 rounded-xl border hairline-border transition-all text-left ${
              filterLowStock
                ? 'border-amber-500/40 bg-amber-500/15'
                : 'bg-surface-subtle/30 dark:bg-surface-elevated/40 hover:bg-amber-500/10 hover:border-amber-500/30'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-600 dark:text-rose-400">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  Cảnh Báo Tồn Kho Thấp
                </p>
                <p className="text-[11px] text-rose-600 dark:text-rose-400 font-mono font-bold">
                  {lowStockCount} SKU cần nhập (&lt; 5)
                </p>
              </div>
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-rose-500/15 text-rose-700 dark:text-rose-300">
              {filterLowStock ? 'Đang lọc' : 'Lọc ngay'}
            </span>
          </button>
        </div>
      </div>

      {feedback && (
        <div className="p-3 rounded-lg bg-emerald-500/10 hairline-border border-emerald-500/20 text-emerald-700 dark:text-signal-emerald text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600 dark:text-signal-emerald" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Low stock warning banner */}
      {lowStockCount > 0 && !filterLowStock && (
        <div className="p-4 rounded-xl bg-amber-500/10 hairline-border border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/15 text-amber-700 dark:text-signal-amber border border-amber-500/30 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Cảnh Báo Tồn Kho Thấp</span>
                <span className="px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-800 dark:text-signal-amber font-mono text-[11px] tabular-nums font-bold border border-amber-500/30">
                  {lowStockCount} sản phẩm &lt; 5 chiếc
                </span>
              </h3>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                Một số sản phẩm trong kho đang sắp hết hàng. Vui lòng kiểm tra và lên kế hoạch nhập thêm hàng để tránh gián đoạn bán hàng.
              </p>
            </div>
          </div>
          <button
            onClick={() => setFilterLowStock(true)}
            className="px-3 py-1.5 rounded-lg bg-signal-amber text-slate-950 hover:bg-amber-400 font-mono font-bold text-xs transition-colors self-start sm:self-auto flex-shrink-0 shadow-sm"
          >
            Xem danh sách cần nhập
          </button>
        </div>
      )}

      {/* Search & Stock Table */}
      <div className="rounded-xl hairline-border surface-bevel bg-surface-card p-6 shadow-sm space-y-5">
        <form onSubmit={handleSearchSubmit} className="flex gap-2 max-w-md">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Tìm theo tên sản phẩm..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-xs rounded-lg bg-surface-subtle/40 dark:bg-surface-elevated hairline-border text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus:border-slate-500 dark:focus:border-signal-cyan"
            />
            <Search className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          </div>
          <button
            type="submit"
            className="px-3.5 py-2 rounded-lg bg-slate-100 dark:bg-surface-elevated text-slate-950 dark:text-white hairline-border border-slate-300 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-surface-subtle text-xs font-mono font-bold transition-colors shadow-sm"
          >
            Tìm kiếm
          </button>
        </form>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-600 dark:text-slate-400 font-mono font-medium">Đang tải danh sách tồn kho...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b hairline-border text-slate-900 dark:text-slate-200 font-mono text-[11px] uppercase tracking-wider font-extrabold">
                <tr>
                  <th className="pb-2.5 px-3">Tên Sản Phẩm</th>
                  <th className="pb-2.5 px-3">Danh Mục</th>
                  <th className="pb-2.5 px-3">Hãng</th>
                  <th className="pb-2.5 px-3">Đã Bán</th>
                  <th className="pb-2.5 px-3">Tồn Kho Hiện Tại</th>
                  <th className="pb-2.5 px-3">Trạng Thái Cảnh Báo</th>
                  <th className="pb-2.5 px-3 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y hairline-border">
                {products.map((p) => {
                  const isLow = p.stock < 5;
                  const isOut = p.stock <= 0;
                  return (
                    <tr key={p._id} className="hover:bg-surface-subtle/30 dark:hover:bg-surface-elevated/40 transition-colors">
                      <td className="py-2.5 px-3 font-medium text-slate-900 dark:text-slate-100 max-w-xs truncate">
                        {p.name}
                      </td>
                      <td className="py-2.5 px-3 uppercase text-slate-800 dark:text-slate-200 font-mono text-[11px] font-semibold">{p.category}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-slate-100">{p.brand}</td>
                      <td className="py-2.5 px-3 font-medium text-slate-800 dark:text-slate-300 tabular-nums font-mono">{p.soldCount || 0}</td>
                      <td className="py-2.5 px-3">
                        <span className="text-sm font-bold text-slate-900 dark:text-white tabular-nums font-mono">
                          {p.stock}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        {isOut ? (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase bg-rose-500/10 text-rose-700 dark:text-signal-rose border border-rose-500/20">
                            Hết Hàng
                          </span>
                        ) : isLow ? (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase bg-amber-500/10 text-amber-700 dark:text-signal-amber border border-amber-500/20 flex items-center gap-1 w-fit">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Sắp Hết (&lt; 5)</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase bg-emerald-500/10 text-emerald-700 dark:text-signal-emerald border border-emerald-500/20">
                            Đầy Đủ Tồn
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => {
                            setSelectedProduct(p);
                            setChangeAmount(10);
                            setReason('restock');
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-surface-elevated dark:hover:bg-surface-subtle text-slate-950 dark:text-white font-mono font-bold text-xs inline-flex items-center gap-1 border border-slate-300 dark:border-white/10 transition-colors shadow-sm"
                        >
                          <PlusCircle className="w-3.5 h-3.5 text-slate-950 dark:text-white" />
                          <span>Nhập / Sửa Kho</span>
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

      {/* Row 2: Inventory Audit Log (Lịch sử nhập hàng & điều chỉnh tồn kho) */}
      <div className="rounded-xl hairline-border surface-bevel bg-surface-card p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b hairline-border">
          <History className="w-4 h-4 text-slate-900 dark:text-black" />
          <h2 className="text-base font-black text-slate-900 dark:text-white">
            Lịch Sử Nhập Hàng & Điều Chỉnh Tồn Kho Gần Đây
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b hairline-border text-slate-900 dark:text-slate-200 uppercase font-mono font-extrabold text-[11px]">
              <tr>
                <th className="pb-2 px-3">Thời Gian</th>
                <th className="pb-2 px-3">Sản Phẩm</th>
                <th className="pb-2 px-3">Biến Động</th>
                <th className="pb-2 px-3">Tồn Trước → Sau</th>
                <th className="pb-2 px-3">Lý Do</th>
                <th className="pb-2 px-3">Người Cập Nhật</th>
              </tr>
            </thead>
            <tbody className="divide-y hairline-border">
              {logs.map((log) => (
                <tr key={log._id} className="hover:bg-surface-subtle/30 dark:hover:bg-surface-elevated/40 transition-colors">
                  <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400 font-mono text-[11px] tabular-nums font-medium">{formatDate(log.createdAt)}</td>
                  <td className="py-2.5 px-3 font-medium text-slate-900 dark:text-slate-100 max-w-xs truncate">
                    {log.productName}
                  </td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`font-mono font-bold tabular-nums ${
                        log.changeAmount > 0 ? 'text-emerald-700 dark:text-signal-emerald' : 'text-rose-700 dark:text-signal-rose'
                      }`}
                    >
                      {log.changeAmount > 0 ? `+${log.changeAmount}` : log.changeAmount}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400 font-mono text-[11px] tabular-nums font-medium">
                    {log.previousStock} → <strong className="text-slate-900 dark:text-white font-bold">{log.newStock}</strong>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded-md bg-surface-subtle/50 dark:bg-surface-elevated hairline-border text-slate-700 dark:text-slate-300 font-mono text-[11px] font-medium">
                      {log.reason === 'restock'
                        ? 'Nhập hàng thêm'
                        : log.reason === 'manual_adjustment'
                        ? 'Kiểm kê thủ công'
                        : log.reason === 'order_deduction'
                        ? 'Khách mua hàng'
                        : 'Hủy đơn hoàn kho'}
                    </span>
                    {log.note && <span className="text-[10px] text-slate-600 dark:text-slate-400 block mt-0.5 font-medium">{log.note}</span>}
                  </td>
                  <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400 font-mono text-[11px] font-medium">{log.updatedBy || 'System'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Adjust Stock Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-surface-card hairline-border surface-bevel p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b hairline-border">
              <h3 className="font-black text-sm text-slate-900 dark:text-white">
                Điều Chỉnh Tồn Kho
              </h3>
              <button
                onClick={() => setSelectedProduct(null)}
                className="p-1 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-surface-elevated transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
              Sản phẩm: <strong className="text-slate-900 dark:text-white">{selectedProduct.name}</strong>
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
              Tồn kho hiện tại: <strong className="text-slate-950 dark:text-white font-mono font-bold tabular-nums">{selectedProduct.stock}</strong> chiếc
            </p>

            <form onSubmit={handleAdjustStock} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Hình thức điều chỉnh
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-lg bg-surface-subtle/50 dark:bg-surface-elevated hairline-border text-slate-900 dark:text-white focus:outline-none focus:border-slate-500 dark:focus:border-signal-cyan font-medium"
                >
                  <option value="restock">Nhập thêm hàng mới vào kho (+)</option>
                  <option value="manual_adjustment">Điều chỉnh kiểm kê kho</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Số lượng thay đổi (dương là cộng thêm, âm là trừ đi)
                </label>
                <input
                  type="number"
                  required
                  value={changeAmount}
                  onChange={(e) => setChangeAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg bg-surface-subtle/50 dark:bg-surface-elevated hairline-border font-mono font-bold tabular-nums text-slate-900 dark:text-white focus:outline-none focus:border-slate-500 dark:focus:border-signal-cyan"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Ghi chú nội bộ
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Nhập lô hàng tháng 9, PO-1029..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-surface-subtle/50 dark:bg-surface-elevated hairline-border text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus:border-slate-500 dark:focus:border-signal-cyan"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedProduct(null)}
                  className="flex-1 py-2 rounded-lg hairline-border bg-surface-subtle/30 dark:bg-surface-elevated font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="flex-1 py-2 rounded-lg bg-slate-900 text-white dark:bg-white dark:text-slate-950 hover:bg-slate-800 dark:hover:bg-slate-100 font-bold transition-all disabled:opacity-50 shadow-sm"
                >
                  {modalLoading ? 'Đang lưu...' : 'Xác Nhận Lưu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function InventoryContainer() {
  const searchParams = useSearchParams();
  const lowStockParam = searchParams.get('lowStock') === 'true';
  return <InventoryContent key={String(lowStockParam)} initialLowStock={lowStockParam} />;
}

export default function InventoryPage() {
  const { hasPermission } = useAuthStore();

  if (!hasPermission('inventory')) {
    return <AccessDenied requiredPermission="inventory" />;
  }

  return (
    <Suspense fallback={<div className="p-8 text-center text-xs font-mono font-medium text-slate-600 dark:text-slate-400">Đang tải kho hàng...</div>}>
      <InventoryContainer />
    </Suspense>
  );
}
