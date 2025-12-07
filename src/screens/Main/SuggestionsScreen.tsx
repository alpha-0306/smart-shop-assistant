import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
  TextInput,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { Check, Package, List, X, Plus, Minus, ShoppingCart, Search } from 'lucide-react-native';
import { useInventoryStore } from '../../store/inventoryStore';
import { useSalesStore } from '../../store/salesStore';
import { suggestProducts, SuggestedCombination } from '../../utils/recommender';
import { getProductImageSource } from '../../utils/productImages';

type SuggestionsRouteParams = {
  Suggestions: {
    amount: number;
  };
};

export default function SuggestionsScreen() {
  const route = useRoute<RouteProp<SuggestionsRouteParams, 'Suggestions'>>();
  const navigation = useNavigation();
  const products = useInventoryStore((state) => state.products);
  const updateStock = useInventoryStore((state) => state.updateStock);
  const addSale = useSalesStore((state) => state.addSale);
  
  // Get learning data from sales store
  const lastTenSales = useSalesStore((state) => state.lastTenSales);
  const hourlyStats = useSalesStore((state) => state.hourlyStats);
  const comboStats = useSalesStore((state) => state.comboStats);

  const amount = route.params?.amount || 0;
  const [suggestions, setSuggestions] = useState<SuggestedCombination[]>([]);
  const [showManualModal, setShowManualModal] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Array<{ product: any; quantity: number }>>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Generate suggestions with learning data
    const learningData = { lastTenSales, hourlyStats, comboStats };
    const results = suggestProducts(products, amount, learningData);
    setSuggestions(results);

    if (results.length === 0) {
      Alert.alert(
        'No Matches Found',
        `No product combinations found for ₹${amount}. Would you like to go to inventory?`,
        [
          { text: 'Cancel', style: 'cancel', onPress: () => navigation.goBack() },
          {
            text: 'Go to Inventory',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    }
  }, [amount, products]);

  const handleConfirm = (suggestion: SuggestedCombination) => {
    Alert.alert(
      'Confirm Sale',
      `Confirm sale of ₹${suggestion.total}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => processSale(suggestion),
        },
      ]
    );
  };

  const handleManualSelection = () => {
    const availableProducts = products.filter((p) => p.stock > 0);
    
    if (availableProducts.length === 0) {
      Alert.alert('No Products', 'No products available in inventory');
      return;
    }

    setSelectedItems([]);
    setSearchQuery('');
    setShowManualModal(true);
  };

  // Filter products based on search query
  const filteredAvailableProducts = useMemo(() => {
    const available = products.filter((p) => p.stock > 0);
    
    if (!searchQuery.trim()) return available;
    
    const query = searchQuery.toLowerCase();
    return available.filter((product) =>
      product.name.toLowerCase().includes(query)
    );
  }, [products, searchQuery]);

  const addProductToSelection = (product: any) => {
    const existing = selectedItems.find((item) => item.product.id === product.id);
    if (existing) {
      setSelectedItems(
        selectedItems.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setSelectedItems([...selectedItems, { product, quantity: 1 }]);
    }
  };

  const removeProductFromSelection = (productId: string) => {
    setSelectedItems(selectedItems.filter((item) => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, delta: number) => {
    setSelectedItems(
      selectedItems
        .map((item) =>
          item.product.id === productId
            ? { ...item, quantity: Math.max(1, item.quantity + delta) }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const processManualSale = () => {
    if (selectedItems.length === 0) {
      Alert.alert('No Products', 'Please select at least one product');
      return;
    }

    const total = selectedItems.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    );

    if (total !== amount) {
      Alert.alert(
        'Amount Mismatch',
        `Selected total (₹${total}) must match payment amount (₹${amount}). Please adjust your selection.`
      );
      return;
    }

    // Deduct stock
    selectedItems.forEach(({ product, quantity }) => {
      for (let i = 0; i < quantity; i++) {
        updateStock(product.id, -1);
      }
      
      // Update popularity
      useInventoryStore.setState((state) => ({
        products: state.products.map((p) =>
          p.id === product.id ? { ...p, popularity: p.popularity + 1 } : p
        ),
      }));
    });

    // Add sale
    addSale({
      timestamp: Date.now(),
      amount,
      items: selectedItems.flatMap((item) => Array(item.quantity).fill(item.product.id)),
    });

    setShowManualModal(false);
    setSelectedItems([]);

    Alert.alert('Success!', `Sale of ₹${amount} recorded (Total: ₹${total})`, [
      {
        text: 'View Dashboard',
        onPress: () => {
          navigation.reset({
            index: 0,
            routes: [{ name: 'Main' as never }],
          });
        },
      },
      {
        text: 'OK',
        style: 'cancel',
      },
    ]);
  };

  const processSale = (suggestion: SuggestedCombination) => {
    try {
      // Deduct stock for each item
      suggestion.items.forEach(({ product, quantity }) => {
        for (let i = 0; i < quantity; i++) {
          updateStock(product.id, -1);
        }
        
        // Update popularity
        useInventoryStore.setState((state) => ({
          products: state.products.map((p) =>
            p.id === product.id ? { ...p, popularity: p.popularity + 1 } : p
          ),
        }));
      });

      // Add sale
      addSale({
        timestamp: Date.now(),
        amount: suggestion.total,
        items: suggestion.items.map((item) => item.product.id),
      });

      // Navigate to dashboard
      Alert.alert('Success!', `Sale of ₹${suggestion.total} recorded`, [
        {
          text: 'View Dashboard',
          onPress: () => {
            navigation.reset({
              index: 0,
              routes: [{ name: 'Main' as never }],
            });
          },
        },
        {
          text: 'OK',
          style: 'cancel',
        },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to process sale. Please try again.');
    }
  };

  const renderSuggestion = (suggestion: SuggestedCombination, index: number) => (
    <View key={index} style={styles.suggestionCard}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>Option {index + 1}</Text>
        <View style={styles.confidenceBadge}>
          <Text style={styles.confidenceText}>
            {Math.round(suggestion.confidence * 100)}% match
          </Text>
        </View>
      </View>

      {/* Confidence bar */}
      <View style={styles.confidenceBarContainer}>
        <View
          style={[
            styles.confidenceBar,
            { width: `${suggestion.confidence * 100}%` },
          ]}
        />
      </View>

      {/* AI Reasons */}
      {suggestion.reasons && suggestion.reasons.length > 0 && (
        <View style={styles.reasonsContainer}>
          {suggestion.reasons.map((reason, idx) => (
            <Text key={idx} style={styles.reasonText}>
              • {reason}
            </Text>
          ))}
        </View>
      )}

      <View style={styles.itemsList}>
        {suggestion.items.map(({ product, quantity }, idx) => (
          <View key={idx} style={styles.itemRow}>
            {(() => {
              const imageSource = getProductImageSource(product.photoUri, product.name);
              return imageSource ? (
                <Image source={imageSource} style={styles.itemImage} />
              ) : (
                <View style={styles.itemImagePlaceholder}>
                  <Package size={24} color="#9CA3AF" />
                </View>
              );
            })()}
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{product.name}</Text>
              <Text style={styles.itemPrice}>
                ₹{product.price} × {quantity}
              </Text>
            </View>
            <Text style={styles.itemTotal}>₹{product.price * quantity}</Text>
          </View>
        ))}
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Total:</Text>
          <Text style={styles.totalAmount}>₹{suggestion.total}</Text>
        </View>
        <TouchableOpacity
          style={styles.confirmButton}
          onPress={() => handleConfirm(suggestion)}
        >
          <Check size={20} color="#fff" />
          <Text style={styles.confirmButtonText}>Confirm</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Match Found for ₹{amount}</Text>
        <Text style={styles.headerSubtitle}>
          {suggestions.length} suggestion{suggestions.length !== 1 ? 's' : ''}
        </Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {suggestions.map((suggestion, index) => renderSuggestion(suggestion, index))}

        {suggestions.length > 0 && (
          <>
            <TouchableOpacity
              style={styles.manualButton}
              onPress={() => handleManualSelection()}
            >
              <List size={20} color="#4F46E5" />
              <Text style={styles.manualButtonText}>Manual Selection</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.manualButton, styles.secondaryButton]}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.secondaryButtonText}>Go Back</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      {/* Manual Selection Modal */}
      <Modal
        visible={showManualModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowManualModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Products</Text>
            <TouchableOpacity onPress={() => setShowManualModal(false)}>
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <View style={styles.modalBody}>
            {/* Selected Items Summary */}
            {selectedItems.length > 0 && (
              <View style={styles.selectedSummary}>
                <View style={styles.summaryHeader}>
                  <ShoppingCart size={20} color="#4F46E5" />
                  <Text style={styles.summaryTitle}>Selected Items</Text>
                </View>
                {selectedItems.map((item) => (
                  <View key={item.product.id} style={styles.selectedItem}>
                    <Text style={styles.selectedItemName}>
                      {item.product.name} × {item.quantity}
                    </Text>
                    <View style={styles.selectedItemActions}>
                      <TouchableOpacity
                        onPress={() => updateQuantity(item.product.id, -1)}
                        style={styles.qtyButton}
                      >
                        <Minus size={16} color="#6B7280" />
                      </TouchableOpacity>
                      <Text style={styles.selectedItemQty}>{item.quantity}</Text>
                      <TouchableOpacity
                        onPress={() => updateQuantity(item.product.id, 1)}
                        style={styles.qtyButton}
                      >
                        <Plus size={16} color="#6B7280" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => removeProductFromSelection(item.product.id)}
                        style={styles.removeButton}
                      >
                        <X size={16} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
                <View style={styles.summaryTotal}>
                  <View>
                    <Text style={styles.summaryTotalLabel}>Selected Total:</Text>
                    <Text style={styles.summaryPaymentLabel}>Payment: ₹{amount}</Text>
                  </View>
                  <View style={styles.summaryTotalRight}>
                    <Text
                      style={[
                        styles.summaryTotalValue,
                        selectedItems.reduce(
                          (sum, item) => sum + item.product.price * item.quantity,
                          0
                        ) !== amount && styles.summaryTotalExceeded,
                      ]}
                    >
                      ₹
                      {selectedItems.reduce(
                        (sum, item) => sum + item.product.price * item.quantity,
                        0
                      )}
                    </Text>
                    {selectedItems.reduce(
                      (sum, item) => sum + item.product.price * item.quantity,
                      0
                    ) !== amount &&
                      selectedItems.length > 0 && (
                        <Text style={styles.exceededWarning}>
                          {selectedItems.reduce(
                            (sum, item) => sum + item.product.price * item.quantity,
                            0
                          ) > amount
                            ? 'Exceeds payment!'
                            : 'Less than payment!'}
                        </Text>
                      )}
                  </View>
                </View>
              </View>
            )}

            {/* Search Bar */}
            <View style={styles.searchContainer}>
              <Search size={20} color="#9CA3AF" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search products..."
                placeholderTextColor="#9CA3AF"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <X size={20} color="#9CA3AF" />
                </TouchableOpacity>
              )}
            </View>

            {/* Available Products List */}
            <Text style={styles.sectionLabel}>
              Available Products ({filteredAvailableProducts.length})
            </Text>
            <FlatList
              data={filteredAvailableProducts}
              keyExtractor={(item) => item.id}
              renderItem={({ item: product }) => (
                <TouchableOpacity
                  style={styles.productItem}
                  onPress={() => addProductToSelection(product)}
                >
                  {(() => {
                    const imageSource = getProductImageSource(product.photoUri, product.name);
                    return imageSource ? (
                      <Image source={imageSource} style={styles.productItemImage} />
                    ) : (
                      <View style={styles.productItemImagePlaceholder}>
                        <Package size={20} color="#9CA3AF" />
                      </View>
                    );
                  })()}
                  <View style={styles.productItemInfo}>
                    <Text style={styles.productItemName}>{product.name}</Text>
                    <Text style={styles.productItemPrice}>₹{product.price}</Text>
                  </View>
                  <Plus size={20} color="#4F46E5" />
                </TouchableOpacity>
              )}
              contentContainerStyle={styles.productsList}
              ListEmptyComponent={
                searchQuery.trim() ? (
                  <View style={styles.emptySearch}>
                    <Search size={48} color="#D1D5DB" />
                    <Text style={styles.emptySearchText}>No products found</Text>
                    <Text style={styles.emptySearchSubtext}>
                      Try a different search term
                    </Text>
                  </View>
                ) : null
              }
            />
          </View>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalCancelButton]}
              onPress={() => setShowManualModal(false)}
            >
              <Text style={styles.modalCancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modalButton,
                styles.modalConfirmButton,
                (selectedItems.length === 0 ||
                  selectedItems.reduce(
                    (sum, item) => sum + item.product.price * item.quantity,
                    0
                  ) !== amount) &&
                  styles.modalButtonDisabled,
              ]}
              onPress={processManualSale}
              disabled={
                selectedItems.length === 0 ||
                selectedItems.reduce(
                  (sum, item) => sum + item.product.price * item.quantity,
                  0
                ) !== amount
              }
            >
              <Check size={20} color="#fff" />
              <Text style={styles.modalConfirmButtonText}>
                Confirm Sale ({selectedItems.length})
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 24,
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
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  suggestionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  confidenceBadge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E40AF',
  },
  confidenceBarContainer: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 12,
  },
  confidenceBar: {
    height: '100%',
    backgroundColor: '#4F46E5',
    borderRadius: 2,
  },
  reasonsContainer: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    gap: 4,
  },
  reasonText: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
  },
  itemsList: {
    gap: 12,
    marginBottom: 16,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  itemImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  itemImagePlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  itemPrice: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  itemTotal: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4F46E5',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  totalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  totalLabel: {
    fontSize: 16,
    color: '#6B7280',
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#4F46E5',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  manualButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#4F46E5',
    marginTop: 8,
  },
  manualButtonText: {
    color: '#4F46E5',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  secondaryButtonText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  modalBody: {
    flex: 1,
    padding: 16,
  },
  selectedSummary: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  selectedItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  selectedItemName: {
    fontSize: 14,
    color: '#1F2937',
    flex: 1,
  },
  selectedItemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  qtyButton: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  selectedItemQty: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    minWidth: 24,
    textAlign: 'center',
  },
  removeButton: {
    padding: 4,
    marginLeft: 4,
  },
  summaryTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  summaryTotalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  summaryPaymentLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  summaryTotalRight: {
    alignItems: 'flex-end',
  },
  summaryTotalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4F46E5',
  },
  summaryTotalExceeded: {
    color: '#EF4444',
  },
  exceededWarning: {
    fontSize: 11,
    color: '#EF4444',
    fontWeight: '600',
    marginTop: 2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 12,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  emptySearch: {
    alignItems: 'center',
    padding: 40,
  },
  emptySearchText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 12,
  },
  emptySearchSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 12,
  },
  productsList: {
    gap: 8,
  },
  productItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 12,
  },
  productItemImage: {
    width: 40,
    height: 40,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
  },
  productItemImagePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productItemInfo: {
    flex: 1,
  },
  productItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  productItemPrice: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  modalButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  modalCancelButton: {
    backgroundColor: '#F3F4F6',
  },
  modalCancelButtonText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '600',
  },
  modalConfirmButton: {
    backgroundColor: '#4F46E5',
  },
  modalConfirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalButtonDisabled: {
    opacity: 0.5,
  },
});
