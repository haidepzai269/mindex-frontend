import { create } from 'zustand';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: any[];
  timestamp: string;
  log_id?: string; // AI response log ID — dùng cho thumbs rating
}


interface ChatStore {
  messages: ChatMessage[];
  isStreaming: boolean;
  currentStreamText: string;
  sessionId: string | null;
  pendingLogId: string | null; // log_id từ event done, chưa gắn vào message
  
  setMessages: (messages: ChatMessage[]) => void;
  setSessionId: (id: string | null) => void;
  addMessage: (message: ChatMessage) => void;
  updateLastAssistantLogId: (logId: string) => void;
  setPendingLogId: (id: string | null) => void;
  setIsStreaming: (isStreaming: boolean) => void;
  setCurrentStreamText: (text: string) => void;
  appendStreamText: (token: string) => void;
  clearChat: () => void;
}


export const useChatStore = create<ChatStore>((set) => ({
  messages: [],
  isStreaming: false,
  currentStreamText: '',
  sessionId: null as string | null,
  pendingLogId: null as string | null,

  setMessages: (messages: ChatMessage[]) => set({ messages }),
  setSessionId: (sessionId) => set({ sessionId }),
  setPendingLogId: (id) => set({ pendingLogId: id }),
  
  addMessage: (message) => set((state) => ({ 
    messages: [...state.messages, message] 
  })),

  // Cập nhật log_id cho assistant message cuối cùng
  updateLastAssistantLogId: (logId) => set((state) => {
    const msgs = [...state.messages];
    for (let i = msgs.length - 1; i >= 0; i--) {
      if (msgs[i].role === 'assistant') {
        msgs[i] = { ...msgs[i], log_id: logId };
        break;
      }
    }
    return { messages: msgs };
  }),

  setIsStreaming: (isStreaming) => set({ isStreaming }),

  setCurrentStreamText: (text) => set({ currentStreamText: text }),

  appendStreamText: (token) => set((state) => ({ 
    currentStreamText: state.currentStreamText + token 
  })),

  clearChat: () => set({ messages: [], currentStreamText: '', isStreaming: false, sessionId: null, pendingLogId: null }),
 }));

