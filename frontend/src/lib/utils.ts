import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

export function formatDate(dateString: string | Date): string {
  if (!dateString) return '';
  const d = new Date(dateString);
  return d.toLocaleDateString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export const CATEGORIES_CONFIG = {
  monitor: {
    label: 'Màn hình máy tính',
    slug: 'monitor',
    icon: 'Monitor',
    desc: 'OLED 240Hz, Mini-LED, 2K-4K siêu tốc độ',
    image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=600&q=80',
  },
  keyboard: {
    label: 'Bàn phím cơ',
    slug: 'keyboard',
    icon: 'Keyboard',
    desc: 'Custom nhôm CNC, Rapid Trigger Hall Effect',
    image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&q=80',
  },
  mouse: {
    label: 'Chuột gaming & văn phòng',
    slug: 'mouse',
    icon: 'Mouse',
    desc: 'Siêu nhẹ 31g-54g, cảm biến 35K DPI, 8000Hz',
    image: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=600&q=80',
  },
  headphone: {
    label: 'Tai nghe cao cấp',
    slug: 'headphone',
    icon: 'Headphones',
    desc: 'Âm thanh vòm 360, Chống ồn chủ động ANC',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80',
  },
};

export const ORDER_STATUS_MAP: Record<string, { label: string; color: string; step: number }> = {
  pending: { label: 'Chờ xác nhận', color: 'bg-amber-500/10 text-amber-500 border-amber-500/20', step: 1 },
  processing: { label: 'Đang xử lý', color: 'bg-slate-100 text-slate-950 dark:bg-surface-elevated dark:text-white border border-slate-300 dark:border-white/10', step: 2 },
  shipping: { label: 'Đang giao hàng (Chờ khách nhận)', color: 'bg-purple-500/10 text-purple-500 border-purple-500/20', step: 3 },
  delivered: { label: '✓ ĐÃ GIAO (HOÀN TẤT)', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20', step: 4 },
  cancelled: { label: 'Đã hủy', color: 'bg-rose-500/10 text-rose-500 border-rose-500/20', step: 0 },
};

export const PAYMENT_STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: 'Chưa thanh toán', color: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
  paid: { label: 'Đã thanh toán', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
  failed: { label: 'Thất bại', color: 'bg-rose-500/10 text-rose-500 border-rose-500/20' },
  refunded: { label: 'Đã hoàn tiền', color: 'bg-gray-500/10 text-gray-400 border-gray-500/20' },
};
