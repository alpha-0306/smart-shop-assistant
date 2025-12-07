import { Alert } from 'react-native';

/**
 * Global error handler with user-friendly messages
 */

export function handleError(error: any, context: string = 'Operation') {
  console.error(`[${context}]`, error);
  
  let message = 'Something went wrong. Please try again.';
  
  // Network errors
  if (error.message?.includes('Network') || error.message?.includes('fetch')) {
    message = 'No internet connection. Please check your network and try again.';
  }
  
  // API errors
  else if (error.message?.includes('API') || error.message?.includes('401')) {
    message = 'API error. Please check your API key configuration.';
  }
  
  // Permission errors
  else if (error.message?.includes('permission')) {
    message = 'Permission denied. Please grant the required permissions.';
  }
  
  // Storage errors
  else if (error.message?.includes('storage') || error.message?.includes('AsyncStorage')) {
    message = 'Storage error. Please try restarting the app.';
  }
  
  // Audio errors
  else if (error.message?.includes('audio') || error.message?.includes('recording')) {
    message = 'Audio error. Please check microphone permissions or use Demo Mode.';
  }
  
  // Use custom message if provided
  else if (error.message) {
    message = error.message;
  }
  
  return message;
}

export function showErrorAlert(error: any, context: string = 'Error', onRetry?: () => void) {
  const message = handleError(error, context);
  
  const buttons: any[] = [{ text: 'OK', style: 'cancel' }];
  
  if (onRetry) {
    buttons.unshift({ text: 'Retry', onPress: onRetry });
  }
  
  Alert.alert(context, message, buttons);
}

export async function withErrorHandling<T>(
  fn: () => Promise<T>,
  context: string = 'Operation',
  onError?: (error: any) => void
): Promise<T | null> {
  try {
    return await fn();
  } catch (error) {
    console.error(`[${context}]`, error);
    if (onError) {
      onError(error);
    } else {
      showErrorAlert(error, context);
    }
    return null;
  }
}
