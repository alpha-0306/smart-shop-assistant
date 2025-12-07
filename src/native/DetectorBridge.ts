/**
 * Detector Bridge - Native Module Interface
 * 
 * This module provides a unified interface for the wake-sound detector
 * across Android (native foreground service) and iOS (JS fallback).
 * 
 * Android: Uses native module with Porcupine/TFLite detector
 * iOS: Uses JS-based ambient level detection (foreground only)
 */

import { NativeModules, NativeEventEmitter, Platform } from 'react-native';
import { DetectorConfig } from '../store/detectorStore';

// Native module interface (Android only)
const DetectorModule = Platform.OS === 'android' ? NativeModules.WakeSoundDetector : null;

// Event emitter for native events
const detectorEmitter = DetectorModule
  ? new NativeEventEmitter(DetectorModule)
  : null;

export interface WakeEvent {
  confidence: number;
  timestamp: number;
}

export interface ClipReadyEvent {
  uri: string;
  timestamp: number;
  durationMs: number;
}

type WakeCallback = (event: WakeEvent) => void;
type ClipReadyCallback = (event: ClipReadyEvent) => void;
type ErrorCallback = (error: Error) => void;

class DetectorBridge {
  private wakeListeners: WakeCallback[] = [];
  private clipReadyListeners: ClipReadyCallback[] = [];
  private errorListeners: ErrorCallback[] = [];
  private isListening = false;

  constructor() {
    this.setupNativeListeners();
  }

  private setupNativeListeners() {
    if (!detectorEmitter) return;

    // Listen for wake events from native
    detectorEmitter.addListener('onWake', (event: WakeEvent) => {
      this.wakeListeners.forEach((cb) => cb(event));
    });

    // Listen for clip ready events from native
    detectorEmitter.addListener('onClipReady', (event: ClipReadyEvent) => {
      this.clipReadyListeners.forEach((cb) => cb(event));
    });

    // Listen for errors from native
    detectorEmitter.addListener('onError', (error: { message: string }) => {
      const err = new Error(error.message);
      this.errorListeners.forEach((cb) => cb(err));
    });
  }

  /**
   * Start the detector with given configuration
   */
  async startDetector(config: DetectorConfig): Promise<void> {
    if (this.isListening) {
      console.warn('Detector already running');
      return;
    }

    try {
      if (Platform.OS === 'android' && DetectorModule) {
        // Android: Start native foreground service
        await DetectorModule.startDetector({
          debounceMs: config.debounceMs,
          confidenceThreshold: config.confidenceThreshold,
          activeHours: config.activeHours,
          batterySaver: config.batterySaver,
        });
        this.isListening = true;
      } else if (Platform.OS === 'ios') {
        // iOS: Start JS-based ambient detector (foreground only)
        await this.startIOSFallback(config);
        this.isListening = true;
      } else {
        throw new Error('Detector not supported on this platform');
      }
    } catch (error) {
      console.error('Failed to start detector:', error);
      throw error;
    }
  }

  /**
   * Stop the detector
   */
  async stopDetector(): Promise<void> {
    if (!this.isListening) {
      return;
    }

    try {
      if (Platform.OS === 'android' && DetectorModule) {
        await DetectorModule.stopDetector();
      } else if (Platform.OS === 'ios') {
        await this.stopIOSFallback();
      }
      this.isListening = false;
    } catch (error) {
      console.error('Failed to stop detector:', error);
      throw error;
    }
  }

  /**
   * Update detector configuration
   */
  async setConfig(config: Partial<DetectorConfig>): Promise<void> {
    if (Platform.OS === 'android' && DetectorModule) {
      await DetectorModule.setConfig(config);
    }
    // iOS fallback doesn't support runtime config updates
  }

  /**
   * Check if detector is currently active
   */
  isActive(): boolean {
    return this.isListening;
  }

  /**
   * Register callback for wake events
   */
  onWake(callback: WakeCallback): () => void {
    this.wakeListeners.push(callback);
    return () => {
      this.wakeListeners = this.wakeListeners.filter((cb) => cb !== callback);
    };
  }

  /**
   * Register callback for clip ready events
   */
  onClipReady(callback: ClipReadyCallback): () => void {
    this.clipReadyListeners.push(callback);
    return () => {
      this.clipReadyListeners = this.clipReadyListeners.filter((cb) => cb !== callback);
    };
  }

  /**
   * Register callback for errors
   */
  onError(callback: ErrorCallback): () => void {
    this.errorListeners.push(callback);
    return () => {
      this.errorListeners = this.errorListeners.filter((cb) => cb !== callback);
    };
  }

  /**
   * Simulate a wake event (for testing)
   */
  async simulateWake(): Promise<void> {
    const event: WakeEvent = {
      confidence: 0.95,
      timestamp: Date.now(),
    };
    this.wakeListeners.forEach((cb) => cb(event));

    // Simulate clip ready after short delay
    setTimeout(() => {
      const clipEvent: ClipReadyEvent = {
        uri: 'file://simulated-clip.m4a',
        timestamp: Date.now(),
        durationMs: 2000,
      };
      this.clipReadyListeners.forEach((cb) => cb(clipEvent));
    }, 500);
  }

  /**
   * iOS fallback: JS-based ambient level detection
   * Only works while app is in foreground
   */
  private async startIOSFallback(config: DetectorConfig): Promise<void> {
    // TODO: Implement JS-based ambient audio level monitoring
    // This would use expo-av or react-native-audio to sample
    // audio levels periodically and trigger on threshold
    console.log('iOS fallback detector started (foreground only)');
    
    // For now, this is a placeholder
    // Real implementation would:
    // 1. Request microphone permission
    // 2. Start audio recording session
    // 3. Sample audio levels every 100ms
    // 4. Trigger wake event when level exceeds threshold
    // 5. Record short clip and emit clipReady event
  }

  private async stopIOSFallback(): Promise<void> {
    console.log('iOS fallback detector stopped');
    // TODO: Stop audio monitoring
  }

  /**
   * Request microphone permission
   */
  async requestPermission(): Promise<boolean> {
    if (Platform.OS === 'android' && DetectorModule) {
      return await DetectorModule.requestPermission();
    }
    // iOS: Use expo-av or react-native-permissions
    return false;
  }

  /**
   * Check if microphone permission is granted
   */
  async hasPermission(): Promise<boolean> {
    if (Platform.OS === 'android' && DetectorModule) {
      return await DetectorModule.hasPermission();
    }
    return false;
  }
}

// Export singleton instance
export const detectorBridge = new DetectorBridge();
