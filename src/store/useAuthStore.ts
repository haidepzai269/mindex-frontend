import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

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
        set({ user: null, quota: null, isAuthenticated: false });
        sessionStorage.removeItem('mindex-auth-storage');

        if (typeof window !== 'undefined') {
          // httpOnly cookies không thể xóa bằng JS — server routes lo việc này
          const performLogout = async () => {
            try {
              await Promise.allSettled([
                fetch(`${API_BASE_URL}/auth/logout`, { method: 'POST', credentials: 'include', headers: { 'X-Requested-With': 'XMLHttpRequest' } }),
                fetch('/api/auth/logout', { method: 'POST' }),
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
      name: 'mindex-auth-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
