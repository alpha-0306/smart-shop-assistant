import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Package, Plus, Minus, Camera, Edit2, Trash2, Check, X, PlusCircle, PackagePlus, History, Search } from 'lucide-react-native';
import { useInventoryStore, Product } from '../../store/inventoryStore';
import { useRestockStore } from '../../store/restockStore';
import RestockModal from '../../components/RestockModal';
import ExpiryBadge from '../../components/ExpiryBadge';
import { getEarliestExpiry } from '../../utils/expiryUtils';
import { getProductImageSource } from '../../utils/productImages';
import { useNavigation } from '@react-navigation/native';

export default function InventoryScreen() {
  const products = useInventoryStore((state) => state.products);
  const updateStock = useInventoryStore((state) => state.updateStock);
  const addProduct = useInventoryStore((state) => state.addProduct);
  const getRestocksForProduct = useRestockStore((state) => state.getRestocksForProduct);
  const navigation = useNavigation();

  const [searchQuery, setSearchQuery] = useState('');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editStock, setEditStock] = useState('');
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  
  const [restockingProduct, setRestockingProduct] = useState<Product | null>(null);
  const [newPrice, setNewPrice] = useState('');
  const [newStock, setNewStock] = useState('');

  // Filter products based on search query
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;
    
    const query = searchQuery.toLowerCase();
    return products.filter((product) =>
      product.name.toLowerCase().includes(query)
    );
  }, [products, searchQuery]);

  const handleEditStart = (product: Product) => {
    setEditingProduct(product);
    setEditName(product.name);
    setEditPrice(product.price.toString());
    setEditStock(product.stock.toString());
  };

  const handleEditSave = () => {
    if (!editingProduct) return;

    const price = parseFloat(editPrice);
    const stock = parseInt(editStock, 10);

    if (!editName.trim()) {
      Alert.alert('Error', 'Product name is required');
      return;
    }
    if (isNaN(price) || price <= 0) {
      Alert.alert('Error', 'Valid price is required');
      return;
    }
    if (isNaN(stock) || stock < 0) {
      Alert.alert('Error', 'Valid stock quantity is required');
      return;
    }

    // Update product
    useInventoryStore.setState((state) => ({
      products: state.products.map((p) =>
        p.id === editingProduct.id
          ? { ...p, name: editName.trim(), price, stock }
          : p
      ),
    }));

    // Save to storage
    useInventoryStore.getState().saveToStorage();

    setEditingProduct(null);
    Alert.alert('Success', 'Product updated successfully');
  };

  const handleDelete = (product: Product) => {
    Alert.alert(
      'Delete Product',
      `Are you sure you want to delete "${product.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            useInventoryStore.setState((state) => ({
              products: state.products.filter((p) => p.id !== product.id),
            }));
            useInventoryStore.getState().saveToStorage();
          },
        },
      ]
    );
  };

  const handleAddProduct = () => {
    const price = parseFloat(newPrice);
    const stock = parseInt(newStock, 10);

    if (!newName.trim()) {
      Alert.alert('Error', 'Product name is required');
      return;
    }
    if (isNaN(price) || price <= 0) {
      Alert.alert('Error', 'Valid price is required');
      return;
    }
    if (isNaN(stock) || stock < 0) {
      Alert.alert('Error', 'Valid stock quantity is required');
      return;
    }

    const newProduct: Product = {
      id: `product_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      name: newName.trim(),
      price,
      stock,
      popularity: 0,
    };

    addProduct(newProduct);
    
    setShowAddModal(false);
    setNewName('');
    setNewPrice('');
    setNewStock('');
    
    Alert.alert('Success', 'Product added successfully');
  };

  const renderProduct = ({ item }: { item: Product }) => {
    const restocks = getRestocksForProduct(item.id);
    const expiryDates = restocks.map(r => r.expiryDate).filter((d): d is number => d != null);
    const earliestExpiry = getEarliestExpiry(expiryDates);
    const isLowStock = item.stock <= (item.lowStockThreshold ?? 2);

    return (
      <View style={styles.productCard}>
        {(() => {
          const imageSource = getProductImageSource(item.photoUri, item.name);
          return imageSource ? (
            <Image source={imageSource} style={styles.productImage} />
          ) : (
            <View style={styles.placeholderImage}>
              <Package size={32} color="#9CA3AF" />
            </View>
          );
        })()}

        <View style={styles.productInfo}>
          <Text style={styles.productName}>{item.name}</Text>
          <Text style={styles.productPrice}>₹{item.price}</Text>
        </View>

        <View style={styles.productActions}>
          <View style={styles.stockControl}>
            <TouchableOpacity
              style={styles.stockButton}
              onPress={() => updateStock(item.id, -1)}
              disabled={item.stock <= 0}
            >
              <Minus size={16} color={item.stock <= 0 ? '#D1D5DB' : '#4F46E5'} />
            </TouchableOpacity>
            <Text style={styles.stockValue}>{item.stock}</Text>
            <TouchableOpacity
              style={styles.stockButton}
              onPress={() => updateStock(item.id, 1)}
            >
              <Plus size={16} color="#4F46E5" />
            </TouchableOpacity>
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => setRestockingProduct(item)}
            >
              <PackagePlus size={18} color="#10B981" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => (navigation.navigate as any)('RestockHistory', { productId: item.id })}
            >
              <History size={18} color="#6B7280" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => handleEditStart(item)}
            >
              <Edit2 size={18} color="#4F46E5" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => handleDelete(item)}
            >
              <Trash2 size={18} color="#EF4444" />
            </TouchableOpacity>
          </View>

          {(isLowStock || earliestExpiry) && (
            <View style={styles.badges}>
              {isLowStock && (
                <View style={styles.lowStockBadge}>
                  <Text style={styles.lowStockText}>Low</Text>
                </View>
              )}
              {earliestExpiry && (
                <ExpiryBadge expiryDate={earliestExpiry} small />
              )}
            </View>
          )}
        </View>
      </View>
    );
  };

  if (products.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Package size={64} color="#9CA3AF" />
          <Text style={styles.emptyTitle}>No Products Yet</Text>
          <Text style={styles.emptySubtitle}>
            Add products manually or using camera
          </Text>
          <View style={styles.emptyButtons}>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => (navigation.navigate as any)('ManualAddProduct')}
            >
              <PlusCircle size={20} color="#fff" />
              <Text style={styles.addButtonText}>Add Manually</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.addButton, styles.addButtonSecondary]}
              onPress={() => (navigation.navigate as any)('ShelfPhoto')}
            >
              <Camera size={20} color="#4F46E5" />
              <Text style={[styles.addButtonText, styles.addButtonTextSecondary]}>
                Use Camera
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Inventory</Text>
          <Text style={styles.headerSubtitle}>
            {filteredProducts.length} of {products.length} product{products.length !== 1 ? 's' : ''}
          </Text>
        </View>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => (navigation.navigate as any)('ManualAddProduct')}
          >
            <PlusCircle size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => (navigation.navigate as any)('ShelfPhoto')}
          >
            <Camera size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

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

      <FlatList
        data={filteredProducts}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
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

      {/* Edit Modal */}
      <Modal
        visible={editingProduct !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditingProduct(null)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Product</Text>
              <TouchableOpacity onPress={() => setEditingProduct(null)}>
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Product Name</Text>
                <TextInput
                  style={styles.input}
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="e.g., Parle-G Biscuits"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Price (₹)</Text>
                <TextInput
                  style={styles.input}
                  value={editPrice}
                  onChangeText={setEditPrice}
                  placeholder="e.g., 50"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="decimal-pad"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Stock Quantity</Text>
                <TextInput
                  style={styles.input}
                  value={editStock}
                  onChangeText={setEditStock}
                  placeholder="e.g., 20"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="number-pad"
                />
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setEditingProduct(null)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleEditSave}
              >
                <Check size={20} color="#fff" />
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Add Product Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Product</Text>
              <TouchableOpacity onPress={() => {
                setShowAddModal(false);
                setNewName('');
                setNewPrice('');
                setNewStock('');
              }}>
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Product Name</Text>
                <TextInput
                  style={styles.input}
                  value={newName}
                  onChangeText={setNewName}
                  placeholder="e.g., Parle-G Biscuits"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Price (₹)</Text>
                <TextInput
                  style={styles.input}
                  value={newPrice}
                  onChangeText={setNewPrice}
                  placeholder="e.g., 50"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="decimal-pad"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Stock Quantity</Text>
                <TextInput
                  style={styles.input}
                  value={newStock}
                  onChangeText={setNewStock}
                  placeholder="e.g., 20"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="number-pad"
                />
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowAddModal(false);
                  setNewName('');
                  setNewPrice('');
                  setNewStock('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleAddProduct}
              >
                <Check size={20} color="#fff" />
                <Text style={styles.saveButtonText}>Add Product</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Restock Modal */}
      {restockingProduct && (
        <RestockModal
          visible={true}
          product={restockingProduct}
          onClose={() => setRestockingProduct(null)}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerLeft: {
    flex: 1,
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
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 12,
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
  listContent: {
    padding: 16,
    gap: 12,
  },
  productCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  productImage: {
    width: 72,
    height: 72,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  placeholderImage: {
    width: 72,
    height: 72,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  badges: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 10,
  },
  lowStockBadge: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  lowStockText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  productPrice: {
    fontSize: 15,
    color: '#4F46E5',
    fontWeight: '700',
    marginTop: 2,
  },
  productActions: {
    alignItems: 'flex-end',
    gap: 8,
  },
  stockControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stockButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  stockValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    minWidth: 30,
    textAlign: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    padding: 6,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
  emptyButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#4F46E5',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  addButtonSecondary: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#4F46E5',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  addButtonTextSecondary: {
    color: '#4F46E5',
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
    width: '100%',
    maxWidth: 400,
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
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  modalButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    gap: 8,
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
  },
  cancelButtonText: {
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
