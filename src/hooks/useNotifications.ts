import { useEffect, useRef } from 'react';
import { useNotificationStore } from '@/store/useNotificationStore';
import { API_BASE_URL, fetchApi } from '@/lib/api';
import Cookies from 'js-cookie';
import { toast } from 'sonner';
import { useConfirmStore } from '@/store/useConfirmStore';
import { useSWRConfig } from 'swr';

export function useNotifications() {
  const { addNotification, setNotifications } = useNotificationStore();
  const eventSourceRef = useRef<EventSource | null>(null);
  const confirm = useConfirmStore((state) => state.confirm);
  const { mutate } = useSWRConfig();

  // 1. Fetch initial history (Ngầm để đồng bộ với server)
  useEffect(() => {
    async function fetchHistory() {
      try {
        // Fetch ngầm để cập nhật thông tin mới nhất từ server
        // Store đã có dữ liệu từ LocalStorage (Zustand Persist) nên UI sẽ hiện ngay lập tức
        const res: any = await fetchApi('/notifications');
        if (res.success) {
          setNotifications(res.data);
        }
      } catch (err) {
        console.error("Failed to fetch notification history", err);
      }
    }
    
    // Đợi 1 chút để ứng dụng ổn định trước khi sync ngầm
    const timer = setTimeout(fetchHistory, 1000);
    return () => clearTimeout(timer);
  }, [setNotifications]);


  // 2. Setup SSE Stream
  useEffect(() => {
    let reconnectTimeout: any;

    function connect() {
      const token = Cookies.get('access_token');
      if (!token) return;

      // Clean up old connection
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      const url = `${API_BASE_URL}/notifications/stream?token=${token}`;
      const es = new EventSource(url);
      eventSourceRef.current = es;

      es.addEventListener('notification', (event) => {
        try {
          const notification = JSON.parse(event.data);
          const docId = notification?.data?.doc_id as string | undefined;
          addNotification(notification);
          
          // Toast mượt mà
          toast(notification.title, {
            description: notification.message,
            duration: 5000,
          });

          // Nếu là sự kiện xóa tài liệu, hiển thị Dialog thông báo dọn dẹp
          if (notification.type === 'document_deleted') {
              mutate("/documents");
              mutate("/collections");
              if (docId) {
                mutate(`/documents/${docId}`);
              }
              confirm({
                  title: "Dọn dẹp hệ thống",
                  message: "Tài liệu của bạn đã được dọn dẹp sau khi hết hạn.",
                  confirmLabel: "Tôi đã hiểu",
                  hideCancel: true,
                  onConfirm: () => {}
              });
          }

          if (notification.type === 'document_expired') {
              mutate("/documents");
              mutate("/collections");
              if (docId) {
                mutate(`/documents/${docId}`);
              }
          }

          // Case: Quota update (pinned docs) - Silent update
          if (notification.type === 'quota_update') {
              console.log("🔄 SSE: Quota updated, refreshing user data...");
              mutate("/documents");
              mutate("/collections");
              mutate('/auth/me');
              return; // Tránh hiển thị thông báo ghim trùng lặp nếu không cần
          }
        } catch (err) {
          console.error("Error parsing notification data", err);
        }
      });

      es.addEventListener('error', (err) => {
        console.warn("SSE Notification Error, reconnecting...", err);
        es.close();
        reconnectTimeout = setTimeout(connect, 5000);
      });
    }

    connect();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      clearTimeout(reconnectTimeout);
    };
  }, [addNotification, confirm]);

  return null;
}
