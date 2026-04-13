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
        // 1. Reset local state ngay lập tức để UI phản hồi nhanh
        set({ user: null, quota: null, isAuthenticated: false });
        
        if (typeof window !== 'undefined') {
          try {
            // 2. Gọi API logout - Backend sẽ chịu trách nhiệm xóa HttpOnly Cookies
            await fetch(`${API_BASE_URL}/auth/logout`, { 
              method: 'POST',
              credentials: 'include' // Quan trọng: Để trình duyệt gửi kèm cookies lên server xóa
            });
          } catch (e) {
            console.error("Logout API failed:", e);
          } finally {
            // 3. Xóa sạch localStorage và chuyển hướng
            localStorage.removeItem('mindex-auth-storage');
            window.location.replace('/login');
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
