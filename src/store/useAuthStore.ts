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
        // 1. Reset local state và xóa localStorage ngay lập tức
        set({ user: null, quota: null, isAuthenticated: false });
        
        if (typeof window !== 'undefined') {
          try {
            // 2. Xóa sạch cookies ở phía Client bằng js-cookie (Chống lỗi cross-domain)
            Cookies.remove('access_token', { path: '/' });
            Cookies.remove('refresh_token', { path: '/' });

            // 3. Gọi đồng thời cả API Backend và API nội bộ Next.js để xóa HttpOnly Cookies
            await Promise.allSettled([
              fetch(`${API_BASE_URL}/auth/logout`, { 
                method: 'POST',
                credentials: 'include'
              }),
              fetch('/api/auth/logout', { 
                method: 'POST'
              })
            ]);
          } catch (e) {
            console.error("Logout process partial failure:", e);
          } finally {
            // 4. Dọn dẹp cuối cùng và cưỡng chế chuyển hướng
            localStorage.removeItem('mindex-auth-storage');
            window.location.href = '/login';
          }
        }
      },
    }),
    {
      name: 'mindex-auth-storage', // Tên key trong localStorage
      storage: createJSONStorage(() => localStorage), // Lưu vào localStorage
    }
  )
);
