'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, Package, Calendar, Phone, Mail, Shield, CheckCircle2, ArrowRight } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { fetchApi } from '@/lib/api';
import { formatVND, formatDate, ORDER_STATUS_MAP } from '@/lib/utils';

export default function ProfilePage() {
  const router = useRouter();
  const { user, token, updateUser, logout } = useAuthStore();

  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!token) {
      router.push('/auth/login');
      return;
    }

    if (user) {
      setTimeout(() => setFullName(user.fullName || ''), 0);
      setTimeout(() => setPhone(user.phone || ''), 0);
    }

    async function loadMyOrders() {
      setLoadingOrders(true);
      const res = await fetchApi('/orders/my-orders');
      if (res.success && res.data) {
        setOrders(res.data);
      }
      setLoadingOrders(false);
    }
    loadMyOrders();
  }, [token, user, router]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetchApi('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify({ fullName, phone }),
    });
    if (res.success && res.data) {
      updateUser(res.data);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
    setSaving(false);
  };

  if (!user) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
          Tài Khoản & Lịch Sử Đơn Hàng
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
          Quản lý thông tin liên hệ và theo dõi toàn bộ các đơn hàng đã đặt
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Personal info form (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="rounded-2xl border hairline-border surface-bevel bg-surface-card p-6 space-y-5 shadow-xl">
            <div className="flex items-center gap-3 pb-4 border-b hairline-border">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-600 dark:from-signal-cyan dark:to-indigo-500 flex items-center justify-center text-white dark:text-slate-950 font-black text-lg uppercase shadow-sm">
                {user.fullName.charAt(0)}
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">{user.fullName}</h3>
                <span className="text-[11px] text-slate-600 dark:text-slate-400 font-mono font-medium">{user.email}</span>
              </div>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Họ và tên
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 dark:bg-surface-elevated border hairline-border text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:border-cyan-600 dark:focus:border-signal-cyan/60"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Số điện thoại
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 dark:bg-surface-elevated border hairline-border text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:border-cyan-600 dark:focus:border-signal-cyan/60"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Vai trò tài khoản
                </label>
                <input
                  type="text"
                  disabled
                  value={user.role.toUpperCase()}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-slate-100 dark:bg-surface-elevated/70 border hairline-border text-slate-800 dark:text-slate-200 font-bold"
                />
              </div>

              {saveSuccess && (
                <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-signal-emerald text-xs flex items-center gap-1.5 font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Đã lưu thông tin mới!</span>
                </div>
              )}

              <button
                type="submit"
                disabled={saving}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-signal-cyan dark:text-slate-950 dark:hover:bg-cyan-400 font-bold transition-all shadow-sm"
              >
                {saving ? 'Đang lưu...' : 'Lưu Thay Đổi'}
              </button>
            </form>

            <div className="pt-2 border-t hairline-border">
              <button
                onClick={() => {
                  logout();
                  router.push('/');
                }}
                className="w-full py-2 text-rose-700 dark:text-signal-rose hover:underline text-xs font-bold transition-colors"
              >
                Đăng xuất tài khoản
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Past Orders (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="rounded-2xl border hairline-border surface-bevel bg-surface-card p-6 space-y-5 shadow-xl">
            <h2 className="text-base font-bold text-slate-900 dark:text-white pb-3 border-b hairline-border flex items-center justify-between">
              <span>Lịch Sử Đơn Hàng ({orders.length})</span>
            </h2>

            {loadingOrders ? (
              <div className="space-y-3 animate-pulse">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-20 bg-surface-elevated rounded-xl" />
                ))}
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-12 space-y-3">
                <Package className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto" />
                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">Bạn chưa có đơn hàng nào.</p>
                <Link
                  href="/products"
                  className="inline-block px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-signal-cyan dark:text-slate-950 font-bold text-xs shadow-sm"
                >
                  Mua sắm ngay
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {orders.map((order) => {
                  const statusInfo = ORDER_STATUS_MAP[order.orderStatus] || {
                    label: order.orderStatus,
                    color: 'text-slate-600 dark:text-slate-400',
                  };
                  return (
                    <div
                      key={order._id}
                      className="p-4 rounded-xl border hairline-border surface-bevel bg-slate-50 dark:bg-surface-elevated/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs shadow-sm"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-cyan-700 dark:text-signal-cyan">
                            {order.orderCode}
                          </span>
                          <span className={`px-2.5 py-0.5 rounded-full font-bold border hairline-border text-[10px] ${statusInfo.color}`}>
                            {statusInfo.label}
                          </span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-400 font-medium">
                          {formatDate(order.createdAt)} • {order.items?.length || 0} sản phẩm
                        </p>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-4">
                        <span className="font-black text-sm text-slate-900 dark:text-white tabular-nums">
                          {formatVND(order.totalAmount)}
                        </span>
                        <Link
                          href={`/order-tracking?orderCode=${order.orderCode}&phone=${encodeURIComponent(order.customerInfo?.phone || '')}`}
                          className="px-3 py-1.5 rounded-lg bg-white dark:bg-surface-card border hairline-border font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-surface-subtle flex items-center gap-1 shadow-sm transition-colors"
                        >
                          <span>Xem chi tiết</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
