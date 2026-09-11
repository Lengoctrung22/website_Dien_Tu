'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, SlidersHorizontal, ArrowRight, RotateCcw } from 'lucide-react';

export default function QuickFilterBar() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [switchType, setSwitchType] = useState('');
  const [refreshRate, setRefreshRate] = useState('');
  const [connection, setConnection] = useState('');

  const handleApplyFilter = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const params = new URLSearchParams();

    if (search.trim()) params.set('search', search.trim());
    if (category) params.set('category', category);
    if (minPrice) params.set('minPrice', minPrice);
    if (maxPrice) params.set('maxPrice', maxPrice);
    if (switchType) params.set('switchType', switchType);
    if (refreshRate) params.set('refreshRate', refreshRate);
    if (connection) params.set('connection', connection);

    router.push(`/products?${params.toString()}`);
  };

  const handleReset = () => {
    setSearch('');
    setCategory('');
    setMinPrice('');
    setMaxPrice('');
    setSwitchType('');
    setRefreshRate('');
    setConnection('');
  };

  return (
    <div className="w-full rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-6 shadow-xl shadow-slate-200/50 dark:shadow-none transition-colors">
      <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
          <SlidersHorizontal className="w-4 h-4 text-indigo-500 dark:text-cyan-400" />
          <span>Bộ Lọc Tìm Kiếm Nhanh Thiết Bị Gaming</span>
        </div>
        <button
          type="button"
          onClick={handleReset}
          className="text-xs font-semibold text-slate-500 hover:text-indigo-600 dark:hover:text-cyan-400 flex items-center gap-1 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Đặt lại</span>
        </button>
      </div>

      <form onSubmit={handleApplyFilter} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Search Keyword */}
        <div className="relative">
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Từ Khóa</label>
          <div className="relative">
            <input
              type="text"
              placeholder="Tên sản phẩm, mã..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-indigo-500 dark:focus:border-cyan-400"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Category */}
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Danh Mục</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-indigo-500 dark:focus:border-cyan-400"
          >
            <option value="">Tất cả danh mục</option>
            <option value="monitor">Màn hình máy tính</option>
            <option value="keyboard">Bàn phím cơ</option>
            <option value="mouse">Chuột gaming</option>
            <option value="headphone">Tai nghe cao cấp</option>
          </select>
        </div>

        {/* Price Range */}
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Mức Giá</label>
          <select
            onChange={(e) => {
              const val = e.target.value;
              if (!val) {
                setMinPrice('');
                setMaxPrice('');
              } else {
                const [min, max] = val.split('-');
                setMinPrice(min);
                setMaxPrice(max || '');
              }
            }}
            className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-indigo-500 dark:focus:border-cyan-400"
          >
            <option value="">Mọi mức giá</option>
            <option value="0-3000000">Dưới 3 triệu</option>
            <option value="3000000-6000000">3 triệu - 6 triệu</option>
            <option value="6000000-15000000">6 triệu - 15 triệu</option>
            <option value="15000000-50000000">Trên 15 triệu</option>
          </select>
        </div>

        {/* Switch Type (for Keyboards) */}
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Loại Switch</label>
          <select
            value={switchType}
            onChange={(e) => setSwitchType(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-indigo-500 dark:focus:border-cyan-400"
          >
            <option value="">Tất cả switch</option>
            <option value="Magnetic">Hall Effect / Magnetic</option>
            <option value="Linear">Linear (Red/Snow/Pink)</option>
            <option value="Tactile">Tactile (Brown/Panda)</option>
            <option value="Optical">Optical (Quang học)</option>
          </select>
        </div>

        {/* Refresh Rate (for Monitors) */}
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Tần Số Quét</label>
          <select
            value={refreshRate}
            onChange={(e) => setRefreshRate(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-indigo-500 dark:focus:border-cyan-400"
          >
            <option value="">Tất cả tần số</option>
            <option value="240Hz">240Hz Siêu tốc</option>
            <option value="165Hz">165Hz Chuẩn game</option>
            <option value="144Hz">144Hz</option>
          </select>
        </div>

        {/* Connection & Submit */}
        <div className="flex flex-col justify-end">
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Kết Nối</label>
          <div className="flex gap-2">
            <select
              value={connection}
              onChange={(e) => setConnection(e.target.value)}
              className="flex-1 px-2 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-indigo-500 dark:focus:border-cyan-400"
            >
              <option value="">Mọi kiểu</option>
              <option value="Không dây">Không dây</option>
              <option value="Có dây">Có dây</option>
            </select>
            <button
              type="submit"
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 dark:bg-cyan-500 dark:hover:bg-cyan-600 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-md shadow-indigo-500/20 dark:shadow-cyan-500/20 transition-all flex-shrink-0"
              title="Tìm kiếm"
            >
              <span>Lọc</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
