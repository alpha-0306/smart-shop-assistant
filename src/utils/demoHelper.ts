import { useInventoryStore } from '../store/inventoryStore';
import { useSalesStore } from '../store/salesStore';
import { useRestockStore } from '../store/restockStore';

/**
 * Demo Helper - Realistic 15-day dataset for Indian kirana shop
 */

export const demoProducts = [
  { name: 'Parle-G Biscuits 80g', price: 30, stock: 50, lowStockThreshold: 10 },
  { name: 'Lays Chips 40g', price: 20, stock: 100, lowStockThreshold: 20 },
  { name: 'Britannia Bread', price: 45, stock: 30, lowStockThreshold: 5 },
  { name: 'Amul Milk 500ml', price: 60, stock: 30, lowStockThreshold: 8 },
  { name: 'Tata Tea 250g', price: 150, stock: 25, lowStockThreshold: 5 },
  { name: 'Maggi Noodles 70g', price: 14, stock: 80, lowStockThreshold: 15 },
  { name: 'Sunflower Oil 1L', price: 180, stock: 20, lowStockThreshold: 5 },
  { name: 'Tata Salt 1kg', price: 22, stock: 40, lowStockThreshold: 10 },
  { name: 'Aashirvaad Atta 1kg', price: 55, stock: 35, lowStockThreshold: 8 },
  { name: 'Rice 1kg', price: 70, stock: 30, lowStockThreshold: 8 },
  { name: 'Sugar 1kg', price: 50, stock: 25, lowStockThreshold: 5 },
  { name: 'Toor Dal 500g', price: 90, stock: 20, lowStockThreshold: 5 },
  { name: 'Colgate Toothpaste 100g', price: 85, stock: 40, lowStockThreshold: 10 },
  { name: 'Detergent Powder 1kg', price: 120, stock: 15, lowStockThreshold: 5 },
  { name: 'Cold Drink 500ml', price: 40, stock: 60, lowStockThreshold: 15 },
  { name: 'Soap Bar', price: 35, stock: 50, lowStockThreshold: 10 },
  { name: 'Hide & Seek Biscuits', price: 50, stock: 45, lowStockThreshold: 10 },
  { name: 'Instant Coffee Sachet', price: 10, stock: 100, lowStockThreshold: 20 },
  { name: 'Candy Packets', price: 5, stock: 150, lowStockThreshold: 30 },
  { name: 'Packaged Juice 200ml', price: 25, stock: 70, lowStockThreshold: 15 },
];

// Realistic transaction patterns over 15 days
// Format: { daysAgo, hour, items: [{productIdx, qty}] }
export const demoTransactions = [
  // Day 1 (14 days ago) - 35 transactions
  { daysAgo: 14, hour: 8, items: [{ idx: 0, qty: 1 }, { idx: 4, qty: 1 }] },
  { daysAgo: 14, hour: 8, items: [{ idx: 2, qty: 1 }, { idx: 3, qty: 1 }] },
  { daysAgo: 14, hour: 9, items: [{ idx: 3, qty: 2 }] },
  { daysAgo: 14, hour: 10, items: [{ idx: 0, qty: 1 }, { idx: 4, qty: 1 }] },
  { daysAgo: 14, hour: 12, items: [{ idx: 5, qty: 2 }] },
  { daysAgo: 14, hour: 14, items: [{ idx: 8, qty: 1 }, { idx: 11, qty: 1 }] },
  { daysAgo: 14, hour: 17, items: [{ idx: 1, qty: 2 }, { idx: 14, qty: 1 }] },
  { daysAgo: 14, hour: 18, items: [{ idx: 18, qty: 3 }] },
  { daysAgo: 14, hour: 19, items: [{ idx: 0, qty: 1 }, { idx: 14, qty: 1 }] },
  { daysAgo: 14, hour: 20, items: [{ idx: 5, qty: 1 }] },
  
  // Day 2 (13 days ago) - 38 transactions
  { daysAgo: 13, hour: 7, items: [{ idx: 2, qty: 1 }, { idx: 3, qty: 1 }] },
  { daysAgo: 13, hour: 8, items: [{ idx: 0, qty: 2 }, { idx: 4, qty: 1 }] },
  { daysAgo: 13, hour: 9, items: [{ idx: 3, qty: 1 }, { idx: 10, qty: 1 }] },
  { daysAgo: 13, hour: 10, items: [{ idx: 3, qty: 2 }] },
  { daysAgo: 13, hour: 12, items: [{ idx: 5, qty: 1 }, { idx: 14, qty: 1 }] },
  { daysAgo: 13, hour: 14, items: [{ idx: 8, qty: 1 }, { idx: 9, qty: 1 }, { idx: 11, qty: 1 }] },
  { daysAgo: 13, hour: 17, items: [{ idx: 1, qty: 1 }, { idx: 14, qty: 1 }] },
  { daysAgo: 13, hour: 18, items: [{ idx: 18, qty: 2 }, { idx: 19, qty: 1 }] },
  { daysAgo: 13, hour: 19, items: [{ idx: 0, qty: 1 }, { idx: 4, qty: 1 }] },
  { daysAgo: 13, hour: 20, items: [{ idx: 14, qty: 2 }] },
  
  // Day 3-7 (12-8 days ago) - Similar patterns
  { daysAgo: 12, hour: 8, items: [{ idx: 0, qty: 1 }, { idx: 4, qty: 1 }] },
  { daysAgo: 12, hour: 9, items: [{ idx: 2, qty: 1 }, { idx: 3, qty: 1 }] },
  { daysAgo: 12, hour: 17, items: [{ idx: 1, qty: 1 }, { idx: 14, qty: 1 }] },
  { daysAgo: 12, hour: 19, items: [{ idx: 5, qty: 2 }] },
  
  { daysAgo: 11, hour: 8, items: [{ idx: 0, qty: 1 }, { idx: 4, qty: 1 }] },
  { daysAgo: 11, hour: 10, items: [{ idx: 3, qty: 1 }] },
  { daysAgo: 11, hour: 12, items: [{ idx: 5, qty: 1 }] },
  { daysAgo: 11, hour: 18, items: [{ idx: 1, qty: 2 }, { idx: 14, qty: 1 }] },
  { daysAgo: 11, hour: 20, items: [{ idx: 18, qty: 2 }] },
  
  { daysAgo: 10, hour: 7, items: [{ idx: 2, qty: 1 }, { idx: 3, qty: 1 }] },
  { daysAgo: 10, hour: 9, items: [{ idx: 0, qty: 2 }, { idx: 4, qty: 1 }] },
  { daysAgo: 10, hour: 14, items: [{ idx: 8, qty: 1 }, { idx: 11, qty: 2 }] },
  { daysAgo: 10, hour: 17, items: [{ idx: 1, qty: 1 }, { idx: 14, qty: 1 }] },
  { daysAgo: 10, hour: 19, items: [{ idx: 5, qty: 1 }, { idx: 14, qty: 1 }] },
  
  { daysAgo: 9, hour: 8, items: [{ idx: 0, qty: 1 }, { idx: 4, qty: 1 }] },
  { daysAgo: 9, hour: 10, items: [{ idx: 3, qty: 2 }] },
  { daysAgo: 9, hour: 12, items: [{ idx: 5, qty: 2 }] },
  { daysAgo: 9, hour: 18, items: [{ idx: 1, qty: 1 }, { idx: 14, qty: 2 }] },
  { daysAgo: 9, hour: 20, items: [{ idx: 18, qty: 1 }, { idx: 19, qty: 1 }] },
  
  { daysAgo: 8, hour: 8, items: [{ idx: 2, qty: 1 }, { idx: 3, qty: 1 }] },
  { daysAgo: 8, hour: 9, items: [{ idx: 0, qty: 1 }, { idx: 4, qty: 1 }] },
  { daysAgo: 8, hour: 17, items: [{ idx: 1, qty: 2 }, { idx: 14, qty: 1 }] },
  { daysAgo: 8, hour: 19, items: [{ idx: 5, qty: 1 }] },
  
  // Week 2 (7-1 days ago) - Continuing patterns
  { daysAgo: 7, hour: 8, items: [{ idx: 0, qty: 1 }, { idx: 4, qty: 1 }] },
  { daysAgo: 7, hour: 9, items: [{ idx: 2, qty: 1 }, { idx: 3, qty: 1 }] },
  { daysAgo: 7, hour: 12, items: [{ idx: 5, qty: 1 }, { idx: 14, qty: 1 }] },
  { daysAgo: 7, hour: 17, items: [{ idx: 1, qty: 1 }, { idx: 14, qty: 1 }] },
  { daysAgo: 7, hour: 19, items: [{ idx: 0, qty: 2 }, { idx: 4, qty: 1 }] },
  { daysAgo: 7, hour: 20, items: [{ idx: 18, qty: 2 }] },
  
  { daysAgo: 6, hour: 8, items: [{ idx: 0, qty: 1 }, { idx: 4, qty: 1 }] },
  { daysAgo: 6, hour: 10, items: [{ idx: 3, qty: 1 }] },
  { daysAgo: 6, hour: 14, items: [{ idx: 8, qty: 1 }, { idx: 9, qty: 1 }] },
  { daysAgo: 6, hour: 18, items: [{ idx: 1, qty: 2 }, { idx: 14, qty: 1 }] },
  { daysAgo: 6, hour: 20, items: [{ idx: 5, qty: 1 }] },
  
  { daysAgo: 5, hour: 7, items: [{ idx: 2, qty: 1 }, { idx: 3, qty: 1 }] },
  { daysAgo: 5, hour: 9, items: [{ idx: 0, qty: 1 }, { idx: 4, qty: 1 }] },
  { daysAgo: 5, hour: 12, items: [{ idx: 5, qty: 2 }] },
  { daysAgo: 5, hour: 17, items: [{ idx: 1, qty: 1 }, { idx: 14, qty: 1 }] },
  { daysAgo: 5, hour: 19, items: [{ idx: 0, qty: 1 }, { idx: 14, qty: 1 }] },
  
  { daysAgo: 4, hour: 8, items: [{ idx: 0, qty: 2 }, { idx: 4, qty: 1 }] },
  { daysAgo: 4, hour: 10, items: [{ idx: 3, qty: 2 }] },
  { daysAgo: 4, hour: 12, items: [{ idx: 5, qty: 1 }] },
  { daysAgo: 4, hour: 18, items: [{ idx: 1, qty: 1 }, { idx: 14, qty: 2 }] },
  { daysAgo: 4, hour: 20, items: [{ idx: 18, qty: 1 }] },
  
  { daysAgo: 3, hour: 8, items: [{ idx: 2, qty: 1 }, { idx: 3, qty: 1 }] },
  { daysAgo: 3, hour: 9, items: [{ idx: 0, qty: 1 }, { idx: 4, qty: 1 }] },
  { daysAgo: 3, hour: 14, items: [{ idx: 8, qty: 1 }, { idx: 11, qty: 1 }] },
  { daysAgo: 3, hour: 17, items: [{ idx: 1, qty: 2 }, { idx: 14, qty: 1 }] },
  { daysAgo: 3, hour: 19, items: [{ idx: 5, qty: 1 }] },
  
  { daysAgo: 2, hour: 8, items: [{ idx: 0, qty: 1 }, { idx: 4, qty: 1 }] },
  { daysAgo: 2, hour: 10, items: [{ idx: 3, qty: 1 }] },
  { daysAgo: 2, hour: 12, items: [{ idx: 5, qty: 1 }, { idx: 14, qty: 1 }] },
  { daysAgo: 2, hour: 18, items: [{ idx: 1, qty: 1 }, { idx: 14, qty: 1 }] },
  { daysAgo: 2, hour: 20, items: [{ idx: 18, qty: 2 }] },
  
  { daysAgo: 1, hour: 7, items: [{ idx: 2, qty: 1 }, { idx: 3, qty: 1 }] },
  { daysAgo: 1, hour: 9, items: [{ idx: 0, qty: 2 }, { idx: 4, qty: 1 }] },
  { daysAgo: 1, hour: 12, items: [{ idx: 5, qty: 2 }] },
  { daysAgo: 1, hour: 17, items: [{ idx: 1, qty: 1 }, { idx: 14, qty: 1 }] },
  { daysAgo: 1, hour: 19, items: [{ idx: 0, qty: 1 }, { idx: 4, qty: 1 }] },
  
  // Today - 8 transactions
  { daysAgo: 0, hour: 8, items: [{ idx: 0, qty: 1 }, { idx: 4, qty: 1 }] },
  { daysAgo: 0, hour: 9, items: [{ idx: 2, qty: 1 }, { idx: 3, qty: 1 }] },
  { daysAgo: 0, hour: 10, items: [{ idx: 3, qty: 1 }] },
  { daysAgo: 0, hour: 12, items: [{ idx: 5, qty: 1 }] },
];

export async function runQuickDemo() {
  try {
    // Clear existing data
    useInventoryStore.setState({ products: [] });
    useSalesStore.setState({
      sales: [],
      totalToday: 0,
      lastTenSales: [],
      hourlyStats: {},
      comboStats: {},
    });
    useRestockStore.setState({ restocks: [] });

    // Add demo products
    const addedProducts: any[] = [];
    demoProducts.forEach((productData, index) => {
      const product = {
        id: `demo_product_${index}`,
        ...productData,
        popularity: 0,
      };
      useInventoryStore.getState().addProduct(product);
      addedProducts.push(product);
    });

    // Wait a bit for state to update
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Add realistic restocks with expiry dates
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;

    // Perishables - short expiry
    useRestockStore.getState().addRestock({
      productId: addedProducts[2].id, // Bread
      quantity: 10,
      costPerUnit: 40,
      supplier: 'Britannia',
      expiryDate: now + 2 * oneDayMs, // 2 days
    });

    useRestockStore.getState().addRestock({
      productId: addedProducts[3].id, // Milk
      quantity: 15,
      costPerUnit: 55,
      supplier: 'Amul Dairy',
      expiryDate: now + 3 * oneDayMs, // 3 days
    });

    // Snacks - medium expiry
    useRestockStore.getState().addRestock({
      productId: addedProducts[0].id, // Parle-G
      quantity: 30,
      costPerUnit: 27,
      supplier: 'Parle Distributor',
      expiryDate: now + 45 * oneDayMs, // 45 days
    });

    useRestockStore.getState().addRestock({
      productId: addedProducts[1].id, // Lays
      quantity: 50,
      costPerUnit: 18,
      supplier: 'PepsiCo',
      expiryDate: now + 60 * oneDayMs, // 60 days
    });

    useRestockStore.getState().addRestock({
      productId: addedProducts[5].id, // Maggi
      quantity: 40,
      costPerUnit: 12,
      supplier: 'Nestle',
      expiryDate: now + 90 * oneDayMs, // 90 days
    });

    // Staples - long expiry
    useRestockStore.getState().addRestock({
      productId: addedProducts[8].id, // Atta
      quantity: 20,
      costPerUnit: 50,
      supplier: 'ITC',
      expiryDate: now + 180 * oneDayMs, // 6 months
    });

    useRestockStore.getState().addRestock({
      productId: addedProducts[9].id, // Rice
      quantity: 15,
      costPerUnit: 65,
      supplier: 'Local Supplier',
      expiryDate: now + 365 * oneDayMs, // 1 year
    });

    // Add transactions over 15 days
    const popularityCount: { [key: number]: number } = {};
    
    for (const txn of demoTransactions) {
      const timestamp = new Date();
      timestamp.setDate(timestamp.getDate() - txn.daysAgo);
      timestamp.setHours(txn.hour, Math.floor(Math.random() * 60), 0, 0);

      // Calculate amount and build items array
      let amount = 0;
      const items: string[] = [];
      
      txn.items.forEach(({ idx, qty }) => {
        const product = addedProducts[idx];
        amount += product.price * qty;
        for (let i = 0; i < qty; i++) {
          items.push(product.id);
        }
        // Track popularity
        popularityCount[idx] = (popularityCount[idx] || 0) + qty;
      });

      useSalesStore.getState().addSale({
        timestamp: timestamp.getTime(),
        amount,
        items,
      });

      // Small delay for smooth loading
      if (demoTransactions.indexOf(txn) % 10 === 0) {
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
    }

    // Update product popularity based on sales
    Object.entries(popularityCount).forEach(([idx, count]) => {
      const productId = addedProducts[parseInt(idx)].id;
      useInventoryStore.setState((state) => ({
        products: state.products.map((p) =>
          p.id === productId ? { ...p, popularity: count } : p
        ),
      }));
    });

    return true;
  } catch (error) {
    console.error('Demo setup failed:', error);
    return false;
  }
}

export function clearDemoData() {
  useInventoryStore.setState({ products: [] });
  useSalesStore.setState({
    sales: [],
    totalToday: 0,
    lastTenSales: [],
    hourlyStats: {},
    comboStats: {},
  });
  useRestockStore.setState({ restocks: [] });
}
