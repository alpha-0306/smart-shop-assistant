import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface DetectorConfig {
  enabled: boolean;
  activeHours: {
    startHour: number;
    endHour: number;
  };
  debounceMs: number;
  confidenceThreshold: number;
  batterySaver: boolean;
  onlyDuringShopHours: boolean;
}

export interface DetectionEvent {
  id: string;
  timestamp: number;
  confidence: number;
  clipUri?: string;
  transcription?: string;
  amount?: number;
  isProcessed: boolean;
  isTruePositive?: boolean; // For QA marking
  error?: string;
}

interface DetectorStore {
  config: DetectorConfig;
  isActive: boolean;
  detectionHistory: DetectionEvent[];
  stats: {
    totalDetections: number;
    truePositives: number;
    falsePositives: number;
    averageLatencyMs: number;
  };
  
  // Config management
  updateConfig: (updates: Partial<DetectorConfig>) => void;
  setActive: (active: boolean) => void;
  
  // Detection management
  addDetection: (detection: Omit<DetectionEvent, 'id'>) => void;
  updateDetection: (id: string, updates: Partial<DetectionEvent>) => void;
  markDetection: (id: string, isTruePositive: boolean) => void;
  clearHistory: () => void;
  
  // Persistence
  loadFromStorage: () => Promise<void>;
  saveToStorage: () => Promise<void>;
}

const STORAGE_KEY = '@smart_shop_detector';

const defaultConfig: DetectorConfig = {
  enabled: false,
  activeHours: {
    startHour: 8,
    endHour: 21,
  },
  debounceMs: 2000,
  confidenceThreshold: 0.7,
  batterySaver: false,
  onlyDuringShopHours: true,
};

export const useDetectorStore = create<DetectorStore>((set, get) => ({
  config: defaultConfig,
  isActive: false,
  detectionHistory: [],
  stats: {
    totalDetections: 0,
    truePositives: 0,
    falsePositives: 0,
    averageLatencyMs: 0,
  },

  updateConfig: (updates: Partial<DetectorConfig>) => {
    set((state) => ({
      config: { ...state.config, ...updates },
    }));
    get().saveToStorage();
  },

  setActive: (active: boolean) => {
    set({ isActive: active });
  },

  addDetection: (detection: Omit<DetectionEvent, 'id'>) => {
    const newDetection: DetectionEvent = {
      ...detection,
      id: `detection_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    };

    set((state) => ({
      detectionHistory: [newDetection, ...state.detectionHistory].slice(0, 100), // Keep last 100
      stats: {
        ...state.stats,
        totalDetections: state.stats.totalDetections + 1,
      },
    }));
    get().saveToStorage();
  },

  updateDetection: (id: string, updates: Partial<DetectionEvent>) => {
    set((state) => ({
      detectionHistory: state.detectionHistory.map((d) =>
        d.id === id ? { ...d, ...updates } : d
      ),
    }));
    get().saveToStorage();
  },

  markDetection: (id: string, isTruePositive: boolean) => {
    set((state) => {
      const detection = state.detectionHistory.find((d) => d.id === id);
      const wasMarked = detection?.isTruePositive !== undefined;
      const wasTrue = detection?.isTruePositive === true;
      const wasFalse = detection?.isTruePositive === false;

      let truePositives = state.stats.truePositives;
      let falsePositives = state.stats.falsePositives;

      // Adjust counts based on previous marking
      if (wasMarked) {
        if (wasTrue) truePositives--;
        if (wasFalse) falsePositives--;
      }

      // Add new marking
      if (isTruePositive) {
        truePositives++;
      } else {
        falsePositives++;
      }

      return {
        detectionHistory: state.detectionHistory.map((d) =>
          d.id === id ? { ...d, isTruePositive } : d
        ),
        stats: {
          ...state.stats,
          truePositives,
          falsePositives,
        },
      };
    });
    get().saveToStorage();
  },

  clearHistory: () => {
    set({
      detectionHistory: [],
      stats: {
        totalDetections: 0,
        truePositives: 0,
        falsePositives: 0,
        averageLatencyMs: 0,
      },
    });
    get().saveToStorage();
  },

  loadFromStorage: async () => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        set({
          config: { ...defaultConfig, ...parsed.config },
          detectionHistory: parsed.detectionHistory || [],
          stats: parsed.stats || get().stats,
        });
      }
    } catch (error) {
      console.error('Failed to load detector config from storage:', error);
      set({
        config: defaultConfig,
        detectionHistory: [],
        stats: get().stats,
      });
    }
  },

  saveToStorage: async () => {
    try {
      const { config, detectionHistory, stats } = get();
      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ config, detectionHistory, stats })
      );
    } catch (error) {
      console.error('Failed to save detector config to storage:', error);
    }
  },
}));
