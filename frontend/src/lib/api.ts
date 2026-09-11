const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export async function fetchApi<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; message?: string }> {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  // Read token from localStorage if in browser
  let token: string | null = null;
  if (typeof window !== 'undefined') {
    try {
      const authData = localStorage.getItem('techgear_auth_storage');
      if (authData) {
        const parsed = JSON.parse(authData);
        token = parsed.state?.token || null;
      }
    } catch {
      // ignore JSON parse error
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

    const json = await res.json();
    if (!res.ok) {
      return {
        success: false,
        message: json.message || 'Yêu cầu thất bại',
        data: json.data,
      };
    }
    return json;
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Không thể kết nối tới máy chủ',
    };
  }
}
