import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { Package, AlertTriangle, Clock, XCircle } from 'lucide-react-native';
import { useInventoryStore } from '../../store/inventoryStore';
import { useRestockStore } from '../../store/restockStore';
import ExpiryBadge from '../../components/ExpiryBadge';
import { getEarliestExpiry } from '../../utils/expiryUtils';
import {
  colors,
  spacing,
  borderRadius,
  typography,
  shadows,
} from '../../utils/theme';

type AlertDetailsRouteParams = {
  AlertDetails: {
    type: 'lowStock' | 'expiring' | 'expired';
  };
};

export default function AlertDetailsScreen() {
  const route = useRoute<RouteProp<AlertDetailsRouteParams, 'AlertDetails'>>();
  const navigation = useNavigation();
  const { type } = route.params;

  const products = useInventoryStore((state) => state.products);
  const getLowStockProducts = useInventoryStore((state) => state.getLowStockProducts);
  const getRestocksForProduct = useRestockStore((state) => state.getRestocksForProduct);
  const getExpiringSoon = useRestockStore((state) => state.getExpiringSoon);
  const getExpiredRestocks = useRestockStore((state) => state.getExpiredRestocks);

  const getTitle = () => {
    switch (type) {
      case 'lowStock':
        return 'Low Stock Products';
      case 'expiring':
        return 'Expiring Soon (3 Days)';
      case 'expired':
        return 'Expired Products';
      default:
        return 'Alert Details';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'lowStock':
        return <Package size={24} color={colors.warning} />;
      case 'expiring':
        return <Clock size={24} color={colors.error} />;
      case 'expired':
        return <XCircle size={24} color={colors.error} />;
      default:
        return <AlertTriangle size={24} color={colors.warning} />;
    }
  };

  const getData = () => {
    switch (type) {
      case 'lowStock':
        return getLowStockProducts().map((product) => ({
          product,
          reason: `Stock: ${product.stock} (Threshold: ${product.lowStockThreshold ?? 2})`,
        }));
      case 'expiring':
        const expiring = getExpiringSoon(3);
        const expiringProductIds = [...new Set(expiring.map((r) => r.productId))];
        return expiringProductIds.map((productId) => {
          const product = products.find((p) => p.id === productId);
          const restocks = getRestocksForProduct(productId);
          const expiryDates = restocks
            .map((r) => r.expiryDate)
            .filter((d): d is number => d != null);
          const earliestExpiry = getEarliestExpiry(expiryDates);
          return {
            product,
            reason: earliestExpiry ? `Expires soon` : '',
            expiryDate: earliestExpiry,
          };
        }).filter((item) => item.product);
      case 'expired':
        const expired = getExpiredRestocks();
        const expiredProductIds = [...new Set(expired.map((r) => r.productId))];
        return expiredProductIds.map((productId) => {
          const product = products.find((p) => p.id === productId);
          const expiredBatches = expired.filter((r) => r.productId === productId);
          return {
            product,
            reason: `${expiredBatches.length} expired batch${expiredBatches.length !== 1 ? 'es' : ''}`,
          };
        }).filter((item) => item.product);
      default:
        return [];
    }
  };

  const data = getData();

  const renderItem = ({ item }: { item: any }) => {
    const { product, reason, expiryDate } = item;

    return (
      <TouchableOpacity
        style={styles.productCard}
        onPress={() => (navigation.navigate as any)('RestockHistory', { productId: product.id })}
      >
        {product.photoUri ? (
          <Image source={{ uri: product.photoUri }} style={styles.productImage} />
        ) : (
          <View style={styles.placeholderImage}>
            <Package size={32} color={colors.gray400} />
          </View>
        )}

        <View style={styles.productInfo}>
          <Text style={styles.productName}>{product.name}</Text>
          <Text style={styles.productPrice}>₹{product.price}</Text>
          <Text style={styles.productReason}>{reason}</Text>
        </View>

        <View style={styles.productBadges}>
          {type === 'lowStock' && (
            <View style={styles.stockBadge}>
              <Text style={styles.stockValue}>{product.stock}</Text>
              <Text style={styles.stockLabel}>in stock</Text>
            </View>
          )}
          {expiryDate && <ExpiryBadge expiryDate={expiryDate} />}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerIcon}>{getIcon()}</View>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>{getTitle()}</Text>
          <Text style={styles.headerSubtitle}>
            {data.length} item{data.length !== 1 ? 's' : ''}
          </Text>
        </View>
      </View>

      {data.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Package size={64} color={colors.gray300} />
          <Text style={styles.emptyText}>No items found</Text>
          <Text style={styles.emptySubtext}>
            {type === 'lowStock' && 'All products are well stocked'}
            {type === 'expiring' && 'No products expiring in the next 3 days'}
            {type === 'expired' && 'No expired products'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={data}
          renderItem={renderItem}
          keyExtractor={(item) => item.product?.id || Math.random().toString()}
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
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.backgroundSecondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
    gap: spacing.md,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  headerText: {
    flex: 1,
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
    gap: spacing.md,
  },
  productCard: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.gray200,
    alignItems: 'center',
    gap: spacing.md,
    ...shadows.sm,
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.gray50,
  },
  placeholderImage: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.gray50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    ...typography.bodyBold,
    marginBottom: spacing.xs,
  },
  productPrice: {
    ...typography.caption,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  productReason: {
    ...typography.small,
    color: colors.textSecondary,
  },
  productBadges: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  stockBadge: {
    backgroundColor: colors.warning,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
  },
  stockValue: {
    ...typography.h3,
    color: colors.white,
  },
  stockLabel: {
    ...typography.small,
    color: colors.white,
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
    textAlign: 'center',
  },
});
