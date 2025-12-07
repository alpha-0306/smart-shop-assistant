import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Polyline, Circle, Line } from 'react-native-svg';
import { Package, TrendingUp, Clock, RotateCcw, ChevronRight, Database, Trash2 } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useInventoryStore } from '../../store/inventoryStore';
import { useSalesStore } from '../../store/salesStore';
import { useRestockStore } from '../../store/restockStore';
import { daysUntilExpiry } from '../../utils/expiryUtils';
import { getProductImageSource } from '../../utils/productImages';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { runQuickDemo, clearDemoData } from '../../utils/demoHelper';

export default function DashboardScreen() {
  const navigation = useNavigation();
  const products = useInventoryStore((state) => state.products);
  const getLowStockProducts = useInventoryStore((state) => state.getLowStockProducts);
  const totalToday = useSalesStore((state) => state.totalToday);
  const getTodaySales = useSalesStore((state) => state.getTodaySales);
  const getHourlySales = useSalesStore((state) => state.getHourlySales);
  const getTopProducts = useSalesStore((state) => state.getTopProducts);
  const getRecentSales = useSalesStore((state) => state.getRecentSales);
  const getExpiringSoon = useRestockStore((state) => state.getExpiringSoon);
  const getExpiredRestocks = useRestockStore((state) => state.getExpiredRestocks);

  const [loadingSample, setLoadingSample] = useState(false);

  const sales = useSalesStore((state) => state.sales);
  const todaySales = getTodaySales();
  const topProducts = getTopProducts(products);
  const recentSales = getRecentSales();
  
  // Calculate daily sales for last 15 days
  const getDailySales = () => {
    const dailyTotals: { date: string; total: number; dayLabel: string; monthLabel: string }[] = [];
    const now = new Date();
    
    for (let i = 14; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);
      
      const daySales = sales.filter(
        (sale) => sale.timestamp >= date.getTime() && sale.timestamp < nextDay.getTime()
      );
      
      const total = daySales.reduce((sum, sale) => sum + sale.amount, 0);
      
      // Format labels
      const dayLabel = date.getDate().toString();
      const monthLabel = date.toLocaleDateString('en-US', { month: 'short' });
      
      dailyTotals.push({ date: date.toDateString(), total, dayLabel, monthLabel });
    }
    
    return dailyTotals;
  };
  
  const dailySales = getDailySales();
  const lowStockProducts = getLowStockProducts();
  const expiring3Days = getExpiringSoon(3);
  const expiring7Days = getExpiringSoon(7);
  const expired = getExpiredRestocks();

  // Calculate total stats
  const totalSales = sales.length;
  const totalRevenue = sales.reduce((sum, sale) => sum + sale.amount, 0);
  
  // Calculate daily average (last 15 days)
  const fifteenDaysAgo = Date.now() - 15 * 24 * 60 * 60 * 1000;
  const recentSalesData = sales.filter((sale) => sale.timestamp >= fifteenDaysAgo);
  const daysWithSales = new Set(
    recentSalesData.map((sale) => new Date(sale.timestamp).toDateString())
  ).size;
  const avgDailySales = daysWithSales > 0 ? Math.round(recentSalesData.length / daysWithSales) : 0;
  const avgDailyRevenue = daysWithSales > 0 ? Math.round(recentSalesData.reduce((sum, sale) => sum + sale.amount, 0) / daysWithSales) : 0;

  const handleLoadSampleData = async () => {
    setLoadingSample(true);
    try {
      const success = await runQuickDemo();
      if (success) {
        Alert.alert('Success', 'Sample data loaded! Check your dashboard, inventory, and transactions.');
      } else {
        Alert.alert('Error', 'Failed to load sample data');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load sample data');
    } finally {
      setLoadingSample(false);
    }
  };

  const handleClearSampleData = () => {
    Alert.alert(
      'Clear Sample Data',
      'This will remove all sample products and transactions. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            clearDemoData();
            Alert.alert('Success', 'Sample data cleared');
          },
        },
      ]
    );
  };

  const handleResetApp = () => {
    Alert.alert(
      'Reset App Data',
      'This will clear all products and sales. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.clear();
              useInventoryStore.setState({ products: [] });
              useSalesStore.setState({
                sales: [],
                totalToday: 0,
                lastTenSales: [],
                hourlyStats: {},
                comboStats: {},
              });
              Alert.alert('Success', 'App data cleared. Please reload the app.');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear data');
            }
          },
        },
      ]
    );
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getProductNames = (productIds: string[]) => {
    return productIds
      .map((id) => products.find((p) => p.id === id)?.name || 'Unknown')
      .join(' + ');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Dashboard</Text>
          <Text style={styles.subtitle}>Today's Overview</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* A. Today's Overview */}
        <View style={styles.overviewCard}>
          <View style={styles.overviewMain}>
            <Text style={styles.revenueLabel}>Revenue Today</Text>
            <Text style={styles.revenueValue}>₹{totalToday}</Text>
            <Text style={styles.salesCount}>
              {todaySales.length} sale{todaySales.length !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Avg Daily Sales</Text>
            <Text style={styles.statValue}>{avgDailySales}</Text>
            <Text style={styles.statSubtext}>last 15 days</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Avg Daily Revenue</Text>
            <Text style={styles.statValue}>₹{avgDailyRevenue}</Text>
            <Text style={styles.statSubtext}>last 15 days</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Total Sales</Text>
            <Text style={styles.statValue}>{totalSales}</Text>
            <Text style={styles.statSubtext}>all time</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Total Revenue</Text>
            <Text style={styles.statValue}>₹{totalRevenue}</Text>
            <Text style={styles.statSubtext}>all time</Text>
          </View>
        </View>

        {/* Alerts Row */}
        <View style={styles.alertsRow}>
          {/* Low Stock Alert */}
          <TouchableOpacity
            style={[styles.alertCard, styles.alertWarning]}
            disabled={lowStockProducts.length === 0}
            onPress={() => (navigation.navigate as any)('AlertDetails', { type: 'lowStock' })}
          >
            <Package size={24} color="#F59E0B" />
            <Text style={styles.alertValue}>{lowStockProducts.length}</Text>
            <Text style={styles.alertLabel}>Low Stock</Text>
          </TouchableOpacity>

          {/* Expiring Soon Alert */}
          <TouchableOpacity
            style={[styles.alertCard, styles.alertDanger]}
            disabled={expiring3Days.length === 0}
            onPress={() => (navigation.navigate as any)('AlertDetails', { type: 'expiring' })}
          >
            <Clock size={24} color="#EF4444" />
            <Text style={styles.alertValue}>{expiring3Days.length}</Text>
            <Text style={styles.alertLabel}>Expiring (3d)</Text>
          </TouchableOpacity>

          {/* Expired Alert */}
          {expired.length > 0 && (
            <TouchableOpacity
              style={[styles.alertCard, styles.alertCritical]}
              onPress={() => (navigation.navigate as any)('AlertDetails', { type: 'expired' })}
            >
              <Text style={styles.alertValue}>{expired.length}</Text>
              <Text style={styles.alertLabel}>Expired</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* B. Daily Sales Line Chart */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <TrendingUp size={20} color="#4F46E5" />
            <Text style={styles.sectionTitle}>Daily Sales (Last 15 Days)</Text>
          </View>

          <ScrollView
            style={styles.outerScrollView}
            showsVerticalScrollIndicator={false}
          >
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={true}
              style={styles.chartScrollView}
              contentContainerStyle={styles.chartScrollContent}
            >
              <View style={styles.chartWrapper}>
                {/* Calculate chart dimensions */}
                {(() => {
                  const maxValue = Math.max(...dailySales.map((d) => d.total), 100);
                  const chartHeight = 200; // Increased height
                  const labelSpace = 40; // Space for labels above chart
                  const totalHeight = chartHeight + labelSpace;
                  const columnWidth = 60;
                  const chartWidth = dailySales.length * columnWidth;
                  
                  // Build SVG points string
                  const points = dailySales
                    .map((item, index) => {
                      const x = index * columnWidth + columnWidth / 2;
                      const y = labelSpace + chartHeight - (item.total / maxValue) * chartHeight;
                      return `${x},${y}`;
                    })
                    .join(' ');
                  
                  return (
                    <>
                      {/* SVG Line Chart */}
                      <View style={[styles.svgChartContainer, { height: totalHeight }]}>
                        <Svg width={chartWidth} height={totalHeight}>
                          {/* Draw connecting line */}
                          <Polyline
                            points={points}
                            fill="none"
                            stroke="#4F46E5"
                            strokeWidth="2"
                          />
                          
                          {/* Draw dots at each point */}
                          {dailySales.map((item, index) => {
                            const x = index * columnWidth + columnWidth / 2;
                            const y = labelSpace + chartHeight - (item.total / maxValue) * chartHeight;
                            
                            return (
                              <Circle
                                key={item.date}
                                cx={x}
                                cy={y}
                                r="6"
                                fill="#4F46E5"
                                stroke="#fff"
                                strokeWidth="3"
                              />
                            );
                          })}
                        </Svg>
                      </View>
                      
                      {/* Labels overlay */}
                      <View style={[styles.labelsOverlay, { height: totalHeight }]}>
                        {dailySales.map((item, index) => {
                          const yPosition = labelSpace + chartHeight - (item.total / maxValue) * chartHeight;
                          
                          return (
                            <View
                              key={item.date}
                              style={[
                                styles.labelColumn,
                                { width: columnWidth },
                              ]}
                            >
                              {item.total > 0 && (
                                <Text
                                  style={[
                                    styles.valueLabel,
                                    { 
                                      position: 'absolute',
                                      top: Math.max(0, yPosition - 25),
                                      left: 0,
                                      right: 0,
                                    },
                                  ]}
                                >
                                  ₹{item.total}
                                </Text>
                              )}
                            </View>
                          );
                        })}
                      </View>
                      
                      {/* X-axis labels */}
                      <View style={styles.xAxisLabels}>
                        {dailySales.map((item) => (
                          <View key={item.date} style={[styles.dateLabel, { width: columnWidth }]}>
                            <Text style={styles.dayText}>{item.dayLabel}</Text>
                            <Text style={styles.monthText}>{item.monthLabel}</Text>
                          </View>
                        ))}
                      </View>
                    </>
                  );
                })()}
              </View>
            </ScrollView>
          </ScrollView>
        </View>

        {/* C. Top Products Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Package size={20} color="#4F46E5" />
            <Text style={styles.sectionTitle}>Top Selling Products</Text>
          </View>
          {topProducts.length > 0 ? (
            <View style={styles.topProductsList}>
              {topProducts.map((item, index) => (
                <View key={item.product.id} style={styles.topProductCard}>
                  <View style={styles.topProductRank}>
                    <Text style={styles.rankEmoji}>
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                    </Text>
                  </View>
                  {(() => {
                    const imageSource = getProductImageSource(item.product.photoUri, item.product.name);
                    return imageSource ? (
                      <Image
                        source={imageSource}
                        style={styles.topProductImage}
                      />
                    ) : (
                      <View style={styles.topProductImagePlaceholder}>
                        <Package size={24} color="#9CA3AF" />
                      </View>
                    );
                  })()}
                  <View style={styles.topProductInfo}>
                    <Text style={styles.topProductName}>{item.product.name}</Text>
                    <Text style={styles.topProductDetails}>
                      ₹{item.product.price} • Sold {item.count} time
                      {item.count !== 1 ? 's' : ''}
                    </Text>
                    <Text style={styles.topProductPopularity}>
                      Popularity: {item.product.popularity}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Package size={48} color="#D1D5DB" />
              <Text style={styles.emptyStateText}>No popular items yet</Text>
              <Text style={styles.emptyStateSubtext}>
                Start recording sales to see top products
              </Text>
            </View>
          )}
        </View>

        {/* D. Recent Transactions List */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Clock size={20} color="#4F46E5" />
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            <TouchableOpacity
              style={styles.viewAllButton}
              onPress={() => (navigation.navigate as any)('AllTransactions')}
            >
              <Text style={styles.viewAllText}>View All</Text>
              <ChevronRight size={16} color="#4F46E5" />
            </TouchableOpacity>
          </View>
          {recentSales.length > 0 ? (
            <View style={styles.transactionsList}>
              {recentSales.map((sale) => (
                <View key={sale.id} style={styles.transactionCard}>
                  <View style={styles.transactionLeft}>
                    <Text style={styles.transactionAmount}>₹{sale.amount}</Text>
                    <Text style={styles.transactionProducts}>
                      {getProductNames(sale.items)}
                    </Text>
                  </View>
                  <Text style={styles.transactionTime}>{formatTime(sale.timestamp)}</Text>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Clock size={48} color="#D1D5DB" />
              <Text style={styles.emptyStateText}>No transactions yet</Text>
              <Text style={styles.emptyStateSubtext}>
                Sales will appear here once recorded
              </Text>
            </View>
          )}
        </View>

        {/* Sample Data Section */}
        <View style={styles.sampleDataSection}>
          <Text style={styles.sampleDataTitle}>Demo & Testing</Text>
          <View style={styles.sampleDataButtons}>
            <TouchableOpacity
              style={[styles.sampleButton, styles.loadButton]}
              onPress={handleLoadSampleData}
              disabled={loadingSample}
            >
              {loadingSample ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Database size={20} color="#fff" />
                  <Text style={styles.sampleButtonText}>Load Sample Data</Text>
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sampleButton, styles.clearButton]}
              onPress={handleClearSampleData}
              disabled={loadingSample}
            >
              <Trash2 size={20} color="#fff" />
              <Text style={styles.sampleButtonText}>Clear Sample Data</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Reset Button */}
        <TouchableOpacity style={styles.resetButton} onPress={handleResetApp}>
          <RotateCcw size={20} color="#EF4444" />
          <Text style={styles.resetButtonText}>Reset App Data</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 20,
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 20,
  },
  overviewCard: {
    backgroundColor: '#4F46E5',
    borderRadius: 20,
    padding: 28,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  overviewMain: {
    alignItems: 'center',
  },
  revenueLabel: {
    fontSize: 15,
    color: '#E0E7FF',
    marginBottom: 10,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  revenueValue: {
    fontSize: 56,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: -1,
  },
  salesCount: {
    fontSize: 17,
    color: '#E0E7FF',
    marginTop: 10,
    fontWeight: '500',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  statLabel: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    letterSpacing: -0.5,
  },
  statSubtext: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 4,
  },
  alertsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  alertCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  alertWarning: {
    borderColor: '#F59E0B',
    backgroundColor: '#FFFBEB',
  },
  alertDanger: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  alertCritical: {
    borderColor: '#DC2626',
    backgroundColor: '#FEE2E2',
  },
  alertValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 10,
    letterSpacing: -0.5,
  },
  alertLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 6,
    textAlign: 'center',
    fontWeight: '600',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    flex: 1,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4F46E5',
  },
  outerScrollView: {
    maxHeight: 300,
  },
  chartScrollView: {
    marginHorizontal: -18,
  },
  chartScrollContent: {
    paddingHorizontal: 18,
  },
  chartWrapper: {
    paddingVertical: 12,
  },
  svgChartContainer: {
    position: 'relative',
  },
  labelsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
  },
  labelColumn: {
    position: 'relative',
    alignItems: 'center',
  },
  valueLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#4F46E5',
    backgroundColor: '#fff',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    textAlign: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  xAxisLabels: {
    flexDirection: 'row',
    marginTop: 8,
  },
  dateLabel: {
    alignItems: 'center',
  },
  dayText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
  },
  monthText: {
    fontSize: 9,
    color: '#9CA3AF',
    marginTop: 2,
  },
  topProductsList: {
    gap: 12,
  },
  topProductCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    gap: 12,
  },
  topProductRank: {
    width: 32,
    alignItems: 'center',
  },
  rankEmoji: {
    fontSize: 24,
  },
  topProductImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  topProductImagePlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  topProductInfo: {
    flex: 1,
  },
  topProductName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  topProductDetails: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  topProductPopularity: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  transactionsList: {
    gap: 8,
  },
  transactionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  transactionLeft: {
    flex: 1,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  transactionProducts: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  transactionTime: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 12,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
    textAlign: 'center',
  },
  sampleDataSection: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  sampleDataTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  sampleDataButtons: {
    gap: 10,
  },
  sampleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    gap: 8,
  },
  loadButton: {
    backgroundColor: '#10B981',
  },
  clearButton: {
    backgroundColor: '#F59E0B',
  },
  sampleButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    gap: 8,
    marginTop: 8,
  },
  resetButtonText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '600',
  },
});
