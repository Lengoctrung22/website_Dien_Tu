'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart, Check, AlertCircle } from 'lucide-react';
import { formatVND } from '@/lib/utils';
import { useCartStore, CartProduct } from '@/store/cartStore';

interface ProductCardProps {
  product: {
    _id: string;
    name: string;
    slug: string;
    category: string;
    brand: string;
    price: number;
    discountPrice?: number;
    stock: number;
    soldCount?: number;
    isHot?: boolean;
    images: string[];
    specs?: Record<string, any>;
  };
}

export default function ProductCard({ product }: ProductCardProps) {
  const [added, setAdded] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const addItem = useCartStore((state) => state.addItem);

  const finalPrice = product.discountPrice && product.discountPrice > 0 ? product.discountPrice : product.price;
  const hasDiscount = product.discountPrice && product.discountPrice > 0 && product.discountPrice < product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.price - product.discountPrice!) / product.price) * 100)
    : 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const cartProd: CartProduct = {
      _id: product._id,
      name: product.name,
      slug: product.slug,
      category: product.category,
      brand: product.brand,
      price: product.price,
      discountPrice: product.discountPrice,
      stock: product.stock,
      images: product.images,
    };

    const res = addItem(cartProd, 1);
    if (res.success) {
      setAdded(true);
      setErrorMsg(null);
      setTimeout(() => setAdded(false), 1500);
    } else {
      setErrorMsg(res.message || 'Không thể thêm vào giỏ');
      setTimeout(() => setErrorMsg(null), 3000);
    }
  };

  const imageSrc = product.images?.[0] || 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=600&q=80';

  return (
    <div className="group relative flex flex-col rounded-xl bg-white dark:bg-surface-card border hairline-border surface-bevel hover:border-slate-400 dark:hover:border-signal-cyan/40 hover:shadow-lg transition-all duration-200 overflow-hidden">
      {/* Badges Top Left: Hot Spec Chip & Discount Tag */}
      <div className="absolute top-2.5 left-2.5 z-10 flex flex-col gap-1 pointer-events-none">
        {product.isHot && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-mono font-bold tracking-wider uppercase border border-amber-500/40 bg-amber-500/15 text-amber-800 dark:text-amber-300 backdrop-blur-sm shadow-sm">
            HOT GEAR
          </span>
        )}
        {hasDiscount && (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[11px] font-mono font-bold tabular-nums bg-rose-500/10 text-rose-700 dark:text-signal-rose border border-rose-500/25 backdrop-blur-sm shadow-sm">
            -{discountPercent}%
          </span>
        )}
      </div>

      {/* Brand Badge Top Right */}
      <div className="absolute top-2.5 right-2.5 z-10 pointer-events-none">
        <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider bg-slate-900/90 dark:bg-surface-subtle/90 text-white dark:text-slate-200 border hairline-border backdrop-blur-sm shadow-sm">
          {product.brand}
        </span>
      </div>

      {/* Image with zoom micro-interaction */}
      <Link href={`/products/${product.slug}`} className="relative block w-full pt-[75%] overflow-hidden bg-slate-50 dark:bg-surface-canvas/60 border-b hairline-border">
        <Image
          src={imageSrc}
          alt={product.name}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
          className="object-cover object-center group-hover:scale-105 transition-transform duration-300"
        />
      </Link>

      {/* Card Body */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div>
          {/* Key Specs chips */}
          <div className="flex flex-wrap gap-1 mb-2">
            {product.specs?.refreshRate && (
              <span className="text-[10px] font-mono font-semibold tabular-nums px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-surface-subtle text-slate-800 dark:text-slate-200 border hairline-border">
                {product.specs.refreshRate}
              </span>
            )}
            {product.specs?.switch && (
              <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-surface-subtle text-slate-800 dark:text-slate-200 border hairline-border">
                {product.specs.switch.split('(')[0]}
              </span>
            )}
            {product.specs?.weight && (
              <span className="text-[10px] font-mono font-semibold tabular-nums px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-surface-subtle text-slate-800 dark:text-slate-200 border hairline-border">
                {product.specs.weight}
              </span>
            )}
            {product.specs?.batteryLife && (
              <span className="text-[10px] font-mono font-semibold tabular-nums px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-surface-subtle text-slate-800 dark:text-slate-200 border hairline-border">
                {product.specs.batteryLife}
              </span>
            )}
            {product.specs?.anc && (
              <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-surface-subtle text-slate-800 dark:text-slate-200 border hairline-border">
                ANC
              </span>
            )}
          </div>

          {/* Product Title */}
          <Link href={`/products/${product.slug}`} className="block group-hover:text-slate-950 dark:group-hover:text-black transition-colors">
            <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100 line-clamp-2 leading-snug">
              {product.name}
            </h3>
          </Link>
        </div>

        {/* Stock status indicator */}
        <div className="text-[11px] font-mono tabular-nums">
          {product.stock <= 0 ? (
            <span className="text-rose-700 dark:text-signal-rose flex items-center gap-1.5 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-600 dark:bg-signal-rose inline-block" />
              Tạm hết hàng
            </span>
          ) : product.stock < 5 ? (
            <span className="text-amber-700 dark:text-signal-amber flex items-center gap-1.5 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-600 dark:bg-signal-amber animate-pulse inline-block" />
              Chỉ còn {product.stock} chiếc!
            </span>
          ) : (
            <span className="text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-signal-emerald inline-block" />
              Sẵn hàng ({product.stock})
            </span>
          )}
        </div>

        {/* Price & Add to Cart Action */}
        <div className="pt-2.5 border-t hairline-border flex items-end justify-between gap-2">
          <div>
            <div className="text-base sm:text-lg font-mono font-bold tabular-nums text-slate-900 dark:text-white">
              {formatVND(finalPrice)}
            </div>
            {hasDiscount && (
              <div className="text-xs font-mono font-bold tabular-nums text-slate-400 dark:text-slate-500 line-through">
                {formatVND(product.price)}
              </div>
            )}
          </div>

          {/* High-Contrast Conversion Add-to-Cart Button with micro-tactile feel */}
          <button
            onClick={handleAddToCart}
            disabled={product.stock <= 0}
            className={`p-2.5 rounded-lg transition-all duration-150 active:scale-95 flex items-center justify-center surface-bevel ${
              product.stock <= 0
                ? 'bg-slate-100 dark:bg-surface-subtle text-slate-400 cursor-not-allowed border hairline-border'
                : added
                ? 'bg-signal-emerald text-white shadow-md'
                : 'bg-slate-900 hover:bg-slate-800 dark:bg-signal-cyan dark:text-slate-950 dark:hover:bg-cyan-300 text-white font-bold shadow-sm'
            }`}
            title="Thêm vào giỏ hàng"
          >
            {added ? <Check className="w-4 h-4 stroke-[2.5]" /> : <ShoppingCart className="w-4 h-4 stroke-[2]" />}
          </button>
        </div>

        {errorMsg && (
          <p className="text-[11px] font-mono text-signal-rose flex items-center gap-1 mt-1">
            <AlertCircle className="w-3 h-3 flex-shrink-0" />
            {errorMsg}
          </p>
        )}
      </div>
    </div>
  );
}
