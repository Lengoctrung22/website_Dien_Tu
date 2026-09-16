'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LogIn, Key, Mail, ShieldAlert } from 'lucide-react';
import { fetchApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const submitCredentials = async (loginEmail: string, loginPass: string) => {
    setErrorMsg(null);
    setLoading(true);

    try {
      const res = await fetchApi('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: loginEmail, password: loginPass }),
      });

      if (res.success && res.data) {
        setAuth(res.data.user, res.data.token);
        if (
          res.data.user.role === 'admin' ||
          res.data.user.role === 'staff' ||
          res.data.user.role === 'orders' ||
          res.data.user.role === 'warehouse'
        ) {
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

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    submitCredentials(email, password);
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12 space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-slate-900 dark:bg-surface-elevated hairline-border mx-auto flex items-center justify-center text-white shadow-lg">
          <LogIn className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">Đăng Nhập Tài Khoản</h1>
        <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
          Hệ thống thương mại điện tử TechGear Pro
        </p>
      </div>

      {errorMsg && (
        <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 font-semibold flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 flex-shrink-0 text-rose-600 dark:text-rose-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleLogin} className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-xl space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
            Email đăng nhập
          </label>
          <div className="relative">
            <input
              type="email"
              required
              placeholder="email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2.5 text-xs font-medium rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-slate-500 dark:focus:border-signal-cyan font-mono"
            />
            <Mail className="w-4 h-4 text-slate-500 dark:text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
            Mật khẩu
          </label>
          <div className="relative">
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2.5 text-xs font-medium rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-slate-500 dark:focus:border-signal-cyan"
            />
            <Key className="w-4 h-4 text-slate-500 dark:text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100 font-bold text-xs flex items-center justify-center gap-2 shadow-md disabled:opacity-50 transition-all"
        >
          <span>{loading ? 'Đang xác thực...' : 'Đăng Nhập'}</span>
        </button>

        <div className="pt-2 text-center text-xs text-slate-600 dark:text-slate-400 font-medium">
          Chưa có tài khoản?{' '}
          <Link href="/auth/register" className="font-bold text-slate-950 dark:text-white hover:underline">
            Đăng ký ngay
          </Link>
        </div>
      </form>
    </div>
  );
}
