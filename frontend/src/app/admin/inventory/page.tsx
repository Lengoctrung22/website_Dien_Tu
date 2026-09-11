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
  AlertCircle,
  X,
  ArrowUpDown,
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
      }
    } catch {
      alert('Không thể cập nhật tồn kho');
    }
    setModalLoading(false);
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Boxes className="w-7 h-7 text-indigo-500 dark:text-cyan-400" />
            <span>Quản Lý Kho Hàng & Cảnh Báo Tồn Kho</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Theo dõi tồn kho thời gian thực, tự động cảnh báo khi tồn &lt; 5 chiếc và ghi vết lịch sử điều chỉnh.
          </p>
        </div>

        {/* Filter Toggle */}
        <button
          onClick={() => setFilterLowStock(!filterLowStock)}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all ${
            filterLowStock
              ? 'bg-amber-500 text-white border-amber-600 shadow-md shadow-amber-500/20'
              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>{filterLowStock ? 'Đang lọc: Tồn kho < 5 chiếc' : 'Chỉ xem sản phẩm sắp hết hàng (< 5)'}</span>
        </button>
      </div>

      {feedback && (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Search & Stock Table */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xl space-y-6">
        <form onSubmit={handleSearchSubmit} className="flex gap-3 max-w-md">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Tìm theo tên sản phẩm..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-indigo-500 dark:focus:border-cyan-400"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold"
          >
            Tìm kiếm
          </button>
        </form>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Đang tải danh sách tồn kho...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                <tr>
                  <th className="pb-3 px-3">Tên Sản Phẩm</th>
                  <th className="pb-3 px-3">Danh Mục</th>
                  <th className="pb-3 px-3">Hãng</th>
                  <th className="pb-3 px-3">Đã Bán</th>
                  <th className="pb-3 px-3">Tồn Kho Hiện Tại</th>
                  <th className="pb-3 px-3">Trạng Thái Cảnh Báo</th>
                  <th className="pb-3 px-3 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {products.map((p) => {
                  const isLow = p.stock < 5;
                  const isOut = p.stock <= 0;
                  return (
                    <tr key={p._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="py-3.5 px-3 font-bold text-slate-800 dark:text-slate-200 max-w-xs truncate">
                        {p.name}
                      </td>
                      <td className="py-3.5 px-3 uppercase text-slate-500 font-medium">{p.category}</td>
                      <td className="py-3.5 px-3 font-semibold text-slate-600 dark:text-slate-300">{p.brand}</td>
                      <td className="py-3.5 px-3 font-bold text-slate-700 dark:text-slate-300">{p.soldCount || 0}</td>
                      <td className="py-3.5 px-3">
                        <span className="text-sm font-black text-slate-900 dark:text-white">
                          {p.stock}
                        </span>
                      </td>
                      <td className="py-3.5 px-3">
                        {isOut ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-rose-500/10 text-rose-500 border border-rose-500/20">
                            Hết Hàng
                          </span>
                        ) : isLow ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center gap-1 w-fit">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Sắp Hết (&lt; 5)</span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                            Đầy Đủ Tồn
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        <button
                          onClick={() => {
                            setSelectedProduct(p);
                            setChangeAmount(10);
                            setReason('restock');
                          }}
                          className="px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-slate-800 text-indigo-600 dark:text-cyan-400 hover:bg-indigo-100 font-bold text-xs inline-flex items-center gap-1 border border-indigo-200 dark:border-slate-700"
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
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <History className="w-5 h-5 text-indigo-500 dark:text-cyan-400" />
          <h2 className="text-base font-black text-slate-900 dark:text-white">
            Lịch Sử Nhập Hàng & Điều Chỉnh Tồn Kho Gần Đây
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase font-bold text-[11px]">
              <tr>
                <th className="pb-2 px-3">Thời Gian</th>
                <th className="pb-2 px-3">Sản Phẩm</th>
                <th className="pb-2 px-3">Biến Động</th>
                <th className="pb-2 px-3">Tồn Trước → Sau</th>
                <th className="pb-2 px-3">Lý Do</th>
                <th className="pb-2 px-3">Người Cập Nhật</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {logs.map((log) => (
                <tr key={log._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <td className="py-2.5 px-3 text-slate-400">{formatDate(log.createdAt)}</td>
                  <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200 max-w-xs truncate">
                    {log.productName}
                  </td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`font-black ${
                        log.changeAmount > 0 ? 'text-emerald-500' : 'text-rose-500'
                      }`}
                    >
                      {log.changeAmount > 0 ? `+${log.changeAmount}` : log.changeAmount}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-500">
                    {log.previousStock} → <strong className="text-slate-900 dark:text-white">{log.newStock}</strong>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
                      {log.reason === 'restock'
                        ? 'Nhập hàng thêm'
                        : log.reason === 'manual_adjustment'
                        ? 'Kiểm kê thủ công'
                        : log.reason === 'order_deduction'
                        ? 'Khách mua hàng'
                        : 'Hủy đơn hoàn kho'}
                    </span>
                    {log.note && <span className="text-[10px] text-slate-400 block mt-0.5">{log.note}</span>}
                  </td>
                  <td className="py-2.5 px-3 text-slate-400">{log.updatedBy || 'System'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Adjust Stock Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-black text-sm text-slate-900 dark:text-white">
                Điều Chỉnh Tồn Kho
              </h3>
              <button
                onClick={() => setSelectedProduct(null)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              Sản phẩm: <strong className="text-slate-900 dark:text-white">{selectedProduct.name}</strong>
            </p>
            <p className="text-xs text-slate-400">
              Tồn kho hiện tại: <strong className="text-indigo-600 dark:text-cyan-400 font-bold">{selectedProduct.stock}</strong> chiếc
            </p>

            <form onSubmit={handleAdjustStock} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Hình thức điều chỉnh
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
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
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold"
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
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedProduct(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-slate-600 dark:text-slate-400"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all shadow-md"
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
    <Suspense fallback={<div className="p-8 text-center text-xs">Đang tải kho hàng...</div>}>
      <InventoryContent />
    </Suspense>
  );
}
