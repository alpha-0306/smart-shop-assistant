/**
 * Clip Processor - Handles audio clip processing for wake-sound detector
 * 
 * This module processes audio clips from the detector:
 * 1. Transcribes audio using Whisper API
 * 2. Extracts payment amount using GPT-4o-mini
 * 3. Routes to suggestions flow
 * 4. Cleans up temporary files
 */

import * as FileSystem from 'expo-file-system';
import { transcribeAndExtractAmount } from './sttUtils';
import { useDetectorStore } from '../store/detectorStore';
import { useSalesStore } from '../store/salesStore';

export interface ClipProcessingResult {
  success: boolean;
  transcription?: string;
  amount?: number;
  error?: string;
  latencyMs: number;
}

/**
 * Process an audio clip from the detector
 */
export async function processDetectorClip(
  clipUri: string,
  apiKey: string,
  detectionId: string
): Promise<ClipProcessingResult> {
  const startTime = Date.now();
  let retryCount = 0;
  const maxRetries = 1;

  while (retryCount <= maxRetries) {
    try {
      // Transcribe and extract amount
      const result = await transcribeAndExtractAmount(clipUri, apiKey);

      if (!result) {
        if (retryCount < maxRetries) {
          retryCount++;
          console.log(`STT failed, retrying (${retryCount}/${maxRetries})...`);
          await new Promise((resolve) => setTimeout(resolve, 1000));
          continue;
        }
        
        // Failed after retries
        await deleteClip(clipUri);
        return {
          success: false,
          error: 'Failed to transcribe audio',
          latencyMs: Date.now() - startTime,
        };
      }

      // Update detection with results
      useDetectorStore.getState().updateDetection(detectionId, {
        transcription: result.transcription,
        amount: result.amount,
        isProcessed: true,
      });

      // Delete clip after successful processing
      await deleteClip(clipUri);

      return {
        success: true,
        transcription: result.transcription,
        amount: result.amount,
        latencyMs: Date.now() - startTime,
      };
    } catch (error) {
      console.error('Clip processing error:', error);
      
      if (retryCount < maxRetries) {
        retryCount++;
        await new Promise((resolve) => setTimeout(resolve, 1000));
        continue;
      }

      // Failed after retries
      await deleteClip(clipUri);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        latencyMs: Date.now() - startTime,
      };
    }
  }

  // Should never reach here
  await deleteClip(clipUri);
  return {
    success: false,
    error: 'Processing failed',
    latencyMs: Date.now() - startTime,
  };
}

/**
 * Delete a temporary audio clip
 */
export async function deleteClip(clipUri: string): Promise<void> {
  try {
    // Check if file exists
    const fileInfo = await FileSystem.getInfoAsync(clipUri);
    if (fileInfo.exists) {
      await FileSystem.deleteAsync(clipUri, { idempotent: true });
      console.log('Clip deleted:', clipUri);
    }
  } catch (error) {
    console.error('Failed to delete clip:', error);
    // Don't throw - deletion failure shouldn't break the flow
  }
}

/**
 * Save a clip for QA purposes (opt-in)
 */
export async function saveClipForQA(
  clipUri: string,
  detectionId: string
): Promise<string | null> {
  try {
    const qaDir = `${FileSystem.documentDirectory}qa_clips/`;
    
    // Ensure QA directory exists
    const dirInfo = await FileSystem.getInfoAsync(qaDir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(qaDir, { intermediates: true });
    }

    // Copy clip to QA directory
    const qaClipUri = `${qaDir}${detectionId}.m4a`;
    await FileSystem.copyAsync({
      from: clipUri,
      to: qaClipUri,
    });

    console.log('Clip saved for QA:', qaClipUri);
    return qaClipUri;
  } catch (error) {
    console.error('Failed to save clip for QA:', error);
    return null;
  }
}

/**
 * Get all QA clips
 */
export async function getQAClips(): Promise<string[]> {
  try {
    const qaDir = `${FileSystem.documentDirectory}qa_clips/`;
    const dirInfo = await FileSystem.getInfoAsync(qaDir);
    
    if (!dirInfo.exists) {
      return [];
    }

    const files = await FileSystem.readDirectoryAsync(qaDir);
    return files.map((file) => `${qaDir}${file}`);
  } catch (error) {
    console.error('Failed to get QA clips:', error);
    return [];
  }
}

/**
 * Clear all QA clips
 */
export async function clearQAClips(): Promise<void> {
  try {
    const qaDir = `${FileSystem.documentDirectory}qa_clips/`;
    const dirInfo = await FileSystem.getInfoAsync(qaDir);
    
    if (dirInfo.exists) {
      await FileSystem.deleteAsync(qaDir, { idempotent: true });
      console.log('QA clips cleared');
    }
  } catch (error) {
    console.error('Failed to clear QA clips:', error);
  }
}
