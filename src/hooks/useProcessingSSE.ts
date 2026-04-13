import { useState, useEffect } from 'react';

export interface ProcessingStatus {
  status: 'pending' | 'downloading' | 'extracting' | 'moderating' | 'preprocessing' | 'embedding' | 'ready' | 'error';
  progress: number;
  message?: string;
}

export function useProcessingSSE(docID: string | null) {
  const [data, setData] = useState<ProcessingStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!docID) return;

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';
    const eventSource = new EventSource(`${apiUrl}/processing/status/${docID}`, { withCredentials: true });

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
