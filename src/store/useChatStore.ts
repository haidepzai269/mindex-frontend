import { create } from 'zustand';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: any[];
  timestamp: string;
}

interface ChatStore {
  messages: ChatMessage[];
  isStreaming: boolean;
  currentStreamText: string;
  sessionId: string | null;
  
  setMessages: (messages: ChatMessage[]) => void;
  setSessionId: (id: string | null) => void;
  addMessage: (message: ChatMessage) => void;
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

  setMessages: (messages: ChatMessage[]) => set({ messages }),
  setSessionId: (sessionId) => set({ sessionId }),
  
  addMessage: (message) => set((state) => ({ 
    messages: [...state.messages, message] 
  })),

  setIsStreaming: (isStreaming) => set({ isStreaming }),

  setCurrentStreamText: (text) => set({ currentStreamText: text }),

  appendStreamText: (token) => set((state) => ({ 
    currentStreamText: state.currentStreamText + token 
  })),

  clearChat: () => set({ messages: [], currentStreamText: '', isStreaming: false, sessionId: null }),
 }));
