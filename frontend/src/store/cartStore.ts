import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartProduct {
  _id: string;
  name: string;
  slug: string;
  category: string;
  brand: string;
  price: number;
  discountPrice?: number;
  stock: number;
  images: string[];
}

export interface CartItem {
  product: CartProduct;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  addItem: (product: CartProduct, quantity?: number) => { success: boolean; message?: string };
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => { success: boolean; message?: string };
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product, quantity = 1) => {
        const { items } = get();
        const existingIndex = items.findIndex((i) => i.product._id === product._id);

        if (existingIndex > -1) {
          const newQty = items[existingIndex].quantity + quantity;
          if (newQty > product.stock) {
            return {
              success: false,
              message: `Chỉ còn ${product.stock} sản phẩm trong kho. Bạn đã có ${items[existingIndex].quantity} trong giỏ.`,
            };
          }

          const updated = [...items];
          updated[existingIndex].quantity = newQty;
          set({ items: updated });
          return { success: true };
        } else {
          if (quantity > product.stock) {
            return {
              success: false,
              message: `Chỉ còn ${product.stock} sản phẩm trong kho.`,
            };
          }

          set({ items: [...items, { product, quantity }] });
          return { success: true };
        }
      },

      removeItem: (productId) => {
        set({ items: get().items.filter((i) => i.product._id !== productId) });
      },

      updateQuantity: (productId, quantity) => {
        const { items } = get();
        const item = items.find((i) => i.product._id === productId);
        if (!item) return { success: false, message: 'Sản phẩm không có trong giỏ' };

        if (quantity <= 0) {
          set({ items: items.filter((i) => i.product._id !== productId) });
          return { success: true };
        }

        if (quantity > item.product.stock) {
          return {
            success: false,
            message: `Rất tiếc, kho chỉ còn tối đa ${item.product.stock} sản phẩm này!`,
          };
        }

        set({
          items: items.map((i) =>
            i.product._id === productId ? { ...i, quantity } : i
          ),
        });
        return { success: true };
      },

      clearCart: () => set({ items: [] }),

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      getTotalPrice: () => {
        return get().items.reduce((total, item) => {
          const price =
            item.product.discountPrice && item.product.discountPrice > 0
              ? item.product.discountPrice
              : item.product.price;
          return total + price * item.quantity;
        }, 0);
      },
    }),
    {
      name: 'techgear_cart_storage',
    }
  )
);
