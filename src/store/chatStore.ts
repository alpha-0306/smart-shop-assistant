import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  language?: string;
  actions?: Array<{
    type: 'order' | 'snooze';
    productId?: string;
    quantity?: number;
    days?: number;
  }>;
}

interface ChatStore {
  messages: ChatMessage[];
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  clearMessages: () => void;
  loadFromStorage: () => Promise<void>;
  saveToStorage: () => Promise<void>;
}

const STORAGE_KEY = '@smart_shop_chat';
const MAX_MESSAGES = 40; // Keep last 20 exchanges (40 messages)

export const useChatStore = create<ChatStore>((set, get) => ({
  messages: [],

  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const newMessage: ChatMessage = {
      ...message,
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      timestamp: Date.now(),
    };

    set((state) => {
      const updatedMessages = [...state.messages, newMessage];
      // Keep only last MAX_MESSAGES
      const trimmedMessages =
        updatedMessages.length > MAX_MESSAGES
          ? updatedMessages.slice(-MAX_MESSAGES)
          : updatedMessages;
      return { messages: trimmedMessages };
    });

    get().saveToStorage();
  },

  clearMessages: () => {
    set({ messages: [] });
    get().saveToStorage();
  },

  loadFromStorage: async () => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      if (data) {
        const messages = JSON.parse(data);
        set({ messages });
      }
    } catch (error) {
      console.error('Failed to load chat from storage:', error);
      // Reset to empty state on error
      set({ messages: [] });
    }
  },

  saveToStorage: async () => {
    try {
      const { messages } = get();
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch (error) {
      console.error('Failed to save chat to storage:', error);
      // Don't throw - allow app to continue
    }
  },
}));
