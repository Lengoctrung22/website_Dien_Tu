'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Boxes,
  AlertTriangle,
  Search,
  PlusCircle,
  History,
  CheckCircle2,
  X,
} from 'lucide-react';
import { fetchApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';

function InventoryContent() {
  const searchParams = useSearchParams();
  const lowStockParam = searchParams.get('lowStock') === 'true';

  const [products, setProducts] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterLowStock, setFilterLowStock] = useState(lowStockParam);

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
    setTimeout(() => loadInventory(), 0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterLowStock]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTimeout(() => loadInventory(), 0);
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
        setTimeout(() => loadInventory(), 0);
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Boxes className="w-6 h-6 text-cyan-600 dark:text-signal-cyan" />
            <span>Quản Lý Kho Hàng & Cảnh Báo Tồn Kho</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium mt-1">
            Theo dõi tồn kho thời gian thực, tự động cảnh báo khi tồn &lt; 5 chiếc và ghi vết lịch sử điều chỉnh.
          </p>
        </div>

        {/* Filter Toggle */}
        <button
          onClick={() => setFilterLowStock(!filterLowStock)}
          className={`px-3.5 py-2 rounded-lg text-xs font-mono font-bold flex items-center gap-2 hairline-border transition-all ${
            filterLowStock
              ? 'bg-amber-500/15 text-amber-800 dark:text-signal-amber border border-amber-500/30 shadow-sm'
              : 'bg-surface-card hover:bg-surface-subtle/50 text-slate-700 dark:text-slate-300'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-signal-amber" />
          <span>{filterLowStock ? 'Đang lọc: Tồn kho < 5 chiếc' : 'Chỉ xem sắp hết hàng (< 5)'}</span>
        </button>
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
              className="w-full pl-8 pr-3 py-2 text-xs rounded-lg bg-surface-subtle/40 dark:bg-surface-elevated hairline-border text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
            />
            <Search className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          </div>
          <button
            type="submit"
            className="px-3.5 py-2 rounded-lg bg-surface-elevated text-cyan-700 dark:text-signal-cyan hairline-border border-cyan-500/30 hover:bg-cyan-500/10 text-xs font-mono font-bold transition-colors"
          >
            Tìm kiếm
          </button>
        </form>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-600 dark:text-slate-400 font-mono font-medium">Đang tải danh sách tồn kho...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b hairline-border text-slate-700 dark:text-slate-400 font-mono text-[11px] uppercase tracking-wider font-bold">
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
                      <td className="py-2.5 px-3 uppercase text-slate-600 dark:text-slate-400 font-mono text-[11px] font-medium">{p.category}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-700 dark:text-slate-200">{p.brand}</td>
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
                          className="px-2.5 py-1 rounded-lg bg-cyan-500/10 text-cyan-700 dark:text-signal-cyan hover:bg-cyan-500/20 font-mono font-bold text-xs inline-flex items-center gap-1 border border-cyan-500/20 transition-colors"
                        >
                          <PlusCircle className="w-3.5 h-3.5" />
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
          <History className="w-4 h-4 text-cyan-600 dark:text-signal-cyan" />
          <h2 className="text-base font-black text-slate-900 dark:text-white">
            Lịch Sử Nhập Hàng & Điều Chỉnh Tồn Kho Gần Đây
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b hairline-border text-slate-700 dark:text-slate-400 uppercase font-mono font-bold text-[11px]">
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
              Tồn kho hiện tại: <strong className="text-cyan-700 dark:text-signal-cyan font-mono font-bold tabular-nums">{selectedProduct.stock}</strong> chiếc
            </p>

            <form onSubmit={handleAdjustStock} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Hình thức điều chỉnh
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-lg bg-surface-subtle/50 dark:bg-surface-elevated hairline-border text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 font-medium"
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
                  className="w-full px-3 py-2 rounded-lg bg-surface-subtle/50 dark:bg-surface-elevated hairline-border font-mono font-bold tabular-nums text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
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
                  className="w-full px-3 py-2 rounded-lg bg-surface-subtle/50 dark:bg-surface-elevated hairline-border text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
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
                  className="flex-1 py-2 rounded-lg bg-cyan-500/15 text-cyan-700 dark:text-signal-cyan border border-cyan-500/30 hover:bg-cyan-500/25 font-bold transition-all disabled:opacity-50"
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

export default function InventoryPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs font-mono font-medium text-slate-600 dark:text-slate-400">Đang tải kho hàng...</div>}>
      <InventoryContent />
    </Suspense>
  );
}
