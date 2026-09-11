'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Trash2,
  Minus,
  Plus,
  ArrowRight,
  ShoppingBag,
  ShieldCheck,
  Truck,
  RotateCcw,
  AlertCircle,
} from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { formatVND } from '@/lib/utils';

export default function CartPage() {
  const [mounted, setMounted] = useState(false);
  const { items, updateQuantity, removeItem, clearCart, getTotalPrice } = useCartStore();
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    setTimeout(() => setMounted(true), 0);
  }, []);

  if (!mounted) {
    return <div className="max-w-7xl mx-auto p-12 text-center text-sm">Đang tải giỏ hàng...</div>;
  }

  const subtotal = getTotalPrice();
  const shippingFee = subtotal > 1000000 || subtotal === 0 ? 0 : 30000;
  const finalTotal = subtotal + shippingFee;

  const handleUpdate = (productId: string, newQty: number) => {
    const res = updateQuantity(productId, newQty);
    if (!res.success) {
      setFeedback(res.message || 'Lỗi cập nhật số lượng');
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-24 h-24 rounded-full bg-slate-100 dark:bg-slate-800/80 mx-auto flex items-center justify-center text-slate-400">
          <ShoppingBag className="w-12 h-12" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">Giỏ hàng của bạn đang trống</h2>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">
            Hãy khám phá các thiết bị gaming cao cấp và chọn những sản phẩm phù hợp nhất với bạn.
          </p>
        </div>
        <Link
          href="/products"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold text-sm shadow-lg shadow-indigo-500/20 transition-all"
        >
          <span>Khám phá sản phẩm ngay</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            Giỏ Hàng Của Bạn ({items.length} mặt hàng)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Kiểm tra thông tin chi tiết các món phụ kiện máy tính trước khi tiến hành thanh toán
          </p>
        </div>
        <button
          onClick={clearCart}
          className="text-xs font-semibold text-rose-500 hover:text-rose-600 flex items-center gap-1 self-start sm:self-auto"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Xóa tất cả</span>
        </button>
      </div>

      {feedback && (
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Cart items list (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden shadow-sm">
            {items.map(({ product, quantity }) => {
              const unitPrice =
                product.discountPrice && product.discountPrice > 0 ? product.discountPrice : product.price;
              const itemTotal = unitPrice * quantity;

              return (
                <div key={product._id} className="p-4 sm:p-6 flex flex-col sm:flex-row items-center gap-4">
                  {/* Product Image */}
                  <Link
                    href={`/products/${product.slug}`}
                    className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden flex-shrink-0 bg-slate-100 dark:bg-slate-800"
                  >
                    <Image
                      src={product.images?.[0] || 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=400&q=80'}
                      alt={product.name}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </Link>

                  {/* Product Details */}
                  <div className="flex-1 space-y-1 text-center sm:text-left">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-cyan-400">
                      {product.brand} • {product.category}
                    </span>
                    <Link
                      href={`/products/${product.slug}`}
                      className="block font-bold text-sm sm:text-base text-slate-800 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-cyan-400 transition-colors line-clamp-1"
                    >
                      {product.name}
                    </Link>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Đơn giá: <span className="font-semibold text-slate-700 dark:text-slate-300">{formatVND(unitPrice)}</span>
                      {product.stock < 5 && (
                        <span className="ml-2 text-amber-500 font-semibold">(Kho còn {product.stock})</span>
                      )}
                    </div>
                  </div>

                  {/* Quantity Counter */}
                  <div className="flex items-center rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                    <button
                      onClick={() => handleUpdate(product._id, quantity - 1)}
                      className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-8 text-center text-xs font-bold">{quantity}</span>
                    <button
                      onClick={() => handleUpdate(product._id, quantity + 1)}
                      disabled={quantity >= product.stock}
                      className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white disabled:opacity-30"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Item Total */}
                  <div className="text-right min-w-[110px]">
                    <div className="text-sm sm:text-base font-black text-indigo-600 dark:text-cyan-400">
                      {formatVND(itemTotal)}
                    </div>
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => removeItem(product._id)}
                    className="p-2 text-slate-400 hover:text-rose-500 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                    title="Xóa sản phẩm"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>

          <div className="flex justify-between items-center text-xs text-slate-500">
            <Link href="/products" className="hover:text-indigo-600 dark:hover:text-cyan-400 flex items-center gap-1 font-semibold">
              ← Tiếp tục mua sắm phụ kiện khác
            </Link>
          </div>
        </div>

        {/* Order summary (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-5 shadow-xl">
            <h2 className="text-base font-black text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800">
              Tóm Tắt Đơn Hàng
            </h2>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>Tạm tính hàng hóa:</span>
                <span className="font-bold text-slate-900 dark:text-white">{formatVND(subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>Phí giao hàng:</span>
                <span className="font-bold text-emerald-500">
                  {shippingFee === 0 ? 'MIỄN PHÍ' : formatVND(shippingFee)}
                </span>
              </div>
              {shippingFee === 0 && (
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400">
                  ✓ Đã áp dụng chính sách Freeship cho đơn &gt; 1.000.000đ
                </p>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-baseline">
              <span className="text-sm font-bold text-slate-800 dark:text-white">Tổng cộng:</span>
              <div className="text-right">
                <span className="text-xl font-black text-indigo-600 dark:text-cyan-400 block">
                  {formatVND(finalTotal)}
                </span>
                <span className="text-[10px] text-slate-400">(Đã bao gồm VAT 8-10%)</span>
              </div>
            </div>

            <Link
              href="/checkout"
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 transition-all text-center block"
            >
              <span>Tiến Hành Thanh Toán</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <div className="text-[11px] text-slate-400 space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span>Bảo mật giao dịch thanh toán chuẩn SSL 256-bit</span>
              </div>
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-cyan-500 flex-shrink-0" />
                <span>Kiểm tra hàng trước khi thanh toán (COD)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
