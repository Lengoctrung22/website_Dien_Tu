'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LogIn, Key, Mail, ShieldAlert, ShieldCheck, Boxes, ShoppingCart, User } from 'lucide-react';
import { fetchApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

const DEMO_ACCOUNTS = [
  {
    roleName: 'Super Admin',
    email: 'admin@techgear.vn',
    password: 'admin123',
    permissions: 'Toàn quyền quản trị (all)',
    icon: ShieldCheck,
    color: 'hover:border-rose-500/50 hover:bg-rose-500/5 text-rose-700 dark:text-rose-300',
    tag: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/25',
  },
  {
    roleName: 'Nhân viên Kho',
    email: 'warehouse@techgear.vn',
    password: 'staff123',
    permissions: 'Quản lý kho, nhập hàng (inventory)',
    icon: Boxes,
    color: 'hover:border-amber-500/50 hover:bg-amber-500/5 text-amber-700 dark:text-amber-300',
    tag: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/25',
  },
  {
    roleName: 'Nhân viên Đơn hàng',
    email: 'orders@techgear.vn',
    password: 'staff123',
    permissions: 'Xử lý tiến trình đơn hàng (orders)',
    icon: ShoppingCart,
    color: 'hover:border-cyan-500/50 hover:bg-cyan-500/5 text-cyan-700 dark:text-cyan-300',
    tag: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/25',
  },
  {
    roleName: 'Khách hàng',
    email: 'customer@gmail.com',
    password: 'customer123',
    permissions: 'Mua sắm & Quản lý profile',
    icon: User,
    color: 'hover:border-slate-500/50 hover:bg-slate-500/5 text-slate-700 dark:text-slate-300',
    tag: 'bg-slate-100 dark:bg-surface-elevated text-slate-700 dark:text-slate-300 border-slate-300 dark:border-white/10',
  },
];

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

  const handleQuickFill = (acc: typeof DEMO_ACCOUNTS[0]) => {
    setEmail(acc.email);
    setPassword(acc.password);
    submitCredentials(acc.email, acc.password);
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12 space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-slate-900 dark:bg-surface-elevated hairline-border mx-auto flex items-center justify-center text-white shadow-lg">
          <LogIn className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">Đăng Nhập Tài Khoản</h1>
        <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">Truy cập hệ thống quản trị phân quyền RBAC TECHGEAR PRO</p>
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

      {/* Quick Demo Login Buttons for RBAC Testing */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-surface-card p-4 space-y-2.5 shadow-sm">
        <div className="flex items-center justify-between pb-1 border-b hairline-border">
          <span className="text-[11px] font-mono font-bold uppercase text-slate-500">
            Tài khoản mẫu thử nghiệm phân quyền (RBAC):
          </span>
        </div>
        <div className="space-y-1.5">
          {DEMO_ACCOUNTS.map((acc) => {
            const Icon = acc.icon;
            return (
              <button
                key={acc.email}
                type="button"
                onClick={() => handleQuickFill(acc)}
                className={`w-full text-left p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 transition-all flex items-center justify-between group ${acc.color}`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-1.5 rounded-lg bg-surface-elevated hairline-border flex-shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs text-slate-900 dark:text-white">{acc.roleName}</span>
                      <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border ${acc.tag}`}>
                        {acc.email.split('@')[0]}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 font-mono truncate">{acc.permissions}</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                  Vào ngay →
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
