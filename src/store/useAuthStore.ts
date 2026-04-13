import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import Cookies from 'js-cookie';

export interface Quota {
  pinnedCount: number;
  maxPins: number;
  pinnedDocs?: number;
  pinnedDocsLimit?: number;
  publicDocs?: number;
  publicDocsLimit?: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  bio?: string;
  urls?: string[];
  avatar_url?: string;
  role: 'user' | 'admin';
  tier?: string;
  quota: Quota;
}

interface AuthStore {
  user: User | null;
  quota: Quota | null;
  isAuthenticated: boolean;
  setUser: (user: User) => void;
  updateQuota: (quota: Quota) => void;
  logout: () => void;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      quota: null,
      isAuthenticated: false,
      setUser: (user) => set({ user, quota: user.quota, isAuthenticated: true }),
      updateQuota: (quota) => set({ quota }),
      logout: async () => {
        // 1. Reset local state ngay lập tức
        set({ user: null, quota: null, isAuthenticated: false });
        localStorage.removeItem('mindex-auth-storage');
        
        if (typeof window !== 'undefined') {
          // 2. Chuyển hướng ngay lập tức (Fast Logout) - không đợi API
          // Việc xóa cookie sẽ chạy ngầm, middleware sẽ lo phần còn lại ở lần load trang sau
          const domain = window.location.hostname.endsWith('mindex.io.vn') ? '.mindex.io.vn' : undefined;
          
          const performLogout = async () => {
            try {
              Cookies.remove('access_token', { path: '/', domain });
              Cookies.remove('refresh_token', { path: '/', domain });

              await Promise.allSettled([
                fetch(`${API_BASE_URL}/auth/logout`, { method: 'POST', credentials: 'include' }),
                fetch('/api/auth/logout', { method: 'POST' })
              ]);
            } catch (e) {
              console.error("Background logout failed:", e);
            }
          };

          performLogout();
          window.location.href = '/login';
        }
      },
    }),
    {
      name: 'mindex-auth-storage', // Tên key trong localStorage
      storage: createJSONStorage(() => localStorage), // Lưu vào localStorage
    }
  )
);
