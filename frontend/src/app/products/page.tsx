'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  SlidersHorizontal,
  Search,
  RotateCcw,
  Check,
  ChevronRight,
  Filter,
  X,
  Layers,
} from 'lucide-react';
import ProductCard from '@/components/ProductCard';
import { fetchApi } from '@/lib/api';

function ProductsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Query states
  const categoryParam = searchParams.get('category') || '';
  const brandParam = searchParams.get('brand') || '';
  const minPriceParam = searchParams.get('minPrice') || '';
  const maxPriceParam = searchParams.get('maxPrice') || '';
  const searchParam = searchParams.get('search') || '';
  const switchTypeParam = searchParams.get('switchType') || '';
  const refreshRateParam = searchParams.get('refreshRate') || '';
  const connectionParam = searchParams.get('connection') || '';
  const sortByParam = searchParams.get('sortBy') || 'newest';
  const pageParam = parseInt(searchParams.get('page') || '1');

  // Local states
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1, page: 1, limit: 12 });
  const [availableBrands, setAvailableBrands] = useState<string[]>([]);
  const [categoriesCount, setCategoriesCount] = useState<Record<string, number>>({});
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Search input state
  const [keyword, setKeyword] = useState(searchParam);

  // Fetch filter metadata
  useEffect(() => {
    async function loadFilters() {
      const res = await fetchApi('/products/filters');
      if (res.success && res.data) {
        setAvailableBrands(res.data.brands || []);
        setCategoriesCount(res.data.categoriesCount || {});
      }
    }
    loadFilters();
  }, []);

  // Fetch products whenever searchParams change
  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      const queryStr = searchParams.toString();
      const res = await fetchApi(`/products?${queryStr}`);
      if (res.success && res.data) {
        setProducts(res.data.products || []);
        setPagination(res.data.pagination || { total: 0, totalPages: 1, page: 1, limit: 12 });
      }
      setLoading(false);
    }
    fetchProducts();
  }, [searchParams]);

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set('page', '1'); // Reset to page 1 on filter change
    router.push(`/products?${params.toString()}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateParam('search', keyword.trim());
  };

  const handleResetFilters = () => {
    setKeyword('');
    router.push('/products');
  };

  const categories = [
    { id: '', label: 'Tất cả sản phẩm', count: pagination.total },
    { id: 'monitor', label: 'Màn hình máy tính', count: categoriesCount['monitor'] || 0 },
    { id: 'keyboard', label: 'Bàn phím cơ', count: categoriesCount['keyboard'] || 0 },
    { id: 'mouse', label: 'Chuột gaming', count: categoriesCount['mouse'] || 0 },
    { id: 'headphone', label: 'Tai nghe cao cấp', count: categoriesCount['headphone'] || 0 },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6">
      {/* Breadcrumb & Header Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
            <span>Trang chủ</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-indigo-600 dark:text-cyan-400 font-bold">Cửa Hàng Gear</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            Tất Cả Sản Phẩm ({pagination.total})
          </h1>
        </div>

        {/* Top Controls: Search & Sort */}
        <div className="flex flex-wrap items-center gap-3">
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              placeholder="Tìm theo tên, hãng..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="w-48 sm:w-64 pl-9 pr-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-indigo-500 dark:focus:border-cyan-400"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </form>

          <select
            value={sortByParam}
            onChange={(e) => updateParam('sortBy', e.target.value)}
            className="px-3 py-2 text-xs font-semibold rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none"
          >
            <option value="newest">Mới nhất trước</option>
            <option value="best_seller">Bán chạy nhất</option>
            <option value="price_asc">Giá tăng dần</option>
            <option value="price_desc">Giá giảm dần</option>
            <option value="hot_order">Ưu tiên HOT</option>
          </select>

          {/* Mobile Filter Toggle */}
          <button
            onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
            className="lg:hidden p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 flex items-center gap-1.5 text-xs font-bold"
          >
            <Filter className="w-4 h-4" />
            <span>Lọc</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* SIDEBAR FILTER (Desktop & Mobile Drawer) */}
        <aside
          className={`lg:block ${
            isMobileFilterOpen
              ? 'fixed inset-0 z-50 bg-black/60 p-4 flex justify-end'
              : 'hidden'
          }`}
        >
          <div
            className={`w-full max-w-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-6 overflow-y-auto max-h-[90vh] shadow-xl ${
              isMobileFilterOpen ? 'h-full animate-in slide-in-from-right duration-200' : ''
            }`}
          >
            {/* Header of Sidebar */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 font-bold text-sm text-slate-900 dark:text-white">
                <SlidersHorizontal className="w-4 h-4 text-indigo-500 dark:text-cyan-400" />
                <span>Bộ Lọc Nâng Cao</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleResetFilters}
                  className="text-xs text-slate-400 hover:text-rose-500 transition-colors flex items-center gap-1"
                  title="Xóa bộ lọc"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Xóa</span>
                </button>
                {isMobileFilterOpen && (
                  <button
                    onClick={() => setIsMobileFilterOpen(false)}
                    className="p-1 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>

            {/* 1. Categories Filter */}
            <div className="space-y-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Danh Mục Sản Phẩm
              </h3>
              <div className="space-y-1">
                {categories.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      updateParam('category', c.id);
                      setIsMobileFilterOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                      categoryParam === c.id
                        ? 'bg-indigo-50 dark:bg-cyan-950/40 text-indigo-600 dark:text-cyan-400 border border-indigo-200 dark:border-cyan-800'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <span>{c.label}</span>
                    {c.count !== undefined && (
                      <span className="text-[10px] opacity-70">({c.count})</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Price Filter Presets */}
            <div className="space-y-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Khoảng Giá
              </h3>
              <div className="space-y-1 text-xs">
                {[
                  { label: 'Tất cả giá', min: '', max: '' },
                  { label: 'Dưới 3.000.000đ', min: '0', max: '3000000' },
                  { label: '3.000.000đ - 6.000.000đ', min: '3000000', max: '6000000' },
                  { label: '6.000.000đ - 15.000.000đ', min: '6000000', max: '15000000' },
                  { label: 'Trên 15.000.000đ', min: '15000000', max: '' },
                ].map((range, idx) => {
                  const isSelected = minPriceParam === range.min && maxPriceParam === range.max;
                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        const params = new URLSearchParams(searchParams.toString());
                        if (range.min) params.set('minPrice', range.min);
                        else params.delete('minPrice');
                        if (range.max) params.set('maxPrice', range.max);
                        else params.delete('maxPrice');
                        params.set('page', '1');
                        router.push(`/products?${params.toString()}`);
                        setIsMobileFilterOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                        isSelected
                          ? 'bg-indigo-50 dark:bg-cyan-950/40 text-indigo-600 dark:text-cyan-400 font-bold border border-indigo-200 dark:border-cyan-800'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <span>{range.label}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-cyan-400" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Brands */}
            {availableBrands.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Thương Hiệu
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => updateParam('brand', '')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                      !brandParam
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    Tất cả
                  </button>
                  {availableBrands.map((b) => (
                    <button
                      key={b}
                      onClick={() => {
                        updateParam('brand', brandParam === b ? '' : b);
                        setIsMobileFilterOpen(false);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors ${
                        brandParam === b
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 4. Switch Type Filter (for Keyboards) */}
            <div className="space-y-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Loại Switch Phím Cơ
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: 'Tất cả', val: '' },
                  { label: 'Magnetic (Hall Effect)', val: 'Magnetic' },
                  { label: 'Linear', val: 'Linear' },
                  { label: 'Tactile', val: 'Tactile' },
                  { label: 'Optical', val: 'Optical' },
                ].map((s) => (
                  <button
                    key={s.val}
                    onClick={() => updateParam('switchType', s.val)}
                    className={`px-2 py-1 rounded-lg text-[11px] font-semibold border ${
                      switchTypeParam === s.val
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 5. Refresh Rate Filter (for Monitors) */}
            <div className="space-y-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Tần Số Quét Màn Hình
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {['', '240Hz', '165Hz', '144Hz'].map((r) => (
                  <button
                    key={r}
                    onClick={() => updateParam('refreshRate', r)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${
                      refreshRateParam === r
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {r || 'Tất cả'}
                  </button>
                ))}
              </div>
            </div>

            {/* 6. Connection Filter */}
            <div className="space-y-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Kiểu Kết Nối
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {['', 'Không dây', 'Có dây'].map((conn) => (
                  <button
                    key={conn}
                    onClick={() => updateParam('connection', conn)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${
                      connectionParam === conn
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {conn || 'Tất cả'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* PRODUCTS GRID */}
        <div className="lg:col-span-3 space-y-6">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-80 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="py-16 text-center space-y-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8">
              <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 mx-auto flex items-center justify-center text-slate-400">
                <Layers className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                Không tìm thấy sản phẩm phù hợp
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Hãy thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm để tìm được sản phẩm mong muốn.
              </p>
              <button
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-md shadow-indigo-500/20"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Đặt lại toàn bộ lọc</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="pt-6 flex items-center justify-center gap-2">
              {[...Array(pagination.totalPages)].map((_, idx) => {
                const pageNum = idx + 1;
                const isActive = pageNum === pagination.page;
                return (
                  <button
                    key={pageNum}
                    onClick={() => updateParam('page', String(pageNum))}
                    className={`w-10 h-10 rounded-xl text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-indigo-600 dark:bg-cyan-500 text-white shadow-lg'
                        : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-sm">Đang tải sản phẩm...</div>}>
      <ProductsContent />
    </Suspense>
  );
}
