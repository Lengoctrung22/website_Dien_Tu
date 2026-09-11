'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart, Flame, Check, AlertCircle } from 'lucide-react';
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
    <div className="group relative flex flex-col rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 hover:border-indigo-500/50 dark:hover:border-cyan-500/50 hover:shadow-xl hover:shadow-indigo-500/10 dark:hover:shadow-cyan-500/10 transition-all duration-300 overflow-hidden">
      {/* Badges Top Left & Right */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5 pointer-events-none">
        {product.isHot && (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wide bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-md shadow-rose-500/30">
            <Flame className="w-3 h-3 fill-current animate-bounce" />
            HOT
          </span>
        )}
        {hasDiscount && (
          <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-rose-600 text-white shadow-md">
            -{discountPercent}%
          </span>
        )}
      </div>

      {/* Brand Badge Top Right */}
      <div className="absolute top-3 right-3 z-10">
        <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-slate-100/90 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 backdrop-blur-sm">
          {product.brand}
        </span>
      </div>

      {/* Image with zoom on hover */}
      <Link href={`/products/${product.slug}`} className="relative block w-full pt-[80%] overflow-hidden bg-slate-100 dark:bg-slate-800/40">
        <Image
          src={imageSrc}
          alt={product.name}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
          className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
          unoptimized
        />
      </Link>

      {/* Card Content */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
        <div>
          {/* Key Specs chips */}
          <div className="flex flex-wrap gap-1 mb-2">
            {product.specs?.refreshRate && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-50 dark:bg-cyan-950/50 text-cyan-700 dark:text-cyan-300 font-medium border border-cyan-200 dark:border-cyan-800">
                {product.specs.refreshRate}
              </span>
            )}
            {product.specs?.switch && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-medium border border-indigo-200 dark:border-indigo-800">
                {product.specs.switch.split('(')[0]}
              </span>
            )}
            {product.specs?.weight && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-medium border border-emerald-200 dark:border-emerald-800">
                {product.specs.weight}
              </span>
            )}
          </div>

          {/* Product Title */}
          <Link href={`/products/${product.slug}`} className="block group-hover:text-indigo-600 dark:group-hover:text-cyan-400 transition-colors">
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 line-clamp-2 leading-snug">
              {product.name}
            </h3>
          </Link>
        </div>

        {/* Stock status indicator */}
        <div className="text-xs font-medium">
          {product.stock <= 0 ? (
            <span className="text-rose-500">Tạm hết hàng</span>
          ) : product.stock < 5 ? (
            <span className="text-amber-500 font-semibold">Chỉ còn {product.stock} chiếc!</span>
          ) : (
            <span className="text-emerald-600 dark:text-emerald-400">Còn hàng ({product.stock})</span>
          )}
        </div>

        {/* Price & Action */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
          <div>
            <div className="text-base sm:text-lg font-black text-indigo-600 dark:text-cyan-400">
              {formatVND(finalPrice)}
            </div>
            {hasDiscount && (
              <div className="text-xs text-slate-400 line-through">
                {formatVND(product.price)}
              </div>
            )}
          </div>

          {/* Add to Cart Button */}
          <button
            onClick={handleAddToCart}
            disabled={product.stock <= 0}
            className={`p-2.5 rounded-xl transition-all flex items-center justify-center ${
              product.stock <= 0
                ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                : added
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-indigo-600 hover:bg-indigo-700 dark:bg-cyan-500 dark:hover:bg-cyan-600 text-white shadow-md shadow-indigo-500/20 dark:shadow-cyan-500/20'
            }`}
            title="Thêm vào giỏ"
          >
            {added ? <Check className="w-4 h-4" /> : <ShoppingCart className="w-4 h-4" />}
          </button>
        </div>

        {errorMsg && (
          <p className="text-[11px] text-rose-500 flex items-center gap-1 mt-1">
            <AlertCircle className="w-3 h-3 flex-shrink-0" />
            {errorMsg}
          </p>
        )}
      </div>
    </div>
  );
}
