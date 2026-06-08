import { useAuthStore } from "@/store/useAuthStore";

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';
export const WS_FEEDBACK_URL = process.env.NEXT_PUBLIC_WS_URL || API_BASE_URL.replace(/^https?/, (p) => p === 'https' ? 'wss' : 'ws') + '/ws/feedback';

export class APIError extends Error {
  status: number;
  data: unknown;
  
  constructor(message: string, status: number, data: unknown) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

let refreshPromise: Promise<string> | null = null;

// Hàm hỗ trợ refresh token sử dụng cơ chế Singleton Promise
export async function handleRefreshToken(): Promise<string> {
  if (refreshPromise) {
    console.log("[API] Refresh already in progress, joining existing promise...");
    return refreshPromise;
  }

  refreshPromise = (async () => {
    console.log("[API] Initiating token refresh call...");
    try {
      const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Quan trọng: Để gửi refresh_token cookie
      });

      if (refreshRes.ok) {
        const data = await refreshRes.json();
        const newAccessToken: string = data.data.access_token ?? "";
        const newRefreshToken: string = data.data.refresh_token ?? "";

        // Cập nhật httpOnly cookies qua server route (không thể dùng js-cookie cho httpOnly)
        if (newAccessToken) {
          fetch('/api/auth/set-tokens', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ access_token: newAccessToken, refresh_token: newRefreshToken || undefined }),
          }).catch(() => {});
        }

        console.log("[API] Token refresh successful.");
        return newAccessToken;
      } else {
        const errorData = await refreshRes.json().catch(() => ({}));
        console.error("[API] Refresh token failed:", errorData);
        
        if (typeof window !== 'undefined') {
            console.warn("[API] Global logout triggered due to refresh failure.");
            useAuthStore.getState().logout();
        }
        throw new Error('Refresh failed');
      }
    } catch (err) {
      console.error("[API] Error during refresh process:", err);
      throw err;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // 1. Khởi tạo Headers
  const headers = new Headers(options.headers);
  if (!(options.body instanceof FormData)) {
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
  } else {
    headers.delete('Content-Type');
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include', // Quan trọng: Luôn gửi kèm cookies
    });

    // 401 HANDLING (REACTIVE REFRESH)
    if (response.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/refresh')) {
      console.log(`[API] 401 Unauthorized for ${endpoint}. Attempting reactive refresh...`);
      
      try {
        await handleRefreshToken();
        console.log("[API] Token refreshed, retrying original request...");

        const retryResponse = await fetch(url, {
            ...options, 
            headers,
            credentials: 'include' 
        });
        const text = await retryResponse.text();
        return text ? JSON.parse(text) : ({} as T);
      } catch (err) {
        throw err;
      }
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new APIError(errorData?.message || 'API request failed', response.status, errorData);
    }

    const text = await response.text();
    return text ? JSON.parse(text) : ({} as T);
  } catch (error) {
    if (error instanceof APIError) throw error;
    throw new Error(error instanceof Error ? error.message : 'Network error');
  }
}

export const fetcher = (url: string) => fetchApi(url);
