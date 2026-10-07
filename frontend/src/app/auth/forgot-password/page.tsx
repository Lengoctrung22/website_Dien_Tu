'use client';
 
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  KeyRound,
  Mail,
  Key,
  ShieldAlert,
  ArrowLeft,
  CheckCircle2,
  RotateCcw,
  Eye,
  EyeOff,
  Sparkles,
} from 'lucide-react';
import { fetchApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const redirectTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current);
    };
  }, []);

  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // 60-second countdown timer for resending OTP
  const [countdown, setCountdown] = useState<number>(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  // Step 1: Send OTP to email
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMsg('Vui lòng nhập địa chỉ email');
      return;
    }

    setLoading(true);
    try {
      const res = await fetchApi('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: cleanEmail }),
      });

      if (res.success) {
        setStep(2);
        setCountdown(60);
        setSuccessMsg(
          res.message || 'Mã xác thực OTP đã được gửi đến email của bạn (có hiệu lực trong 10 phút).'
        );
      } else {
        setErrorMsg(res.message || 'Không thể gửi mã xác thực. Vui lòng kiểm tra lại email.');
      }
    } catch {
      setErrorMsg('Không thể kết nối tới hệ thống. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP in Step 2
  const handleResendOtp = async () => {
    if (countdown > 0 || resending || loading) return;

    setErrorMsg(null);
    setSuccessMsg(null);
    setResending(true);

    try {
      const res = await fetchApi('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim() }),
      });

      if (res.success) {
        setCountdown(60);
        setSuccessMsg('Mã OTP mới đã được gửi lại vào email của bạn!');
      } else {
        setErrorMsg(res.message || 'Không thể gửi lại mã OTP. Vui lòng thử lại sau.');
      }
    } catch {
      setErrorMsg('Không thể kết nối tới hệ thống. Vui lòng thử lại sau.');
    } finally {
      setResending(false);
    }
  };

  // Step 2: Verify OTP and reset password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanOtp = otp.trim();
    if (!cleanOtp) {
      setErrorMsg('Vui lòng nhập mã xác thực OTP 6 số');
      return;
    }

    if (cleanOtp.length !== 6) {
      setErrorMsg('Mã OTP phải có đúng 6 chữ số');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMsg('Mật khẩu mới phải có tối thiểu 6 ký tự');
      return;
    }

    if (newPassword.length > 128) {
      setErrorMsg('Mật khẩu mới không được vượt quá 128 ký tự');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Mật khẩu xác nhận không khớp với mật khẩu mới');
      return;
    }

    setLoading(true);
    try {
      const res = await fetchApi('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          email: email.trim(),
          otp: cleanOtp,
          newPassword,
        }),
      });

      if (res.success && res.data) {
        setSuccessMsg('Đặt lại mật khẩu thành công! Đang đăng nhập và chuyển hướng...');
        setAuth(res.data.user, res.data.token);

        redirectTimerRef.current = setTimeout(() => {
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
        }, 1200);
      } else {
        setErrorMsg(res.message || 'Không thể đặt lại mật khẩu. Vui lòng kiểm tra lại mã OTP.');
      }
    } catch {
      setErrorMsg('Không thể kết nối tới máy chủ. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-slate-900 dark:bg-surface-elevated hairline-border mx-auto flex items-center justify-center text-white shadow-lg">
          <KeyRound className="w-6 h-6 text-signal-cyan" />
        </div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">
          {step === 1 ? 'Quên Mật Khẩu' : 'Đặt Lại Mật Khẩu'}
        </h1>
        <p className="text-xs text-slate-600 dark:text-slate-400 font-medium max-w-xs mx-auto">
          {step === 1
            ? 'Nhập địa chỉ email đăng ký để nhận mã OTP lấy lại tài khoản'
            : `Nhập mã xác thực OTP 6 số đã được gửi đến email ${email}`}
        </p>
      </div>

      {/* Notifications */}
      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 font-semibold flex items-center gap-2.5">
          <ShieldAlert className="w-4 h-4 flex-shrink-0 text-rose-600 dark:text-rose-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-300 font-semibold flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Step 1: Request OTP Form */}
      {step === 1 && (
        <form
          onSubmit={handleRequestOtp}
          className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-xl space-y-5"
        >
          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
              Email tài khoản của bạn
            </label>
            <div className="relative">
              <input
                type="email"
                required
                autoFocus
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 text-xs font-medium rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-slate-500 dark:focus:border-signal-cyan font-mono"
              />
              <Mail className="w-4 h-4 text-slate-500 dark:text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            <p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">
              Hệ thống sẽ gửi mã xác thực OTP 6 số đến email này để xác nhận danh tính.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100 font-bold text-xs flex items-center justify-center gap-2 shadow-md disabled:opacity-50 transition-all"
          >
            {loading ? (
              <span>Đang gửi mã...</span>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-signal-cyan dark:text-cyan-600" />
                <span>Gửi Mã Xác Thực OTP</span>
              </>
            )}
          </button>

          <div className="pt-2 text-center text-xs text-slate-600 dark:text-slate-400 font-medium">
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-1.5 font-bold text-slate-950 dark:text-white hover:underline"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Quay lại trang Đăng Nhập</span>
            </Link>
          </div>
        </form>
      )}

      {/* Step 2: Verify OTP and Enter New Password Form */}
      {step === 2 && (
        <form
          onSubmit={handleResetPassword}
          className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-xl space-y-4"
        >
          {/* Email Info Bar */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 text-xs">
            <div className="flex items-center gap-2 truncate">
              <Mail className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
              <span className="font-mono font-medium text-slate-700 dark:text-slate-300 truncate">
                {email}
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                setStep(1);
                setOtp('');
                setNewPassword('');
                setConfirmPassword('');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className="text-[11px] font-bold text-cyan-600 dark:text-signal-cyan hover:underline flex-shrink-0 ml-2"
            >
              Thay đổi email
            </button>
          </div>

          {/* OTP Input */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Mã xác thực OTP (6 chữ số)
              </label>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">Hiệu lực 10 phút</span>
            </div>
            <div className="relative">
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                required
                autoFocus
                maxLength={6}
                placeholder="123456"
                value={otp}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setOtp(val);
                }}
                className="w-full text-center tracking-[0.5em] text-lg font-black py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:outline-none focus:border-slate-500 dark:focus:border-signal-cyan font-mono"
              />
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
              Mật khẩu mới
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Tối thiểu 6 ký tự"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full pl-9 pr-10 py-2.5 text-xs font-medium rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-slate-500 dark:focus:border-signal-cyan"
              />
              <Key className="w-4 h-4 text-slate-500 dark:text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm New Password */}
          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
              Xác nhận mật khẩu mới
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                required
                placeholder="Nhập lại mật khẩu mới"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-9 pr-10 py-2.5 text-xs font-medium rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-slate-500 dark:focus:border-signal-cyan"
              />
              <Key className="w-4 h-4 text-slate-500 dark:text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Resend Code Button & Countdown */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Không nhận được mã?
            </span>
            {countdown > 0 ? (
              <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">
                Gửi lại sau <strong className="font-mono text-slate-700 dark:text-slate-300">{countdown}s</strong>
              </span>
            ) : (
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resending}
                className="text-[11px] font-bold text-cyan-600 dark:text-signal-cyan hover:underline inline-flex items-center gap-1 disabled:opacity-50"
              >
                <RotateCcw className="w-3 h-3" />
                <span>{resending ? 'Đang gửi...' : 'Gửi lại mã OTP'}</span>
              </button>
            )}
          </div>

          {/* Spam Folder Tip Box */}
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
            💡 <strong>Mẹo:</strong> Nếu không thấy thư trong Hộp thư đến, bạn vui lòng kiểm tra thư mục <strong>Thư rác (Spam)</strong> hoặc tab <strong>Cập nhật / Quảng cáo</strong> trên Gmail.
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100 font-bold text-xs flex items-center justify-center gap-2 shadow-md disabled:opacity-50 transition-all mt-2"
          >
            {loading ? (
              <span>Đang xử lý đặt lại...</span>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
                <span>Đặt Lại Mật Khẩu & Đăng Nhập</span>
              </>
            )}
          </button>

          <div className="pt-2 text-center text-xs text-slate-600 dark:text-slate-400 font-medium">
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-1.5 font-bold text-slate-950 dark:text-white hover:underline"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Quay lại trang Đăng Nhập</span>
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}
