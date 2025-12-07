import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Sparkles } from 'lucide-react-native';

import AddProductScreen from '../screens/Onboarding/AddProductScreen';
import ManualAddProductScreen from '../screens/Onboarding/ManualAddProductScreen';
import ShelfPhotoScreen from '../screens/Onboarding/ShelfPhotoScreen';
import ShelfAnalysisScreen from '../screens/Onboarding/ShelfAnalysisScreen';
import SuggestionsScreen from '../screens/Main/SuggestionsScreen';
import RestockHistoryScreen from '../screens/Product/RestockHistoryScreen';
import AlertDetailsScreen from '../screens/Main/AlertDetailsScreen';
import AllTransactionsScreen from '../screens/Main/AllTransactionsScreen';
import DetectorSettingsScreen from '../screens/Main/DetectorSettingsScreen';
import DetectorQAScreen from '../screens/Main/DetectorQAScreen';
import OnboardingModal from '../components/OnboardingModal';
import MicIndicator from '../components/MicIndicator';
import MainTabs from './MainTabs';
import { useInventoryStore } from '../store/inventoryStore';
import { useSalesStore } from '../store/salesStore';
import { useRestockStore } from '../store/restockStore';
import { useShopContextStore } from '../store/shopContextStore';
import { useChatStore } from '../store/chatStore';
import { useDetectorStore } from '../store/detectorStore';
import { detectorHandler } from '../utils/detectorHandler';

const Stack = createNativeStackNavigator();

function SplashScreen() {
  return (
    <View style={styles.splash}>
      <Sparkles size={64} color="#4F46E5" />
      <Text style={styles.splashText}>Smart Shop Assistant</Text>
    </View>
  );
}

export default function RootNavigator() {
  const [isLoading, setIsLoading] = useState(true);
  const [hasProducts, setHasProducts] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const loadInventory = useInventoryStore((state) => state.loadFromStorage);
  const loadSales = useSalesStore((state) => state.loadFromStorage);
  const loadRestocks = useRestockStore((state) => state.loadFromStorage);
  const loadShopContext = useShopContextStore((state) => state.loadFromStorage);
  const loadChat = useChatStore((state) => state.loadFromStorage);
  const loadDetector = useDetectorStore((state) => state.loadFromStorage);
  const products = useInventoryStore((state) => state.products);
  const shopContext = useShopContextStore((state) => state.context);

  useEffect(() => {
    const initializeApp = async () => {
      await Promise.all([
        loadInventory(),
        loadSales(),
        loadRestocks(),
        loadDetector(),
        loadShopContext(),
        loadChat(),
      ]);
      
      // Initialize detector handler
      await detectorHandler.initialize();
      
      setIsLoading(false);
      
      // Show onboarding if shop name is still default
      if (shopContext.shopName === 'My Kirana Store' && shopContext.ownerName === 'Owner') {
        setShowOnboarding(true);
      }
    };
    initializeApp();
    
    // Cleanup on unmount
    return () => {
      detectorHandler.cleanup();
    };
  }, []);

  useEffect(() => {
    setHasProducts(products.length > 0);
  }, [products]);

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <>
      <OnboardingModal
        visible={showOnboarding}
        onComplete={() => setShowOnboarding(false)}
      />
      <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: true,
          headerStyle: { backgroundColor: '#4F46E5' },
          headerTintColor: '#fff',
        }}
        initialRouteName="Main"
      >
        <Stack.Screen
          name="Main"
          component={MainTabs}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="AddProduct"
          component={AddProductScreen}
          options={{ title: 'Add Product' }}
        />
        <Stack.Screen
          name="ManualAddProduct"
          component={ManualAddProductScreen}
          options={{ title: 'Add Product Manually' }}
        />
        <Stack.Screen
          name="ShelfPhoto"
          component={ShelfPhotoScreen}
          options={{ title: 'Add Products' }}
        />
        <Stack.Screen
          name="ShelfAnalysis"
          component={ShelfAnalysisScreen}
          options={{ title: 'AI Analysis' }}
        />
        <Stack.Screen
          name="Suggestions"
          component={SuggestionsScreen}
          options={{ title: 'Product Suggestions' }}
        />
        <Stack.Screen
          name="RestockHistory"
          component={RestockHistoryScreen}
          options={{ title: 'Restock History' }}
        />
        <Stack.Screen
          name="AlertDetails"
          component={AlertDetailsScreen}
          options={{ title: 'Alert Details' }}
        />
        <Stack.Screen
          name="AllTransactions"
          component={AllTransactionsScreen}
          options={{ title: 'All Transactions' }}
        />
        <Stack.Screen
          name="DetectorSettings"
          component={DetectorSettingsScreen}
          options={{ title: 'Auto-Listen Settings' }}
        />
        <Stack.Screen
          name="DetectorQA"
          component={DetectorQAScreen}
          options={{ title: 'Detector QA' }}
        />
      </Stack.Navigator>
      <MicIndicator />
    </NavigationContainer>
    </>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  splashText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    color: '#1F2937',
  },
});
