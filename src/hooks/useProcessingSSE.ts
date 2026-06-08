import { useState, useEffect } from 'react';
import { API_BASE_URL } from '@/lib/api';

export interface ProcessingStatus {
  status:
    | 'queued'
    | 'retrying'
    | 'pending'
    | 'downloading'
    | 'extracting'
    | 'analyzing'
    | 'moderating'
    | 'classifying'
    | 'preprocessing'
    | 'embedding'
    | 'ready'
    | 'error';
  progress: number;
  message?: string;
  error_code?: string;
}

export function useProcessingSSE(docID: string | null) {
  const [data, setData] = useState<ProcessingStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!docID) return;

    const eventSource = new EventSource(`${API_BASE_URL}/processing/status/${docID}`, { withCredentials: true });

    eventSource.onmessage = (event) => {
      try {
        const parsedData: ProcessingStatus = JSON.parse(event.data);
        setData(parsedData);

        if (parsedData.status === 'ready' || parsedData.status === 'error') {
          eventSource.close();
        }
      } catch (err) {
        console.error("Lỗi parse SSE data:", err);
      }
    };

    eventSource.onerror = (err) => {
      console.error("Lỗi kết nối SSE:", err);
      setError("Mất kết nối với máy chủ xử lý.");
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [docID]);

  return { data, error };
}
