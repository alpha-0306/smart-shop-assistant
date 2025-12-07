import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { Package, Trash2 } from 'lucide-react-native';
import { useInventoryStore } from '../../store/inventoryStore';
import { useRestockStore } from '../../store/restockStore';
import ExpiryBadge from '../../components/ExpiryBadge';
import { formatExpiryDate, isExpired } from '../../utils/expiryUtils';
import {
  colors,
  spacing,
  borderRadius,
  typography,
  shadows,
} from '../../utils/theme';

type RestockHistoryRouteParams = {
  RestockHistory: {
    productId: string;
  };
};

export default function RestockHistoryScreen() {
  const route = useRoute<RouteProp<RestockHistoryRouteParams, 'RestockHistory'>>();
  const navigation = useNavigation();
  const { productId } = route.params;

  const product = useInventoryStore((state) =>
    state.products.find((p) => p.id === productId)
  );
  const getRestocksForProduct = useRestockStore(
    (state) => state.getRestocksForProduct
  );
  const markRestockDiscarded = useRestockStore(
    (state) => state.markRestockDiscarded
  );

  const restocks = getRestocksForProduct(productId);

  const handleDiscard = (restockId: string, quantity: number, consumed: number) => {
    const remaining = quantity - consumed;
    Alert.alert(
      'Discard Batch',
      `This will remove ${remaining} unit(s) from stock. Continue?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => {
            markRestockDiscarded(restockId);
            Alert.alert('Success', 'Batch discarded and stock updated');
          },
        },
      ]
    );
  };

  const renderRestock = ({ item }: { item: any }) => {
    const remaining = item.quantity - (item.consumed || 0);
    const date = new Date(item.timestamp);

    return (
      <View style={styles.restockCard}>
        <View style={styles.restockHeader}>
          <View style={styles.restockInfo}>
            <Text style={styles.restockDate}>
              {date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
            <Text style={styles.restockQuantity}>
              +{item.quantity} units
              {remaining < item.quantity && (
                <Text style={styles.consumed}> ({remaining} remaining)</Text>
              )}
            </Text>
          </View>
          {remaining > 0 && item.expiryDate && isExpired(item.expiryDate) && (
            <TouchableOpacity
              style={styles.discardButton}
              onPress={() => handleDiscard(item.id, item.quantity, item.consumed || 0)}
            >
              <Trash2 size={16} color={colors.error} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.restockDetails}>
          {item.costPerUnit && (
            <Text style={styles.detailText}>
              Cost: ₹{item.costPerUnit}/unit (Total: ₹{(item.costPerUnit * item.quantity).toFixed(2)})
            </Text>
          )}
          {item.supplier && (
            <Text style={styles.detailText}>Supplier: {item.supplier}</Text>
          )}
          {item.batchId && (
            <Text style={styles.detailText}>Batch: {item.batchId}</Text>
          )}
          {item.expiryDate && (
            <View style={styles.expiryRow}>
              <Text style={styles.detailText}>
                Expiry: {formatExpiryDate(item.expiryDate)}
              </Text>
              <ExpiryBadge expiryDate={item.expiryDate} small />
            </View>
          )}
        </View>
      </View>
    );
  };

  if (!product) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Product not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{product.name}</Text>
        <Text style={styles.headerSubtitle}>Restock History</Text>
      </View>

      {restocks.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Package size={64} color={colors.gray300} />
          <Text style={styles.emptyText}>No restock history</Text>
          <Text style={styles.emptySubtext}>
            Restock records will appear here
          </Text>
        </View>
      ) : (
        <FlatList
          data={restocks}
          renderItem={renderRestock}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    padding: spacing.xl,
    backgroundColor: colors.backgroundSecondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  headerTitle: {
    ...typography.h2,
  },
  headerSubtitle: {
    ...typography.caption,
    marginTop: spacing.xs,
  },
  listContent: {
    padding: spacing.lg,
  },
  restockCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.gray200,
    ...shadows.sm,
  },
  restockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  restockInfo: {
    flex: 1,
  },
  restockDate: {
    ...typography.caption,
    marginBottom: spacing.xs,
  },
  restockQuantity: {
    ...typography.bodyBold,
    color: colors.success,
  },
  consumed: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  discardButton: {
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.gray50,
  },
  restockDetails: {
    gap: spacing.xs,
  },
  detailText: {
    ...typography.caption,
  },
  expiryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxxl,
  },
  emptyText: {
    ...typography.h3,
    color: colors.gray400,
    marginTop: spacing.lg,
  },
  emptySubtext: {
    ...typography.caption,
    color: colors.gray400,
    marginTop: spacing.sm,
  },
});
