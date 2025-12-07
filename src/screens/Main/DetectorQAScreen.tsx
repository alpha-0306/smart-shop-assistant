import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  TestTube,
  Play,
  ThumbsUp,
  ThumbsDown,
  Trash2,
  Download,
  AlertCircle,
} from 'lucide-react-native';
import { useDetectorStore, DetectionEvent } from '../../store/detectorStore';
import { detectorBridge } from '../../native/DetectorBridge';
import { processDetectorClip, saveClipForQA } from '../../utils/clipProcessor';
import { colors, spacing, typography, borderRadius, shadows } from '../../utils/theme';
import { preventDoubleTap } from '../../utils/performance';

const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY || '';

export default function DetectorQAScreen() {
  const detectionHistory = useDetectorStore((state) => state.detectionHistory);
  const stats = useDetectorStore((state) => state.stats);
  const markDetection = useDetectorStore((state) => state.markDetection);
  const clearHistory = useDetectorStore((state) => state.clearHistory);
  const addDetection = useDetectorStore((state) => state.addDetection);
  const updateDetection = useDetectorStore((state) => state.updateDetection);

  const [isSimulating, setIsSimulating] = useState(false);

  const handleSimulateWake = preventDoubleTap(async () => {
    if (!OPENAI_API_KEY) {
      Alert.alert('Error', 'OpenAI API key not configured');
      return;
    }

    setIsSimulating(true);

    try {
      // Add detection event
      const detectionId = `detection_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
      addDetection({
        timestamp: Date.now(),
        confidence: 0.95,
        isProcessed: false,
      });

      // Simulate wake event
      await detectorBridge.simulateWake();

      Alert.alert(
        'Simulation Started',
        'Simulated wake event triggered. In a real scenario, this would process an audio clip.',
        [{ text: 'OK' }]
      );

      // Update detection as processed (simulated)
      setTimeout(() => {
        updateDetection(detectionId, {
          transcription: 'Simulated: Fifty rupees received from 9876543210',
          amount: 50,
          isProcessed: true,
        });
      }, 1500);
    } catch (error) {
      Alert.alert('Error', 'Failed to simulate wake event');
      console.error(error);
    } finally {
      setIsSimulating(false);
    }
  });

  const handleMarkDetection = (id: string, isTruePositive: boolean) => {
    markDetection(id, isTruePositive);
  };

  const handleSaveForQA = async (detection: DetectionEvent) => {
    if (!detection.clipUri) {
      Alert.alert('Error', 'No clip available for this detection');
      return;
    }

    try {
      const savedUri = await saveClipForQA(detection.clipUri, detection.id);
      if (savedUri) {
        Alert.alert('Success', 'Clip saved for QA review');
      } else {
        Alert.alert('Error', 'Failed to save clip');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to save clip');
      console.error(error);
    }
  };

  const handleClearHistory = () => {
    Alert.alert(
      'Clear History',
      'Are you sure you want to clear all detection history?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: clearHistory,
        },
      ]
    );
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const getAccuracyRate = () => {
    const marked = stats.truePositives + stats.falsePositives;
    if (marked === 0) return 0;
    return ((stats.truePositives / marked) * 100).toFixed(1);
  };

  const renderDetection = ({ item }: { item: DetectionEvent }) => {
    const isMarked = item.isTruePositive !== undefined;
    const isTruePositive = item.isTruePositive === true;

    return (
      <View style={styles.detectionCard}>
        <View style={styles.detectionHeader}>
          <View style={styles.detectionInfo}>
            <Text style={styles.detectionTime}>{formatTimestamp(item.timestamp)}</Text>
            <Text style={styles.detectionConfidence}>
              Confidence: {(item.confidence * 100).toFixed(0)}%
            </Text>
          </View>
          {isMarked && (
            <View
              style={[
                styles.markBadge,
                isTruePositive ? styles.trueBadge : styles.falseBadge,
              ]}
            >
              {isTruePositive ? (
                <ThumbsUp size={14} color={colors.white} />
              ) : (
                <ThumbsDown size={14} color={colors.white} />
              )}
            </View>
          )}
        </View>

        {item.transcription && (
          <View style={styles.detectionContent}>
            <Text style={styles.detectionLabel}>Transcription:</Text>
            <Text style={styles.detectionText}>{item.transcription}</Text>
          </View>
        )}

        {item.amount !== undefined && (
          <View style={styles.detectionContent}>
            <Text style={styles.detectionLabel}>Amount Extracted:</Text>
            <Text style={styles.detectionAmount}>₹{item.amount}</Text>
          </View>
        )}

        {item.error && (
          <View style={styles.detectionError}>
            <AlertCircle size={16} color={colors.error} />
            <Text style={styles.errorText}>{item.error}</Text>
          </View>
        )}

        <View style={styles.detectionActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.trueButton]}
            onPress={() => handleMarkDetection(item.id, true)}
            disabled={isMarked && isTruePositive}
          >
            <ThumbsUp size={16} color={colors.white} />
            <Text style={styles.actionButtonText}>True</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.falseButton]}
            onPress={() => handleMarkDetection(item.id, false)}
            disabled={isMarked && !isTruePositive}
          >
            <ThumbsDown size={16} color={colors.white} />
            <Text style={styles.actionButtonText}>False</Text>
          </TouchableOpacity>

          {item.clipUri && (
            <TouchableOpacity
              style={[styles.actionButton, styles.saveButton]}
              onPress={() => handleSaveForQA(item)}
            >
              <Download size={16} color={colors.white} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TestTube size={24} color={colors.primary} />
        <Text style={styles.headerTitle}>Detector QA</Text>
      </View>

      {/* Stats Card */}
      <View style={styles.statsCard}>
        <View style={styles.statRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.totalDetections}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.success }]}>
              {stats.truePositives}
            </Text>
            <Text style={styles.statLabel}>True +</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.error }]}>
              {stats.falsePositives}
            </Text>
            <Text style={styles.statLabel}>False +</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.primary }]}>
              {getAccuracyRate()}%
            </Text>
            <Text style={styles.statLabel}>Accuracy</Text>
          </View>
        </View>

        {stats.averageLatencyMs > 0 && (
          <View style={styles.latencyRow}>
            <Text style={styles.latencyLabel}>Avg Latency:</Text>
            <Text style={styles.latencyValue}>{stats.averageLatencyMs}ms</Text>
          </View>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.actionBar}>
        <TouchableOpacity
          style={[styles.primaryButton, isSimulating && styles.buttonDisabled]}
          onPress={handleSimulateWake}
          disabled={isSimulating}
        >
          <Play size={20} color={colors.white} />
          <Text style={styles.primaryButtonText}>
            {isSimulating ? 'Simulating...' : 'Simulate Wake'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={handleClearHistory}
          disabled={detectionHistory.length === 0}
        >
          <Trash2 size={20} color={colors.error} />
        </TouchableOpacity>
      </View>

      {/* Detection History */}
      {detectionHistory.length > 0 ? (
        <FlatList
          data={detectionHistory}
          renderItem={renderDetection}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <TestTube size={64} color={colors.gray300} />
          <Text style={styles.emptyTitle}>No Detections Yet</Text>
          <Text style={styles.emptyText}>
            Use the "Simulate Wake" button to test the detector
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.xl,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  headerTitle: {
    ...typography.h2,
  },
  statsCard: {
    backgroundColor: colors.white,
    margin: spacing.lg,
    padding: spacing.xl,
    borderRadius: borderRadius.xl,
    ...shadows.md,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    ...typography.h1,
    color: colors.textPrimary,
  },
  statLabel: {
    ...typography.caption,
    marginTop: spacing.xs,
  },
  latencyRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
  },
  latencyLabel: {
    ...typography.body,
  },
  latencyValue: {
    ...typography.bodyBold,
    color: colors.primary,
  },
  actionBar: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.lg,
    ...shadows.md,
  },
  primaryButtonText: {
    ...typography.bodyBold,
    color: colors.white,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  secondaryButton: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.error,
    ...shadows.sm,
  },
  listContent: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  detectionCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.sm,
  },
  detectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  detectionInfo: {
    flex: 1,
  },
  detectionTime: {
    ...typography.caption,
    marginBottom: spacing.xs,
  },
  detectionConfidence: {
    ...typography.captionBold,
    color: colors.primary,
  },
  markBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  trueBadge: {
    backgroundColor: colors.success,
  },
  falseBadge: {
    backgroundColor: colors.error,
  },
  detectionContent: {
    marginBottom: spacing.md,
  },
  detectionLabel: {
    ...typography.captionBold,
    marginBottom: spacing.xs,
  },
  detectionText: {
    ...typography.body,
  },
  detectionAmount: {
    ...typography.h3,
    color: colors.success,
  },
  detectionError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.gray50,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  errorText: {
    ...typography.caption,
    color: colors.error,
    flex: 1,
  },
  detectionActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  trueButton: {
    backgroundColor: colors.success,
  },
  falseButton: {
    backgroundColor: colors.error,
  },
  saveButton: {
    flex: 0,
    width: 44,
    backgroundColor: colors.primary,
  },
  actionButtonText: {
    ...typography.captionBold,
    color: colors.white,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxxl,
  },
  emptyTitle: {
    ...typography.h2,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
