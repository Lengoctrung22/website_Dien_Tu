'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Zap,
  ArrowRight,
  Monitor,
  Keyboard,
  Mouse,
  Headphones,
  TrendingUp,
  Clock,
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
      count: categoryCounts['monitor'] ?? 0,
      icon: Monitor,
      image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 'keyboard',
      name: 'Bàn Phím Cơ',
      sub: 'Rapid Trigger, Nhôm CNC, Custom',
      count: categoryCounts['keyboard'] ?? 0,
      icon: Keyboard,
      image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 'mouse',
      name: 'Chuột Gaming & Esports',
      sub: 'Siêu nhẹ 31g-54g, 35K DPI, 8000Hz',
      count: categoryCounts['mouse'] ?? 0,
      icon: Mouse,
      image: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 'headphone',
      name: 'Tai Nghe Cao Cấp',
      sub: 'Chống ồn ANC, Pin 120H, Hi-Res',
      count: categoryCounts['headphone'] ?? 0,
      icon: Headphones,
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80',
    },
  ];

  return (
    <div className="space-y-12 sm:space-y-16 pb-16">
      {/* 1. Hero Carousel & Quick Search Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 space-y-6">
        <HeroSlider />
        <QuickFilterBar />
      </section>

      {/* 2. Featured Categories Grid (Matte Obsidian Hardware Cards) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-600 dark:bg-signal-cyan inline-block" />
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                HARDWARE TAXONOMY
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Danh Mục Sản Phẩm Nổi Bật
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5">
              Khám phá hệ sinh thái phụ kiện máy tính chuyên nghiệp được phân loại chi tiết
            </p>
          </div>
          <Link
            href="/products"
            className="text-xs font-mono font-semibold text-slate-600 dark:text-slate-400 hover:text-cyan-700 dark:hover:text-signal-cyan flex items-center gap-1 transition-colors"
          >
            <span>Xem tất cả</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <Link
                key={cat.id}
                href={`/products?category=${cat.id}`}
                className="group relative h-48 rounded-2xl overflow-hidden border hairline-border surface-bevel bg-surface-card hover:border-slate-400 dark:hover:border-signal-cyan/50 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                {/* Background Hardware Image with Zoom & Dark Matte Tint */}
                <Image
                  src={cat.image}
                  alt={cat.name}
                  fill
                  className="object-cover object-center opacity-35 dark:opacity-25 group-hover:opacity-50 dark:group-hover:opacity-40 group-hover:scale-105 transition-all duration-500"
                  unoptimized
                />

                {/* Matte Obsidian Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-surface-card via-surface-card/80 to-transparent" />

                {/* Content */}
                <div className="absolute inset-0 p-5 flex flex-col justify-between z-10">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-surface-elevated/90 border hairline-border surface-bevel flex items-center justify-center text-slate-800 dark:text-slate-200 group-hover:text-cyan-700 dark:group-hover:text-signal-cyan group-hover:border-cyan-500/40 transition-colors">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-mono tabular-nums font-bold px-2 py-0.5 rounded-md bg-surface-elevated/90 text-slate-700 dark:text-slate-300 border hairline-border backdrop-blur-sm">
                      {cat.count} SP
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-base text-slate-900 dark:text-white group-hover:text-cyan-700 dark:group-hover:text-signal-cyan transition-colors">
                      {cat.name}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-mono line-clamp-1 mt-0.5">
                      {cat.sub}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 3. Hot Products Section (Technical Spec Badges) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl bg-surface-card border hairline-border surface-bevel p-6 sm:p-8 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b hairline-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-surface-elevated border hairline-border surface-bevel flex items-center justify-center text-amber-600 dark:text-signal-amber shadow-sm">
                <Zap className="w-5 h-5 fill-current" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider uppercase bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30">
                    TELEMETRY // BENCHMARK VERIFIED
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  Sản Phẩm HOT Bán Chạy Nhất
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5">
                  Tuyển chọn các thiết bị phần cứng đạt điểm số hiệu năng cao nhất theo kiểm định
                </p>
              </div>
            </div>

            <Link
              href="/products?isHot=true"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-mono font-semibold bg-surface-elevated hover:bg-surface-subtle text-slate-800 dark:text-slate-200 border hairline-border surface-bevel transition-all self-start sm:self-auto active:translate-y-0.5"
            >
              <span>Xem tất cả HOT</span>
              <span className="tabular-nums opacity-70">({hotProducts.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loadingHot ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 animate-pulse">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-72 bg-surface-elevated rounded-xl" />
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

      {/* 4. Tab Section: New Arrivals / Best Sellers (Tactile Segmented Tabs) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-600 dark:bg-signal-cyan animate-pulse inline-block" />
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                LIVE HARDWARE FEED
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Sản Phẩm Mới Về & Bán Chạy
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5">
              Cập nhật liên tục các mẫu gear mới nhất và các model thịnh hành nhất
            </p>
          </div>

          {/* Interactive Switcher Tabs: Tactile Segmented Tabs */}
          <div className="flex items-center p-1 rounded-xl bg-surface-card border hairline-border surface-bevel self-start sm:self-auto shadow-sm">
            <button
              onClick={() => setActiveTab('newest')}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                activeTab === 'newest'
                  ? 'bg-surface-elevated text-cyan-700 dark:text-signal-cyan border border-cyan-500/30 dark:border-signal-cyan/30 surface-bevel shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Hàng Mới Về</span>
            </button>

            <button
              onClick={() => setActiveTab('best_seller')}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                activeTab === 'best_seller'
                  ? 'bg-surface-elevated text-cyan-700 dark:text-signal-cyan border border-cyan-500/30 dark:border-signal-cyan/30 surface-bevel shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
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
              <div key={i} className="h-72 bg-surface-elevated rounded-xl" />
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
        <div className="p-6 rounded-2xl bg-surface-card border hairline-border surface-bevel shadow-sm">
          <p className="text-center text-[11px] font-mono font-bold uppercase tracking-widest text-slate-700 dark:text-slate-400 mb-4">
            ĐỐI TÁC THƯƠNG HIỆU PHẦN CỨNG CHÍNH HÃNG
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-12 opacity-85 hover:opacity-100 transition-opacity">
            {['ASUS ROG', 'LOGITECH G', 'RAZER', 'STEELSERIES', 'KEYCHRON', 'SAMSUNG', 'ZOWIE', 'CORSAIR'].map(
              (brand) => (
                <Link
                  key={brand}
                  href={`/products?brand=${encodeURIComponent(brand.split(' ')[0])}`}
                  className="font-mono font-bold text-xs sm:text-sm tracking-wider text-slate-700 dark:text-slate-400 hover:text-cyan-700 dark:hover:text-signal-cyan transition-colors"
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
