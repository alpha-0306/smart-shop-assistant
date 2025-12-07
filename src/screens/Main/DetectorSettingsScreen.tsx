import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Mic, Clock, Battery, Settings as SettingsIcon, AlertCircle } from 'lucide-react-native';
import { useDetectorStore } from '../../store/detectorStore';
import { useShopContextStore } from '../../store/shopContextStore';
import { detectorBridge } from '../../native/DetectorBridge';
import { colors, spacing, typography, borderRadius, shadows } from '../../utils/theme';

export default function DetectorSettingsScreen() {
  const config = useDetectorStore((state) => state.config);
  const updateConfig = useDetectorStore((state) => state.updateConfig);
  const isActive = useDetectorStore((state) => state.isActive);
  const setActive = useDetectorStore((state) => state.setActive);
  const shopContext = useShopContextStore((state) => state.context);

  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    checkPermission();
  }, []);

  const checkPermission = async () => {
    const granted = await detectorBridge.hasPermission();
    setHasPermission(granted);
  };

  const handleToggleDetector = async (enabled: boolean) => {
    if (enabled && !hasPermission) {
      // Request permission first
      const granted = await detectorBridge.requestPermission();
      if (!granted) {
        Alert.alert(
          'Permission Required',
          'Microphone permission is required for hands-free payment detection. Please enable it in settings.',
          [{ text: 'OK' }]
        );
        return;
      }
      setHasPermission(true);
    }

    if (enabled) {
      // Show opt-in modal
      Alert.alert(
        'Enable Auto-Listen?',
        'This feature will listen for payment notifications in the background. Audio clips are processed locally and deleted immediately after transcription. A microphone indicator will be shown while active.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Enable',
            onPress: async () => {
              try {
                await detectorBridge.startDetector(config);
                updateConfig({ enabled: true });
                setActive(true);
                Alert.alert('Success', 'Auto-listen enabled');
              } catch (error) {
                Alert.alert('Error', 'Failed to start detector');
                console.error(error);
              }
            },
          },
        ]
      );
    } else {
      try {
        await detectorBridge.stopDetector();
        updateConfig({ enabled: false });
        setActive(false);
      } catch (error) {
        Alert.alert('Error', 'Failed to stop detector');
        console.error(error);
      }
    }
  };

  const handleToggleShopHours = (value: boolean) => {
    updateConfig({ onlyDuringShopHours: value });
    
    if (value) {
      // Sync with shop context hours
      const [openHour] = shopContext.openingHours.open.split(':').map(Number);
      const [closeHour] = shopContext.openingHours.close.split(':').map(Number);
      updateConfig({
        activeHours: {
          startHour: openHour,
          endHour: closeHour,
        },
      });
    }
  };

  const handleToggleBatterySaver = (value: boolean) => {
    updateConfig({ batterySaver: value });
    
    if (isActive) {
      Alert.alert(
        'Restart Required',
        'Please disable and re-enable auto-listen for this change to take effect.',
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <SettingsIcon size={24} color={colors.primary} />
        <Text style={styles.headerTitle}>Detector Settings</Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Mic size={32} color={isActive ? colors.success : colors.gray400} />
            <View style={styles.statusInfo}>
              <Text style={styles.statusTitle}>
                {isActive ? 'Auto-Listen Active' : 'Auto-Listen Inactive'}
              </Text>
              <Text style={styles.statusSubtitle}>
                {isActive
                  ? 'Listening for payment notifications'
                  : 'Enable to start hands-free detection'}
              </Text>
            </View>
          </View>
          {isActive && (
            <View style={styles.activeIndicator}>
              <View style={styles.micDot} />
              <Text style={styles.activeText}>Recording</Text>
            </View>
          )}
        </View>

        {/* Main Toggle */}
        <View style={styles.section}>
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Mic size={20} color={colors.primary} />
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Auto-Listen</Text>
                <Text style={styles.settingDescription}>
                  Automatically detect payment notifications
                </Text>
              </View>
            </View>
            <Switch
              value={config.enabled}
              onValueChange={handleToggleDetector}
              trackColor={{ false: colors.gray300, true: colors.primary }}
              thumbColor={colors.white}
            />
          </View>
        </View>

        {/* Active Hours */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Active Hours</Text>
          
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Clock size={20} color={colors.primary} />
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Only During Shop Hours</Text>
                <Text style={styles.settingDescription}>
                  {config.onlyDuringShopHours
                    ? `${shopContext.openingHours.open} - ${shopContext.openingHours.close}`
                    : 'Always active'}
                </Text>
              </View>
            </View>
            <Switch
              value={config.onlyDuringShopHours}
              onValueChange={handleToggleShopHours}
              trackColor={{ false: colors.gray300, true: colors.primary }}
              thumbColor={colors.white}
            />
          </View>
        </View>

        {/* Battery Saver */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Performance</Text>
          
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Battery size={20} color={colors.primary} />
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Battery Saver Mode</Text>
                <Text style={styles.settingDescription}>
                  Only listen when app is in foreground
                </Text>
              </View>
            </View>
            <Switch
              value={config.batterySaver}
              onValueChange={handleToggleBatterySaver}
              trackColor={{ false: colors.gray300, true: colors.primary }}
              thumbColor={colors.white}
            />
          </View>
        </View>

        {/* Privacy Notice */}
        <View style={styles.privacyCard}>
          <AlertCircle size={20} color={colors.info} />
          <View style={styles.privacyText}>
            <Text style={styles.privacyTitle}>Privacy & Security</Text>
            <Text style={styles.privacyDescription}>
              • Audio clips are processed locally{'\n'}
              • Clips are deleted immediately after transcription{'\n'}
              • Only payment amounts are extracted{'\n'}
              • Microphone indicator shown while active{'\n'}
              • You can disable this feature anytime
            </Text>
          </View>
        </View>

        {/* Advanced Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Advanced</Text>
          
          <View style={styles.advancedRow}>
            <Text style={styles.advancedLabel}>Debounce Delay</Text>
            <Text style={styles.advancedValue}>{config.debounceMs}ms</Text>
          </View>
          
          <View style={styles.advancedRow}>
            <Text style={styles.advancedLabel}>Confidence Threshold</Text>
            <Text style={styles.advancedValue}>
              {(config.confidenceThreshold * 100).toFixed(0)}%
            </Text>
          </View>
        </View>
      </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  statusCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    ...shadows.md,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  statusInfo: {
    flex: 1,
  },
  statusTitle: {
    ...typography.h3,
    marginBottom: spacing.xs,
  },
  statusSubtitle: {
    ...typography.caption,
  },
  activeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
  },
  micDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.error,
  },
  activeText: {
    ...typography.captionBold,
    color: colors.error,
  },
  section: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.sm,
  },
  sectionTitle: {
    ...typography.h3,
    marginBottom: spacing.md,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    ...typography.bodyBold,
    marginBottom: spacing.xs,
  },
  settingDescription: {
    ...typography.caption,
  },
  privacyCard: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.info,
    ...shadows.sm,
  },
  privacyText: {
    flex: 1,
  },
  privacyTitle: {
    ...typography.bodyBold,
    color: colors.info,
    marginBottom: spacing.sm,
  },
  privacyDescription: {
    ...typography.caption,
    lineHeight: 20,
  },
  advancedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  advancedLabel: {
    ...typography.body,
  },
  advancedValue: {
    ...typography.bodyBold,
    color: colors.primary,
  },
});
