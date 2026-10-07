'use client';

import { useEffect, useRef, useState } from 'react';

const GIS_SRC = 'https://accounts.google.com/gsi/client';
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

interface GoogleIdApi {
  initialize: (config: { client_id: string; callback: (res: { credential?: string }) => void }) => void;
  renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void;
}

declare global {
  interface Window {
    google?: { accounts: { id: GoogleIdApi } };
  }
}

let gisLoader: Promise<void> | null = null;

function loadGis(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.google?.accounts?.id) return Promise.resolve();
  if (!gisLoader) {
    gisLoader = new Promise((resolve, reject) => {
      const existing = document.querySelector<HTMLScriptElement>(`script[src="${GIS_SRC}"]`);
      if (existing) {
        if (window.google?.accounts?.id) {
          resolve();
          return;
        }
        existing.addEventListener('load', () => resolve());
        existing.addEventListener('error', () => {
          gisLoader = null;
          reject(new Error('Không tải được Google Sign-In (vui lòng kiểm tra kết nối mạng hoặc trình chặn quảng cáo)'));
        });
        return;
      }

      const script = document.createElement('script');
      script.src = GIS_SRC;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => {
        gisLoader = null;
        script.remove();
        reject(new Error('Không tải được Google Sign-In (vui lòng kiểm tra kết nối mạng hoặc trình chặn quảng cáo)'));
      };
      document.head.appendChild(script);
    });
  }
  return gisLoader;
}

interface GoogleLoginButtonProps {
  onCredential: (credential: string) => void;
  onError: (message: string) => void;
  text?: 'signin_with' | 'signup_with' | 'continue_with';
}

export default function GoogleLoginButton({ onCredential, onError, text = 'signin_with' }: GoogleLoginButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [gisReady, setGisReady] = useState(false);
  const callbacksRef = useRef({ onCredential, onError });
  callbacksRef.current = { onCredential, onError };

  const buttonLabel = text === 'signup_with' ? 'Đăng ký với Google' : 'Đăng nhập với Google';

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;
    let cancelled = false;

    loadGis()
      .then(() => {
        const gis = window.google?.accounts?.id;
        if (cancelled || !gis || !containerRef.current) return;
        gis.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (res) => {
            if (res.credential) callbacksRef.current.onCredential(res.credential);
            else callbacksRef.current.onError('Đăng nhập Google không thành công');
          },
        });
        if (containerRef.current) {
          containerRef.current.innerHTML = '';
          const containerWidth = containerRef.current.offsetWidth || 320;
          gis.renderButton(containerRef.current, {
            type: 'standard',
            theme: 'outline',
            size: 'large',
            text,
            shape: 'pill',
            locale: 'vi',
            width: Math.min(Math.max(containerWidth, 200), 400),
          });
          setGisReady(true);
        }
      })
      .catch((err: Error) => {
        if (!cancelled) callbacksRef.current.onError(err.message);
      });

    return () => {
      cancelled = true;
    };
  }, [text]);

  const handleUnconfiguredClick = () => {
    callbacksRef.current.onError(
      'Chưa cấu hình Google Client ID. Vui lòng thiết lập NEXT_PUBLIC_GOOGLE_CLIENT_ID trong frontend/.env.local (hướng dẫn chi tiết tại docs/GOOGLE_OAUTH_SETUP.md)'
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
        <span className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
        <span>hoặc</span>
        <span className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
      </div>

      {GOOGLE_CLIENT_ID ? (
        <div className="relative">
          <div
            ref={containerRef}
            className={`w-full flex justify-center min-h-[44px] ${!gisReady ? 'invisible absolute' : ''}`}
          />
          {!gisReady && (
            <div className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium text-xs shadow-sm">
              <svg className="w-4 h-4 flex-shrink-0 animate-pulse" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>{buttonLabel}</span>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-1.5">
          <button
            type="button"
            onClick={handleUnconfiguredClick}
            className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium text-xs hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors shadow-sm"
          >
            <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>{buttonLabel}</span>
          </button>
          <p className="text-[10px] text-amber-600 dark:text-amber-400 text-center font-medium">
            Chưa cấu hình Google Client ID (Xem docs/GOOGLE_OAUTH_SETUP.md)
          </p>
        </div>
      )}
    </div>
  );
}
