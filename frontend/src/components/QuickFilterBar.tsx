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

  const priceRangeValue = minPrice || maxPrice ? `${minPrice}-${maxPrice}` : '';

  return (
    <div className="w-full rounded-xl bg-surface-card border hairline-border surface-bevel p-4 sm:p-5 shadow-lg transition-colors">
      <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b hairline-border">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-cyan-700 dark:text-signal-cyan" />
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-900 dark:text-white">
            Bộ Lọc Thông Số Phần Cứng // Hardware Inspection Bar
          </span>
        </div>
        <button
          type="button"
          onClick={handleReset}
          className="text-xs font-mono font-semibold text-slate-600 dark:text-slate-400 hover:text-rose-700 dark:hover:text-signal-rose flex items-center gap-1 transition-colors"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Đặt lại</span>
        </button>
      </div>

      <form onSubmit={handleApplyFilter} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Search Keyword */}
        <div className="relative">
          <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
            Từ Khóa
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="Model, switch, DPI..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-surface-elevated border hairline-border text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 font-medium focus:outline-none focus:border-cyan-600 dark:focus:border-signal-cyan/60"
            />
            <Search className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Category */}
        <div>
          <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
            Danh Mục
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-surface-elevated border hairline-border text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:border-cyan-600 dark:focus:border-signal-cyan/60"
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
          <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
            Mức Giá
          </label>
          <select
            value={priceRangeValue}
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
            className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-surface-elevated border hairline-border text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:border-cyan-600 dark:focus:border-signal-cyan/60"
          >
            <option value="">Mọi mức giá</option>
            <option value="0-3000000">Dưới 3 triệu</option>
            <option value="3000000-6000000">3 triệu - 6 triệu</option>
            <option value="6000000-15000000">6 triệu - 15 triệu</option>
            <option value="15000000-">Trên 15 triệu</option>
          </select>
        </div>

        {/* Switch Type (for Keyboards) */}
        <div>
          <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
            Loại Switch
          </label>
          <select
            value={switchType}
            onChange={(e) => setSwitchType(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-surface-elevated border hairline-border text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:border-cyan-600 dark:focus:border-signal-cyan/60"
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
          <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
            Tần Số Quét
          </label>
          <select
            value={refreshRate}
            onChange={(e) => setRefreshRate(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-surface-elevated border hairline-border text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:border-cyan-600 dark:focus:border-signal-cyan/60"
          >
            <option value="">Tất cả tần số</option>
            <option value="240Hz">240Hz Siêu tốc</option>
            <option value="165Hz">165Hz Chuẩn game</option>
            <option value="144Hz">144Hz Esports</option>
          </select>
        </div>

        {/* Connection & Submit */}
        <div className="flex flex-col justify-end">
          <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
            Kết Nối
          </label>
          <div className="flex gap-2">
            <select
              value={connection}
              onChange={(e) => setConnection(e.target.value)}
              className="flex-1 px-2.5 py-2 text-xs rounded-lg bg-slate-50 dark:bg-surface-elevated border hairline-border text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:border-cyan-600 dark:focus:border-signal-cyan/60"
            >
              <option value="">Mọi kiểu</option>
              <option value="Không dây">Không dây</option>
              <option value="Có dây">Có dây</option>
            </select>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white dark:bg-signal-cyan dark:text-slate-950 dark:hover:bg-cyan-300 font-mono font-bold text-xs flex items-center justify-center gap-1 shadow-sm active:translate-y-0.5 transition-all flex-shrink-0"
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
