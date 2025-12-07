/**
 * Detector Handler - Manages detector lifecycle and event processing
 * 
 * This module:
 * 1. Initializes detector on app start
 * 2. Handles wake events and clip processing
 * 3. Routes results to suggestions flow
 * 4. Manages detector state based on shop hours
 */

import { detectorBridge, WakeEvent, ClipReadyEvent } from '../native/DetectorBridge';
import { useDetectorStore } from '../store/detectorStore';
import { useShopContextStore } from '../store/shopContextStore';
import { processDetectorClip } from './clipProcessor';
import { Alert } from 'react-native';

const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY || '';

class DetectorHandler {
  private wakeUnsubscribe: (() => void) | null = null;
  private clipReadyUnsubscribe: (() => void) | null = null;
  private errorUnsubscribe: (() => void) | null = null;
  private hourCheckInterval: NodeJS.Timeout | null = null;

  /**
   * Initialize detector handler
   */
  async initialize(): Promise<void> {
    console.log('Initializing detector handler...');

    // Load detector config from storage
    await useDetectorStore.getState().loadFromStorage();

    // Setup event listeners
    this.setupEventListeners();

    // Start detector if enabled
    const config = useDetectorStore.getState().config;
    if (config.enabled) {
      await this.startDetector();
    }

    // Setup hour-based auto-start/stop
    this.setupHourCheck();
  }

  /**
   * Setup event listeners for detector events
   */
  private setupEventListeners(): void {
    // Wake event listener
    this.wakeUnsubscribe = detectorBridge.onWake((event: WakeEvent) => {
      console.log('Wake event detected:', event);
      this.handleWakeEvent(event);
    });

    // Clip ready listener
    this.clipReadyUnsubscribe = detectorBridge.onClipReady((event: ClipReadyEvent) => {
      console.log('Clip ready:', event);
      this.handleClipReady(event);
    });

    // Error listener
    this.errorUnsubscribe = detectorBridge.onError((error: Error) => {
      console.error('Detector error:', error);
      this.handleError(error);
    });
  }

  /**
   * Handle wake event
   */
  private handleWakeEvent(event: WakeEvent): void {
    // Add detection to history
    useDetectorStore.getState().addDetection({
      timestamp: event.timestamp,
      confidence: event.confidence,
      isProcessed: false,
    });
  }

  /**
   * Handle clip ready event
   */
  private async handleClipReady(event: ClipReadyEvent): Promise<void> {
    if (!OPENAI_API_KEY) {
      console.error('OpenAI API key not configured');
      return;
    }

    // Find the most recent unprocessed detection
    const detectionHistory = useDetectorStore.getState().detectionHistory;
    const detection = detectionHistory.find((d) => !d.isProcessed);

    if (!detection) {
      console.warn('No unprocessed detection found for clip');
      return;
    }

    // Update detection with clip URI
    useDetectorStore.getState().updateDetection(detection.id, {
      clipUri: event.uri,
    });

    // Process the clip
    const result = await processDetectorClip(event.uri, OPENAI_API_KEY, detection.id);

    if (result.success && result.amount) {
      // Show notification to user
      Alert.alert(
        'Payment Detected',
        `Amount: ₹${result.amount}\n\nWould you like to record this sale?`,
        [
          { text: 'Ignore', style: 'cancel' },
          {
            text: 'Record Sale',
            onPress: () => {
              // Navigate to suggestions screen
              // This would need navigation ref or event emitter
              console.log('Navigate to suggestions with amount:', result.amount);
            },
          },
        ]
      );
    } else if (result.error) {
      // Update detection with error
      useDetectorStore.getState().updateDetection(detection.id, {
        error: result.error,
        isProcessed: true,
      });
    }
  }

  /**
   * Handle detector error
   */
  private handleError(error: Error): void {
    console.error('Detector error:', error);
    
    // Stop detector on critical errors
    this.stopDetector();
    
    // Update config
    useDetectorStore.getState().updateConfig({ enabled: false });
    useDetectorStore.getState().setActive(false);
  }

  /**
   * Start the detector
   */
  async startDetector(): Promise<void> {
    const config = useDetectorStore.getState().config;

    // Check if we should start based on shop hours
    if (config.onlyDuringShopHours && !this.isWithinShopHours()) {
      console.log('Not starting detector - outside shop hours');
      return;
    }

    try {
      await detectorBridge.startDetector(config);
      useDetectorStore.getState().setActive(true);
      console.log('Detector started');
    } catch (error) {
      console.error('Failed to start detector:', error);
      throw error;
    }
  }

  /**
   * Stop the detector
   */
  async stopDetector(): Promise<void> {
    try {
      await detectorBridge.stopDetector();
      useDetectorStore.getState().setActive(false);
      console.log('Detector stopped');
    } catch (error) {
      console.error('Failed to stop detector:', error);
      throw error;
    }
  }

  /**
   * Check if current time is within shop hours
   */
  private isWithinShopHours(): boolean {
    const config = useDetectorStore.getState().config;
    const now = new Date();
    const currentHour = now.getHours();

    return (
      currentHour >= config.activeHours.startHour &&
      currentHour < config.activeHours.endHour
    );
  }

  /**
   * Setup periodic check for shop hours
   */
  private setupHourCheck(): void {
    // Check every 5 minutes
    this.hourCheckInterval = setInterval(() => {
      const config = useDetectorStore.getState().config;
      const isActive = useDetectorStore.getState().isActive;

      if (!config.enabled || !config.onlyDuringShopHours) {
        return;
      }

      const shouldBeActive = this.isWithinShopHours();

      if (shouldBeActive && !isActive) {
        console.log('Starting detector - within shop hours');
        this.startDetector();
      } else if (!shouldBeActive && isActive) {
        console.log('Stopping detector - outside shop hours');
        this.stopDetector();
      }
    }, 5 * 60 * 1000); // 5 minutes
  }

  /**
   * Cleanup detector handler
   */
  cleanup(): void {
    // Unsubscribe from events
    if (this.wakeUnsubscribe) {
      this.wakeUnsubscribe();
    }
    if (this.clipReadyUnsubscribe) {
      this.clipReadyUnsubscribe();
    }
    if (this.errorUnsubscribe) {
      this.errorUnsubscribe();
    }

    // Clear interval
    if (this.hourCheckInterval) {
      clearInterval(this.hourCheckInterval);
    }

    // Stop detector
    this.stopDetector();
  }
}

// Export singleton instance
export const detectorHandler = new DetectorHandler();
