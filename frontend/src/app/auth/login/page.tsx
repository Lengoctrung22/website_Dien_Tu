'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LogIn, Key, Mail, ShieldAlert, Sparkles, UserCheck } from 'lucide-react';
import { fetchApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const res = await fetchApi('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      if (res.success && res.data) {
        setAuth(res.data.user, res.data.token);
        if (res.data.user.role === 'admin' || res.data.user.role === 'staff') {
          router.push('/admin');
        } else {
          router.push('/');
        }
      } else {
        setErrorMsg(res.message || 'Đăng nhập không thành công');
      }
    } catch {
      setErrorMsg('Không thể kết nối tới hệ thống xác thực');
    }
    setLoading(false);
  };

  const fillAccount = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setErrorMsg(null);
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16 space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-cyan-500 mx-auto flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
          <LogIn className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">Đăng Nhập Tài Khoản</h1>
        <p className="text-xs text-slate-500">Truy cập hệ thống mua sắm và quản trị TECHGEAR PRO</p>
      </div>

      {/* Demo Accounts Quick-Fill Box */}
      <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-slate-850 border border-indigo-200 dark:border-slate-800 space-y-2.5">
        <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 dark:text-cyan-400">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Tài Khoản Mẫu (Bấm Để Điền Nhanh):</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => fillAccount('admin@techgear.vn', 'admin123')}
            className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-bold hover:border-indigo-500 text-indigo-600 dark:text-indigo-400 transition-all text-center shadow-sm"
          >
            Super Admin
          </button>
          <button
            type="button"
            onClick={() => fillAccount('warehouse@techgear.vn', 'staff123')}
            className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-bold hover:border-cyan-500 text-cyan-600 dark:text-cyan-400 transition-all text-center shadow-sm"
          >
            Nhân Viên Kho
          </button>
          <button
            type="button"
            onClick={() => fillAccount('customer@gmail.com', 'customer123')}
            className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-bold hover:border-emerald-500 text-emerald-600 dark:text-emerald-400 transition-all text-center shadow-sm"
          >
            Khách Hàng
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleLogin} className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-xl space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            Email đăng nhập
          </label>
          <div className="relative">
            <input
              type="email"
              required
              placeholder="admin@techgear.vn"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-indigo-500 dark:focus:border-cyan-400"
            />
            <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            Mật khẩu
          </label>
          <div className="relative">
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-indigo-500 dark:focus:border-cyan-400"
            />
            <Key className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 disabled:opacity-50 transition-all"
        >
          <span>{loading ? 'Đang xác thực...' : 'Đăng Nhập'}</span>
        </button>

        <div className="pt-2 text-center text-xs text-slate-500">
          Chưa có tài khoản?{' '}
          <Link href="/auth/register" className="font-bold text-indigo-600 dark:text-cyan-400 hover:underline">
            Đăng ký ngay
          </Link>
        </div>
      </form>
    </div>
  );
}
