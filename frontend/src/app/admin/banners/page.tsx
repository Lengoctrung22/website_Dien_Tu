'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
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
  Search,
  Eye,
  Zap,
  Award,
  ArrowRight,
  RefreshCw,
  Loader2,
  CheckCircle2,
  Package,
  Layers,
  Maximize2,
  Monitor,
  Smartphone,
  ChevronUp,
  ChevronDown,
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
import {
  useBlendedProductImage,
  getProductBlendStyles,
  getScenicFeatherStyles,
  isValidImageSrc,
  normalizeImageSrc,
} from '@/lib/imageBlender';

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

const QUICK_LINK_PRESETS = [
  { label: 'Tất cả SP', path: '/products' },
  { label: 'Màn hình', path: '/products?category=monitor' },
  { label: 'Bàn phím', path: '/products?category=keyboard' },
  { label: 'Chuột Gaming', path: '/products?category=mouse' },
  { label: 'Tai nghe', path: '/products?category=headphone' },
  { label: 'Đang HOT', path: '/products?isHot=true' },
];

function normalizeCtaLink(raw: string): string {
  const trimmed = (raw || '').trim();
  if (!trimmed) return '/products';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith('//') || /^[a-zA-Z][a-zA-Z0-9+.-]*:/i.test(trimmed)) {
    return '/products';
  }
  if (trimmed.startsWith('/')) return trimmed;
  return `/${trimmed}`;
}

function suggestThemeForProduct(prod: ProductOption): BannerThemeKey {
  const b = (prod.brand || '').toLowerCase();
  const c = (prod.category || '').toLowerCase();
  if (b.includes('razer')) return 'emerald';
  if (b.includes('rog') || b.includes('asus')) return 'blue';
  if (b.includes('zowie') || b.includes('hyperx')) return 'rose';
  if (b.includes('logitech') || b.includes('pulsar')) return 'cyan';
  if (c === 'keyboard') return 'purple';
  if (c === 'mouse') return 'cyan';
  if (c === 'headphone') return 'amber';
  if (c === 'monitor') return 'blue';
  return 'purple';
}

function BannerCardThumbnail({ banner }: { banner: BannerItem }) {
  const themeData = getBannerTheme(banner.theme);
  const isCover = banner.imageFit === 'cover';
  const { displaySrc, blendMode } = useBlendedProductImage(
    banner.image,
    Boolean(banner.removeWhiteBg)
  );

  const imageStyle = isCover
    ? undefined
    : blendMode === 'cutout'
    ? undefined
    : blendMode === 'softbox'
    ? getProductBlendStyles(true, 'softbox')
    : getScenicFeatherStyles();

  return (
    <div className="relative w-full md:w-48 h-28 rounded-xl overflow-hidden hairline-border flex-shrink-0 bg-[#070b14] shadow-md isolate">
      {/* Studio Ambient Theme Aura */}
      <div
        className="absolute inset-0 opacity-75 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 80% 80% at 60% 50%, ${themeData.accentColor}45 0%, ${themeData.accentColor}15 50%, transparent 80%)`,
        }}
      />
      <div
        className={`absolute inset-0 bg-gradient-to-r ${themeData.gradient} opacity-45 pointer-events-none mix-blend-screen`}
      />

      {/* Image */}
      <div className="relative w-full h-full flex items-center justify-center">
        <Image
          src={displaySrc || banner.image}
          alt={banner.title}
          fill
          className={
            isCover
              ? 'object-cover'
              : blendMode !== 'cutout'
              ? 'object-cover rounded-lg'
              : 'object-contain p-2 drop-shadow-[0_10px_20px_rgba(0,0,0,0.85)]'
          }
          style={imageStyle}
          unoptimized
        />
      </div>

      <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-slate-950/90 to-transparent pointer-events-none" />
      <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-black/70 text-white backdrop-blur-sm border border-white/10">
        {themeData.label}
      </span>
      <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded text-[8px] font-mono font-bold bg-black/75 text-cyan-300 backdrop-blur-sm uppercase border border-white/10">
        {isCover
          ? 'Cover 21:9'
          : blendMode === 'cutout'
          ? 'Cutout Studio'
          : 'Vignette 2/3'}
      </span>
    </div>
  );
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
  const [modalError, setModalError] = useState<string | null>(null);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [previewCollapsed, setPreviewCollapsed] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [desc, setDesc] = useState('');
  const [badge, setBadge] = useState('');
  const [tag, setTag] = useState('');
  const [image, setImage] = useState('');
  const [imageFit, setImageFit] = useState<'contain' | 'cover'>('contain');
  const [removeWhiteBg, setRemoveWhiteBg] = useState(true);
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

  const normalizedPreviewImage = normalizeImageSrc(image);
  const validPreviewImage = isValidImageSrc(normalizedPreviewImage) ? normalizedPreviewImage : '';

  // Live preview blended image hook (wired directly into the 21:9 & Mobile Live Preview)
  const {
    displaySrc: previewDisplaySrc,
    blendMode: previewBlendMode,
    hasLightBg: previewHasLightBg,
    isProcessing: previewIsProcessing,
  } = useBlendedProductImage(validPreviewImage, removeWhiteBg);

  // Product Picker state
  const [productSearch, setProductSearch] = useState('');
  const [productResults, setProductResults] = useState<ProductOption[]>([]);
  const [defaultProducts, setDefaultProducts] = useState<ProductOption[]>([]);
  const [searchingProducts, setSearchingProducts] = useState(false);
  const [showProductDropdown, setShowProductDropdown] = useState(false);

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

  // Preload initial featured (isHot=true) products when modal opens for instant Quick Product Picker suggestions
  useEffect(() => {
    if (!modalOpen || defaultProducts.length > 0) return;
    let ignore = false;
    const loadInitialProducts = async () => {
      setSearchingProducts(true);
      try {
        const hotRes = await fetchApi<{ products: ProductOption[] }>(
          '/products?isHot=true&sortBy=hot_order&limit=8'
        );
        let list: ProductOption[] =
          hotRes.success && Array.isArray(hotRes.data?.products) ? hotRes.data.products : [];

        if (list.length < 8) {
          const fallbackRes = await fetchApi<{ products: ProductOption[] }>(
            '/products?limit=8&sortBy=hot_order'
          );
          if (fallbackRes.success && Array.isArray(fallbackRes.data?.products)) {
            const seen = new Set(list.map((p) => p._id));
            for (const p of fallbackRes.data.products) {
              if (!seen.has(p._id)) {
                list.push(p);
                seen.add(p._id);
                if (list.length >= 8) break;
              }
            }
          }
        }

        if (!ignore) {
          setDefaultProducts(list);
        }
      } catch {
        // ignore
      } finally {
        if (!ignore) setSearchingProducts(false);
      }
    };
    loadInitialProducts();
    return () => {
      ignore = true;
    };
  }, [modalOpen, defaultProducts.length]);

  // Close modal on Escape key
  useEffect(() => {
    if (!modalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !modalLoading && !imageUploading) {
        setModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [modalOpen, modalLoading, imageUploading]);

  // Product Search Debounce
  useEffect(() => {
    const query = productSearch.trim();
    if (!query) {
      return;
    }

    let ignore = false;

    const timer = setTimeout(async () => {
      setSearchingProducts(true);
      try {
        const res = await fetchApi<{ products: ProductOption[] }>(
          `/products?search=${encodeURIComponent(query)}&limit=8`
        );
        if (ignore) return;
        if (res.success && res.data?.products) {
          setProductResults(res.data.products);
        } else {
          setProductResults([]);
        }
      } catch {
        if (!ignore) setProductResults([]);
      } finally {
        if (!ignore) setSearchingProducts(false);
      }
    }, 300);

    return () => {
      ignore = true;
      clearTimeout(timer);
    };
  }, [productSearch]);

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingBanner(null);
    setModalError(null);
    setPreviewDevice('desktop');
    setPreviewCollapsed(false);
    setTitle('');
    setSubtitle('');
    setDesc('');
    setBadge('SẢN PHẨM MỚI RA MẮT');
    setTag('Chính Hãng');
    setImage('');
    setImageFit('contain');
    setRemoveWhiteBg(true);
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
    setSearchingProducts(false);
    setShowProductDropdown(false);
    setModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (banner: BannerItem) => {
    setEditingBanner(banner);
    setModalError(null);
    setPreviewDevice('desktop');
    setPreviewCollapsed(false);
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
    setMakePrimary(banners.length > 0 && banners[0]._id === banner._id);
    setIsActive(banner.isActive);
    setProductSearch('');
    setProductResults([]);
    setSearchingProducts(false);
    setShowProductDropdown(false);
    setModalOpen(true);
  };

  // When a product is selected from the quick pick
  const handleSelectProduct = (prod: ProductOption) => {
    setModalError(null);
    setSelectedProductInfo(prod);
    setProductId(prod._id);
    setTitle(prod.name);

    // Extract specs across all hardware categories
    if (prod.specs && typeof prod.specs === 'object') {
      const priorityKeys = [
        'refreshRate',
        'resolution',
        'panelType',
        'screen',
        'hdr',
        'switch',
        'layout',
        'sensor',
        'dpi',
        'pollingRate',
        'drivers',
        'anc',
        'battery',
        'mic',
        'responseTime',
        'connection',
        'weight',
        'features',
      ];
      const specList: string[] = [];
      for (const k of priorityKeys) {
        const val = prod.specs[k];
        if (val && typeof val === 'string' && !specList.includes(val.trim())) {
          specList.push(val.trim());
        }
      }
      if (specList.length < 3) {
        for (const val of Object.values(prod.specs)) {
          if (val && (typeof val === 'string' || typeof val === 'number')) {
            const str = String(val).trim();
            if (str && !specList.includes(str)) {
              specList.push(str);
            }
          }
        }
      }

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
    } else {
      setDesc('');
    }

    if (prod.images && prod.images.length > 0) {
      setImage(prod.images[0]);
    } else {
      setImage('');
    }
    setImageFit('contain');
    setRemoveWhiteBg(true);
    setTheme(suggestThemeForProduct(prod));

    setLink(`/products/${prod.slug}`);
    setCta('Xem Chi Tiết');
    setTag(prod.brand || 'Chính Hãng');

    if (prod.discountPrice && prod.discountPrice > 0 && prod.discountPrice < prod.price) {
      const discountPct = Math.round(((prod.price - prod.discountPrice) / prod.price) * 100);
      setBadge(discountPct >= 5 ? `ƯU ĐÃI GIẢM ${discountPct}% • CHÍNH HÃNG` : 'SIÊU PHẨM MỚI 2026');
    } else {
      setBadge('SIÊU PHẨM MỚI 2026');
    }

    const categoryLinks: Record<string, { cta: string; link: string }> = {
      monitor: { cta: 'Xem tất cả màn hình', link: '/products?category=monitor' },
      keyboard: { cta: 'Xem tất cả bàn phím', link: '/products?category=keyboard' },
      mouse: { cta: 'Xem tất cả chuột gaming', link: '/products?category=mouse' },
      headphone: { cta: 'Xem tất cả tai nghe', link: '/products?category=headphone' },
    };
    const catKey = (prod.category || '').toLowerCase();
    if (categoryLinks[catKey]) {
      setSecondaryCta(categoryLinks[catKey].cta);
      setSecondaryLink(categoryLinks[catKey].link);
    } else {
      setSecondaryCta('Xem tất cả sản phẩm');
      setSecondaryLink(prod.category ? `/products?category=${prod.category}` : '/products');
    }

    setShowProductDropdown(false);
    setSearchingProducts(false);
    setProductSearch('');
  };

  // Submit Form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    if (!title.trim()) {
      setModalError('Vui lòng nhập tiêu đề chính (Title) cho slide banner.');
      return;
    }

    const normalizedImg = normalizeImageSrc(image);
    if (!normalizedImg) {
      setModalError('Vui lòng chọn sản phẩm hoặc tải lên hình ảnh cho slide banner.');
      return;
    }
    if (!isValidImageSrc(normalizedImg)) {
      setModalError(
        'Đường dẫn hình ảnh không hợp lệ (chỉ chấp nhận http://, https:// hoặc đường dẫn nội bộ /uploads/...).'
      );
      return;
    }
    if (normalizedImg !== image) {
      setImage(normalizedImg);
    }

    const normalizedPrimaryLink = normalizeCtaLink(link);
    const normalizedSecondaryLink = normalizeCtaLink(secondaryLink);
    setLink(normalizedPrimaryLink);
    setSecondaryLink(normalizedSecondaryLink);

    setModalLoading(true);
    try {
      const payload = {
        title: title.trim(),
        subtitle: subtitle.trim(),
        desc: desc.trim(),
        badge: badge.trim(),
        tag: tag.trim(),
        image: normalizedImg,
        imageFit,
        removeWhiteBg,
        theme,
        cta: cta.trim() || 'Khám Phá Ngay',
        link: normalizedPrimaryLink,
        showSecondaryBtn,
        secondaryCta: secondaryCta.trim() || 'Xem tất cả sản phẩm',
        secondaryLink: normalizedSecondaryLink,
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
        setModalError(res.message || 'Lưu banner thất bại. Vui lòng kiểm tra lại dữ liệu.');
      }
    } catch {
      setModalError('Đã có lỗi kết nối xảy ra khi lưu banner.');
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

  // Quick Toggle Background Harmony (removeWhiteBg) directly from Banner List
  const handleQuickToggleBlend = async (banner: BannerItem) => {
    try {
      const nextVal = !banner.removeWhiteBg;
      const nextFit = nextVal ? 'contain' : banner.imageFit || 'contain';
      const res = await fetchApi(`/banners/${banner._id}`, {
        method: 'PUT',
        body: JSON.stringify({ removeWhiteBg: nextVal, imageFit: nextFit }),
      });
      if (res.success) {
        setFeedback({
          type: 'success',
          message: nextVal
            ? `Đã bật Hòa trộn nền Studio cho "${banner.title}"`
            : `Đã chuyển sang chế độ Khung viền mờ cho "${banner.title}"`,
        });
        await loadBanners();
      }
    } catch {
      setFeedback({ type: 'error', message: 'Lỗi khi cập nhật chế độ hòa nền' });
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
  const isPreviewCover = imageFit === 'cover';
  const showPreviewAmbientPhoto =
    Boolean(validPreviewImage) &&
    (isPreviewCover || (!removeWhiteBg && !previewHasLightBg && previewBlendMode === 'scenic'));

  const previewImageStyle = isPreviewCover
    ? undefined
    : previewBlendMode === 'cutout'
    ? undefined
    : previewBlendMode === 'softbox'
    ? getProductBlendStyles(true, 'softbox')
    : getScenicFeatherStyles();

  const displayedProducts = productSearch.trim() ? productResults : defaultProducts;
  const isEditingFirstBanner = Boolean(
    editingBanner && banners.length > 0 && banners[0]._id === editingBanner._id
  );

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b hairline-border">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-signal-cyan animate-pulse" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              STOREFRONT TELEMETRY // HERO CAROUSEL STUDIO
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Sliders className="w-6 h-6 text-signal-cyan" />
            <span>Quản Lý Banner & Slideshow Trang Chủ</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            Tùy biến slide quảng bá sản phẩm, tự động tách nền trắng hòa quyện vào background tối và xem trước thời gian thực
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
          <span className="text-[10px] font-mono uppercase font-bold text-slate-600 dark:text-slate-400">
            Tổng Số Slide
          </span>
          <p className="text-xl font-black text-slate-900 dark:text-white font-mono tabular-nums mt-1">
            {banners.length} <span className="text-xs font-normal text-slate-500">slides</span>
          </p>
        </div>

        <div className="p-4 rounded-xl bg-surface-card border hairline-border surface-bevel">
          <span className="text-[10px] font-mono uppercase font-bold text-slate-600 dark:text-slate-400">
            Đang Hoạt Động (Trang Chủ)
          </span>
          <p className="text-xl font-black text-emerald-600 dark:text-signal-emerald font-mono tabular-nums mt-1">
            {banners.filter((b) => b.isActive).length} <span className="text-xs font-normal text-slate-500">active</span>
          </p>
        </div>

        <div className="p-4 rounded-xl bg-surface-card border hairline-border surface-bevel">
          <span className="text-[10px] font-mono uppercase font-bold text-slate-600 dark:text-slate-400">
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
          <h2 className="text-sm font-bold uppercase tracking-wider font-mono tabular-nums text-slate-700 dark:text-slate-300">
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
                      className={`inline-flex items-center justify-center font-mono tabular-nums font-black text-xs px-2.5 py-1 rounded-lg border ${
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

                  {/* Harmonized Thumbnail */}
                  <BannerCardThumbnail banner={banner} />

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
                      <button
                        type="button"
                        onClick={() => handleQuickToggleBlend(banner)}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold border transition-colors ${
                          banner.removeWhiteBg
                            ? 'bg-cyan-500/15 text-cyan-600 dark:text-signal-cyan border-cyan-500/30 hover:bg-cyan-500/25'
                            : 'bg-surface-elevated text-slate-500 dark:text-slate-400 hairline-border hover:text-signal-cyan'
                        }`}
                        title="Bấm để bật/tắt chế độ Hòa trộn nền Studio thông minh"
                      >
                        <Sparkles className="w-2.5 h-2.5" />
                        <span>{banner.removeWhiteBg ? 'HÒA NỀN STUDIO: BẬT' : 'HÒA NỀN TỰ ĐỘNG'}</span>
                      </button>
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

                    <div className="flex items-center gap-3 pt-1 text-[11px] font-mono text-slate-500 flex-wrap">
                      <span className="truncate">
                        Liên kết: <span className="text-slate-800 dark:text-slate-200">{banner.link}</span>
                      </span>
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
       * 4. CREATE / EDIT MODAL WITH SYNCHRONIZED 21:9 & MOBILE LIVE PREVIEW
       * ========================================================================= */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="banner-modal-title"
        >
          <div className="relative w-full max-w-4xl bg-surface-card border hairline-border surface-bevel rounded-2xl shadow-2xl overflow-hidden max-h-[94vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b hairline-border bg-surface-elevated/40 flex-shrink-0">
              <div>
                <h2
                  id="banner-modal-title"
                  className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2"
                >
                  <Sliders className="w-5 h-5 text-signal-cyan" />
                  <span>{editingBanner ? 'Chỉnh Sửa Slide Banner' : 'Thêm Mới Slide Hero Slideshow'}</span>
                </h2>
                <p className="text-[11px] font-mono text-slate-600 dark:text-slate-400">
                  {editingBanner
                    ? 'Tối ưu hiển thị hòa trộn background và cập nhật thời gian thực'
                    : 'Giới thiệu sản phẩm mới với công nghệ tách nền & hòa trộn ánh sáng studio'}
                </p>
              </div>

              <button
                type="button"
                disabled={modalLoading || imageUploading}
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-surface-elevated transition-colors disabled:opacity-40"
                title="Đóng (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form with Pinned Live Preview & Pinned Footer */}
            <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
              {/* =================================================================
               * PINNED LIVE PREVIEW SECTION (DESKTOP 21:9 & MOBILE VIEWPORT)
               * ================================================================= */}
              <div className="px-4 sm:px-6 py-3 border-b hairline-border bg-surface-card/95 backdrop-blur-md flex-shrink-0 space-y-2.5 z-20">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-signal-cyan" />
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                      Live Preview Thời Gian Thực
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-surface-elevated text-slate-700 dark:text-slate-300 hairline-border">
                      {activeThemeConfig.label}
                    </span>
                    {previewIsProcessing && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono text-signal-cyan">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Đang đồng bộ nền...
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Device Switcher: Desktop 21:9 vs Mobile */}
                    <div className="inline-flex items-center p-0.5 rounded-lg bg-surface-elevated border hairline-border text-[11px] font-mono">
                      <button
                        type="button"
                        onClick={() => {
                          setPreviewDevice('desktop');
                          setPreviewCollapsed(false);
                        }}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
                          previewDevice === 'desktop' && !previewCollapsed
                            ? 'bg-surface-card text-slate-950 dark:text-white font-bold shadow-sm hairline-border'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        <Monitor className="w-3 h-3" />
                        <span>Desktop 21:9</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPreviewDevice('mobile');
                          setPreviewCollapsed(false);
                        }}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
                          previewDevice === 'mobile' && !previewCollapsed
                            ? 'bg-surface-card text-slate-950 dark:text-white font-bold shadow-sm hairline-border'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        <Smartphone className="w-3 h-3" />
                        <span>Mobile</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => setPreviewCollapsed((prev) => !prev)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-mono font-semibold bg-surface-elevated hover:bg-surface-subtle text-slate-700 dark:text-slate-300 border hairline-border transition-colors"
                      title={previewCollapsed ? 'Mở rộng khung xem trước' : 'Thu gọn khung xem trước để mở rộng vùng nhập liệu'}
                    >
                      {previewCollapsed ? (
                        <>
                          <ChevronDown className="w-3.5 h-3.5" />
                          <span>Mở Preview</span>
                        </>
                      ) : (
                        <>
                          <ChevronUp className="w-3.5 h-3.5" />
                          <span>Thu gọn</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {!previewCollapsed &&
                  (previewDevice === 'desktop' ? (
                    /* DESKTOP 21:9 PREVIEW */
                    <div className="relative w-full h-[200px] sm:h-[235px] md:h-[255px] rounded-2xl overflow-hidden border hairline-border surface-bevel shadow-2xl bg-[#070b14] group">
                      {/* 1. Ambient backdrop & Theme Aura (Always active even before image is chosen) */}
                      <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        {validPreviewImage && showPreviewAmbientPhoto && (
                          <Image
                            src={validPreviewImage}
                            alt={title || 'Preview'}
                            fill
                            className={`object-cover object-center transition-all duration-500 ${
                              isPreviewCover
                                ? 'scale-100 opacity-85'
                                : 'scale-125 blur-3xl opacity-25 saturate-150 brightness-75'
                            }`}
                            unoptimized
                          />
                        )}

                        {/* Full-slide harmonious theme aura */}
                        <div
                          className="absolute inset-0 opacity-70 transition-all duration-300"
                          style={{
                            background: `
                              radial-gradient(ellipse 65% 80% at 70% 50%, ${activeThemeConfig.accentColor}38 0%, ${activeThemeConfig.accentColor}14 45%, transparent 75%),
                              radial-gradient(ellipse 50% 60% at 15% 20%, ${activeThemeConfig.accentColor}28 0%, transparent 65%)
                            `,
                          }}
                        />
                      </div>

                      {/* 2. Smooth dark text-protection scrim */}
                      <div
                        className={`absolute inset-0 pointer-events-none z-[1] ${
                          isPreviewCover
                            ? 'bg-gradient-to-r from-[#070b14]/95 via-[#070b14]/75 via-[42%] to-[#070b14]/20'
                            : 'bg-gradient-to-r from-[#070b14] via-[#070b14]/88 via-[34%] to-transparent to-[65%]'
                        }`}
                      />

                      {/* 3. Theme accent gradient ABOVE scrim */}
                      <div
                        className={`absolute inset-y-0 left-0 w-full sm:w-[55%] bg-gradient-to-r ${activeThemeConfig.gradient} opacity-50 sm:opacity-60 pointer-events-none z-[2] mix-blend-screen transition-all duration-300`}
                      />

                      {/* Content Overlay */}
                      <div className="relative h-full max-w-5xl mx-auto px-5 sm:px-9 flex items-center justify-between z-10 text-white">
                        <div
                          className={`w-full h-full flex items-center ${
                            isPreviewCover ? 'justify-between' : 'justify-between'
                          } gap-4`}
                        >
                          {/* Left: Text */}
                          <div
                            className={`w-full ${
                              isPreviewCover ? 'max-w-md' : 'w-[42%] sm:w-[40%]'
                            } space-y-1 sm:space-y-1.5 py-2.5 z-10`}
                          >
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {badge && (
                                <span
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] sm:text-[10px] font-mono font-bold tracking-wider uppercase backdrop-blur-md border ${activeThemeConfig.badgeBg} ${activeThemeConfig.badgeText} ${activeThemeConfig.badgeBorder}`}
                                >
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

                            <h3 className="text-sm sm:text-lg md:text-xl font-black tracking-tight leading-tight drop-shadow-md line-clamp-2">
                              {title || 'Tiêu đề sản phẩm hoặc ưu đãi nổi bật'}
                            </h3>

                            {subtitle ? (
                              <p className="text-[10px] sm:text-xs font-semibold text-slate-200/95 font-mono line-clamp-1">
                                {subtitle}
                              </p>
                            ) : (
                              <p className="text-[10px] font-mono text-slate-400/80 italic line-clamp-1">
                                Phụ đề thông số kỹ thuật nổi bật sẽ hiển thị tại đây...
                              </p>
                            )}

                            {desc && (
                              <p className="text-[9px] sm:text-[10px] text-slate-300/90 line-clamp-2">
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

                          {/* Right: Harmonized Product Showcase or Non-overlapping Studio Placeholder */}
                          {!isPreviewCover ? (
                            <div className="w-[58%] sm:w-[60%] h-full flex items-center justify-center p-2 sm:p-4 relative isolate">
                              {/* Seamless Studio Lighting Stage */}
                              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                                <div
                                  className="w-[86%] h-[82%] rounded-full blur-2xl opacity-50 transition-all duration-300"
                                  style={{
                                    background: `radial-gradient(ellipse at 52% 48%, ${activeThemeConfig.accentColor}55 0%, ${activeThemeConfig.accentColor}20 48%, transparent 76%)`,
                                  }}
                                />
                                <div
                                  className="absolute w-[68%] h-[64%] rounded-full blur-xl"
                                  style={{
                                    background:
                                      previewBlendMode === 'cutout'
                                        ? 'radial-gradient(ellipse at 50% 48%, rgba(226, 232, 240, 0.22) 0%, rgba(148, 163, 184, 0.08) 50%, transparent 75%)'
                                        : 'radial-gradient(ellipse at 50% 48%, rgba(255, 255, 255, 0.14) 0%, transparent 70%)',
                                  }}
                                />
                                <div className="absolute bottom-3 sm:bottom-4 w-[58%] h-4 bg-black/80 rounded-[100%] blur-lg" />
                              </div>

                              {validPreviewImage ? (
                                <div className="relative w-full h-[88%] max-h-[205px] flex items-center justify-center">
                                  <Image
                                    src={previewDisplaySrc || validPreviewImage}
                                    alt={title || 'Preview Product'}
                                    fill
                                    className={`${
                                      previewBlendMode !== 'cutout'
                                        ? 'object-cover rounded-2xl'
                                        : 'object-contain'
                                    } object-center transition-all duration-300 ${
                                      previewBlendMode === 'cutout'
                                        ? 'drop-shadow-[0_20px_36px_rgba(0,0,0,0.85)]'
                                        : 'drop-shadow-[0_15px_28px_rgba(0,0,0,0.65)]'
                                    }`}
                                    style={previewImageStyle}
                                    unoptimized
                                  />
                                </div>
                              ) : (
                                <div className="relative z-10 w-full max-w-[290px] h-[145px] sm:h-[165px] rounded-2xl border border-dashed border-white/20 bg-white/[0.03] backdrop-blur-sm flex flex-col items-center justify-center text-center p-4">
                                  <Sliders className="w-6 h-6 text-cyan-400/70 mb-1.5" />
                                  <p className="text-[11px] font-mono font-bold text-slate-200">
                                    Vùng Hiển Thị Ảnh Sản Phẩm Studio
                                  </p>
                                  <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                                    Chọn nhanh sản phẩm từ kho hoặc tải ảnh bên dưới
                                  </p>
                                </div>
                              )}
                            </div>
                          ) : (
                            !validPreviewImage && (
                              <div className="hidden sm:flex items-center justify-center px-4 py-3 rounded-xl border border-dashed border-white/20 bg-black/40 backdrop-blur-sm text-right">
                                <span className="text-[11px] font-mono text-slate-300">
                                  Chế độ Cover 21:9 — Hãy tải ảnh nền tràn khung
                                </span>
                              </div>
                            )
                          )}
                        </div>
                      </div>

                      <span className="absolute bottom-2 right-2 text-[9px] font-mono uppercase px-2.5 py-0.5 rounded-md bg-black/75 text-cyan-300 backdrop-blur-sm border border-white/10 z-20">
                        {activeThemeConfig.label} •{' '}
                        {isPreviewCover
                          ? 'Cover 21:9'
                          : previewBlendMode === 'cutout'
                          ? '✨ Đã Tách Nền & Hòa Trộn Studio'
                          : '🎨 Làm Mềm Viền Tự Nhiên'}
                      </span>
                    </div>
                  ) : (
                    /* MOBILE VIEWPORT PREVIEW (MIRRORS HEROSLIDER MOBILE) */
                    <div className="relative w-full max-w-[380px] mx-auto h-[230px] rounded-2xl overflow-hidden border hairline-border surface-bevel shadow-2xl bg-[#070b14]">
                      {/* Base Atmospheric Layer */}
                      <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        {validPreviewImage && showPreviewAmbientPhoto && (
                          <Image
                            src={validPreviewImage}
                            alt={title || 'Mobile Preview'}
                            fill
                            className={`object-cover object-center ${
                              isPreviewCover
                                ? 'scale-100 opacity-85'
                                : 'scale-125 blur-2xl opacity-25 saturate-150 brightness-75'
                            }`}
                            unoptimized
                          />
                        )}
                        <div
                          className="absolute inset-0 opacity-70"
                          style={{
                            background: `radial-gradient(ellipse 75% 80% at 70% 35%, ${activeThemeConfig.accentColor}40 0%, transparent 75%)`,
                          }}
                        />
                      </div>

                      {/* Mobile Bottom-to-Top Scrim */}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#070b14] via-[#070b14]/92 via-[54%] to-transparent to-[86%] pointer-events-none z-[1]" />
                      <div
                        className={`absolute inset-y-0 left-0 w-full bg-gradient-to-r ${activeThemeConfig.gradient} opacity-45 pointer-events-none z-[2] mix-blend-screen`}
                      />

                      {/* Upper-Right Mobile Product Showcase */}
                      {!isPreviewCover ? (
                        <div className="absolute right-3 top-2.5 w-[42%] h-[96px] pointer-events-none flex items-center justify-center z-[5] isolate">
                          <div
                            className="absolute inset-0 rounded-full blur-xl opacity-50"
                            style={{
                              background: `radial-gradient(circle, ${activeThemeConfig.accentColor}60 0%, transparent 72%)`,
                            }}
                          />
                          {validPreviewImage ? (
                            <div className="relative w-full h-full">
                              <Image
                                src={previewDisplaySrc || validPreviewImage}
                                alt={title || 'Mobile Product'}
                                fill
                                className="object-contain object-center drop-shadow-[0_10px_20px_rgba(0,0,0,0.85)]"
                                style={previewImageStyle}
                                unoptimized
                              />
                            </div>
                          ) : (
                            <div className="w-full h-full rounded-xl border border-dashed border-white/20 bg-white/[0.04] flex flex-col items-center justify-center p-2 text-center">
                              <Sliders className="w-4 h-4 text-cyan-400/70 mb-0.5" />
                              <span className="text-[8px] font-mono text-slate-300">Ảnh SP Mobile</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        !validPreviewImage && (
                          <div className="absolute right-3 top-2.5 px-2.5 py-1.5 rounded-lg border border-dashed border-white/20 bg-black/50 backdrop-blur-sm z-[5]">
                            <span className="text-[8px] font-mono text-slate-300">
                              Cover Mobile — Chưa chọn ảnh
                            </span>
                          </div>
                        )
                      )}

                      {/* Bottom Typography & Action Buttons */}
                      <div className="relative h-full px-4 pt-12 pb-3 flex flex-col justify-end z-10 text-white space-y-1">
                        <div className="flex items-center gap-1 flex-wrap max-w-[60%]">
                          {badge && (
                            <span
                              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-mono font-bold uppercase border ${activeThemeConfig.badgeBg} ${activeThemeConfig.badgeText} ${activeThemeConfig.badgeBorder}`}
                            >
                              <Zap className="w-2.5 h-2.5 fill-current" />
                              <span className="truncate max-w-[115px]">{badge}</span>
                            </span>
                          )}
                          {tag && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-mono font-semibold bg-white/10 text-slate-200 border hairline-border">
                              <Award className="w-2.5 h-2.5" />
                              <span className="truncate max-w-[75px]">{tag}</span>
                            </span>
                          )}
                        </div>
                        <h3 className="text-sm font-black tracking-tight leading-snug line-clamp-1">
                          {title || 'Tiêu đề sản phẩm trên Mobile'}
                        </h3>
                        {subtitle && (
                          <p className="text-[10px] font-mono text-slate-200/95 line-clamp-1">{subtitle}</p>
                        )}
                        {desc && (
                          <p className="text-[9px] text-slate-300/90 line-clamp-1">{desc}</p>
                        )}
                        <div className="pt-1 flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg font-bold text-[10px] bg-white text-slate-950 shadow">
                            <span>{cta || 'Khám Phá Ngay'}</span>
                            <ArrowRight className="w-2.5 h-2.5" />
                          </span>
                          {showSecondaryBtn && (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg font-semibold text-[10px] bg-white/10 text-white border hairline-border truncate max-w-[130px]">
                              {secondaryCta || 'Xem tất cả'}
                            </span>
                          )}
                        </div>
                      </div>

                      <span className="absolute top-2 left-3 text-[8px] font-mono uppercase px-2 py-0.5 rounded bg-black/70 text-cyan-300 border border-white/10 z-20">
                        Mobile Viewport (380px)
                      </span>
                    </div>
                  ))}
              </div>

              {/* Scrollable Form Fields Container */}
              <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
                {/* =================================================================
                 * 1. QUICK PRODUCT PICKER FROM INVENTORY
                 * ================================================================= */}
                <div className="p-4 rounded-xl bg-surface-elevated/50 hairline-border surface-bevel space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <label className="block text-xs font-mono font-bold uppercase text-slate-800 dark:text-slate-200">
                      Chọn nhanh sản phẩm từ kho (Tự động trích xuất thông số, ảnh, màu theme & ưu đãi)
                    </label>
                    {selectedProductInfo && (
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => handleSelectProduct(selectedProductInfo)}
                          className="text-[11px] font-mono text-cyan-600 dark:text-signal-cyan hover:underline"
                          title="Đồng bộ lại tiêu đề, thông số, ảnh và ưu đãi từ sản phẩm này"
                        >
                          Đồng bộ lại thông số SP
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedProductInfo(null);
                            setProductId(null);
                          }}
                          className="text-[11px] font-mono text-rose-600 dark:text-signal-rose hover:underline"
                        >
                          Hủy liên kết SP
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="relative">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Bấm vào đây để chọn sản phẩm gợi ý hoặc gõ tên sản phẩm cần tìm..."
                        value={productSearch}
                        onChange={(e) => {
                          const val = e.target.value;
                          setProductSearch(val);
                          if (!val.trim()) {
                            setProductResults([]);
                            setSearchingProducts(false);
                          } else {
                            setSearchingProducts(true);
                          }
                          setShowProductDropdown(true);
                        }}
                        onFocus={() => setShowProductDropdown(true)}
                        onBlur={() => {
                          setTimeout(() => {
                            setShowProductDropdown(false);
                          }, 200);
                        }}
                        className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-surface-card border hairline-border text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus:border-signal-cyan font-mono"
                      />
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      {searchingProducts && (
                        <Loader2 className="w-4 h-4 text-signal-cyan animate-spin absolute right-3 top-1/2 -translate-y-1/2" />
                      )}
                    </div>

                    {/* Dropdown Suggestions (prevent blur when dragging scrollbar via onMouseDown) */}
                    {showProductDropdown && (
                      <div
                        onMouseDown={(e) => e.preventDefault()}
                        className="absolute top-full left-0 right-0 mt-1 z-30 bg-surface-card border hairline-border rounded-xl shadow-2xl max-h-60 overflow-y-auto p-1.5 space-y-1"
                      >
                        <div className="px-2 py-1 flex items-center justify-between text-[10px] font-mono text-slate-500 border-b hairline-border">
                          <span>
                            {productSearch.trim()
                              ? `Kết quả tìm kiếm cho "${productSearch.trim()}"`
                              : 'Sản phẩm nổi bật trong kho (Chọn 1 chạm)'}
                          </span>
                          <span className="tabular-nums">{displayedProducts.length} SP</span>
                        </div>

                        {searchingProducts && displayedProducts.length === 0 ? (
                          <div className="py-6 flex items-center justify-center gap-2 text-xs font-mono text-slate-500">
                            <Loader2 className="w-4 h-4 animate-spin text-signal-cyan" />
                            <span>Đang tìm kiếm sản phẩm...</span>
                          </div>
                        ) : displayedProducts.length === 0 ? (
                          <div className="py-6 text-center text-xs font-mono text-slate-500">
                            Không tìm thấy sản phẩm phù hợp với từ khóa.
                          </div>
                        ) : (
                          displayedProducts.map((prod) => {
                            const hasDiscount =
                              prod.discountPrice && prod.discountPrice > 0 && prod.discountPrice < prod.price;
                            const finalPrice = hasDiscount ? prod.discountPrice! : prod.price;

                            return (
                              <button
                                key={prod._id}
                                type="button"
                                onClick={() => handleSelectProduct(prod)}
                                className="w-full text-left p-2 rounded-lg hover:bg-surface-elevated flex items-center gap-3 transition-colors group cursor-pointer"
                              >
                                <div className="relative w-10 h-10 rounded-lg overflow-hidden hairline-border bg-surface-subtle flex-shrink-0 flex items-center justify-center">
                                  {prod.images?.[0] ? (
                                    <Image
                                      src={prod.images[0]}
                                      alt={prod.name}
                                      fill
                                      className="object-cover"
                                      unoptimized
                                    />
                                  ) : (
                                    <Package className="w-4 h-4 m-auto text-slate-400" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-signal-cyan">
                                    {prod.name}
                                  </p>
                                  <p className="text-[10px] font-mono tabular-nums text-slate-600 dark:text-slate-400 truncate">
                                    {prod.brand} • {prod.category} •{' '}
                                    <span className="font-bold text-emerald-600 dark:text-signal-emerald">
                                      {finalPrice.toLocaleString('vi-VN')}₫
                                    </span>
                                    {hasDiscount && (
                                      <span className="ml-1.5 line-through opacity-60">
                                        {prod.price.toLocaleString('vi-VN')}₫
                                      </span>
                                    )}
                                  </p>
                                </div>
                              </button>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>

                  {selectedProductInfo && (
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-signal-emerald text-xs font-mono">
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">
                        Đã đồng bộ tự động thông số, ảnh, màu theme & đường dẫn từ:{' '}
                        <strong>{selectedProductInfo.name}</strong>
                      </span>
                    </div>
                  )}
                </div>

                {/* =================================================================
                 * 2. THEME GRADIENT SELECTION (7 PRESETS)
                 * ================================================================= */}
                <div className="space-y-2">
                  <label className="block text-xs font-mono font-bold uppercase text-slate-800 dark:text-slate-200">
                    Màu Sắc & Ánh Sáng Nền Studio (7 Preset chuẩn ROG & Cyber)
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
                    label="Hình Ảnh Sản Phẩm / Banner (Slide Image)"
                    required
                    value={image}
                    onChange={(url) => {
                      setModalError(null);
                      setImage(url);
                    }}
                    onUploadingChange={(uploading) => setImageUploading(uploading)}
                    helperText="Hỗ trợ ảnh sản phẩm nền trắng/đơn sắc (tự động tách nền), dán ảnh Ctrl+V hoặc ảnh banner 21:9"
                  />

                  {selectedProductInfo?.images && selectedProductInfo.images.length > 0 && (
                    <div className="pt-1">
                      <p className="text-[10px] font-mono text-slate-600 dark:text-slate-400 mb-1">
                        Hoặc chọn nhanh từ bộ sưu tập ảnh của sản phẩm ({selectedProductInfo.images.length} ảnh):
                      </p>
                      <div className="flex items-center gap-2 overflow-x-auto pb-1">
                        {selectedProductInfo.images.map((imgUrl, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => {
                              setModalError(null);
                              setImage(imgUrl);
                            }}
                            className={`relative w-12 h-12 rounded-lg overflow-hidden border flex-shrink-0 transition-all ${
                              image === imgUrl
                                ? 'border-signal-cyan ring-2 ring-signal-cyan/30'
                                : 'border-slate-300 dark:border-white/10 opacity-70 hover:opacity-100'
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
                 * 3.1 UNIFIED BACKGROUND HARMONY & DISPLAY MODE (3 PRESET CARDS)
                 * ================================================================= */}
                <div className="space-y-2.5 p-4 rounded-xl bg-surface-elevated/40 hairline-border surface-bevel">
                  <div className="flex items-center justify-between flex-wrap gap-1">
                    <label className="block text-xs font-mono font-bold uppercase text-slate-800 dark:text-slate-200">
                      Chế Độ Tương Thích & Hòa Trộn Background (Background Harmony)
                    </label>
                    <span className="text-[10px] font-mono text-cyan-600 dark:text-signal-cyan font-semibold">
                      Khắc phục triệt để khung ảnh chữ nhật tách biệt với nền tối
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-1">
                    {/* Option 1: Studio Smart Cutout & Glow */}
                    <button
                      type="button"
                      onClick={() => {
                        setImageFit('contain');
                        setRemoveWhiteBg(true);
                      }}
                      className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between gap-2 cursor-pointer ${
                        imageFit === 'contain' && removeWhiteBg
                          ? 'border-signal-cyan bg-signal-cyan/10 ring-2 ring-signal-cyan/30 shadow-sm'
                          : 'border-slate-300 dark:border-white/10 hover:border-slate-400 dark:hover:border-white/20 bg-surface-subtle/20'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-signal-cyan flex-shrink-0" />
                            <span>Tách Nền & Hòa Trộn Studio</span>
                          </span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded font-mono bg-signal-cyan/20 text-cyan-700 dark:text-cyan-300 font-semibold">
                            Tối ưu nhất
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                          Tự động khử khung nền trắng/đơn sắc quanh sản phẩm, tạo quầng sáng studio đồng bộ màu theme và đổ bóng 3D sắc nét.
                        </p>
                      </div>
                    </button>

                    {/* Option 2: Soft Vignette Showcase */}
                    <button
                      type="button"
                      onClick={() => {
                        setImageFit('contain');
                        setRemoveWhiteBg(false);
                      }}
                      className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between gap-2 cursor-pointer ${
                        imageFit === 'contain' && !removeWhiteBg
                          ? 'border-signal-cyan bg-signal-cyan/10 ring-2 ring-signal-cyan/30 shadow-sm'
                          : 'border-slate-300 dark:border-white/10 hover:border-slate-400 dark:hover:border-white/20 bg-surface-subtle/20'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                            <span>Khung Nổi Làm Mềm Viền</span>
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                          Hiển thị ở 2/3 bên phải kèm hiệu ứng feather làm mờ dịu 4 cạnh ảnh, giúp ảnh chụp góc máy hòa vào nền tối tự nhiên.
                        </p>
                      </div>
                    </button>

                    {/* Option 3: Full-bleed Cover */}
                    <button
                      type="button"
                      onClick={() => {
                        setImageFit('cover');
                        setRemoveWhiteBg(false);
                      }}
                      className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between gap-2 cursor-pointer ${
                        imageFit === 'cover'
                          ? 'border-signal-cyan bg-signal-cyan/10 ring-2 ring-signal-cyan/30 shadow-sm'
                          : 'border-slate-300 dark:border-white/10 hover:border-slate-400 dark:hover:border-white/20 bg-surface-subtle/20'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <Maximize2 className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                            <span>Tràn Viền Toàn Khung (Cover)</span>
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                          Phủ kín 100% khung hình 21:9 kèm lớp phủ gradient bảo vệ chữ. Phù hợp cho ảnh nghệ thuật hoặc banner thiết kế sẵn.
                        </p>
                      </div>
                    </button>
                  </div>

                  {/* Diagnostic Status Bar (Replaces redundant toggle switch) */}
                  <div className="pt-2.5 mt-2 border-t hairline-border flex items-center justify-between flex-wrap gap-2 text-[11px] font-mono">
                    <span className="text-slate-600 dark:text-slate-400">
                      Chẩn đoán xử lý quang học hiện tại:
                    </span>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-signal-emerald border border-emerald-500/20 font-semibold">
                      {!validPreviewImage
                        ? 'Đang chờ chọn ảnh sản phẩm...'
                        : imageFit === 'cover'
                        ? 'Phủ tràn khung 21:9 (Full-bleed Cover)'
                        : previewBlendMode === 'cutout'
                        ? '✨ Đã tách nền Studio trong suốt (Alpha Cutout)'
                        : previewBlendMode === 'softbox'
                        ? '🪄 Làm mềm viền elip chống chói nền sáng (Softbox Mask)'
                        : '🎨 Hòa trộn viền cảnh tự nhiên (Scenic Vignette)'}
                    </span>
                  </div>
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
                      onChange={(e) => {
                        setModalError(null);
                        setTitle(e.target.value);
                      }}
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
                 * 5. CALL TO ACTION (CTA) BUTTONS WITH AUTO-NORMALIZATION & CHIPS
                 * ================================================================= */}
                <div className="p-4 rounded-xl bg-surface-elevated/40 hairline-border surface-bevel space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-1">
                    <h4 className="text-xs font-mono font-bold uppercase text-slate-800 dark:text-slate-200">
                      Cấu Hình Nút Bấm Call To Action (CTA)
                    </h4>
                    <span className="text-[10px] font-mono text-slate-500">
                      Tự động chuẩn hóa dấu &quot;/&quot; cho đường dẫn nội bộ
                    </span>
                  </div>

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
                        onBlur={() => setLink(normalizeCtaLink(link))}
                        placeholder="/products/ten-san-pham"
                        className="w-full px-3 py-1.5 text-xs rounded-lg bg-surface-card border hairline-border text-slate-900 dark:text-white font-mono"
                      />
                      <div className="flex items-center gap-1 flex-wrap pt-1">
                        {QUICK_LINK_PRESETS.map((preset) => (
                          <button
                            key={preset.path}
                            type="button"
                            onClick={() => setLink(preset.path)}
                            className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors border ${
                              link === preset.path
                                ? 'bg-signal-cyan/15 text-cyan-700 dark:text-signal-cyan border-signal-cyan/40 font-bold'
                                : 'bg-surface-card text-slate-600 dark:text-slate-400 hairline-border hover:text-slate-900 dark:hover:text-white'
                            }`}
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t hairline-border space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-1">
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
                            onBlur={() => setSecondaryLink(normalizeCtaLink(secondaryLink))}
                            placeholder="/products"
                            className="w-full px-3 py-1.5 text-xs rounded-lg bg-surface-card border hairline-border text-slate-900 dark:text-white font-mono"
                          />
                          <div className="flex items-center gap-1 flex-wrap pt-1">
                            {QUICK_LINK_PRESETS.map((preset) => (
                              <button
                                key={preset.path}
                                type="button"
                                onClick={() => setSecondaryLink(preset.path)}
                                className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors border ${
                                  secondaryLink === preset.path
                                    ? 'bg-signal-cyan/15 text-cyan-700 dark:text-signal-cyan border-signal-cyan/40 font-bold'
                                    : 'bg-surface-card text-slate-600 dark:text-slate-400 hairline-border hover:text-slate-900 dark:hover:text-white'
                                }`}
                              >
                                {preset.label}
                              </button>
                            ))}
                          </div>
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
                      disabled={isEditingFirstBanner}
                      onChange={(e) => setMakePrimary(e.target.checked)}
                      className="rounded border-slate-300 text-amber-500 focus:ring-amber-500 disabled:opacity-60"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        <span>
                          {isEditingFirstBanner
                            ? 'Đang là Slide đầu tiên (#1 Primary Hero)'
                            : 'Đưa lên làm Slide đầu tiên (#1 Primary Hero)'}
                        </span>
                      </span>
                      <span className="text-[10px] font-mono text-slate-500 block">
                        {isEditingFirstBanner
                          ? 'Slide này hiện đang đứng ở vị trí số 1 trên trang chủ'
                          : 'Sản phẩm mới ra mắt sẽ đứng ngay vị trí đầu tiên của Slideshow'}
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
              </div>

              {/* Pinned Modal Footer with Inline Error Feedback & Action Buttons */}
              <div className="px-4 sm:px-6 py-3.5 border-t hairline-border bg-surface-elevated/50 flex-shrink-0 space-y-2.5">
                {modalError && (
                  <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-700 dark:text-signal-rose text-xs font-semibold">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>{modalError}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setModalError(null)}
                      className="p-0.5 hover:opacity-75"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                <div className="flex items-center justify-between gap-3">
                  <span className="text-[11px] font-mono text-slate-500 hidden sm:inline">
                    Mẹo: Bấm phím <kbd className="px-1.5 py-0.5 rounded bg-surface-card border hairline-border text-[10px]">Esc</kbd> để đóng nhanh
                  </span>

                  <div className="flex items-center justify-end gap-3 ml-auto">
                    <button
                      type="button"
                      disabled={modalLoading || imageUploading}
                      onClick={() => setModalOpen(false)}
                      className="px-4 py-2 rounded-xl text-xs font-mono font-semibold bg-surface-elevated hover:bg-surface-subtle text-slate-700 dark:text-slate-300 hairline-border transition-colors disabled:opacity-40"
                    >
                      Hủy bỏ
                    </button>

                    <button
                      type="submit"
                      disabled={modalLoading || imageUploading}
                      className="inline-flex items-center gap-2 px-6 py-2 rounded-xl text-xs font-mono font-bold bg-slate-900 dark:bg-white text-white dark:text-slate-950 hover:opacity-90 transition-all disabled:opacity-50 shadow-md"
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
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
