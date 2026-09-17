import { useAuthStore } from '@/store/authStore';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export async function fetchApi<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; message?: string }> {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  // Read token from active Zustand store or current tab's sessionStorage if in browser
  let token: string | null = null;
  if (typeof window !== 'undefined') {
    try {
      token = useAuthStore.getState().token;
      if (!token) {
        const authData = window.sessionStorage.getItem('techgear_auth_storage');
        if (authData) {
          const parsed = JSON.parse(authData);
          token = parsed.state?.token || parsed?.token || null;
        }
      }
    } catch {
      // ignore storage access error
    }
  }

  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  try {
    const res = await fetch(url, {
      ...options,
      headers,
    });

    const contentType = res.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');
    let json: any = null;
    if (isJson) {
      try {
        json = await res.json();
      } catch {
        json = null;
      }
    }

    if (res.status === 401) {
      if (typeof window !== 'undefined') {
        useAuthStore.getState().logout();
      }
      return {
        success: false,
        message: json?.message || 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
        data: json?.data,
      };
    }

    if (!res.ok) {
      return {
        success: false,
        message: json?.message || `Yêu cầu thất bại (${res.status})`,
        data: json?.data,
      };
    }

    if (json && typeof json === 'object' && !('success' in json)) {
      json.success = true;
    }

    return json || { success: true };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Không thể kết nối tới máy chủ',
    };
  }
}
