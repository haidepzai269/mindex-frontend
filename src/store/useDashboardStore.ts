import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

type Period = '7d' | '30d' | '6m' | '1y';
type ViewMode = 'overview' | 'detailed';

interface DashboardState {
  period: Period;
  viewMode: ViewMode;
  setPeriod: (period: Period) => void;
  setViewMode: (mode: ViewMode) => void;
}

export const useDashboardStore = create<DashboardState>()(
  persist(
    (set) => ({
      period: '7d',
      viewMode: 'overview',
      setPeriod: (period) => set({ period }),
      setViewMode: (viewMode) => set({ viewMode }),
    }),
    {
      name: 'mindex-dashboard',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ viewMode: state.viewMode }),
    }
  )
);
