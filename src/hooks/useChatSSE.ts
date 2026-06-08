import { useState, useCallback, useRef } from 'react';
import { useChatStore, type ChatAttachment } from '@/store/useChatStore';
import { API_BASE_URL, handleRefreshToken } from '@/lib/api';
import Cookies from 'js-cookie';

type ChatMode = 'document' | 'collection' | 'global_ai';

function getQuestionPreview(question: string) {
  const cleanQuestion = question.replace(/\s+/g, ' ').trim();
  return cleanQuestion.length > 96 ? `${cleanQuestion.slice(0, 96)}...` : cleanQuestion;
}

function buildInitialStreamInsights(question: string, chatMode: ChatMode) {
  const preview = getQuestionPreview(question);
  const sourceInsight =
    chatMode === 'global_ai'
      ? 'Kiểm tra Thư viện chung Mindex và các nguồn bổ sung có liên quan.'
      : chatMode === 'collection'
        ? 'Đọc ngữ cảnh từ bộ tài liệu đã chọn và lịch sử hội thoại gần nhất.'
        : 'Đọc ngữ cảnh từ tài liệu đang mở và lịch sử hội thoại gần nhất.';

  return [
    `Người dùng hỏi: "${preview}". Đang xác định ý chính cần trả lời.`,
    sourceInsight,
    'Đánh giá xem câu hỏi cần trả lời trực tiếp, đối chiếu nguồn, hay bổ sung tìm kiếm.',
    'Sắp xếp các dữ kiện liên quan để câu trả lời có cấu trúc và không lệch khỏi nguồn.',
    'Chuẩn bị phần trả lời cuối cùng, kèm nguồn trích dẫn nếu có.',
  ];
}

export function useChatSSE() {
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  const { 
    setIsStreaming, 
    setCurrentStreamText, 
    setStreamInsights,
    appendStreamInsight,
    setStreamStatus,
    appendStreamText, 
    addMessage,
    updateLastAssistantLogId,
    sessionId,
    setSessionId,
  } = useChatStore();


  const sendMessage = useCallback(async (targetId: string, question: string, forkId?: string, isCollection: boolean = false, model?: string, thinking: boolean = false, mode?: ChatMode, attachments: ChatAttachment[] = []) => {
    if (!targetId || !question) return;

    const chatMode: ChatMode = mode ?? (isCollection ? 'collection' : 'document');
    const isGlobalAI = chatMode === 'global_ai';
    const readyAttachments = isGlobalAI ? [] : attachments.filter((attachment) => attachment.status !== 'error');

    setError(null);
    setIsStreaming(true);
    setCurrentStreamText('');
    const initialInsights = buildInitialStreamInsights(question, chatMode);
    setStreamInsights(initialInsights.slice(0, 2));
    setStreamStatus('thinking');
    const scheduledInsightTimers: ReturnType<typeof setTimeout>[] = [];
    let receivedBackendInsight = false;
    const scheduleInsight = (insight: string, delay: number) => {
        const timer = setTimeout(() => appendStreamInsight(insight), delay);
        scheduledInsightTimers.push(timer);
    };
    const clearScheduledInsights = () => {
        scheduledInsightTimers.forEach((timer) => clearTimeout(timer));
    };
    initialInsights.slice(2).forEach((insight, index) => {
        scheduleInsight(insight, 700 + index * 900);
    });

    console.log(`[SSE] Sending message. Mode: ${chatMode}, TargetID: ${targetId}, SessionID: ${sessionId || 'NEW_SESSION'}, Model: ${model || 'default'}`);

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

            const payload = isGlobalAI
                ? {
                    session_id: sessionId || targetId,
                    question: question,
                    ...(model ? { model: model } : {}),
                    ...(thinking ? { thinking: true } : {}),
                }
                : {
                    ...(isCollection ? { collection_id: targetId } : { document_id: targetId }),
                    session_id: sessionId,
                    question: question,
                    ...(forkId ? { fork_id: forkId } : {}),
                    ...(model ? { model: model } : {}),
                    ...(thinking ? { thinking: true } : {}),
                    ...(readyAttachments.length > 0 ? {
                        attachment_ids: readyAttachments.map((attachment) => attachment.id),
                        attachment_overrides: readyAttachments.map((attachment) => ({
                            attachment_id: attachment.id,
                            ocr_text: attachment.ocr_text || attachment.ocr_preview || '',
                        })),
                    } : {}),
                };

            const endpoint = isGlobalAI ? `${API_BASE_URL}/chat/ai/message` : `${API_BASE_URL}/chat/message`;

            console.log(`[SSE] Sending request to ${endpoint}:`, payload);

            const response = await fetch(endpoint, {
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
      ...(readyAttachments.length > 0 ? { attachments: readyAttachments } : {}),
      timestamp: new Date().toISOString()
    });

    const response = await executeFetch();
    if (!response) {
        clearScheduledInsights();
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
                        if (!fullAnswerText) {
                            appendStreamInsight('Đã bắt đầu nhận nội dung trả lời từ AI, đang truyền kết quả về giao diện.');
                        }
                        setStreamStatus('thinking');
                        appendStreamText(parsed.token);
                        fullAnswerText += parsed.token;
                    }
                } catch (e) {
                    console.warn("JSON error in token:", dataStr);
                }
            } else if (eventType === 'status') {
                try {
                    const parsed = JSON.parse(dataStr);
                    if (parsed.status === 'searching' || parsed.status === 'thinking') {
                        setStreamStatus(parsed.status);
                        if (!receivedBackendInsight) {
                            appendStreamInsight(
                                parsed.status === 'searching'
                                    ? (parsed.message || 'Đang tìm kiếm nguồn bổ sung để kiểm chứng câu trả lời.')
                                    : (parsed.message || 'Đang tổng hợp ngữ cảnh và chuẩn bị câu trả lời.')
                            );
                        }
                    }
                } catch (e) {
                    console.warn("JSON error in status:", dataStr);
                }
            } else if (eventType === 'insight') {
                try {
                    const parsed = JSON.parse(dataStr);
                    const insight = parsed.text || parsed.message || "";
                    if (insight) {
                        if (!receivedBackendInsight) {
                            receivedBackendInsight = true;
                            clearScheduledInsights();
                            setStreamInsights([]);
                        }
                        appendStreamInsight(insight);
                    }
                } catch (e) {
                    console.warn("JSON error in insight:", dataStr);
                }
            } else if (eventType === 'done') {
                try {
                    const parsed = JSON.parse(dataStr);
                    console.log(`[SSE] Received done event. Session from server: ${parsed.session_id}`);
                    const finalAnswerText =
                        parsed.answer ||
                        parsed.content ||
                        parsed.full_answer ||
                        fullAnswerText ||
                        "";
                    
                    if (parsed.session_id && sessionId !== parsed.session_id) {
                        console.log(`[SSE] Updating session ID: ${sessionId} -> ${parsed.session_id}`);
                        setSessionId(parsed.session_id);
                        if (isGlobalAI) {
                            sessionStorage.setItem('mindex_ai_active_session', parsed.session_id);
                            sessionStorage.setItem(`mindex_ai_session_${parsed.session_id}`, parsed.session_id);
                        } else {
                            sessionStorage.setItem(isCollection ? `mindex_col_session_${targetId}` : `mindex_session_${targetId}`, parsed.session_id);
                        }
                    }

                    if (!finalAnswerText.trim()) {
                        clearScheduledInsights();
                        console.error("[SSE] Done event received without streamed or final answer content.");
                        setError("AI trả về nội dung rỗng. Vui lòng thử lại.");
                        setIsStreaming(false);
                        setCurrentStreamText('');
                        setStreamStatus('thinking');
                        return;
                    }

                    clearScheduledInsights();
                    appendStreamInsight('Hoàn tất phân tích, đang hiển thị câu trả lời.');
                    addMessage({
                        id: (Date.now() + 1).toString(),
                        role: 'assistant',
                        content: finalAnswerText,
                        sources: parsed.sources || [],
                        timestamp: new Date().toISOString(),
                        log_id: parsed.log_id || undefined, // Gắn log_id để thumbs rating UI
                    });
                    setIsStreaming(false);
                    setCurrentStreamText('');
                    setStreamStatus('thinking');
                    return; // Kết thúc hoàn toàn
                } catch (e) {
                    clearScheduledInsights();
                    console.error("[SSE] Error parsing done event:", e);
                    setIsStreaming(false);
                }
            } else if (eventType === 'error') {
                clearScheduledInsights();
                console.error("[SSE] AI Engine Error event received");
                setError("AI Engine Error");
                setIsStreaming(false);
                setStreamStatus('thinking');
            }
        }
      }

      // Finalize nếu loop kết thúc mà chưa nhận event: done
      if (fullAnswerText.trim()) {
        clearScheduledInsights();
        addMessage({
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: fullAnswerText,
          timestamp: new Date().toISOString(),
        });
        setCurrentStreamText('');
      }
      setIsStreaming(false);
      setStreamStatus('thinking');

    } catch (err: any) {
      clearScheduledInsights();
      if (err.name !== 'AbortError') {
        console.error("Chat SSE Failure:", err);
        setError("Kết nối AI bị gián đoạn.");
      }
      setIsStreaming(false);
      setStreamStatus('thinking');
    }
  }, [addMessage, updateLastAssistantLogId, setIsStreaming, setCurrentStreamText, setStreamInsights, appendStreamInsight, setStreamStatus, appendStreamText, sessionId, setSessionId]);


  const stopStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      console.log("[SSE] Manually stopping stream");
      abortControllerRef.current.abort();
      setIsStreaming(false);
      setStreamInsights([]);
      setStreamStatus('thinking');
    }
  }, [setIsStreaming, setStreamInsights, setStreamStatus]);

  return { sendMessage, stopStreaming, error };
}
