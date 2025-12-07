import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Image,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { X, Check, RotateCcw } from 'lucide-react-native';

interface CropPreviewModalProps {
  visible: boolean;
  croppedUri: string;
  row: number;
  col: number;
  onSave: (data: { name: string; price: number; stock: number }) => void;
  onRecrop: () => void;
  onCancel: () => void;
}

export default function CropPreviewModal({
  visible,
  croppedUri,
  row,
  col,
  onSave,
  onRecrop,
  onCancel,
}: CropPreviewModalProps) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateAndSave = () => {
    const newErrors: { [key: string]: string } = {};

    if (!name.trim()) {
      newErrors.name = 'Product name is required';
    }

    const priceNum = parseFloat(price);
    if (!price || isNaN(priceNum) || priceNum <= 0) {
      newErrors.price = 'Valid price is required';
    }

    const stockNum = parseInt(stock, 10);
    if (!stock || isNaN(stockNum) || stockNum < 0) {
      newErrors.stock = 'Valid stock quantity is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Clear form and errors
    setName('');
    setPrice('');
    setStock('');
    setErrors({});

    onSave({
      name: name.trim(),
      price: priceNum,
      stock: stockNum,
    });
  };

  const handleCancel = () => {
    setName('');
    setPrice('');
    setStock('');
    setErrors({});
    onCancel();
  };

  const handleRecrop = () => {
    setName('');
    setPrice('');
    setStock('');
    setErrors({});
    onRecrop();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleCancel}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Add Product</Text>
            <TouchableOpacity onPress={handleCancel} style={styles.closeButton}>
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollView}>
            <View style={styles.imageContainer}>
              <Image source={{ uri: croppedUri }} style={styles.previewImage} />
              <Text style={styles.gridInfo}>
                Grid Position: Row {row + 1}, Col {col + 1}
              </Text>
            </View>

            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Product Name *</Text>
                <TextInput
                  style={[styles.input, errors.name && styles.inputError]}
                  value={name}
                  onChangeText={(text) => {
                    setName(text);
                    if (errors.name) {
                      setErrors({ ...errors, name: '' });
                    }
                  }}
                  placeholder="e.g., Parle-G Biscuits"
                  placeholderTextColor="#9CA3AF"
                />
                {errors.name && (
                  <Text style={styles.errorText}>{errors.name}</Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Price (₹) *</Text>
                <TextInput
                  style={[styles.input, errors.price && styles.inputError]}
                  value={price}
                  onChangeText={(text) => {
                    setPrice(text);
                    if (errors.price) {
                      setErrors({ ...errors, price: '' });
                    }
                  }}
                  placeholder="e.g., 50"
                  keyboardType="decimal-pad"
                  placeholderTextColor="#9CA3AF"
                />
                {errors.price && (
                  <Text style={styles.errorText}>{errors.price}</Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Stock Quantity *</Text>
                <TextInput
                  style={[styles.input, errors.stock && styles.inputError]}
                  value={stock}
                  onChangeText={(text) => {
                    setStock(text);
                    if (errors.stock) {
                      setErrors({ ...errors, stock: '' });
                    }
                  }}
                  placeholder="e.g., 20"
                  keyboardType="number-pad"
                  placeholderTextColor="#9CA3AF"
                />
                {errors.stock && (
                  <Text style={styles.errorText}>{errors.stock}</Text>
                )}
              </View>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.button, styles.recropButton]}
              onPress={handleRecrop}
            >
              <RotateCcw size={20} color="#6B7280" />
              <Text style={styles.recropButtonText}>Re-crop</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.saveButton]}
              onPress={validateAndSave}
            >
              <Check size={20} color="#fff" />
              <Text style={styles.saveButtonText}>Save Product</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
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
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  closeButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  imageContainer: {
    padding: 20,
    alignItems: 'center',
  },
  previewImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  gridInfo: {
    marginTop: 12,
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  form: {
    padding: 20,
    gap: 16,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#fff',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  recropButton: {
    backgroundColor: '#F3F4F6',
  },
  recropButtonText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#4F46E5',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
