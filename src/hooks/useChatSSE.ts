import { useState, useCallback, useRef } from 'react';
import { useChatStore } from '@/store/useChatStore';
import { API_BASE_URL, handleRefreshToken } from '@/lib/api';
import Cookies from 'js-cookie';

export function useChatSSE() {
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  const { 
    setIsStreaming, 
    setCurrentStreamText, 
    appendStreamText, 
    addMessage,
    updateLastAssistantLogId,
    sessionId,
    setSessionId,
  } = useChatStore();


  const sendMessage = useCallback(async (targetId: string, question: string, forkId?: string, isCollection: boolean = false) => {
    if (!targetId || !question) return;

    setError(null);
    setIsStreaming(true);
    setCurrentStreamText('');

    console.log(`[SSE] Sending message. TargetID: ${targetId}, SessionID: ${sessionId || 'NEW_SESSION'}`);

    // Truyền tham số retry để tránh vòng lặp vô hạn
    const executeFetch = async (retryCount = 0): Promise<Response | null> => {
        const token = Cookies.get('access_token');
        const abortController = new AbortController();
        abortControllerRef.current = abortController;

        try {
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
                'Accept': 'text/event-stream',
            };

            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const payload = {
                ...(isCollection ? { collection_id: targetId } : { document_id: targetId }),
                session_id: sessionId,
                question: question,
                ...(forkId ? { fork_id: forkId } : {}),
            };

            console.log(`[SSE] Sending request to ${API_BASE_URL}/chat/message:`, payload);

            const response = await fetch(`${API_BASE_URL}/chat/message`, {
                method: 'POST',
                signal: abortController.signal,
                headers,
                credentials: 'include',
                body: JSON.stringify(payload)
            });

            if (response.status === 401 && retryCount < 1) {
                console.log("[SSE] 401 Unauthorized. Attempting token refresh...");
                try {
                    await handleRefreshToken();
                    return executeFetch(retryCount + 1);
                } catch (err) {
                    setError("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
                    return null;
                }
            }

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error("SSE Connection Error:", response.status, errorData);
                setError(errorData.message || `Lỗi kết nối AI (${response.status})`);
                return null;
            }

            return response;
        } catch (err: any) {
            if (err.name !== 'AbortError') {
                console.error("Chat SSE Fetch Failure:", err);
                setError("Không thể kết nối với máy chủ AI.");
            }
            return null;
        }
    };

    // Thêm tin nhắn user vào UI ngay lập tức
    addMessage({
      id: Date.now().toString(),
      role: 'user',
      content: question,
      timestamp: new Date().toISOString()
    });

    const response = await executeFetch();
    if (!response) {
        setIsStreaming(false);
        return;
    }

    try {
      const reader = response.body?.getReader();
      if (!reader) throw new Error('Không thể khởi tạo luồng dữ liệu.');

      const decoder = new TextDecoder();
      let fullAnswerText = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // Decode và ghép vào buffer
        buffer += decoder.decode(value, { stream: true });

        // Tách các sự kiện SSE theo chuẩn \n\n
        const parts = buffer.split('\n\n');
        buffer = parts.pop() || ''; // Phần cuối cùng chưa hoàn chỉnh giữ lại trong buffer

        for (const part of parts) {
            const lines = part.split('\n');
            let eventType = 'message';
            let dataStr = '';

            for (const line of lines) {
                if (line.startsWith('event: ')) {
                    eventType = line.slice(7).trim();
                } else if (line.startsWith('data: ')) {
                    dataStr = line.slice(6).trim();
                }
            }

            if (!dataStr) continue;

            // Xử lý logic dựa trên event type
            if (eventType === 'token') {
                try {
                    const parsed = JSON.parse(dataStr);
                    if (parsed.token) {
                        appendStreamText(parsed.token);
                        fullAnswerText += parsed.token;
                    }
                } catch (e) {
                    console.warn("JSON error in token:", dataStr);
                }
            } else if (eventType === 'done') {
                try {
                    const parsed = JSON.parse(dataStr);
                    console.log(`[SSE] Received done event. Session from server: ${parsed.session_id}`);
                    
                    if (parsed.session_id && sessionId !== parsed.session_id) {
                        console.log(`[SSE] Updating session ID: ${sessionId} -> ${parsed.session_id}`);
                        setSessionId(parsed.session_id);
                        localStorage.setItem(isCollection ? `mindex_col_session_${targetId}` : `mindex_session_${targetId}`, parsed.session_id);
                    }
                    addMessage({
                        id: (Date.now() + 1).toString(),
                        role: 'assistant',
                        content: fullAnswerText,
                        sources: parsed.sources || [],
                        timestamp: new Date().toISOString(),
                        log_id: parsed.log_id || undefined, // Gắn log_id để thumbs rating UI
                    });
                    setIsStreaming(false);
                    setCurrentStreamText('');
                    return; // Kết thúc hoàn toàn
                } catch (e) {
                    console.error("[SSE] Error parsing done event:", e);
                    setIsStreaming(false);
                }
            } else if (eventType === 'error') {
                console.error("[SSE] AI Engine Error event received");
                setError("AI Engine Error");
                setIsStreaming(false);
            }
        }
      }

      // Finalize nếu loop kết thúc mà chưa nhận event: done
      setIsStreaming(false);

    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error("Chat SSE Failure:", err);
        setError("Kết nối AI bị gián đoạn.");
      }
      setIsStreaming(false);
    }
  }, [addMessage, updateLastAssistantLogId, setIsStreaming, setCurrentStreamText, appendStreamText, sessionId, setSessionId]);


  const stopStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      console.log("[SSE] Manually stopping stream");
      abortControllerRef.current.abort();
      setIsStreaming(false);
    }
  }, [setIsStreaming]);

  return { sendMessage, stopStreaming, error };
}
