import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Animated,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Mic, Play, Edit3, X, Volume2 } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { startRecording, stopRecording } from '../../utils/audioUtils';
import { transcribeAndExtractAmount } from '../../utils/sttUtils';

export default function ListenScreen() {
  const navigation = useNavigation();
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pulseAnim] = useState(new Animated.Value(1));
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customAmount, setCustomAmount] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [autoRecordTimer, setAutoRecordTimer] = useState<NodeJS.Timeout | null>(null);
  
  // Get API key from environment variable
  const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY || '';

  const startPulse = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.3,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const stopPulse = () => {
    pulseAnim.stopAnimation();
    pulseAnim.setValue(1);
  };

  const handlePressIn = async () => {
    try {
      await startRecording();
      setIsRecording(true);
      startPulse();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to start recording');
    }
  };

  const handlePressOut = async () => {
    try {
      stopPulse();
      setIsRecording(false);
      setIsProcessing(true);

      const audioUri = await stopRecording();

      // Check if API key is configured
      if (!apiKey) {
        setIsProcessing(false);
        Alert.alert(
          'API Key Missing',
          'Please add your OpenAI API key to the .env file:\nEXPO_PUBLIC_OPENAI_API_KEY=your_key_here',
          [{ text: 'OK' }]
        );
        return;
      }

      // Transcribe and extract amount
      const amount = await transcribeAndExtractAmount(audioUri, apiKey);

      setIsProcessing(false);

      if (amount === null) {
        Alert.alert(
          'No Amount Detected',
          'Could not detect payment amount. Please try again or select manually.',
          [
            { text: 'Try Again', style: 'cancel' },
            {
              text: 'Select Manually',
              onPress: () => {
                navigation.navigate('Main' as never);
                // @ts-ignore
                navigation.navigate('Inventory');
              },
            },
          ]
        );
        return;
      }

      // Navigate to suggestions
      (navigation.navigate as any)('Suggestions', { amount });
    } catch (error: any) {
      setIsProcessing(false);
      Alert.alert('Error', error.message || 'Failed to process audio');
    }
  };

  const handleDemoMode = async () => {
    Alert.alert(
      'Demo Mode',
      'Select a sample payment amount to test:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: '₹45',
          onPress: () => (navigation.navigate as any)('Suggestions', { amount: 45 }),
        },
        {
          text: '₹50',
          onPress: () => (navigation.navigate as any)('Suggestions', { amount: 50 }),
        },
        {
          text: '₹100',
          onPress: () => (navigation.navigate as any)('Suggestions', { amount: 100 }),
        },
        {
          text: 'Custom Amount',
          onPress: () => setShowCustomInput(true),
        },
      ]
    );
  };

  const handleCustomAmountSubmit = () => {
    const amount = parseFloat(customAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount greater than 0');
      return;
    }
    setShowCustomInput(false);
    setCustomAmount('');
    (navigation.navigate as any)('Suggestions', { amount });
  };

  const handleSimulateUPI = async () => {
    try {
      // Check if API key is configured
      if (!apiKey) {
        Alert.alert(
          'API Key Missing',
          'Please add your OpenAI API key to the .env file:\nEXPO_PUBLIC_OPENAI_API_KEY=your_key_here',
          [{ text: 'OK' }]
        );
        return;
      }

      // Start recording
      await startRecording();
      setIsRecording(true);
      startPulse();
      setCountdown(5);

      // Countdown timer
      let timeLeft = 5;
      const countdownInterval = setInterval(() => {
        timeLeft--;
        setCountdown(timeLeft);
        if (timeLeft <= 0) {
          clearInterval(countdownInterval);
        }
      }, 1000);

      // Auto-stop after 5 seconds
      const timer = setTimeout(async () => {
        try {
          stopPulse();
          setIsRecording(false);
          setCountdown(0);
          setIsProcessing(true);

          const audioUri = await stopRecording();

          // Transcribe and extract amount
          const amount = await transcribeAndExtractAmount(audioUri, apiKey);

          setIsProcessing(false);

          if (amount === null) {
            Alert.alert(
              'No Amount Detected',
              'Could not detect payment amount. Please try again or select manually.',
              [
                { text: 'Try Again', style: 'cancel' },
                {
                  text: 'Select Manually',
                  onPress: () => {
                    navigation.navigate('Main' as never);
                    // @ts-ignore
                    navigation.navigate('Inventory');
                  },
                },
              ]
            );
            return;
          }

          // Navigate to suggestions
          (navigation.navigate as any)('Suggestions', { amount });
        } catch (error: any) {
          setIsProcessing(false);
          setCountdown(0);
          Alert.alert('Error', error.message || 'Failed to process audio');
        }
      }, 5000);

      setAutoRecordTimer(timer);
    } catch (error: any) {
      setCountdown(0);
      Alert.alert('Error', error.message || 'Failed to start recording');
    }
  };



  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Listen for Payment</Text>
        <Text style={styles.subtitle}>
          {isRecording
            ? 'Listening...'
            : isProcessing
            ? 'Processing...'
            : 'Press and hold to record UPI soundbox'}
        </Text>
        {!isRecording && !isProcessing && (
          <Text style={styles.demoHint}>
            💡 Use Demo Mode below for testing without recording
          </Text>
        )}

        <View style={styles.micContainer}>
          <TouchableOpacity
            style={[
              styles.micButton,
              isRecording && styles.micButtonActive,
              isProcessing && styles.micButtonProcessing,
            ]}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            disabled={isProcessing}
            activeOpacity={0.8}
          >
            <Animated.View
              style={[
                styles.micIconContainer,
                { transform: [{ scale: pulseAnim }] },
              ]}
            >
              {isProcessing ? (
                <ActivityIndicator size="large" color="#fff" />
              ) : (
                <Mic size={64} color="#fff" />
              )}
            </Animated.View>
          </TouchableOpacity>
        </View>

        <Text style={styles.hint}>
          {isRecording
            ? '🎙️ Recording... Release to process'
            : isProcessing
            ? '⏳ Analyzing audio...'
            : ''}
        </Text>

        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.simulateButton} 
            onPress={handleSimulateUPI}
            disabled={isRecording || isProcessing}
          >
            <Volume2 size={20} color="#fff" />
            <Text style={styles.simulateButtonText}>Simulate UPI Soundbox</Text>
            {/* <Text style={styles.simulateButtonSubtext}>(Auto-records 5 sec)</Text> */}
          </TouchableOpacity>

          <Text style={styles.orText}>or</Text>

          <TouchableOpacity 
            style={styles.demoButton} 
            onPress={handleDemoMode}
            disabled={isRecording || isProcessing}
          >
            <Play size={20} color="#4F46E5" />
            <Text style={styles.demoButtonText}>Demo Mode</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Custom Amount Modal */}
      <Modal
        visible={showCustomInput}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCustomInput(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Enter Custom Amount</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowCustomInput(false);
                  setCustomAmount('');
                }}
              >
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.currencySymbol}>₹</Text>
              <TextInput
                style={styles.amountInput}
                value={customAmount}
                onChangeText={setCustomAmount}
                placeholder="Enter amount"
                placeholderTextColor="#9CA3AF"
                keyboardType="decimal-pad"
                autoFocus
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShowCustomInput(false);
                  setCustomAmount('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleCustomAmountSubmit}
              >
                <Text style={styles.submitButtonText}>Find Matches</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 8,
  },
  demoHint: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 52,
    fontStyle: 'italic',
  },
  micContainer: {
    marginVertical: 40,
  },
  micButton: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  micButtonActive: {
    backgroundColor: '#EF4444',
    shadowColor: '#EF4444',
  },
  micButtonProcessing: {
    backgroundColor: '#F59E0B',
    shadowColor: '#F59E0B',
  },
  micIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  hint: {
    fontSize: 14,
    color: '#4F46E5',
    textAlign: 'center',
    marginTop: 20,
    fontWeight: '500',
  },
  buttonContainer: {
    marginTop: 40,
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 20,
  },
  simulateButton: {
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
    width: '100%',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  simulateButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 8,
  },
  simulateButtonSubtext: {
    color: '#D1FAE5',
    fontSize: 13,
    marginTop: 4,
  },
  orText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginVertical: 16,
    fontWeight: '500',
  },
  demoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#4F46E5',
  },
  demoButtonText: {
    color: '#4F46E5',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4F46E5',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4F46E5',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: '600',
    color: '#1F2937',
    paddingVertical: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  submitButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
