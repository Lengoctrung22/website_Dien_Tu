'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log unhandled errors for observability
    console.error('[ErrorBoundary] Unhandled application error:', error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-lg w-full bg-white dark:bg-surface-card border hairline-border surface-bevel rounded-2xl p-8 text-center space-y-6 shadow-2xl">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 dark:text-signal-amber flex items-center justify-center mx-auto shadow-sm">
          <AlertTriangle className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400">
            Sự Cố Hệ Thống // ERROR BOUNDARY
          </span>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Đã xảy ra lỗi không mong muốn
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
            {error.message || 'Hệ thống tạm thời gặp trục trặc khi tải trang này. Vui lòng thử tải lại hoặc quay về trang chủ.'}
          </p>
        </div>

        {error.digest && (
          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-surface-subtle/50 border hairline-border text-left">
            <p className="text-[10px] font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider">Mã sự cố (Digest):</p>
            <p className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 break-all">{error.digest}</p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={() => reset()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-signal-cyan dark:text-slate-950 dark:hover:bg-cyan-300 font-mono font-bold text-xs shadow-md surface-bevel active:translate-y-0.5 transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Thử lại</span>
          </button>
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border hairline-border bg-white dark:bg-surface-card hover:bg-slate-100 dark:hover:bg-surface-subtle text-slate-700 dark:text-slate-200 font-mono font-semibold text-xs surface-bevel active:translate-y-0.5 transition-all"
          >
            <Home className="w-4 h-4" />
            <span>Về trang chủ</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
