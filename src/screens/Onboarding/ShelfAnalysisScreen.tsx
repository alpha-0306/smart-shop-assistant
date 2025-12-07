import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { Sparkles, Check, Edit2, Trash2 } from 'lucide-react-native';
import { useInventoryStore } from '../../store/inventoryStore';
import { analyzeShelfImage, DetectedProduct } from '../../utils/aiVision';

type ShelfAnalysisRouteParams = {
  ShelfAnalysis: {
    photoUri: string;
  };
};

export default function ShelfAnalysisScreen() {
  const route = useRoute<RouteProp<ShelfAnalysisRouteParams, 'ShelfAnalysis'>>();
  const navigation = useNavigation();
  const addProduct = useInventoryStore((state) => state.addProduct);

  const photoUri = route.params?.photoUri;
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [products, setProducts] = useState<DetectedProduct[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [hasAttemptedAnalysis, setHasAttemptedAnalysis] = useState(false);
  
  // Get API key from environment variable
  const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY || '';

  // Auto-analyze if API key is present
  useEffect(() => {
    if (apiKey && apiKey.trim() && photoUri && !hasAttemptedAnalysis && !isAnalyzing) {
      console.log('Auto-analyzing image with API key...');
      setHasAttemptedAnalysis(true);
      handleAnalyze();
    }
  }, [apiKey, photoUri, hasAttemptedAnalysis]);

  const handleAnalyze = async () => {
    if (!apiKey || !apiKey.trim()) {
      Alert.alert(
        'API Key Missing',
        'Please add your OpenAI API key to the .env file:\nEXPO_PUBLIC_OPENAI_API_KEY=your_key_here'
      );
      return;
    }

    console.log('Starting analysis...');
    setIsAnalyzing(true);
    try {
      console.log('Calling analyzeShelfImage with photoUri:', photoUri);
      const detected = await analyzeShelfImage(photoUri, apiKey.trim());
      console.log('Analysis complete, detected products:', detected.length);
      setProducts(detected);
    } catch (error: any) {
      console.error('Analysis error:', error);
      Alert.alert(
        'Analysis Failed',
        error.message || 'Failed to analyze image. Please try again.'
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveAll = () => {
    if (products.length === 0) {
      Alert.alert('No Products', 'Please analyze the image first');
      return;
    }

    products.forEach((product) => {
      const productId = `product_${Date.now()}_${Math.random()
        .toString(36)
        .substring(2, 11)}`;

      addProduct({
        id: productId,
        name: product.name,
        price: product.estimatedPrice,
        stock: product.estimatedStock,
        popularity: 0,
        photoUri: photoUri,
      });
    });

    Alert.alert(
      'Success!',
      `Added ${products.length} product${products.length !== 1 ? 's' : ''} to inventory`,
      [
        {
          text: 'Add More Products',
          onPress: () => navigation.navigate('ShelfPhoto' as never),
        },
        {
          text: 'Go to Main Menu',
          onPress: () => navigation.navigate('Main' as never),
        },
      ]
    );
  };

  const handleEdit = (index: number, field: keyof DetectedProduct, value: string) => {
    const updated = [...products];
    if (field === 'name') {
      updated[index].name = value;
    } else if (field === 'estimatedPrice') {
      updated[index].estimatedPrice = parseFloat(value) || 0;
    } else if (field === 'estimatedStock') {
      updated[index].estimatedStock = parseInt(value, 10) || 0;
    }
    setProducts(updated);
  };

  const handleDelete = (index: number) => {
    const updated = products.filter((_, i) => i !== index);
    setProducts(updated);
  };

  // Show loading or setup screen if no products yet
  if (products.length === 0) {
    if (!apiKey || !apiKey.trim()) {
      // No API key configured
      return (
        <SafeAreaView style={styles.container}>
          <ScrollView contentContainerStyle={styles.setupContainer}>
            <Image source={{ uri: photoUri }} style={styles.previewImage} />
            
            <View style={styles.setupCard}>
              <Sparkles size={48} color="#4F46E5" />
              <Text style={styles.setupTitle}>API Key Required</Text>
              <Text style={styles.setupSubtitle}>
                Add your OpenAI API key to .env file
              </Text>

              <Text style={styles.helpText}>
                1. Open .env file in project root{'\n'}
                2. Add: EXPO_PUBLIC_OPENAI_API_KEY=your_key{'\n'}
                3. Get key from: platform.openai.com/api-keys{'\n'}
                4. Restart the app
              </Text>
            </View>
          </ScrollView>
        </SafeAreaView>
      );
    }

    // API key present, show analyzing state
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.analyzingContainer}>
          <Image source={{ uri: photoUri }} style={styles.previewImage} />
          <ActivityIndicator size="large" color="#4F46E5" style={styles.loader} />
          <Text style={styles.analyzingText}>Analyzing products...</Text>
          <Text style={styles.analyzingSubtext}>This may take a few seconds</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Detected Products</Text>
        <Text style={styles.headerSubtitle}>
          {products.length} product{products.length !== 1 ? 's' : ''} found
        </Text>
      </View>

      <ScrollView style={styles.scrollView}>
        <Image source={{ uri: photoUri }} style={styles.resultImage} />

        {products.map((product, index) => (
          <View key={index} style={styles.productCard}>
            {editingIndex === index ? (
              <View style={styles.editForm}>
                <TextInput
                  style={styles.editInput}
                  value={product.name}
                  onChangeText={(text) => handleEdit(index, 'name', text)}
                  placeholder="Product Name"
                  placeholderTextColor="#9CA3AF"
                />
                <View style={styles.editRow}>
                  <TextInput
                    style={[styles.editInput, styles.editInputSmall]}
                    value={product.estimatedPrice.toString()}
                    onChangeText={(text) => handleEdit(index, 'estimatedPrice', text)}
                    placeholder="Price (₹)"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="decimal-pad"
                  />
                  <TextInput
                    style={[styles.editInput, styles.editInputSmall]}
                    value={product.estimatedStock.toString()}
                    onChangeText={(text) => handleEdit(index, 'estimatedStock', text)}
                    placeholder="Quantity"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="number-pad"
                  />
                </View>
                <TouchableOpacity
                  style={styles.doneButton}
                  onPress={() => setEditingIndex(null)}
                >
                  <Check size={16} color="#4F46E5" />
                  <Text style={styles.doneButtonText}>Done</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <View style={styles.productInfo}>
                  <Text style={styles.productName}>{product.name}</Text>
                  <Text style={styles.productDetails}>
                    ₹{product.estimatedPrice} • Stock: {product.estimatedStock}
                  </Text>
                </View>
                <View style={styles.productActions}>
                  <TouchableOpacity
                    style={styles.iconButton}
                    onPress={() => setEditingIndex(index)}
                  >
                    <Edit2 size={18} color="#6B7280" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.iconButton}
                    onPress={() => handleDelete(index)}
                  >
                    <Trash2 size={18} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.reanalyzeButton}
          onPress={() => {
            setProducts([]);
            setHasAttemptedAnalysis(false);
          }}
        >
          <Sparkles size={20} color="#6B7280" />
          <Text style={styles.reanalyzeButtonText}>Re-analyze</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSaveAll}
          disabled={products.length === 0}
        >
          <Check size={20} color="#fff" />
          <Text style={styles.saveButtonText}>Save All ({products.length})</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  analyzingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loader: {
    marginTop: 24,
  },
  analyzingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
  },
  analyzingSubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
  },
  setupContainer: {
    padding: 20,
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    marginBottom: 24,
  },
  setupCard: {
    width: '100%',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  setupTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 16,
  },
  setupSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
  apiKeyInput: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#1F2937',
    backgroundColor: '#fff',
    marginTop: 20,
  },
  helpText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 12,
    textAlign: 'center',
  },
  analyzeButton: {
    backgroundColor: '#4F46E5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
    marginTop: 20,
    width: '100%',
  },
  analyzeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    padding: 20,
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  resultImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#F3F4F6',
  },
  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  productDetails: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  productActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    padding: 8,
  },
  editForm: {
    flex: 1,
    gap: 8,
  },
  editInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    color: '#1F2937',
    backgroundColor: '#fff',
  },
  editRow: {
    flexDirection: 'row',
    gap: 8,
  },
  editInputSmall: {
    flex: 1,
  },
  doneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    gap: 4,
  },
  doneButtonText: {
    color: '#4F46E5',
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  reanalyzeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    gap: 8,
  },
  reanalyzeButtonText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#4F46E5',
    gap: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
