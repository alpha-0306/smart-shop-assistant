import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useInventoryStore } from './inventoryStore';

export interface Restock {
  id: string;
  productId: string;
  quantity: number;
  costPerUnit?: number;
  supplier?: string;
  timestamp: number;
  expiryDate?: number | null;
  batchId?: string;
  consumed?: number;
}

interface RestockStore {
  restocks: Restock[];
  addRestock: (r: Omit<Restock, 'id' | 'timestamp' | 'consumed'>) => void;
  consumeFromRestock: (restockId: string, qty: number) => void;
  getRestocksForProduct: (productId: string) => Restock[];
  getExpiringSoon: (days: number) => Restock[];
  getExpiredRestocks: () => Restock[];
  markRestockDiscarded: (restockId: string) => void;
  loadFromStorage: () => Promise<void>;
  saveToStorage: () => Promise<void>;
}

const STORAGE_KEY = '@smart_shop_restock_v1';

export const useRestockStore = create<RestockStore>((set, get) => ({
  restocks: [],

  addRestock: ({ productId, quantity, costPerUnit, supplier, expiryDate, batchId }) => {
    const newRestock: Restock = {
      id: `restock_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      productId,
      quantity,
      costPerUnit,
      supplier,
      timestamp: Date.now(),
      expiryDate: expiryDate || null,
      batchId: batchId || undefined,
      consumed: 0,
    };

    set((state) => ({
      restocks: [...state.restocks, newRestock],
    }));

    // Update product stock
    useInventoryStore.getState().updateStock(productId, quantity);

    // Persist both stores
    get().saveToStorage();
    useInventoryStore.getState().saveToStorage();
  },

  consumeFromRestock: (restockId: string, qty: number) => {
    set((state) => ({
      restocks: state.restocks.map((r) =>
        r.id === restockId
          ? { ...r, consumed: (r.consumed || 0) + qty }
          : r
      ),
    }));
    get().saveToStorage();
  },

  getRestocksForProduct: (productId: string) => {
    return get()
      .restocks.filter((r) => r.productId === productId)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 20);
  },

  getExpiringSoon: (days: number) => {
    const cutoff = Date.now() + days * 24 * 60 * 60 * 1000;
    return get().restocks.filter(
      (r) =>
        r.expiryDate &&
        r.expiryDate <= cutoff &&
        r.expiryDate > Date.now() &&
        (r.consumed || 0) < r.quantity
    );
  },

  getExpiredRestocks: () => {
    const now = Date.now();
    return get().restocks.filter(
      (r) =>
        r.expiryDate &&
        r.expiryDate <= now &&
        (r.consumed || 0) < r.quantity
    );
  },

  markRestockDiscarded: (restockId: string) => {
    const restock = get().restocks.find((r) => r.id === restockId);
    if (!restock) return;

    const remaining = restock.quantity - (restock.consumed || 0);
    
    // Mark as fully consumed
    set((state) => ({
      restocks: state.restocks.map((r) =>
        r.id === restockId ? { ...r, consumed: r.quantity } : r
      ),
    }));

    // Reduce product stock
    useInventoryStore.getState().updateStock(restock.productId, -remaining);

    get().saveToStorage();
    useInventoryStore.getState().saveToStorage();
  },

  loadFromStorage: async () => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      if (data) {
        const restocks = JSON.parse(data);
        set({ restocks });
      }
    } catch (error) {
      console.error('Failed to load restocks from storage:', error);
      // Reset to empty state on error
      set({ restocks: [] });
    }
  },

  saveToStorage: async () => {
    try {
      const { restocks } = get();
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(restocks));
    } catch (error) {
      console.error('Failed to save restocks to storage:', error);
      // Don't throw - allow app to continue
    }
  },
}));
