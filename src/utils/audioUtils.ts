import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';

let recording: Audio.Recording | null = null;

/**
 * Start audio recording
 */
export async function startRecording(): Promise<void> {
  try {
    // Request permissions
    const { status } = await Audio.requestPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Audio permission not granted');
    }

    // Configure audio mode
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });

    // Start recording
    const { recording: newRecording } = await Audio.Recording.createAsync(
      Audio.RecordingOptionsPresets.HIGH_QUALITY
    );
    recording = newRecording;
  } catch (error) {
    console.error('Failed to start recording:', error);
    throw error;
  }
}

/**
 * Stop recording and return file URI
 */
export async function stopRecording(): Promise<string> {
  try {
    if (!recording) {
      throw new Error('No active recording');
    }

    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    recording = null;

    if (!uri) {
      throw new Error('Failed to get recording URI');
    }

    return uri;
  } catch (error) {
    console.error('Failed to stop recording:', error);
    throw error;
  }
}

/**
 * Get demo audio file URI
 */
export function getDemoAudioUri(): string {
  // For demo mode, we'll use a text-to-speech approach
  // or user can record their own demo audio
  return '';
}

/**
 * Check if currently recording
 */
export function isRecording(): boolean {
  return recording !== null;
}
