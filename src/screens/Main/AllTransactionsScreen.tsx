import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Receipt, Calendar, TrendingUp } from 'lucide-react-native';
import { useSalesStore } from '../../store/salesStore';
import { useInventoryStore } from '../../store/inventoryStore';
import { formatProductList } from '../../utils/recommender';
import {
  colors,
  spacing,
  borderRadius,
  typography,
  shadows,
} from '../../utils/theme';

export default function AllTransactionsScreen() {
  const sales = useSalesStore((state) => state.sales);
  const products = useInventoryStore((state) => state.products);
  const [filter, setFilter] = useState<'all' | 'today' | 'week'>('all');

  const getFilteredSales = () => {
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    const oneWeekMs = 7 * oneDayMs;

    switch (filter) {
      case 'today':
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        return sales.filter((s) => s.timestamp >= todayStart.getTime());
      case 'week':
        return sales.filter((s) => s.timestamp >= now - oneWeekMs);
      default:
        return sales;
    }
  };

  const filteredSales = getFilteredSales().sort((a, b) => b.timestamp - a.timestamp);

  const getTotalRevenue = () => {
    return filteredSales.reduce((sum, sale) => sum + sale.amount, 0);
  };

  const renderSale = ({ item }: { item: any }) => {
    const date = new Date(item.timestamp);
    const saleProducts = item.items
      .map((id: string) => products.find((p) => p.id === id))
      .filter(Boolean);

    return (
      <View style={styles.saleCard}>
        <View style={styles.saleHeader}>
          <View style={styles.saleIcon}>
            <Receipt size={20} color={colors.primary} />
          </View>
          <View style={styles.saleInfo}>
            <Text style={styles.saleAmount}>₹{item.amount}</Text>
            <Text style={styles.saleDate}>
              {date.toLocaleDateString()} • {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        </View>
        <View style={styles.saleProducts}>
          <Text style={styles.saleProductsText}>
            {saleProducts.length > 0
              ? formatProductList(saleProducts)
              : `${item.items.length} item${item.items.length !== 1 ? 's' : ''}`}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>All Transactions</Text>
        <Text style={styles.headerSubtitle}>
          {filteredSales.length} transaction{filteredSales.length !== 1 ? 's' : ''}
        </Text>
      </View>

      <View style={styles.filterBar}>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
            All Time
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'week' && styles.filterButtonActive]}
          onPress={() => setFilter('week')}
        >
          <Text style={[styles.filterText, filter === 'week' && styles.filterTextActive]}>
            This Week
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'today' && styles.filterButtonActive]}
          onPress={() => setFilter('today')}
        >
          <Text style={[styles.filterText, filter === 'today' && styles.filterTextActive]}>
            Today
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.summaryCard}>
        <TrendingUp size={24} color={colors.success} />
        <View style={styles.summaryInfo}>
          <Text style={styles.summaryLabel}>Total Revenue</Text>
          <Text style={styles.summaryValue}>₹{getTotalRevenue()}</Text>
        </View>
      </View>

      {filteredSales.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Receipt size={64} color={colors.gray300} />
          <Text style={styles.emptyText}>No transactions found</Text>
          <Text style={styles.emptySubtext}>
            {filter === 'today' && 'No sales recorded today'}
            {filter === 'week' && 'No sales recorded this week'}
            {filter === 'all' && 'Start making sales to see transactions here'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredSales}
          renderItem={renderSale}
          keyExtractor={(item, index) => `${item.timestamp}-${index}`}
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
  filterBar: {
    flexDirection: 'row',
    padding: spacing.lg,
    gap: spacing.sm,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  filterButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.gray50,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    ...typography.captionBold,
    color: colors.textSecondary,
  },
  filterTextActive: {
    color: colors.white,
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: spacing.lg,
    padding: spacing.lg,
    backgroundColor: colors.gray50,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.gray200,
    gap: spacing.md,
  },
  summaryInfo: {
    flex: 1,
  },
  summaryLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  summaryValue: {
    ...typography.h2,
    color: colors.success,
    marginTop: spacing.xs,
  },
  listContent: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  saleCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.gray200,
    ...shadows.sm,
  },
  saleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  saleIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.gray50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saleInfo: {
    flex: 1,
  },
  saleAmount: {
    ...typography.h3,
    color: colors.primary,
  },
  saleDate: {
    ...typography.small,
    color: colors.textSecondary,
    marginTop: 2,
  },
  saleProducts: {
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
  },
  saleProductsText: {
    ...typography.caption,
    color: colors.textSecondary,
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
