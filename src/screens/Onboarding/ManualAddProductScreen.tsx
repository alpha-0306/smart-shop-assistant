import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput, 
  ScrollView, 
  Alert,
  Keyboard,
  TouchableWithoutFeedback
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Package, Check, Calendar } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useInventoryStore } from '../../store/inventoryStore';
import { useRestockStore } from '../../store/restockStore';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function ManualAddProductScreen() {
  const navigation = useNavigation();
  const addProduct = useInventoryStore((state) => state.addProduct);
  const addRestock = useRestockStore((state) => state.addRestock);

  const [productName, setProductName] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [lowStockThreshold, setLowStockThreshold] = useState('');
  const [costPerUnit, setCostPerUnit] = useState('');
  const [supplier, setSupplier] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [expiryDate, setExpiryDate] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleAddProduct = async () => {
    // Validation
    if (!productName.trim()) {
      Alert.alert('Error', 'Product name is required');
      return;
    }
    if (!price || isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
      Alert.alert('Error', 'Valid selling price is required');
      return;
    }
    if (!stock || isNaN(parseInt(stock)) || parseInt(stock) < 0) {
      Alert.alert('Error', 'Valid stock quantity is required');
      return;
    }

    setIsLoading(true);

    try {
      // Create product without any image (will show package icon)
      const newProduct = {
        id: `product_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
        name: productName.trim(),
        price: parseFloat(price),
        stock: parseInt(stock),
        lowStockThreshold: lowStockThreshold ? parseInt(lowStockThreshold) : 5,
        popularity: 0,
        // No photoUri - will show package icon placeholder
      };

      addProduct(newProduct);

      // Add restock entry if cost and supplier provided
      if (costPerUnit && supplier.trim()) {
        addRestock({
          productId: newProduct.id,
          quantity: parseInt(stock),
          costPerUnit: parseFloat(costPerUnit),
          supplier: supplier.trim(),
          expiryDate: expiryDate?.getTime() || null,
        });
      }

      Alert.alert(
        'Success!', 
        `${productName} added to inventory`,
        [
          {
            text: 'Add Another',
            onPress: () => {
              setProductName('');
              setPrice('');
              setStock('');
              setLowStockThreshold('');
              setCostPerUnit('');
              setSupplier('');
              setExpiryDate(null);
            }
          },
          {
            text: 'Go to Inventory',
            onPress: () => navigation.navigate('Main' as never)
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to add product. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateChange = (_event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setExpiryDate(selectedDate);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Package size={48} color="#4F46E5" />
            <Text style={styles.title}>Add Product Manually</Text>
            <Text style={styles.subtitle}>Enter product details below</Text>
          </View>

          <View style={styles.form}>
            {/* Product Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Product Name *</Text>
              <TextInput
                style={styles.input}
                value={productName}
                onChangeText={setProductName}
                placeholder="e.g., Parle-G Biscuits 80g"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            {/* Price and Stock Row */}
            <View style={styles.row}>
              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.label}>Selling Price (₹) *</Text>
                <TextInput
                  style={styles.input}
                  value={price}
                  onChangeText={setPrice}
                  placeholder="30"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.label}>Stock Quantity *</Text>
                <TextInput
                  style={styles.input}
                  value={stock}
                  onChangeText={setStock}
                  placeholder="50"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="number-pad"
                />
              </View>
            </View>

            {/* Low Stock Threshold */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Low Stock Alert (optional)</Text>
              <TextInput
                style={styles.input}
                value={lowStockThreshold}
                onChangeText={setLowStockThreshold}
                placeholder="5 (alert when stock falls below this)"
                placeholderTextColor="#9CA3AF"
                keyboardType="number-pad"
              />
            </View>

            {/* Separator */}
            <View style={styles.separator}>
              <Text style={styles.separatorText}>Restock Information (Optional)</Text>
            </View>

            {/* Cost and Supplier Row */}
            <View style={styles.row}>
              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.label}>Cost per Unit (₹)</Text>
                <TextInput
                  style={styles.input}
                  value={costPerUnit}
                  onChangeText={setCostPerUnit}
                  placeholder="25"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.label}>Supplier</Text>
                <TextInput
                  style={styles.input}
                  value={supplier}
                  onChangeText={setSupplier}
                  placeholder="Supplier name"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>

            {/* Expiry Date */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Expiry Date (optional)</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Calendar size={20} color="#6B7280" />
                <Text style={styles.dateButtonText}>
                  {expiryDate ? expiryDate.toLocaleDateString() : 'Select expiry date'}
                </Text>
              </TouchableOpacity>
            </View>

            {showDatePicker && (
              <DateTimePicker
                value={expiryDate || new Date()}
                mode="date"
                display="default"
                onChange={handleDateChange}
                minimumDate={new Date()}
              />
            )}
          </View>

          {/* Add Button */}
          <TouchableOpacity
            style={[styles.addButton, isLoading && styles.addButtonDisabled]}
            onPress={handleAddProduct}
            disabled={isLoading}
          >
            <Check size={20} color="#fff" />
            <Text style={styles.addButtonText}>
              {isLoading ? 'Adding...' : 'Add Product'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 16,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  form: {
    gap: 20,
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
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  separator: {
    alignItems: 'center',
    marginVertical: 8,
  },
  separatorText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    backgroundColor: '#fff',
    gap: 8,
  },
  dateButtonText: {
    fontSize: 16,
    color: '#6B7280',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4F46E5',
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
    gap: 8,
  },
  addButtonDisabled: {
    opacity: 0.6,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});