import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Sale {
  id: string;
  timestamp: number;
  amount: number;
  items: string[];
}

interface SalesStore {
  sales: Sale[];
  totalToday: number;
  // Learning features
  lastTenSales: Sale[];
  hourlyStats: Record<number, Record<string, number>>; // hour -> productId -> count
  comboStats: Record<string, number>; // "id1|id2|id3" -> count
  addSale: (saleData: Omit<Sale, 'id'>) => void;
  computeTotalToday: () => void;
  loadFromStorage: () => Promise<void>;
  saveToStorage: () => Promise<void>;
  // Hour 5: Helper selectors
  getTodaySales: () => Sale[];
  getHourlySales: () => { hour: number; total: number }[];
  getTopProducts: (products: any[]) => { product: any; count: number }[];
  getRecentSales: () => Sale[];
}

const STORAGE_KEY = '@smart_shop_sales';

export const useSalesStore = create<SalesStore>((set, get) => ({
  sales: [],
  totalToday: 0,
  lastTenSales: [],
  hourlyStats: {},
  comboStats: {},

  addSale: (saleData: Omit<Sale, 'id'>) => {
    const newSale: Sale = {
      ...saleData,
      id: `sale_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
    };
    
    set((state) => {
      // A. Update lastTenSales
      const updatedLastTen = [...state.lastTenSales, newSale];
      if (updatedLastTen.length > 10) {
        updatedLastTen.shift(); // Remove oldest
      }

      // B. Update hourlyStats
      const hour = new Date(newSale.timestamp).getHours();
      const updatedHourlyStats = { ...state.hourlyStats };
      if (!updatedHourlyStats[hour]) {
        updatedHourlyStats[hour] = {};
      }
      newSale.items.forEach((productId) => {
        updatedHourlyStats[hour][productId] = (updatedHourlyStats[hour][productId] || 0) + 1;
      });

      // C. Update comboStats
      const sortedIds = [...newSale.items].sort();
      const comboKey = sortedIds.join('|');
      const updatedComboStats = { ...state.comboStats };
      updatedComboStats[comboKey] = (updatedComboStats[comboKey] || 0) + 1;

      return {
        sales: [...state.sales, newSale],
        lastTenSales: updatedLastTen,
        hourlyStats: updatedHourlyStats,
        comboStats: updatedComboStats,
      };
    });
    
    get().computeTotalToday();
    get().saveToStorage();
  },

  computeTotalToday: () => {
    const { sales } = get();
    const todayStart = new Date().setHours(0, 0, 0, 0);
    const todayTotal = sales
      .filter((sale) => sale.timestamp >= todayStart)
      .reduce((sum, sale) => sum + sale.amount, 0);
    set({ totalToday: todayTotal });
  },

  loadFromStorage: async () => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        const sales = parsed.sales || parsed; // Support old format
        
        // Rebuild learning stats from sales history
        const lastTenSales = sales.slice(-10);
        const hourlyStats: Record<number, Record<string, number>> = {};
        const comboStats: Record<string, number> = {};
        
        sales.forEach((sale: Sale) => {
          const hour = new Date(sale.timestamp).getHours();
          if (!hourlyStats[hour]) {
            hourlyStats[hour] = {};
          }
          sale.items.forEach((productId) => {
            hourlyStats[hour][productId] = (hourlyStats[hour][productId] || 0) + 1;
          });
          
          const sortedIds = [...sale.items].sort();
          const comboKey = sortedIds.join('|');
          comboStats[comboKey] = (comboStats[comboKey] || 0) + 1;
        });
        
        set({ sales, lastTenSales, hourlyStats, comboStats });
        get().computeTotalToday();
      }
    } catch (error) {
      console.error('Failed to load sales from storage:', error);
      // Reset to empty state on error
      set({ sales: [], lastTenSales: [], hourlyStats: {}, comboStats: {}, totalToday: 0 });
    }
  },

  saveToStorage: async () => {
    try {
      const { sales, lastTenSales, hourlyStats, comboStats } = get();
      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ sales, lastTenSales, hourlyStats, comboStats })
      );
    } catch (error) {
      console.error('Failed to save sales to storage:', error);
      // Don't throw - allow app to continue
    }
  },

  // Hour 5: Helper selectors
  getTodaySales: () => {
    const { sales } = get();
    const todayStart = new Date().setHours(0, 0, 0, 0);
    return sales.filter((sale) => sale.timestamp >= todayStart);
  },

  getHourlySales: () => {
    const todaySales = get().getTodaySales();
    const hourlyTotals: { hour: number; total: number }[] = [];
    
    // Initialize all 24 hours with 0
    for (let hour = 0; hour < 24; hour++) {
      hourlyTotals.push({ hour, total: 0 });
    }
    
    // Sum amounts for each hour
    todaySales.forEach((sale) => {
      const hour = new Date(sale.timestamp).getHours();
      hourlyTotals[hour].total += sale.amount;
    });
    
    return hourlyTotals;
  },

  getTopProducts: (products: any[]) => {
    const { sales } = get();
    const productCounts: Record<string, number> = {};
    
    // Count occurrences of each product in all sales
    sales.forEach((sale) => {
      sale.items.forEach((productId) => {
        productCounts[productId] = (productCounts[productId] || 0) + 1;
      });
    });
    
    // Map to products with counts
    const productWithCounts = products
      .map((product) => ({
        product,
        count: productCounts[product.id] || 0,
      }))
      .filter((item) => item.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
    
    return productWithCounts;
  },

  getRecentSales: () => {
    const { sales } = get();
    return sales
      .slice()
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 5);
  },
}));
