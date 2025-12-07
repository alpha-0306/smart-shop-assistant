


import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Product } from '../store/inventoryStore';
import { useRestockStore } from '../store/restockStore';
import {
  colors,
  spacing,
  borderRadius,
  typography,
  buttonStyles,
} from '../utils/theme';

interface RestockModalProps {
  visible: boolean;
  product: Product;
  onClose: () => void;
}

export default function RestockModal({
  visible,
  product,
  onClose,
}: RestockModalProps) {
  const addRestock = useRestockStore((state) => state.addRestock);

  const [quantity, setQuantity] = useState('');
  const [costPerUnit, setCostPerUnit] = useState('');
  const [supplier, setSupplier] = useState('');
  const [batchId, setBatchId] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [expiryDate, setExpiryDate] = useState<Date | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSubmit = () => {
    const qty = parseInt(quantity, 10);

    if (!quantity || isNaN(qty) || qty <= 0) {
      Alert.alert('Error', 'Please enter a valid quantity');
      return;
    }

    const cost = costPerUnit ? parseFloat(costPerUnit) : undefined;
    if (costPerUnit && (isNaN(cost!) || cost! <= 0)) {
      Alert.alert('Error', 'Please enter a valid cost per unit');
      return;
    }

    addRestock({
      productId: product.id,
      quantity: qty,
      costPerUnit: cost,
      supplier: supplier.trim() || undefined,
      expiryDate: expiryDate ? expiryDate.getTime() : null,
      batchId: batchId.trim() || undefined,
    });

    const newStock = product.stock + qty;
    Alert.alert(
      'Restock Saved',
      `Added ${qty} units. Stock is now ${newStock}`,
      [{ text: 'OK', onPress: handleClose }]
    );
  };

  const handleClose = () => {
    setQuantity('');
    setCostPerUnit('');
    setSupplier('');
    setBatchId('');
    setExpiryDate(null);
    setShowAdvanced(false);
    onClose();
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setExpiryDate(selectedDate);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Restock: {product.name}</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollView}>
            <View style={styles.form}>
              <Text style={styles.label}>
                Quantity <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                placeholder="Enter quantity"
                placeholderTextColor={colors.gray400}
                keyboardType="numeric"
                value={quantity}
                onChangeText={setQuantity}
              />

              <Text style={styles.label}>Expiry Date (Optional)</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.dateButtonText}>
                  {expiryDate
                    ? expiryDate.toLocaleDateString()
                    : 'Select expiry date'}
                </Text>
              </TouchableOpacity>

              {showDatePicker && (
                <DateTimePicker
                  value={expiryDate || new Date()}
                  mode="date"
                  display="default"
                  onChange={handleDateChange}
                  minimumDate={new Date()}
                />
              )}

              <TouchableOpacity
                style={styles.advancedToggle}
                onPress={() => setShowAdvanced(!showAdvanced)}
              >
                <Text style={styles.advancedToggleText}>
                  {showAdvanced ? '▼' : '▶'} Advanced Options
                </Text>
              </TouchableOpacity>

              {showAdvanced && (
                <>
                  <Text style={styles.label}>Cost Per Unit (Optional)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter cost per unit"
                    placeholderTextColor={colors.gray400}
                    keyboardType="decimal-pad"
                    value={costPerUnit}
                    onChangeText={setCostPerUnit}
                  />

                  <Text style={styles.label}>Supplier (Optional)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter supplier name"
                    placeholderTextColor={colors.gray400}
                    value={supplier}
                    onChangeText={setSupplier}
                  />

                  <Text style={styles.label}>Batch ID (Optional)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter batch ID"
                    placeholderTextColor={colors.gray400}
                    value={batchId}
                    onChangeText={setBatchId}
                  />
                </>
              )}
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[buttonStyles.outline, styles.cancelButton]}
              onPress={handleClose}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[buttonStyles.primary, styles.submitButton]}
              onPress={handleSubmit}
            >
              <Text style={styles.submitButtonText}>Add Restock</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  title: {
    ...typography.h3,
    flex: 1,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    backgroundColor: colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontSize: 20,
    color: colors.gray600,
  },
  scrollView: {
    maxHeight: 400,
  },
  form: {
    padding: spacing.xl,
  },
  label: {
    ...typography.bodyBold,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  required: {
    color: colors.error,
  },
  input: {
    ...typography.body,
    padding: spacing.md,
    backgroundColor: colors.gray50,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  dateButton: {
    padding: spacing.md,
    backgroundColor: colors.gray50,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  dateButtonText: {
    ...typography.body,
    color: colors.textPrimary,
  },
  advancedToggle: {
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  advancedToggleText: {
    ...typography.bodyBold,
    color: colors.primary,
  },
  footer: {
    flexDirection: 'row',
    padding: spacing.xl,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
    gap: spacing.md,
  },
  cancelButton: {
    flex: 1,
  },
  cancelButtonText: {
    ...typography.bodyBold,
    color: colors.primary,
    textAlign: 'center',
  },
  submitButton: {
    flex: 2,
  },
  submitButtonText: {
    ...typography.bodyBold,
    color: colors.white,
    textAlign: 'center',
  },
});
