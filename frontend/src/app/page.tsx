'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Flame,
  Sparkles,
  ArrowRight,
  Monitor,
  Keyboard,
  Mouse,
  Headphones,
  TrendingUp,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import HeroSlider from '@/components/HeroSlider';
import QuickFilterBar from '@/components/QuickFilterBar';
import ProductCard from '@/components/ProductCard';
import { fetchApi } from '@/lib/api';

export default function HomePage() {
  const [hotProducts, setHotProducts] = useState<any[]>([]);
  const [tabProducts, setTabProducts] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'newest' | 'best_seller'>('newest');
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});
  const [loadingHot, setLoadingHot] = useState(true);
  const [loadingTab, setLoadingTab] = useState(true);

  // Fetch Hot Products
  useEffect(() => {
    async function loadHot() {
      setLoadingHot(true);
      const res = await fetchApi('/products?isHot=true&sortBy=hot_order&limit=8');
      if (res.success && res.data?.products) {
        setHotProducts(res.data.products);
      }
      setLoadingHot(false);
    }
    loadHot();
  }, []);

  // Fetch New Arrivals or Best Sellers based on tab
  useEffect(() => {
    async function loadTabProducts() {
      setLoadingTab(true);
      const res = await fetchApi(`/products?sortBy=${activeTab}&limit=8`);
      if (res.success && res.data?.products) {
        setTabProducts(res.data.products);
      }
      setLoadingTab(false);
    }
    loadTabProducts();
  }, [activeTab]);

  // Fetch filter metadata (categories count)
  useEffect(() => {
    async function loadMeta() {
      const res = await fetchApi('/products/filters');
      if (res.success && res.data?.categoriesCount) {
        setCategoryCounts(res.data.categoriesCount);
      }
    }
    loadMeta();
  }, []);

  const categories = [
    {
      id: 'monitor',
      name: 'Màn Hình Máy Tính',
      sub: 'OLED 240Hz, Mini-LED, 4K UHD',
      count: categoryCounts['monitor'] || 6,
      icon: Monitor,
      image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=600&q=80',
      gradient: 'from-blue-600/90 to-cyan-700/80',
    },
    {
      id: 'keyboard',
      name: 'Bàn Phím Cơ',
      sub: 'Rapid Trigger, Nhôm CNC, Custom',
      count: categoryCounts['keyboard'] || 6,
      icon: Keyboard,
      image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&q=80',
      gradient: 'from-purple-600/90 to-indigo-800/80',
    },
    {
      id: 'mouse',
      name: 'Chuột Gaming & Esports',
      sub: 'Siêu nhẹ 31g-54g, 35K DPI, 8000Hz',
      count: categoryCounts['mouse'] || 6,
      icon: Mouse,
      image: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=600&q=80',
      gradient: 'from-emerald-600/90 to-teal-800/80',
    },
    {
      id: 'headphone',
      name: 'Tai Nghe Cao Cấp',
      sub: 'Chống ồn ANC, Pin 120H, Hi-Res',
      count: categoryCounts['headphone'] || 6,
      icon: Headphones,
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80',
      gradient: 'from-amber-600/90 to-orange-800/80',
    },
  ];

  return (
    <div className="space-y-12 sm:space-y-16 pb-16">
      {/* 1. Hero Carousel & Quick Search Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 space-y-6">
        <HeroSlider />
        <QuickFilterBar />
      </section>

      {/* 2. Featured Categories Grid (Hover Zoom / Lift) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <span className="w-2.5 h-6 rounded-full bg-gradient-to-b from-indigo-500 to-cyan-400 inline-block" />
              Danh Mục Sản Phẩm Nổi Bật
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Khám phá hệ sinh thái phụ kiện máy tính chuyên nghiệp được phân loại chi tiết
            </p>
          </div>
          <Link
            href="/products"
            className="text-xs sm:text-sm font-bold text-indigo-600 dark:text-cyan-400 hover:underline flex items-center gap-1"
          >
            <span>Xem tất cả</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <Link
                key={cat.id}
                href={`/products?category=${cat.id}`}
                className="group relative h-48 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1.5"
              >
                {/* Background Image with Zoom */}
                <Image
                  src={cat.image}
                  alt={cat.name}
                  fill
                  className="object-cover object-center group-hover:scale-110 transition-transform duration-500"
                  unoptimized
                />

                {/* Gradient Overlay */}
                <div className={`absolute inset-0 bg-gradient-to-t ${cat.gradient} opacity-90 group-hover:opacity-95 transition-opacity`} />

                {/* Content */}
                <div className="absolute inset-0 p-5 flex flex-col justify-between text-white z-10">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 group-hover:scale-110 transition-transform">
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-md">
                      {cat.count} sản phẩm
                    </span>
                  </div>

                  <div>
                    <h3 className="font-extrabold text-lg group-hover:text-cyan-200 transition-colors">
                      {cat.name}
                    </h3>
                    <p className="text-xs text-white/80 line-clamp-1 mt-0.5">
                      {cat.sub}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 3. Hot Products Section (Sản phẩm HOT ghim từ Dashboard) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-b from-slate-100 to-white dark:from-slate-900 dark:to-dark-900 border border-slate-200 dark:border-slate-800/80 p-6 sm:p-8 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center text-white shadow-lg shadow-rose-500/20">
                <Flame className="w-6 h-6 animate-bounce" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                  Sản Phẩm HOT Bán Chạy Nhất
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  Tuyển chọn các thiết bị được cộng đồng game thủ và chuyên gia đánh giá cao nhất
                </p>
              </div>
            </div>

            <Link
              href="/products?isHot=true"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm self-start sm:self-auto"
            >
              <span>Xem tất cả HOT ({hotProducts.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loadingHot ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 animate-pulse">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-72 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {hotProducts.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 4. Tab Section: New Arrivals / Best Sellers */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <span className="w-2.5 h-6 rounded-full bg-indigo-500 inline-block" />
              Sản Phẩm Mới Về & Bán Chạy
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Cập nhật liên tục các mẫu gear mới nhất và được săn đón nhiều nhất
            </p>
          </div>

          {/* Interactive Switcher Tabs */}
          <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 self-start sm:self-auto">
            <button
              onClick={() => setActiveTab('newest')}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'newest'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-cyan-400 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Hàng Mới Về</span>
            </button>

            <button
              onClick={() => setActiveTab('best_seller')}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'best_seller'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-cyan-400 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Bán Chạy Nhất</span>
            </button>
          </div>
        </div>

        {loadingTab ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 animate-pulse">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-72 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {tabProducts.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* 5. Brand Logos Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <p className="text-center text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">
            Thương Hiệu Đồng Hành Hàng Đầu Thế Giới
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-12 opacity-70 hover:opacity-100 transition-opacity">
            {['ASUS ROG', 'LOGITECH G', 'RAZER', 'STEELSERIES', 'KEYCHRON', 'SAMSUNG', 'ZOWIE', 'CORSAIR'].map(
              (brand) => (
                <Link
                  key={brand}
                  href={`/products?brand=${encodeURIComponent(brand.split(' ')[0])}`}
                  className="font-black text-sm sm:text-base tracking-wider text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-cyan-400 transition-colors"
                >
                  {brand}
                </Link>
              )
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
