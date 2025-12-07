/**
 * Microphone Indicator - Shows when detector is actively listening
 * 
 * Displays a small red dot in the top-right corner of the screen
 * when the wake-sound detector is active.
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Mic } from 'lucide-react-native';
import { useDetectorStore } from '../store/detectorStore';
import { colors, spacing } from '../utils/theme';

export default function MicIndicator() {
  const isActive = useDetectorStore((state) => state.isActive);
  const [pulseAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    if (isActive) {
      // Start pulsing animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.3,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      // Stop animation
      pulseAnim.setValue(1);
    }
  }, [isActive]);

  if (!isActive) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.pulse,
          {
            transform: [{ scale: pulseAnim }],
          },
        ]}
      />
      <View style={styles.indicator}>
        <Mic size={12} color={colors.white} />
      </View>
      <Text style={styles.text}>Listening</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.error,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 20,
    zIndex: 1000,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  pulse: {
    position: 'absolute',
    top: -4,
    right: -4,
    bottom: -4,
    left: -4,
    backgroundColor: colors.error,
    borderRadius: 24,
    opacity: 0.3,
  },
  indicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
});
