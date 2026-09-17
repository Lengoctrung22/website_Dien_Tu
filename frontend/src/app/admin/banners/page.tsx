'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Sliders,
  Plus,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Edit2,
  Trash2,
  Check,
  X,
  AlertCircle,
  ExternalLink,
  Search,
  Eye,
  Zap,
  Award,
  ArrowRight,
  RefreshCw,
  Loader2,
  CheckCircle2,
  Package,
} from 'lucide-react';
import { fetchApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import AccessDenied from '@/components/admin/AccessDenied';
import { SingleImageUpload } from '@/components/admin/ImageUpload';
import {
  BANNER_THEMES,
  BANNER_THEME_KEYS,
  BannerThemeKey,
  getBannerTheme,
} from '@/lib/bannerThemes';
import { useBlendedProductImage } from '@/lib/imageBlender';

interface BannerItem {
  _id: string;
  title: string;
  subtitle: string;
  desc: string;
  badge: string;
  tag: string;
  image: string;
  imageFit?: 'contain' | 'cover';
  removeWhiteBg?: boolean;
  theme: BannerThemeKey;
  cta: string;
  link: string;
  showSecondaryBtn: boolean;
  secondaryCta: string;
  secondaryLink: string;
  productId?: any;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ProductOption {
  _id: string;
  name: string;
  slug: string;
  brand: string;
  category: string;
  price: number;
  discountPrice?: number;
  images: string[];
  specs?: Record<string, any>;
  description?: string;
}

export default function AdminBannersPage() {
  const { hasPermission, isAdmin } = useAuthStore();
  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<BannerItem | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [desc, setDesc] = useState('');
  const [badge, setBadge] = useState('');
  const [tag, setTag] = useState('');
  const [image, setImage] = useState('');
  const [imageFit, setImageFit] = useState<'contain' | 'cover'>('contain');
  const [removeWhiteBg, setRemoveWhiteBg] = useState(false);
  const [theme, setTheme] = useState<BannerThemeKey>('purple');
  const [cta, setCta] = useState('Khám Phá Ngay');
  const [link, setLink] = useState('/products');
  const [showSecondaryBtn, setShowSecondaryBtn] = useState(true);
  const [secondaryCta, setSecondaryCta] = useState('Xem tất cả sản phẩm');
  const [secondaryLink, setSecondaryLink] = useState('/products');
  const [productId, setProductId] = useState<string | null>(null);
  const [selectedProductInfo, setSelectedProductInfo] = useState<ProductOption | null>(null);
  const [makePrimary, setMakePrimary] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [imageUploading, setImageUploading] = useState(false);

  // Live preview blended image hook
  const { displaySrc: previewDisplaySrc, isBlended: previewIsBlended } = useBlendedProductImage(
    image,
    removeWhiteBg
  );

  // Product Picker state
  const [productSearch, setProductSearch] = useState('');
  const [productResults, setProductResults] = useState<ProductOption[]>([]);
  const [searchingProducts, setSearchingProducts] = useState(false);
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Load banners
  const loadBanners = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchApi<BannerItem[]>('/banners/admin');
      if (res.success && res.data) {
        setBanners(res.data);
      } else {
        setFeedback({ type: 'error', message: res.message || 'Không thể tải danh sách banner' });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Lỗi mạng khi tải banner' });
    } finally {
      setLoading(false);
    }
  }, []);

  // Load banners on mount
  useEffect(() => {
    let ignore = false;
    const init = async () => {
      if (isAdmin() || hasPermission('products')) {
        const res = await fetchApi<BannerItem[]>('/banners/admin');
        if (!ignore) {
          if (res.success && res.data) {
            setBanners(res.data);
          } else if (res.message) {
            setFeedback({ type: 'error', message: res.message });
          }
          setLoading(false);
        }
      }
    };
    init();
    return () => {
      ignore = true;
    };
  }, [isAdmin, hasPermission]);

  // Product Search Debounce
  useEffect(() => {
    const query = productSearch.trim();
    if (!query) {
      return;
    }

    const timer = setTimeout(async () => {
      setSearchingProducts(true);
      try {
        const res = await fetchApi<{ products: ProductOption[] }>(
          `/products?search=${encodeURIComponent(query)}&limit=8`
        );
        if (res.success && res.data?.products) {
          setProductResults(res.data.products);
        } else {
          setProductResults([]);
        }
      } catch {
        setProductResults([]);
      } finally {
        setSearchingProducts(false);
      }
    }, 300);

    return () => {
      clearTimeout(timer);
    };
  }, [productSearch]);

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingBanner(null);
    setTitle('');
    setSubtitle('');
    setDesc('');
    setBadge('SẢN PHẨM MỚI RA MẮT');
    setTag('Chính Hãng');
    setImage('');
    setImageFit('contain');
    setRemoveWhiteBg(false);
    setTheme('purple');
    setCta('Khám Phá Ngay');
    setLink('/products');
    setShowSecondaryBtn(true);
    setSecondaryCta('Xem tất cả sản phẩm');
    setSecondaryLink('/products');
    setProductId(null);
    setSelectedProductInfo(null);
    setMakePrimary(false);
    setIsActive(true);
    setProductSearch('');
    setProductResults([]);
    setShowProductDropdown(false);
    setModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (banner: BannerItem) => {
    setEditingBanner(banner);
    setTitle(banner.title);
    setSubtitle(banner.subtitle || '');
    setDesc(banner.desc || '');
    setBadge(banner.badge || '');
    setTag(banner.tag || '');
    setImage(banner.image);
    setImageFit(banner.imageFit === 'cover' ? 'cover' : 'contain');
    setRemoveWhiteBg(Boolean(banner.removeWhiteBg));
    setTheme(banner.theme || 'purple');
    setCta(banner.cta || 'Khám Phá Ngay');
    setLink(banner.link || '/products');
    setShowSecondaryBtn(banner.showSecondaryBtn !== false);
    setSecondaryCta(banner.secondaryCta || 'Xem tất cả sản phẩm');
    setSecondaryLink(banner.secondaryLink || '/products');
    setProductId(banner.productId?._id || banner.productId || null);
    setSelectedProductInfo(banner.productId && typeof banner.productId === 'object' ? banner.productId : null);
    setMakePrimary(false);
    setIsActive(banner.isActive);
    setProductSearch('');
    setProductResults([]);
    setShowProductDropdown(false);
    setModalOpen(true);
  };

  // When a product is selected from the quick pick
  const handleSelectProduct = (prod: ProductOption) => {
    setSelectedProductInfo(prod);
    setProductId(prod._id);
    setTitle(prod.name);

    // Extract specs
    if (prod.specs && typeof prod.specs === 'object') {
      const specList: string[] = [];
      if (prod.specs.refreshRate) specList.push(prod.specs.refreshRate);
      if (prod.specs.resolution) specList.push(prod.specs.resolution);
      if (prod.specs.panelType) specList.push(prod.specs.panelType);
      if (prod.specs.switch) specList.push(prod.specs.switch);
      if (prod.specs.sensor) specList.push(prod.specs.sensor);
      if (prod.specs.responseTime) specList.push(prod.specs.responseTime);
      if (prod.specs.connection) specList.push(prod.specs.connection);
      if (prod.specs.weight) specList.push(prod.specs.weight);

      if (specList.length > 0) {
        setSubtitle(specList.slice(0, 3).join(' • '));
      } else {
        setSubtitle(prod.brand ? `Thương hiệu cao cấp ${prod.brand}` : '');
      }
    } else {
      setSubtitle(prod.brand ? `Thương hiệu cao cấp ${prod.brand}` : '');
    }

    if (prod.description) {
      setDesc(prod.description.slice(0, 140) + (prod.description.length > 140 ? '...' : ''));
    }

    if (prod.images && prod.images.length > 0) {
      setImage(prod.images[0]);
    }
    setImageFit('contain');
    setRemoveWhiteBg(true);

    setLink(`/products/${prod.slug}`);
    setCta('Xem Chi Tiết');
    setTag(prod.brand || 'Chính Hãng');
    setBadge('SIÊU PHẨM MỚI 2026');
    setShowProductDropdown(false);
    setProductSearch('');
  };

  // Submit Form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setFeedback({ type: 'error', message: 'Vui lòng nhập tiêu đề slide' });
      return;
    }
    if (!image.trim()) {
      setFeedback({ type: 'error', message: 'Vui lòng chọn hoặc tải lên hình ảnh cho slide' });
      return;
    }

    setModalLoading(true);
    try {
      const payload = {
        title: title.trim(),
        subtitle: subtitle.trim(),
        desc: desc.trim(),
        badge: badge.trim(),
        tag: tag.trim(),
        image: image.trim(),
        imageFit,
        removeWhiteBg,
        theme,
        cta: cta.trim() || 'Khám Phá Ngay',
        link: link.trim() || '/products',
        showSecondaryBtn,
        secondaryCta: secondaryCta.trim() || 'Xem tất cả sản phẩm',
        secondaryLink: secondaryLink.trim() || '/products',
        productId: productId || null,
        makePrimary,
        isActive,
      };

      let res;
      if (editingBanner) {
        res = await fetchApi(`/banners/${editingBanner._id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetchApi('/banners', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }

      if (res.success) {
        setFeedback({
          type: 'success',
          message: editingBanner ? 'Cập nhật banner thành công!' : 'Tạo banner mới thành công!',
        });
        setModalOpen(false);
        await loadBanners();
      } else {
        setFeedback({ type: 'error', message: res.message || 'Lưu banner thất bại' });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Đã có lỗi xảy ra khi lưu banner' });
    } finally {
      setModalLoading(false);
    }
  };

  // Delete Banner
  const handleDelete = async (bannerId: string, bannerTitle: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa banner "${bannerTitle}"?`)) {
      return;
    }

    try {
      const res = await fetchApi(`/banners/${bannerId}`, {
        method: 'DELETE',
      });
      if (res.success) {
        setFeedback({ type: 'success', message: `Đã xóa banner "${bannerTitle}"` });
        await loadBanners();
      } else {
        setFeedback({ type: 'error', message: res.message || 'Xóa banner thất bại' });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Lỗi khi xóa banner' });
    }
  };

  // Move Up / Down
  const handleMove = async (bannerId: string, direction: 'up' | 'down') => {
    try {
      const res = await fetchApi('/banners/reorder', {
        method: 'PATCH',
        body: JSON.stringify({ bannerId, direction }),
      });
      if (res.success) {
        setFeedback({
          type: 'success',
          message: `Đã di chuyển banner ${direction === 'up' ? 'lên' : 'xuống'}`,
        });
        await loadBanners();
      } else {
        setFeedback({ type: 'error', message: res.message || 'Không thể đổi thứ tự' });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Lỗi khi hoán đổi vị trí slide' });
    }
  };

  // Make Primary Hero
  const handleMakePrimary = async (bannerId: string, bannerTitle: string) => {
    try {
      const res = await fetchApi('/banners/reorder', {
        method: 'PATCH',
        body: JSON.stringify({ bannerId, action: 'make_primary' }),
      });
      if (res.success) {
        setFeedback({
          type: 'success',
          message: `Đã đưa banner "${bannerTitle}" lên làm Hero đầu tiên (#1)`,
        });
        await loadBanners();
      } else {
        setFeedback({ type: 'error', message: res.message || 'Không thể đưa lên đầu' });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Lỗi khi cập nhật vị trí' });
    }
  };

  // Toggle Active Status
  const handleToggleActive = async (banner: BannerItem) => {
    try {
      const res = await fetchApi(`/banners/${banner._id}`, {
        method: 'PUT',
        body: JSON.stringify({ isActive: !banner.isActive }),
      });
      if (res.success) {
        setFeedback({
          type: 'success',
          message: banner.isActive ? 'Đã tắt hiển thị banner' : 'Đã kích hoạt hiển thị banner',
        });
        await loadBanners();
      }
    } catch {
      setFeedback({ type: 'error', message: 'Lỗi khi thay đổi trạng thái' });
    }
  };

  if (!isAdmin() && !hasPermission('products')) {
    return (
      <AccessDenied
        requiredPermission="products"
        customMessage="Bạn không có quyền quản lý Banner & Slideshow (yêu cầu quyền 'products')."
      />
    );
  }

  const activeThemeConfig = getBannerTheme(theme);

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b hairline-border">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-signal-cyan animate-pulse" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              STOREFRONT TELEMETRY // HERO CAROUSEL
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Sliders className="w-6 h-6 text-signal-cyan" />
            <span>Quản Lý Banner & Slideshow Trang Chủ</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            Tùy biến slide quảng bá sản phẩm mới, màu sắc gradient, thứ tự hiển thị và xem trước thời gian thực
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={loadBanners}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-mono font-semibold bg-surface-elevated hover:bg-surface-subtle text-slate-800 dark:text-slate-200 border hairline-border surface-bevel transition-all"
            title="Làm mới danh sách"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Làm mới</span>
          </button>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold font-mono bg-slate-900 dark:bg-white text-white dark:text-slate-950 hover:opacity-90 transition-all shadow-md active:translate-y-0.5"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Banner Mới</span>
          </button>
        </div>
      </div>

      {/* Feedback Notification */}
      {feedback && (
        <div
          className={`flex items-center justify-between p-3.5 rounded-xl border text-xs font-semibold ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-700 dark:text-signal-emerald border-emerald-500/20'
              : 'bg-rose-500/10 text-rose-700 dark:text-signal-rose border-rose-500/20'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="p-1 hover:opacity-70"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 2. Stats Telemetry */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-xl bg-surface-card border hairline-border surface-bevel">
          <span className="text-[10px] font-mono uppercase font-bold text-slate-500 dark:text-slate-400">
            Tổng Số Slide
          </span>
          <p className="text-xl font-black text-slate-900 dark:text-white font-mono mt-1">
            {banners.length} <span className="text-xs font-normal text-slate-500">slides</span>
          </p>
        </div>

        <div className="p-4 rounded-xl bg-surface-card border hairline-border surface-bevel">
          <span className="text-[10px] font-mono uppercase font-bold text-slate-500 dark:text-slate-400">
            Đang Hoạt Động (Trang Chủ)
          </span>
          <p className="text-xl font-black text-emerald-600 dark:text-signal-emerald font-mono mt-1">
            {banners.filter((b) => b.isActive).length} <span className="text-xs font-normal text-slate-500">active</span>
          </p>
        </div>

        <div className="p-4 rounded-xl bg-surface-card border hairline-border surface-bevel">
          <span className="text-[10px] font-mono uppercase font-bold text-slate-500 dark:text-slate-400">
            Slide Hero Đầu Tiên (#1)
          </span>
          <p className="text-xs font-bold text-slate-900 dark:text-white truncate mt-2 font-mono">
            {banners.length > 0 ? banners[0].title : 'Chưa có banner nào'}
          </p>
        </div>
      </div>

      {/* 3. Banners List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider font-mono text-slate-700 dark:text-slate-300">
            Danh Sách Slideshow ({banners.length})
          </h2>
          <span className="text-[11px] font-mono text-slate-500">
            Slide ở trên cùng (#1) sẽ xuất hiện đầu tiên khi khách hàng vào website
          </span>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 bg-surface-card border hairline-border rounded-2xl space-y-3">
            <Loader2 className="w-8 h-8 text-signal-cyan animate-spin" />
            <p className="text-xs font-mono text-slate-500">Đang đồng bộ danh sách banner...</p>
          </div>
        ) : banners.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 bg-surface-card border hairline-border rounded-2xl space-y-3 text-center p-6">
            <div className="w-12 h-12 rounded-2xl bg-surface-elevated flex items-center justify-center text-slate-400 border hairline-border">
              <Sliders className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Chưa có banner nào trong hệ thống</p>
            <p className="text-xs text-slate-500 max-w-sm">
              Tạo banner đầu tiên để hiển thị trên slideshow trang chủ hoặc khởi động lại server để nạp 3 slide mặc định.
            </p>
            <button
              type="button"
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold font-mono bg-slate-900 dark:bg-white text-white dark:text-slate-950 hover:opacity-90 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm Slide Đầu Tiên</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {banners.map((banner, index) => {
              const isFirst = index === 0;
              const isLast = index === banners.length - 1;
              const themeData = getBannerTheme(banner.theme);

              return (
                <div
                  key={banner._id}
                  className={`p-4 rounded-2xl bg-surface-card border hairline-border surface-bevel transition-all flex flex-col md:flex-row md:items-center gap-4 ${
                    !banner.isActive ? 'opacity-60 bg-surface-subtle/20' : ''
                  }`}
                >
                  {/* Order Badge + Reorder controls */}
                  <div className="flex items-center md:flex-col gap-1 md:gap-1.5 justify-between md:justify-center flex-shrink-0">
                    <div
                      className={`inline-flex items-center justify-center font-mono font-black text-xs px-2.5 py-1 rounded-lg border ${
                        isFirst
                          ? 'bg-amber-500/20 text-amber-600 dark:text-amber-300 border-amber-500/30'
                          : 'bg-surface-elevated text-slate-700 dark:text-slate-300 border-slate-300 dark:border-white/10'
                      }`}
                    >
                      {isFirst ? '#1 HERO' : `#${index + 1}`}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleMove(banner._id, 'up')}
                        disabled={isFirst}
                        className="w-7 h-7 rounded-lg bg-surface-elevated hover:bg-surface-subtle disabled:opacity-30 disabled:pointer-events-none hairline-border flex items-center justify-center text-slate-600 dark:text-slate-300 transition-colors"
                        title="Di chuyển lên trên"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMove(banner._id, 'down')}
                        disabled={isLast}
                        className="w-7 h-7 rounded-lg bg-surface-elevated hover:bg-surface-subtle disabled:opacity-30 disabled:pointer-events-none hairline-border flex items-center justify-center text-slate-600 dark:text-slate-300 transition-colors"
                        title="Di chuyển xuống dưới"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Thumbnail */}
                  <div className="relative w-full md:w-44 h-28 rounded-xl overflow-hidden hairline-border flex-shrink-0 bg-slate-950 shadow-sm">
                    <Image
                      src={banner.image}
                      alt={banner.title}
                      fill
                      className={banner.imageFit === 'cover' ? 'object-cover' : 'object-contain p-1.5'}
                      unoptimized
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent pointer-events-none" />
                    <div className={`absolute inset-0 bg-gradient-to-r ${themeData.gradient} opacity-50 pointer-events-none`} />
                    <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-black/60 text-white backdrop-blur-sm">
                      {themeData.label}
                    </span>
                    <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded text-[8px] font-mono font-bold bg-black/70 text-slate-300 backdrop-blur-sm uppercase">
                      {banner.imageFit === 'cover' ? 'Cover' : 'Fit 2/3'}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {banner.badge && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-surface-elevated text-slate-700 dark:text-slate-300 hairline-border">
                          {banner.badge}
                        </span>
                      )}
                      {banner.tag && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-white/10 text-slate-600 dark:text-slate-300 hairline-border">
                          {banner.tag}
                        </span>
                      )}
                      {banner.removeWhiteBg && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-600 dark:text-signal-cyan border border-cyan-500/20">
                          HÒA NỀN TỐI
                        </span>
                      )}
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                          banner.isActive
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-signal-emerald border-emerald-500/20'
                            : 'bg-slate-500/10 text-slate-500 border-slate-500/20'
                        }`}
                      >
                        {banner.isActive ? 'ĐANG HIỂN THỊ' : 'ĐÃ ẨN'}
                      </span>
                    </div>

                    <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white truncate">
                      {banner.title}
                    </h3>

                    {banner.subtitle && (
                      <p className="text-xs font-mono text-slate-600 dark:text-slate-400 truncate">
                        {banner.subtitle}
                      </p>
                    )}

                    <div className="flex items-center gap-3 pt-1 text-[11px] font-mono text-slate-500">
                      <span className="truncate">Liên kết: <span className="text-slate-800 dark:text-slate-200">{banner.link}</span></span>
                      {banner.productId && (
                        <span className="inline-flex items-center gap-1 text-cyan-600 dark:text-signal-cyan font-bold">
                          <Package className="w-3 h-3" />
                          <span>Kho SP: {typeof banner.productId === 'object' ? banner.productId.name : 'Đã liên kết'}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-wrap justify-end pt-2 md:pt-0 border-t md:border-t-0 hairline-border">
                    {!isFirst && (
                      <button
                        type="button"
                        onClick={() => handleMakePrimary(banner._id, banner.title)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30 transition-colors"
                        title="Đưa lên vị trí số 1 ngay lập tức"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Đưa Lên Đầu</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleToggleActive(banner)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-semibold transition-colors border ${
                        banner.isActive
                          ? 'bg-surface-elevated hover:bg-surface-subtle text-slate-700 dark:text-slate-300 hairline-border'
                          : 'bg-emerald-500/10 text-emerald-600 dark:text-signal-emerald border-emerald-500/30 hover:bg-emerald-500/20'
                      }`}
                    >
                      {banner.isActive ? 'Tạm Ẩn' : 'Bật Hiển Thị'}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenEdit(banner)}
                      className="p-2 rounded-lg bg-surface-elevated hover:bg-surface-subtle text-slate-700 dark:text-slate-200 hairline-border transition-colors"
                      title="Chỉnh sửa slide"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(banner._id, banner.title)}
                      className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-signal-rose border border-rose-500/20 transition-colors"
                      title="Xóa slide"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* =========================================================================
       * 4. CREATE / EDIT MODAL WITH 21:9 LIVE PREVIEW
       * ========================================================================= */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-4xl bg-surface-card border hairline-border surface-bevel rounded-2xl shadow-2xl overflow-hidden my-6 max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b hairline-border bg-surface-elevated/40">
              <div>
                <h2 className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-signal-cyan" />
                  <span>{editingBanner ? 'Chỉnh Sửa Slide Banner' : 'Thêm Mới Slide Hero Slideshow'}</span>
                </h2>
                <p className="text-[11px] font-mono text-slate-500">
                  {editingBanner ? 'Cập nhật nội dung và live preview ngay lập tức' : 'Giới thiệu sản phẩm mới với theme gradient tùy chỉnh'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-surface-elevated transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
              {/* =================================================================
               * 21:9 LIVE PREVIEW SECTION
               * ================================================================= */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Eye className="w-4 h-4 text-signal-cyan" />
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Live Preview 21:9 Thời Gian Thực
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500">
                    Mô phỏng chính xác giao diện hiển thị trên trang chủ
                  </span>
                </div>

                <div className="relative w-full h-[220px] sm:h-[260px] md:h-[290px] rounded-2xl overflow-hidden border hairline-border surface-bevel shadow-2xl bg-slate-950 group">
                  {/* Background Image & Gradient Overlays */}
                  {image ? (
                    <>
                      {/* 1. Ambient blurred background if contain, or cover if cover */}
                      {!removeWhiteBg && (
                        <div className="absolute inset-0 overflow-hidden pointer-events-none">
                          <Image
                            src={image}
                            alt={title || 'Preview'}
                            fill
                            className={`object-cover object-center ${
                              imageFit === 'cover' ? 'scale-100 opacity-90' : 'scale-110 blur-3xl opacity-35 dark:opacity-40'
                            }`}
                            unoptimized
                          />
                        </div>
                      )}

                      {/* 2. Theme accent gradient - confined to left ~35% */}
                      <div
                        className={`absolute inset-y-0 left-0 w-full sm:w-[36%] bg-gradient-to-r ${activeThemeConfig.gradient} opacity-30 sm:opacity-40 pointer-events-none z-[1]`}
                      />

                      {/* 3. Dark scrim: left 1/3 (~35%-38%), right 2/3 transparent */}
                      <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/90 via-[26%] to-transparent to-[38%] pointer-events-none z-[2]" />
                    </>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 text-slate-500">
                      <Sliders className="w-8 h-8 mb-2 opacity-50" />
                      <span className="text-xs font-mono">Chưa có ảnh slide - Hãy chọn hoặc tải ảnh bên dưới</span>
                    </div>
                  )}

                  {/* Content Overlay */}
                  <div className="relative h-full max-w-5xl mx-auto px-4 sm:px-7 flex items-center justify-between z-10 text-white">
                    <div
                      className={`w-full h-full flex items-center ${
                        imageFit === 'cover' ? 'justify-start' : 'justify-between'
                      } gap-4`}
                    >
                      {/* Left: Text (1/3 width: ~35%) */}
                      <div
                        className={`w-full ${
                          imageFit === 'cover' ? 'max-w-md' : 'w-[38%] sm:w-[35%]'
                        } space-y-1 sm:space-y-1.5 py-3 z-10`}
                      >
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {badge && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] sm:text-[10px] font-mono font-bold tracking-wider uppercase bg-white/10 text-white border border-white/20 backdrop-blur-md">
                              <Zap className="w-3 h-3 fill-current" />
                              {badge}
                            </span>
                          )}
                          {tag && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] sm:text-[10px] font-mono font-semibold bg-white/10 text-slate-200 backdrop-blur-md border hairline-border">
                              <Award className="w-3 h-3" />
                              {tag}
                            </span>
                          )}
                        </div>

                        <h3 className="text-base sm:text-xl md:text-2xl font-black tracking-tight leading-tight drop-shadow-md">
                          {title || 'Tiêu đề sản phẩm hoặc ưu đãi nổi bật'}
                        </h3>

                        {subtitle && (
                          <p className="text-[10px] sm:text-xs font-semibold text-slate-200 font-mono line-clamp-1">
                            {subtitle}
                          </p>
                        )}

                        {desc && (
                          <p className="text-[9px] sm:text-[10px] text-slate-300 line-clamp-2">
                            {desc}
                          </p>
                        )}

                        <div className="pt-1 flex items-center gap-2 flex-wrap">
                          <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg font-bold text-[11px] bg-white text-slate-950 shadow-md">
                            <span>{cta || 'Khám Phá Ngay'}</span>
                            <ArrowRight className="w-3 h-3" />
                          </span>

                          {showSecondaryBtn && (
                            <span className="inline-flex items-center px-2.5 py-1.5 rounded-lg font-semibold text-[11px] bg-white/10 text-white backdrop-blur-md border hairline-border">
                              {secondaryCta || 'Xem tất cả sản phẩm'}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Right: Product Image for contain mode (2/3 width: ~65%) */}
                      {imageFit !== 'cover' && image && (
                        <div className="w-[62%] sm:w-[65%] h-full flex items-center justify-center p-2 sm:p-4 relative isolate">
                          {/* Studio Spotlight Backdrop when removeWhiteBg is active */}
                          {removeWhiteBg && (
                            <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden">
                              <div
                                className="absolute w-[88%] h-[84%] rounded-full blur-2xl opacity-30 dark:opacity-40 pointer-events-none"
                                style={{
                                  background: activeThemeConfig?.accentColor
                                    ? `radial-gradient(ellipse at 52% 45%, ${activeThemeConfig.accentColor}40 0%, ${activeThemeConfig.accentColor}10 50%, transparent 75%)`
                                    : 'radial-gradient(ellipse at 52% 45%, rgba(59, 130, 246, 0.3) 0%, rgba(30, 64, 175, 0.1) 50%, transparent 75%)',
                                }}
                              />
                              <div className="absolute w-[72%] h-[68%] rounded-full blur-xl pointer-events-none bg-[radial-gradient(ellipse_at_52%_45%,_rgba(80,105,140,0.50)_0%,_rgba(45,65,95,0.25)_45%,_transparent_75%)]" />
                              <div className="absolute bottom-0 inset-x-0 h-[32%] bg-gradient-to-b from-[#242e3d]/85 via-[#192230]/75 to-[#0e141f]/95 border-t border-slate-600/30 pointer-events-none" />
                              <div className="absolute bottom-4 sm:bottom-6 w-[70%] h-3 bg-black/85 rounded-[100%] blur-sm pointer-events-none" />
                            </div>
                          )}

                          <div className="relative w-full h-[88%] max-h-[220px] flex items-center justify-center">
                            <Image
                              src={image}
                              alt={title || 'Preview Product'}
                              fill
                              className={`object-contain object-center transition-all duration-300 ${
                                removeWhiteBg
                                  ? ''
                                  : 'drop-shadow-2xl'
                              }`}
                              style={
                                removeWhiteBg
                                  ? {
                                      mixBlendMode: 'multiply',
                                      WebkitMaskImage:
                                        'radial-gradient(ellipse 90% 86% at 50% 50%, #000 68%, rgba(0, 0, 0, 0.75) 82%, transparent 100%)',
                                      maskImage:
                                        'radial-gradient(ellipse 90% 86% at 50% 50%, #000 68%, rgba(0, 0, 0, 0.75) 82%, transparent 100%)',
                                    }
                                  : undefined
                              }
                              unoptimized
                            />
                          </div>

                          {removeWhiteBg && (
                            <div className="absolute bottom-2 right-4 text-slate-400/40 dark:text-slate-300/35 pointer-events-none text-lg font-serif select-none">
                              ✦
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <span className="absolute bottom-2 right-2 text-[9px] font-mono uppercase px-2 py-0.5 rounded bg-black/60 text-slate-300 backdrop-blur-sm border hairline-border z-20">
                    {activeThemeConfig.label} • {imageFit === 'cover' ? 'Cover' : 'Fit 2/3'} {removeWhiteBg ? '• Hòa Nền Tối' : ''} • 21:9
                  </span>
                </div>
              </div>

              {/* =================================================================
               * 1. QUICK PRODUCT PICKER FROM INVENTORY
               * ================================================================= */}
              <div className="p-4 rounded-xl bg-surface-elevated/50 hairline-border surface-bevel space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-mono font-bold uppercase text-slate-800 dark:text-slate-200">
                    Chọn nhanh sản phẩm từ kho (Tự động trích xuất thông số & ảnh)
                  </label>
                  {selectedProductInfo && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedProductInfo(null);
                        setProductId(null);
                      }}
                      className="text-[11px] font-mono text-rose-600 hover:underline"
                    >
                      Hủy liên kết SP
                    </button>
                  )}
                </div>

                <div className="relative">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Tìm kiếm theo tên sản phẩm (gõ từ 2 ký tự)..."
                      value={productSearch}
                      onChange={(e) => {
                        const val = e.target.value;
                        setProductSearch(val);
                        if (!val.trim()) {
                          setProductResults([]);
                          setSearchingProducts(false);
                        }
                        setShowProductDropdown(true);
                      }}
                      onFocus={() => setShowProductDropdown(true)}
                      onBlur={() => {
                        setTimeout(() => {
                          setShowProductDropdown(false);
                        }, 250);
                      }}
                      className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-surface-card border hairline-border text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus:border-signal-cyan font-mono"
                    />
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    {searchingProducts && (
                      <Loader2 className="w-4 h-4 text-signal-cyan animate-spin absolute right-3 top-1/2 -translate-y-1/2" />
                    )}
                  </div>

                  {/* Dropdown Suggestions */}
                  {showProductDropdown && productResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 z-30 bg-surface-card border hairline-border rounded-xl shadow-2xl max-h-56 overflow-y-auto p-1 space-y-1">
                      {productResults.map((prod) => (
                        <button
                          key={prod._id}
                          type="button"
                          onClick={() => handleSelectProduct(prod)}
                          className="w-full text-left p-2 rounded-lg hover:bg-surface-elevated flex items-center gap-3 transition-colors group cursor-pointer"
                        >
                          <div className="relative w-10 h-10 rounded-lg overflow-hidden hairline-border bg-surface-subtle flex-shrink-0">
                            {prod.images?.[0] ? (
                              <Image src={prod.images[0]} alt={prod.name} fill className="object-cover" unoptimized />
                            ) : (
                              <Package className="w-4 h-4 m-auto text-slate-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-signal-cyan">
                              {prod.name}
                            </p>
                            <p className="text-[10px] font-mono text-slate-500 truncate">
                              {prod.brand} • {prod.category} • {prod.price.toLocaleString('vi-VN')}₫
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {selectedProductInfo && (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-signal-emerald text-xs font-mono">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">
                      Đã trích xuất dữ liệu từ: <strong>{selectedProductInfo.name}</strong>
                    </span>
                  </div>
                )}
              </div>

              {/* =================================================================
               * 2. THEME GRADIENT SELECTION (7 PRESETS)
               * ================================================================= */}
              <div className="space-y-2">
                <label className="block text-xs font-mono font-bold uppercase text-slate-800 dark:text-slate-200">
                  Màu Sắc & Gradient Theme (7 Preset màu chuẩn ROG & Cyber)
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                  {BANNER_THEME_KEYS.map((key) => {
                    const t = BANNER_THEMES[key];
                    const isSelected = theme === key;

                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setTheme(key)}
                        className={`p-2 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                          isSelected
                            ? 'border-signal-cyan bg-signal-cyan/10 ring-2 ring-signal-cyan/30 shadow-md scale-[1.02]'
                            : 'border-slate-300 dark:border-white/10 hover:border-slate-400 dark:hover:border-white/20 bg-surface-subtle/30'
                        }`}
                      >
                        <div
                          className={`w-7 h-7 rounded-full bg-gradient-to-tr ${t.previewClass} border border-white/20 shadow-inner flex items-center justify-center text-white`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5" />}
                        </div>
                        <span className="text-[10px] font-mono font-bold truncate max-w-full text-slate-800 dark:text-slate-200">
                          {t.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* =================================================================
               * 3. IMAGE UPLOAD & URL
               * ================================================================= */}
              <div className="space-y-2">
                <SingleImageUpload
                  label="Hình Ảnh Nền Slide (Background Image)"
                  required
                  value={image}
                  onChange={(url) => setImage(url)}
                  onUploadingChange={(uploading) => setImageUploading(uploading)}
                  helperText="Khuyên dùng ảnh độ phân giải cao 1920x800 hoặc tỷ lệ 21:9 để hiển thị sắc nét nhất"
                />

                {selectedProductInfo?.images && selectedProductInfo.images.length > 0 && (
                  <div className="pt-1">
                    <p className="text-[10px] font-mono text-slate-500 mb-1">
                      Hoặc chọn từ thư viện ảnh của sản phẩm:
                    </p>
                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                      {selectedProductInfo.images.map((imgUrl, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setImage(imgUrl)}
                          className={`relative w-12 h-12 rounded-lg overflow-hidden border flex-shrink-0 transition-all ${
                            image === imgUrl ? 'border-signal-cyan ring-2 ring-signal-cyan/30' : 'border-slate-300 dark:border-white/10 opacity-70 hover:opacity-100'
                          }`}
                        >
                          <Image src={imgUrl} alt={`Product ${i}`} fill className="object-cover" unoptimized />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* =================================================================
               * 3.1 IMAGE DISPLAY MODE (CONTAIN / FIT 2/3 VS COVER)
               * ================================================================= */}
              <div className="space-y-1.5 p-3.5 rounded-xl bg-surface-elevated/40 hairline-border surface-bevel">
                <label className="block text-xs font-mono font-bold uppercase text-slate-800 dark:text-slate-200">
                  Chế Độ Khung Hình Sản Phẩm (Image Display Mode)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setImageFit('contain')}
                    className={`p-3 rounded-xl border text-left transition-all flex items-start gap-2.5 cursor-pointer ${
                      imageFit === 'contain'
                        ? 'border-signal-cyan bg-signal-cyan/10 ring-2 ring-signal-cyan/30 shadow-sm'
                        : 'border-slate-300 dark:border-white/10 hover:border-slate-400 dark:hover:border-white/20 bg-surface-subtle/20'
                    }`}
                  >
                    <div
                      className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 ${
                        imageFit === 'contain' ? 'border-signal-cyan bg-signal-cyan text-white' : 'border-slate-400'
                      }`}
                    >
                      {imageFit === 'contain' && <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span>Vừa vặn khung hình (Fit 2/3)</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded font-mono bg-signal-cyan/20 text-cyan-400 font-semibold">
                          Khuyên dùng
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Hiển thị trọn vẹn sản phẩm ở 2/3 bên phải cùng nền mờ chiều sâu. Không bị zoom cắt xén hay che khuất.
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setImageFit('cover')}
                    className={`p-3 rounded-xl border text-left transition-all flex items-start gap-2.5 cursor-pointer ${
                      imageFit === 'cover'
                        ? 'border-signal-cyan bg-signal-cyan/10 ring-2 ring-signal-cyan/30 shadow-sm'
                        : 'border-slate-300 dark:border-white/10 hover:border-slate-400 dark:hover:border-white/20 bg-surface-subtle/20'
                    }`}
                  >
                    <div
                      className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 ${
                        imageFit === 'cover' ? 'border-signal-cyan bg-signal-cyan text-white' : 'border-slate-400'
                      }`}
                    >
                      {imageFit === 'cover' && <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">
                        Tràn toàn bộ khung (Cover)
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Phủ kín toàn bộ slide. Phù hợp cho banner đồ họa thiết kế sẵn tỷ lệ 21:9 hoặc ảnh phối cảnh.
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              {/* =================================================================
               * 3.2 STUDIO WHITE BACKGROUND BLENDING (HÒA TRỘN VÀO NỀN TỐI)
               * ================================================================= */}
              <div className="p-3.5 rounded-xl bg-surface-elevated/40 hairline-border surface-bevel space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-signal-cyan" />
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      Khử viền nền trắng (Hòa trộn vào nền tối)
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded font-mono font-semibold bg-emerald-500/10 text-emerald-600 dark:text-signal-emerald border border-emerald-500/20">
                      Studio Spotlight
                    </span>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={removeWhiteBg}
                      onChange={(e) => setRemoveWhiteBg(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-300 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-signal-cyan"></div>
                  </label>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Tự động loại bỏ khung chữ nhật màu trắng của ảnh sản phẩm, tạo đốm sáng studio dịu nhẹ và bóng đổ mềm tự nhiên, giúp sản phẩm hòa quyện liền mạch với nền tối của slide mà không làm mất phím trắng hay viền bạc của sản phẩm.
                </p>
              </div>

              {/* =================================================================
               * 4. MAIN TEXT FIELDS
               * ================================================================= */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                    Tiêu Đề Chính (Title) <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="VD: ASUS ROG Swift OLED PG27AQDM"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-surface-subtle/40 dark:bg-surface-elevated border hairline-border text-slate-900 dark:text-white font-bold placeholder:text-slate-500 focus:outline-none focus:border-signal-cyan"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                    Huy Hiệu Phía Trên (Badge)
                  </label>
                  <input
                    type="text"
                    value={badge}
                    onChange={(e) => setBadge(e.target.value)}
                    placeholder="VD: CÔNG NGHỆ RAPID TRIGGER MỚI NHẤT"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-surface-subtle/40 dark:bg-surface-elevated border hairline-border text-slate-900 dark:text-white font-mono placeholder:text-slate-500 focus:outline-none focus:border-signal-cyan uppercase"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                    Thẻ Tag Góc (Tag)
                  </label>
                  <input
                    type="text"
                    value={tag}
                    onChange={(e) => setTag(e.target.value)}
                    placeholder="VD: Chính Hãng ROG hoặc Trending #1"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-surface-subtle/40 dark:bg-surface-elevated border hairline-border text-slate-900 dark:text-white font-mono placeholder:text-slate-500 focus:outline-none focus:border-signal-cyan"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                    Phụ Đề / Thông Số Kỹ Thuật Chính (Subtitle)
                  </label>
                  <input
                    type="text"
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    placeholder="VD: Tần số quét 240Hz • Phản hồi 0.03ms • Tản nhiệt buồng hơi Custom"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-surface-subtle/40 dark:bg-surface-elevated border hairline-border text-slate-900 dark:text-white font-mono placeholder:text-slate-500 focus:outline-none focus:border-signal-cyan"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                    Mô Tả Chi Tiết (Description)
                  </label>
                  <textarea
                    rows={2}
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                    placeholder="Đột phá hiển thị với màu đen vô cực và tốc độ phản hồi cực hạn cho game thủ đỉnh cao..."
                    className="w-full px-3 py-2 text-xs rounded-xl bg-surface-subtle/40 dark:bg-surface-elevated border hairline-border text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus:border-signal-cyan resize-none"
                  />
                </div>
              </div>

              {/* =================================================================
               * 5. CALL TO ACTION (CTA) BUTTONS
               * ================================================================= */}
              <div className="p-4 rounded-xl bg-surface-elevated/40 hairline-border surface-bevel space-y-4">
                <h4 className="text-xs font-mono font-bold uppercase text-slate-800 dark:text-slate-200">
                  Cấu Hình Nút Bấm Call To Action (CTA)
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      Tên Nút Chính (Primary CTA Text)
                    </label>
                    <input
                      type="text"
                      value={cta}
                      onChange={(e) => setCta(e.target.value)}
                      placeholder="Khám Phá Ngay"
                      className="w-full px-3 py-1.5 text-xs rounded-lg bg-surface-card border hairline-border text-slate-900 dark:text-white font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      Đường Dẫn Nút Chính (Primary Link)
                    </label>
                    <input
                      type="text"
                      value={link}
                      onChange={(e) => setLink(e.target.value)}
                      placeholder="/products/ten-san-pham"
                      className="w-full px-3 py-1.5 text-xs rounded-lg bg-surface-card border hairline-border text-slate-900 dark:text-white font-mono"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t hairline-border space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showSecondaryBtn}
                        onChange={(e) => setShowSecondaryBtn(e.target.checked)}
                        className="rounded border-slate-300 text-signal-cyan focus:ring-signal-cyan"
                      />
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Hiển thị nút phụ (Secondary Button)
                      </span>
                    </label>
                    <span className="text-[10px] font-mono text-slate-500">
                      Thường dùng để dẫn tới danh mục hoặc xem tất cả SP
                    </span>
                  </div>

                  {showSecondaryBtn && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-6">
                      <div className="space-y-1">
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                          Tên Nút Phụ
                        </label>
                        <input
                          type="text"
                          value={secondaryCta}
                          onChange={(e) => setSecondaryCta(e.target.value)}
                          placeholder="Xem tất cả sản phẩm"
                          className="w-full px-3 py-1.5 text-xs rounded-lg bg-surface-card border hairline-border text-slate-900 dark:text-white font-mono"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                          Đường Dẫn Nút Phụ
                        </label>
                        <input
                          type="text"
                          value={secondaryLink}
                          onChange={(e) => setSecondaryLink(e.target.value)}
                          placeholder="/products"
                          className="w-full px-3 py-1.5 text-xs rounded-lg bg-surface-card border hairline-border text-slate-900 dark:text-white font-mono"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* =================================================================
               * 6. DISPLAY OPTIONS & CHECKBOXES
               * ================================================================= */}
              <div className="p-3.5 rounded-xl bg-surface-elevated/30 hairline-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={makePrimary}
                    onChange={(e) => setMakePrimary(e.target.checked)}
                    className="rounded border-slate-300 text-amber-500 focus:ring-amber-500"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>Đưa lên làm Slide đầu tiên (#1 Primary Hero)</span>
                    </span>
                    <span className="text-[10px] font-mono text-slate-500 block">
                      Sản phẩm mới ra mắt sẽ đứng ngay vị trí đầu tiên của Slideshow
                    </span>
                  </div>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
                  />
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    Kích hoạt hiển thị ngay
                  </span>
                </label>
              </div>

              {/* Modal Footer Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t hairline-border">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-mono font-semibold bg-surface-elevated hover:bg-surface-subtle text-slate-700 dark:text-slate-300 hairline-border transition-colors"
                >
                  Hủy bỏ
                </button>

                <button
                  type="submit"
                  disabled={modalLoading || imageUploading}
                  className="inline-flex items-center gap-2 px-6 py-2 rounded-xl text-xs font-mono font-bold bg-slate-900 dark:bg-white text-white dark:text-slate-950 hover:opacity-90 transition-all disabled:opacity-50"
                >
                  {modalLoading || imageUploading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  <span>
                    {imageUploading
                      ? 'Đang tải ảnh...'
                      : editingBanner
                      ? 'Lưu Thay Đổi'
                      : 'Tạo Slide Banner'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
