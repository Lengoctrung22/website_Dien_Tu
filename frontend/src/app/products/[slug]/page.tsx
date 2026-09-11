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
  Flame,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import ProductCard from '@/components/ProductCard';
import { fetchApi } from '@/lib/api';
import { formatVND } from '@/lib/utils';
import { useCartStore } from '@/store/cartStore';

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
        <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-1/3 mx-auto" />
        <div className="h-96 bg-slate-200 dark:bg-slate-800 rounded-3xl max-w-4xl mx-auto" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-2xl font-bold">Không tìm thấy sản phẩm</h2>
        <p className="text-sm text-slate-500">Sản phẩm này có thể đã ngừng kinh doanh hoặc đường dẫn không đúng.</p>
        <Link href="/products" className="inline-block px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm">
          Quay lại cửa hàng
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
      <div className="flex items-center gap-1.5 text-xs text-slate-500 flex-wrap">
        <Link href="/" className="hover:text-indigo-600">Trang chủ</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href={`/products?category=${product.category}`} className="hover:text-indigo-600 capitalize">
          {product.category}
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-800 dark:text-slate-200 font-bold truncate max-w-xs sm:max-w-md">
          {product.name}
        </span>
      </div>

      {/* Main Showcase Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* Left: Gallery (5 cols) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="relative w-full pt-[85%] rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 shadow-xl">
            <Image
              src={selectedImage || product.images?.[0] || 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=800&q=80'}
              alt={product.name}
              fill
              priority
              className="object-cover object-center"
              unoptimized
            />
            {product.isHot && (
              <span className="absolute top-4 left-4 inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-rose-600 text-white shadow-lg">
                <Flame className="w-3.5 h-3.5 fill-current animate-bounce" />
                HOT SELLER
              </span>
            )}
          </div>

          {/* Thumbnails */}
          {product.images?.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {product.images.map((img: string, index: number) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(img)}
                  className={`relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-all ${
                    selectedImage === img
                      ? 'border-indigo-600 dark:border-cyan-400 scale-95'
                      : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <Image src={img} alt={`Thumb ${index}`} fill className="object-cover" unoptimized />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Info & Purchase Action (7 cols) */}
        <div className="lg:col-span-6 space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-lg text-xs font-extrabold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                {product.brand}
              </span>
              <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                Mã: {product.slug}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white leading-tight">
              {product.name}
            </h1>

            {/* Price Box */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 flex items-center gap-4">
              <div>
                <div className="text-2xl sm:text-3xl font-black text-indigo-600 dark:text-cyan-400">
                  {formatVND(finalPrice)}
                </div>
                {hasDiscount && (
                  <div className="flex items-center gap-2 text-xs text-slate-400 line-through">
                    <span>{formatVND(product.price)}</span>
                    <span className="text-rose-500 font-bold no-underline">(-{discountPercent}%)</span>
                  </div>
                )}
              </div>
              <div className="ml-auto text-right text-xs">
                <span className="text-emerald-500 font-bold block">✓ Đã bao gồm VAT</span>
                <span className="text-slate-400">Miễn phí ship đơn &gt; 1tr</span>
              </div>
            </div>

            {/* Stock status */}
            <div className="flex items-center gap-3 text-xs font-semibold">
              <span>Tình trạng kho:</span>
              {product.stock <= 0 ? (
                <span className="px-2.5 py-1 rounded-md bg-rose-100 dark:bg-rose-950/50 text-rose-600">
                  Tạm hết hàng
                </span>
              ) : product.stock < 5 ? (
                <span className="px-2.5 py-1 rounded-md bg-amber-100 dark:bg-amber-950/50 text-amber-600">
                  Sắp hết hàng (Chỉ còn {product.stock} chiếc)
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-md bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600">
                  Còn hàng trong kho ({product.stock})
                </span>
              )}
            </div>

            {/* Quantity Selector */}
            {product.stock > 0 && (
              <div className="flex items-center gap-4 pt-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Số lượng:</span>
                <div className="flex items-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white disabled:opacity-30"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-12 text-center text-sm font-bold">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    disabled={quantity >= product.stock}
                    className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white disabled:opacity-30"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                onClick={handleAddToCart}
                disabled={product.stock <= 0}
                className={`py-3.5 px-6 rounded-xl font-bold text-sm flex items-center justify-center gap-2 border transition-all ${
                  product.stock <= 0
                    ? 'opacity-40 cursor-not-allowed border-slate-300 dark:border-slate-700'
                    : added
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-indigo-600 dark:text-cyan-400 border-indigo-600/30 dark:border-cyan-400/30'
                }`}
              >
                {added ? <Check className="w-4 h-4" /> : <ShoppingCart className="w-4 h-4" />}
                <span>{added ? 'Đã thêm vào giỏ!' : 'Thêm vào giỏ'}</span>
              </button>

              <button
                onClick={handleBuyNow}
                disabled={product.stock <= 0}
                className="py-3.5 px-6 rounded-xl font-bold text-sm flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white shadow-lg shadow-indigo-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <Zap className="w-4 h-4 fill-current" />
                <span>Mua ngay</span>
              </button>
            </div>
          </div>

          {/* Guarantee Badges */}
          <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400">
            <div className="flex flex-col items-center gap-1">
              <ShieldCheck className="w-5 h-5 text-indigo-500 dark:text-cyan-400" />
              <span>Bảo hành 24 tháng</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Truck className="w-5 h-5 text-indigo-500 dark:text-cyan-400" />
              <span>Giao siêu tốc 2h</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <RotateCcw className="w-5 h-5 text-indigo-500 dark:text-cyan-400" />
              <span>Đổi mới trong 7 ngày</span>
            </div>
          </div>
        </div>
      </div>

      {/* Description & Technical Specs Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-6 border-t border-slate-200 dark:border-slate-800">
        {/* Left: Detailed Description (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <h2 className="text-xl font-black text-slate-900 dark:text-white">Mô Tả Chi Tiết</h2>
          <div className="prose dark:prose-invert max-w-none text-sm text-slate-600 dark:text-slate-300 leading-relaxed space-y-3">
            <p>{product.description}</p>
            <p>
              Tất cả các dòng thiết bị phân phối tại TECHGEAR đều là sản phẩm chính hãng 100%, được kiểm tra nghiêm ngặt (QC) trước khi xuất kho giao tới tay khách hàng.
            </p>
          </div>
        </div>

        {/* Right: Specs Table (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <h2 className="text-xl font-black text-slate-900 dark:text-white">Thông Số Kỹ Thuật</h2>
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
            <div className="flex py-2.5 px-4 text-xs font-semibold bg-slate-50 dark:bg-slate-800/60">
              <span className="w-1/3 text-slate-400">Thương hiệu</span>
              <span className="w-2/3 text-slate-800 dark:text-slate-200 font-bold">{product.brand}</span>
            </div>
            <div className="flex py-2.5 px-4 text-xs font-semibold">
              <span className="w-1/3 text-slate-400">Danh mục</span>
              <span className="w-2/3 text-slate-800 dark:text-slate-200 capitalize">{product.category}</span>
            </div>

            {product.specs &&
              Object.entries(product.specs).map(([key, val]) => (
                <div key={key} className="flex py-2.5 px-4 text-xs font-semibold">
                  <span className="w-1/3 text-slate-400 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                  <span className="w-2/3 text-slate-800 dark:text-slate-200">{String(val)}</span>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Related Products */}
      {related.length > 0 && (
        <div className="space-y-6 pt-8 border-t border-slate-200 dark:border-slate-800">
          <h2 className="text-xl font-black text-slate-900 dark:text-white">Sản Phẩm Tương Tự</h2>
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
