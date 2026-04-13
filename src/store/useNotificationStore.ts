import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Notification {
  id: string;
  user_id: string;
  type: 'document_expired' | 'document_deleted' | 'system';
  title: string;
  message: string;
  data: any;
  read_at: string | null;
  created_at: string;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  setNotifications: (notifications: Notification[]) => void;
  addNotification: (notification: Notification) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  clearAll: () => void;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set) => ({
      notifications: [],
      unreadCount: 0,
      setNotifications: (notifications) => set({ 
        notifications, 
        unreadCount: notifications.filter(n => !n.read_at).length 
      }),
      addNotification: (notification) => set((state) => {
        // Tránh trùng lặp ID
        if (state.notifications.some(n => n.id === notification.id)) return state;
        const newNotifications = [notification, ...state.notifications].slice(0, 50);
        return {
          notifications: newNotifications,
          unreadCount: newNotifications.filter(n => !n.read_at).length
        };
      }),
      markAsRead: (id) => set((state) => {
        const newNotifications = state.notifications.map(n => 
          n.id === id ? { ...n, read_at: new Date().toISOString() } : n
        );
        return {
          notifications: newNotifications,
          unreadCount: newNotifications.filter(n => !n.read_at).length
        };
      }),
      markAllAsRead: () => set((state) => ({
        notifications: state.notifications.map(n => ({ ...n, read_at: new Date().toISOString() })),
        unreadCount: 0
      })),
      deleteNotification: (id) => set((state) => {
        const newNotifications = state.notifications.filter(n => n.id !== id);
        return {
          notifications: newNotifications,
          unreadCount: newNotifications.filter(n => !n.read_at).length
        };
      }),
      clearAll: () => set({
        notifications: [],
        unreadCount: 0
      }),
    }),
    {
      name: 'mindex_notifications',
    }
  )
);

