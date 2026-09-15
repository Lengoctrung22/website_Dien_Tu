'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  ShoppingCart,
  Zap,
  Check,
  ShieldCheck,
  Truck,
  RotateCcw,
  Minus,
  Plus,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import ProductCard from '@/components/ProductCard';
import { fetchApi } from '@/lib/api';
import { formatVND } from '@/lib/utils';
import { useCartStore } from '@/store/cartStore';

const SPEC_LABEL_MAP: Record<string, string> = {
  refreshRate: 'Tần số quét',
  resolution: 'Độ phân giải',
  panelType: 'Loại tấm nền',
  responseTime: 'Thời gian phản hồi',
  connection: 'Chuẩn kết nối',
  hdr: 'Công nghệ HDR',
  sync: 'Đồng bộ hình ảnh',
  switch: 'Loại Switch',
  layout: 'Layout phím',
  keycaps: 'Chất liệu Keycap',
  sensor: 'Cảm biến (Sensor)',
  dpi: 'Độ nhạy (DPI)',
  weight: 'Trọng lượng',
  batteryLife: 'Thời lượng pin',
  pollingRate: 'Tần số lấy mẫu',
  driver: 'Màng loa (Driver)',
  frequency: 'Dải tần số',
  impedance: 'Trở kháng',
  microphone: 'Microphone',
  anc: 'Chống ồn (ANC)',
  caseMaterial: 'Chất liệu vỏ',
};

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;

  const [product, setProduct] = useState<any>(null);
  const [related, setRelated] = useState<any[]>([]);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const addItem = useCartStore((state) => state.addItem);

  useEffect(() => {
    async function loadProduct() {
      if (!slug) return;
      setLoading(true);
      const res = await fetchApi(`/products/${slug}`);
      if (res.success && res.data) {
        setProduct(res.data.product);
        setRelated(res.data.related || []);
        if (res.data.product.images?.length > 0) {
          setSelectedImage(res.data.product.images[0]);
        }
      }
      setLoading(false);
    }
    loadProduct();
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center animate-pulse space-y-4">
        <div className="h-8 bg-surface-elevated rounded w-1/3 mx-auto" />
        <div className="h-96 bg-surface-elevated rounded-2xl max-w-4xl mx-auto" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-2xl font-black text-slate-900 dark:text-white">Không tìm thấy sản phẩm</h2>
        <p className="text-xs font-mono text-slate-600 dark:text-slate-400 font-medium">Sản phẩm này có thể đã ngừng kinh doanh hoặc đường dẫn không đúng.</p>
        <Link href="/products" className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white dark:bg-signal-cyan dark:hover:bg-cyan-400 dark:text-slate-950 rounded-xl font-mono font-bold text-xs surface-bevel transition-all">
          <span>Quay lại cửa hàng</span>
        </Link>
      </div>
    );
  }

  const finalPrice = product.discountPrice && product.discountPrice > 0 ? product.discountPrice : product.price;
  const hasDiscount = product.discountPrice && product.discountPrice > 0 && product.discountPrice < product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
    : 0;

  const handleAddToCart = () => {
    const res = addItem(product, quantity);
    if (res.success) {
      setAdded(true);
      setErrorMessage(null);
      setTimeout(() => setAdded(false), 2000);
    } else {
      setErrorMessage(res.message || 'Không thể thêm vào giỏ');
      setTimeout(() => setErrorMessage(null), 3000);
    }
  };

  const handleBuyNow = () => {
    const res = addItem(product, quantity);
    if (res.success) {
      router.push('/checkout');
    } else {
      setErrorMessage(res.message || 'Không thể tiến hành mua ngay');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs font-mono text-slate-600 dark:text-slate-400 flex-wrap font-medium">
        <Link href="/" className="hover:text-slate-950 dark:hover:text-black transition-colors">Trang chủ</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href={`/products?category=${product.category}`} className="hover:text-slate-950 dark:hover:text-black capitalize transition-colors">
          {product.category}
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-900 dark:text-slate-200 font-bold truncate max-w-xs sm:max-w-md">
          {product.name}
        </span>
      </div>

      {/* Main Showcase Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* Left: Gallery (6 cols) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="relative w-full pt-[85%] rounded-2xl overflow-hidden border hairline-border surface-bevel bg-surface-card shadow-xl">
            <Image
              src={selectedImage || product.images?.[0] || 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=800&q=80'}
              alt={product.name}
              fill
              priority
              className="object-cover object-center"
              unoptimized
            />
            {product.isHot && (
              <span className="absolute top-4 left-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-mono font-bold tracking-wider uppercase bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/40 backdrop-blur-md shadow-md">
                <Zap className="w-3.5 h-3.5 fill-current" />
                HOT GEAR // BENCHMARK CERTIFIED
              </span>
            )}
          </div>

          {/* Thumbnails with hairline borders */}
          {product.images?.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {product.images.map((img: string, index: number) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(img)}
                  className={`relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 border hairline-border surface-bevel transition-all ${
                    selectedImage === img
                      ? 'ring-2 ring-slate-900 dark:ring-signal-cyan scale-95 shadow-md'
                      : 'opacity-70 hover:opacity-100 hover:border-slate-400 dark:hover:border-signal-cyan/40'
                  }`}
                >
                  <Image src={img} alt={`Thumb ${index}`} fill className="object-cover" unoptimized />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Info & Purchase Action (6 cols) */}
        <div className="lg:col-span-6 space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-md text-xs font-mono font-bold uppercase tracking-wider bg-slate-100 dark:bg-surface-card text-slate-950 dark:text-white border border-slate-300 dark:border-white/10">
                {product.brand}
              </span>
              <span className="text-xs font-mono text-slate-600 dark:text-slate-400 uppercase tracking-wider font-medium">
                Mã: {product.slug}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white leading-tight">
              {product.name}
            </h1>

            {/* Price Box */}
            <div className="p-4 rounded-xl bg-surface-card border hairline-border surface-bevel flex items-center gap-4">
              <div>
                <div className="text-2xl sm:text-3xl font-mono tabular-nums font-black text-slate-950 dark:text-white">
                  {formatVND(finalPrice)}
                </div>
                {hasDiscount && (
                  <div className="flex items-center gap-2 text-xs font-mono text-slate-500 dark:text-slate-400 line-through font-semibold">
                    <span className="tabular-nums">{formatVND(product.price)}</span>
                    <span className="text-rose-700 dark:text-signal-rose font-bold no-underline tabular-nums">(-{discountPercent}%)</span>
                  </div>
                )}
              </div>
              <div className="ml-auto text-right text-xs font-mono">
                <span className="text-emerald-700 dark:text-signal-emerald font-bold block">✓ Đã gồm VAT</span>
                <span className="text-slate-600 dark:text-slate-400 font-medium">Freeship đơn &gt; 1tr</span>
              </div>
            </div>

            {/* Stock status telemetry chip */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-800 dark:text-slate-300">
                Tình trạng kho:
              </span>
              {product.stock <= 0 ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-mono bg-rose-500/10 text-rose-700 dark:text-signal-rose border border-rose-500/25 font-bold">
                  <span className="w-2 h-2 rounded-full bg-rose-600 dark:bg-signal-rose inline-block" />
                  TẠM HẾT HÀNG // OUT OF STOCK
                </span>
              ) : product.stock < 5 ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-mono tabular-nums bg-amber-500/10 text-amber-800 dark:text-signal-amber border border-amber-500/25 font-bold">
                  <span className="w-2 h-2 rounded-full bg-amber-600 dark:bg-signal-amber animate-pulse inline-block" />
                  CRITICAL TELEMETRY: CÒN {product.stock} CHIẾC
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-mono tabular-nums bg-emerald-500/10 text-emerald-700 dark:text-signal-emerald border border-emerald-500/25 font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 dark:bg-signal-emerald inline-block" />
                  SẴN HÀNG TRONG KHO ({product.stock} SẢN PHẨM)
                </span>
              )}
            </div>

            {/* Quantity Selector */}
            {product.stock > 0 && (
              <div className="flex items-center gap-4 pt-2">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-800 dark:text-slate-300">Số lượng:</span>
                <div className="flex items-center rounded-lg border hairline-border surface-bevel bg-surface-elevated overflow-hidden font-mono tabular-nums">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-12 text-center text-sm font-bold text-slate-900 dark:text-white">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    disabled={quantity >= product.stock}
                    className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-xs font-mono text-rose-700 dark:text-signal-rose flex items-center gap-2 font-bold">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* High-Contrast CTA Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                onClick={handleAddToCart}
                disabled={product.stock <= 0}
                className={`py-3.5 px-6 rounded-xl font-bold text-sm flex items-center justify-center gap-2 border hairline-border surface-bevel transition-all active:translate-y-0.5 ${
                  product.stock <= 0
                    ? 'opacity-40 cursor-not-allowed border-slate-700 bg-surface-card'
                    : added
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-surface-elevated hover:bg-surface-subtle text-slate-900 dark:text-white hover:border-slate-400 dark:hover:border-signal-cyan/40 shadow-sm'
                }`}
              >
                {added ? <Check className="w-4 h-4" /> : <ShoppingCart className="w-4 h-4" />}
                <span>{added ? 'Đã thêm vào giỏ!' : 'Thêm Vào Giỏ'}</span>
              </button>

              <button
                onClick={handleBuyNow}
                disabled={product.stock <= 0}
                className="py-3.5 px-6 rounded-xl font-black text-sm flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white dark:bg-signal-cyan dark:text-slate-950 dark:hover:bg-cyan-400 shadow-md active:translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <Zap className="w-4 h-4 fill-current" />
                <span>Mua Ngay</span>
              </button>
            </div>
          </div>

          {/* Guarantee Badges */}
          <div className="grid grid-cols-3 gap-3 p-4 rounded-xl bg-surface-card border hairline-border surface-bevel text-center text-xs text-slate-700 dark:text-slate-400 font-mono font-semibold">
            <div className="flex flex-col items-center gap-1">
              <ShieldCheck className="w-5 h-5 text-slate-900 dark:text-black" />
              <span>Bảo hành 24 tháng</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Truck className="w-5 h-5 text-slate-900 dark:text-black" />
              <span>Giao hỏa tốc 2h</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <RotateCcw className="w-5 h-5 text-slate-900 dark:text-black" />
              <span>Đổi mới 7 ngày</span>
            </div>
          </div>
        </div>
      </div>

      {/* Description & Technical Specs Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-6 border-t hairline-border">
        {/* Left: Detailed Description (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-600 dark:bg-signal-cyan inline-block" />
            <h2 className="text-lg font-mono font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Mô Tả Chi Tiết // Technical Overview
            </h2>
          </div>
          <div className="prose dark:prose-invert max-w-none text-sm text-slate-700 dark:text-slate-300 leading-relaxed space-y-3 font-normal">
            <p>{product.description}</p>
            <p>
              Tất cả các dòng thiết bị phân phối tại TECHGEAR đều là sản phẩm chính hãng 100%, được kiểm tra nghiêm ngặt (QC) trước khi xuất kho giao tới tay khách hàng.
            </p>
          </div>
        </div>

        {/* Right: Specs Table (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-600 dark:bg-signal-cyan inline-block" />
            <h2 className="text-lg font-mono font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Thông Số Kỹ Thuật // Spec Sheet
            </h2>
          </div>
          <div className="rounded-xl border hairline-border surface-bevel overflow-hidden divide-y hairline-border bg-surface-card shadow-sm">
            <div className="flex py-3 px-4 text-xs font-mono bg-surface-subtle/30">
              <span className="w-2/5 text-slate-700 dark:text-slate-400 uppercase tracking-wider text-[11px] font-bold">Thương hiệu</span>
              <span className="w-3/5 text-slate-900 dark:text-slate-100 font-bold">{product.brand}</span>
            </div>
            <div className="flex py-3 px-4 text-xs font-mono">
              <span className="w-2/5 text-slate-700 dark:text-slate-400 uppercase tracking-wider text-[11px] font-bold">Danh mục</span>
              <span className="w-3/5 text-slate-900 dark:text-slate-100 capitalize font-medium">{product.category}</span>
            </div>

            {product.specs &&
              Object.entries(product.specs).map(([key, val]) => (
                <div key={key} className="flex py-3 px-4 text-xs font-mono">
                  <span className="w-2/5 text-slate-700 dark:text-slate-400 uppercase tracking-wider text-[11px] font-bold">
                    {SPEC_LABEL_MAP[key] || key.replace(/([A-Z])/g, ' $1')}
                  </span>
                  <span className="w-3/5 text-slate-900 dark:text-slate-100 tabular-nums font-semibold">
                    {String(val)}
                  </span>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Related Products */}
      {related.length > 0 && (
        <div className="space-y-6 pt-8 border-t hairline-border">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-600 dark:bg-signal-cyan inline-block" />
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                RECOMMENDED TELEMETRY
              </span>
            </div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">Sản Phẩm Tương Tự</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {related.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
