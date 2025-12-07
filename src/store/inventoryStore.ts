import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  popularity: number;
  photoUri?: string;
  category?: string; // Auto-detected or manual
  lowStockThreshold?: number; // Default: 2
}

interface InventoryStore {
  products: Product[];
  addProduct: (product: Product) => void;
  updateStock: (productId: string, delta: number) => void;
  getLowStockProducts: () => Product[];
  loadFromStorage: () => Promise<void>;
  saveToStorage: () => Promise<void>;
}

const STORAGE_KEY = '@smart_shop_inventory';

export const useInventoryStore = create<InventoryStore>((set, get) => ({
  products: [],

  addProduct: (product: Product) => {
    set((state) => ({
      products: [...state.products, product],
    }));
    get().saveToStorage();
  },

  updateStock: (productId: string, delta: number) => {
    set((state) => ({
      products: state.products.map((p) =>
        p.id === productId ? { ...p, stock: p.stock + delta } : p
      ),
    }));
    get().saveToStorage();
  },

  getLowStockProducts: () => {
    return get().products.filter(
      (p) => p.stock <= (p.lowStockThreshold ?? 2)
    );
  },

  loadFromStorage: async () => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      if (data) {
        const products = JSON.parse(data);
        set({ products });
      }
    } catch (error) {
      console.error('[InventoryStore] Failed to load from storage:', error);
      // Continue with empty state rather than crashing
    }
  },

  saveToStorage: async () => {
    try {
      const { products } = get();
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(products));
    } catch (error) {
      console.error('[InventoryStore] Failed to save to storage:', error);
      // Non-blocking - user can continue using app
    }
  },
}));
