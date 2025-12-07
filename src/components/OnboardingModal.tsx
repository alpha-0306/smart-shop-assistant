import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Store } from 'lucide-react-native';
import { useShopContextStore } from '../store/shopContextStore';
import {
  colors,
  spacing,
  borderRadius,
  typography,
  buttonStyles,
  shadows,
} from '../utils/theme';

interface OnboardingModalProps {
  visible: boolean;
  onComplete: () => void;
}

const LANGUAGES = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'hi', label: 'Hindi', native: 'हिंदी' },
  { code: 'kn', label: 'Kannada', native: 'ಕನ್ನಡ' },
];

const REGIONS = [
  'Bangalore',
  'Mumbai',
  'Delhi',
  'Chennai',
  'Hyderabad',
  'Pune',
  'Kolkata',
  'Ahmedabad',
  'Other City',
];

const HOURS = Array.from({ length: 24 }, (_, i) => {
  const hour = i.toString().padStart(2, '0');
  return `${hour}:00`;
});

export default function OnboardingModal({ visible, onComplete }: OnboardingModalProps) {
  const updateContext = useShopContextStore((state) => state.updateContext);
  const context = useShopContextStore((state) => state.context);

  const [ownerName, setOwnerName] = useState(context.ownerName);
  const [shopName, setShopName] = useState(context.shopName);
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'hi' | 'kn'>(context.primaryLanguage);
  const [openingTime, setOpeningTime] = useState(context.openingHours.open);
  const [closingTime, setClosingTime] = useState(context.openingHours.close);
  const [region, setRegion] = useState(context.shopAddressRegion);
  const [showOpeningPicker, setShowOpeningPicker] = useState(false);
  const [showClosingPicker, setShowClosingPicker] = useState(false);
  const [showRegionPicker, setShowRegionPicker] = useState(false);

  const handleComplete = () => {
    updateContext({
      ownerName: ownerName.trim() || 'Owner',
      shopName: shopName.trim() || 'My Kirana Store',
      primaryLanguage: selectedLanguage,
      openingHours: { open: openingTime, close: closingTime },
      shopAddressRegion: region,
    });
    onComplete();
  };

  const handleSkip = () => {
    onComplete();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.modalContainer}>
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
              <View style={styles.iconContainer}>
                <Store size={32} color={colors.primary} />
              </View>
              <Text style={styles.title}>Welcome to Smart Shop!</Text>
              <Text style={styles.subtitle}>
                Let's set up your shop in just a few seconds
              </Text>
            </View>

            <View style={styles.form}>
              {/* Owner Name */}
              <View style={styles.field}>
                <Text style={styles.label}>Your Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your name"
                  placeholderTextColor={colors.gray400}
                  value={ownerName}
                  onChangeText={setOwnerName}
                />
              </View>

              {/* Shop Name */}
              <View style={styles.field}>
                <Text style={styles.label}>Shop Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter shop name"
                  placeholderTextColor={colors.gray400}
                  value={shopName}
                  onChangeText={setShopName}
                />
              </View>

              {/* Language */}
              <View style={styles.field}>
                <Text style={styles.label}>Preferred Language</Text>
                <View style={styles.languageButtons}>
                  {LANGUAGES.map((lang) => (
                    <TouchableOpacity
                      key={lang.code}
                      style={[
                        styles.languageButton,
                        selectedLanguage === lang.code && styles.languageButtonActive,
                      ]}
                      onPress={() => setSelectedLanguage(lang.code as 'en' | 'hi' | 'kn')}
                    >
                      <Text
                        style={[
                          styles.languageButtonText,
                          selectedLanguage === lang.code && styles.languageButtonTextActive,
                        ]}
                      >
                        {lang.native}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Opening Hours */}
              <View style={styles.field}>
                <Text style={styles.label}>Opening Hours</Text>
                <View style={styles.timeRow}>
                  <TouchableOpacity
                    style={styles.timeButton}
                    onPress={() => setShowOpeningPicker(!showOpeningPicker)}
                  >
                    <Text style={styles.timeButtonText}>{openingTime}</Text>
                  </TouchableOpacity>
                  <Text style={styles.timeSeparator}>to</Text>
                  <TouchableOpacity
                    style={styles.timeButton}
                    onPress={() => setShowClosingPicker(!showClosingPicker)}
                  >
                    <Text style={styles.timeButtonText}>{closingTime}</Text>
                  </TouchableOpacity>
                </View>

                {showOpeningPicker && (
                  <View style={styles.picker}>
                    <ScrollView style={styles.pickerScroll}>
                      {HOURS.map((hour) => (
                        <TouchableOpacity
                          key={hour}
                          style={styles.pickerItem}
                          onPress={() => {
                            setOpeningTime(hour);
                            setShowOpeningPicker(false);
                          }}
                        >
                          <Text style={styles.pickerItemText}>{hour}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}

                {showClosingPicker && (
                  <View style={styles.picker}>
                    <ScrollView style={styles.pickerScroll}>
                      {HOURS.map((hour) => (
                        <TouchableOpacity
                          key={hour}
                          style={styles.pickerItem}
                          onPress={() => {
                            setClosingTime(hour);
                            setShowClosingPicker(false);
                          }}
                        >
                          <Text style={styles.pickerItemText}>{hour}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>

              {/* Region */}
              <View style={styles.field}>
                <Text style={styles.label}>Region / City</Text>
                <TouchableOpacity
                  style={styles.input}
                  onPress={() => setShowRegionPicker(!showRegionPicker)}
                >
                  <Text style={styles.inputText}>{region}</Text>
                </TouchableOpacity>

                {showRegionPicker && (
                  <View style={styles.picker}>
                    <ScrollView style={styles.pickerScroll}>
                      {REGIONS.map((r) => (
                        <TouchableOpacity
                          key={r}
                          style={styles.pickerItem}
                          onPress={() => {
                            setRegion(r);
                            setShowRegionPicker(false);
                          }}
                        >
                          <Text style={styles.pickerItemText}>{r}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[buttonStyles.outline, styles.skipButton]}
              onPress={handleSkip}
            >
              <Text style={styles.skipButtonText}>Skip for Now</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[buttonStyles.primary, styles.completeButton]}
              onPress={handleComplete}
            >
              <Text style={styles.completeButtonText}>Get Started</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxHeight: '85%',
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    ...shadows.lg,
  },
  scrollView: {
    maxHeight: 500,
  },
  header: {
    alignItems: 'center',
    padding: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.full,
    backgroundColor: colors.gray50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    ...typography.h2,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.caption,
    textAlign: 'center',
  },
  form: {
    padding: spacing.xl,
    gap: spacing.lg,
  },
  field: {
    gap: spacing.sm,
  },
  label: {
    ...typography.bodyBold,
  },
  input: {
    ...typography.body,
    padding: spacing.md,
    backgroundColor: colors.gray50,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  inputText: {
    ...typography.body,
    color: colors.textPrimary,
  },
  languageButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  languageButton: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.gray50,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: colors.gray200,
    alignItems: 'center',
  },
  languageButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  languageButtonText: {
    ...typography.bodyBold,
    color: colors.textSecondary,
  },
  languageButtonTextActive: {
    color: colors.white,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  timeButton: {
    flex: 1,
    padding: spacing.md,
    backgroundColor: colors.gray50,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.gray200,
    alignItems: 'center',
  },
  timeButtonText: {
    ...typography.bodyBold,
    color: colors.textPrimary,
  },
  timeSeparator: {
    ...typography.body,
    color: colors.textSecondary,
  },
  picker: {
    marginTop: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.gray200,
    maxHeight: 200,
    ...shadows.md,
  },
  pickerScroll: {
    maxHeight: 200,
  },
  pickerItem: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  pickerItemText: {
    ...typography.body,
    color: colors.textPrimary,
  },
  footer: {
    flexDirection: 'row',
    padding: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
    gap: spacing.md,
  },
  skipButton: {
    flex: 1,
  },
  skipButtonText: {
    ...typography.bodyBold,
    color: colors.primary,
    textAlign: 'center',
  },
  completeButton: {
    flex: 2,
  },
  completeButtonText: {
    ...typography.bodyBold,
    color: colors.white,
    textAlign: 'center',
  },
});
