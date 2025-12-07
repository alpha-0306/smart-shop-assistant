import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ShopContext {
  shopName: string;
  ownerName: string;
  timezone: string;
  currency: string;
  primaryLanguage: 'en' | 'hi' | 'kn';
  secondaryLanguages: string[];
  openingHours: { open: string; close: string };
  busyHours: Array<{ start: number; end: number }>;
  paymentTypes: string[];
  typicalCustomers: string;
  preferredSuppliers: Array<{ name: string; contact: string; leadTimeDays: number }>;
  reorderThresholdDays: number;
  defaultTargetCoverageDays: number;
  priceRounding: number;
  demoMode: boolean;
  localTone: 'casual' | 'formal';
  shopAddressRegion: string;
  timeFormat: 12 | 24;
}

interface ShopContextStore {
  context: ShopContext;
  updateContext: (updates: Partial<ShopContext>) => void;
  loadFromStorage: () => Promise<void>;
  saveToStorage: () => Promise<void>;
}

const STORAGE_KEY = '@smart_shop_context';

const defaultContext: ShopContext = {
  shopName: 'My Kirana Store',
  ownerName: 'Owner',
  timezone: 'Asia/Kolkata',
  currency: '₹',
  primaryLanguage: 'en',
  secondaryLanguages: ['hi', 'kn'],
  openingHours: { open: '08:00', close: '21:00' },
  busyHours: [
    { start: 8, end: 10 },
    { start: 18, end: 20 },
  ],
  paymentTypes: ['cash', 'upi', 'card'],
  typicalCustomers: 'school kids morning, office workers noon',
  preferredSuppliers: [],
  reorderThresholdDays: 3,
  defaultTargetCoverageDays: 7,
  priceRounding: 1,
  demoMode: false,
  localTone: 'casual',
  shopAddressRegion: 'City',
  timeFormat: 12,
};

export const useShopContextStore = create<ShopContextStore>((set, get) => ({
  context: defaultContext,

  updateContext: (updates: Partial<ShopContext>) => {
    set((state) => ({
      context: { ...state.context, ...updates },
    }));
    get().saveToStorage();
  },

  loadFromStorage: async () => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      if (data) {
        const context = JSON.parse(data);
        set({ context: { ...defaultContext, ...context } });
      }
    } catch (error) {
      console.error('Failed to load shop context from storage:', error);
      // Reset to default context on error
      set({ context: defaultContext });
    }
  },

  saveToStorage: async () => {
    try {
      const { context } = get();
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(context));
    } catch (error) {
      console.error('Failed to save shop context to storage:', error);
      // Don't throw - allow app to continue
    }
  },
}));
