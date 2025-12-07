import { Product } from '../store/inventoryStore';
import { Sale } from '../store/salesStore';

export interface SuggestedCombination {
  items: Array<{ product: Product; quantity: number }>;
  total: number;
  confidence: number;
  reasons?: string[]; // Why this suggestion was made
}

export interface LearningData {
  lastTenSales: Sale[];
  hourlyStats: Record<number, Record<string, number>>;
  comboStats: Record<string, number>;
}

/**
 * Suggest product combinations that match the given amount
 * Now with intelligent learning-based scoring!
 */
export function suggestProducts(
  products: Product[],
  amount: number,
  learningData?: LearningData
): SuggestedCombination[] {
  const suggestions: SuggestedCombination[] = [];

  // Filter out products with price > amount or out of stock
  const availableProducts = products.filter(
    (p) => p.price <= amount && p.stock > 0
  );

  if (availableProducts.length === 0) {
    return [];
  }

  // Sort by popularity for better suggestions
  const sortedProducts = [...availableProducts].sort(
    (a, b) => b.popularity - a.popularity
  );

  // Limit to top 20 most popular to avoid explosion
  const topProducts = sortedProducts.slice(0, 20);

  // 1. Try exact single matches first
  for (const product of topProducts) {
    if (product.price === amount) {
      suggestions.push({
        items: [{ product, quantity: 1 }],
        total: product.price,
        confidence: 1.0,
      });
    }
  }

  // 2. Try exact multiple quantities of same product
  for (const product of topProducts) {
    const quantity = Math.floor(amount / product.price);
    if (quantity > 1 && quantity <= product.stock && product.price * quantity === amount) {
      suggestions.push({
        items: [{ product, quantity }],
        total: product.price * quantity,
        confidence: 0.95,
      });
    }
  }

  // 3. Try 2-item combinations
  for (let i = 0; i < topProducts.length; i++) {
    for (let j = i; j < topProducts.length; j++) {
      const p1 = topProducts[i];
      const p2 = topProducts[j];
      
      if (p1.price + p2.price === amount) {
        const items = i === j 
          ? [{ product: p1, quantity: 2 }]
          : [{ product: p1, quantity: 1 }, { product: p2, quantity: 1 }];
        
        suggestions.push({
          items,
          total: p1.price + p2.price,
          confidence: 0.85,
        });
      }
    }
  }

  // 4. Try 3-item combinations (limited)
  if (suggestions.length < 3) {
    for (let i = 0; i < Math.min(10, topProducts.length); i++) {
      for (let j = i; j < Math.min(10, topProducts.length); j++) {
        for (let k = j; k < Math.min(10, topProducts.length); k++) {
          const p1 = topProducts[i];
          const p2 = topProducts[j];
          const p3 = topProducts[k];
          
          if (p1.price + p2.price + p3.price === amount) {
            const items = buildItemList([p1, p2, p3]);
            suggestions.push({
              items,
              total: amount,
              confidence: 0.75,
            });
          }
        }
      }
    }
  }

  // 5. Try 4-item combinations (very limited)
  if (suggestions.length < 2) {
    for (let i = 0; i < Math.min(8, topProducts.length); i++) {
      for (let j = i; j < Math.min(8, topProducts.length); j++) {
        for (let k = j; k < Math.min(8, topProducts.length); k++) {
          for (let l = k; l < Math.min(8, topProducts.length); l++) {
            const p1 = topProducts[i];
            const p2 = topProducts[j];
            const p3 = topProducts[k];
            const p4 = topProducts[l];
            
            if (p1.price + p2.price + p3.price + p4.price === amount) {
              const items = buildItemList([p1, p2, p3, p4]);
              suggestions.push({
                items,
                total: amount,
                confidence: 0.65,
              });
            }
          }
        }
      }
    }
  }

  // Apply intelligent scoring if learning data is available
  if (learningData) {
    suggestions.forEach((suggestion) => {
      const intelligentScore = calculateIntelligentScore(
        suggestion,
        learningData,
        amount
      );
      suggestion.confidence = intelligentScore.confidence;
      suggestion.reasons = intelligentScore.reasons;
    });
  }

  // Remove duplicates by comparing item combinations
  const uniqueSuggestions: SuggestedCombination[] = [];
  const seenCombos = new Set<string>();
  
  for (const suggestion of suggestions) {
    // Create a unique key for this combination
    const comboKey = suggestion.items
      .map((item) => `${item.product.id}:${item.quantity}`)
      .sort()
      .join('|');
    
    if (!seenCombos.has(comboKey)) {
      seenCombos.add(comboKey);
      uniqueSuggestions.push(suggestion);
    }
  }

  // Sort by confidence (higher first) and limit to top 3
  const topSuggestions = uniqueSuggestions
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 3);

  // Return only if we have at least 1 suggestion, up to 3
  return topSuggestions.length > 0 ? topSuggestions : [];
}

/**
 * Calculate intelligent confidence score with 7 components
 */
function calculateIntelligentScore(
  suggestion: SuggestedCombination,
  learningData: LearningData,
  targetAmount: number
): { confidence: number; reasons: string[] } {
  const reasons: string[] = [];
  let score = 0;

  // Base score: How well does price match?
  const priceFit = suggestion.total === targetAmount ? 0.5 : 0.3;
  score += priceFit;

  // 🟦 1. Popularity Boost (0-0.25)
  const avgPopularity =
    suggestion.items.reduce((sum, item) => sum + item.product.popularity, 0) /
    suggestion.items.length;
  const popularityBoost = Math.min(0.25, avgPopularity * 0.05);
  score += popularityBoost;
  if (popularityBoost > 0.1) {
    reasons.push('Popular items');
  }

  // 🟩 2. Combo Frequency Boost (0-0.2)
  const comboKey = suggestion.items
    .map((item) => item.product.id)
    .sort()
    .join('|');
  const comboCount = learningData.comboStats[comboKey] || 0;
  const comboBoost = Math.min(0.2, comboCount * 0.1);
  score += comboBoost;
  if (comboCount > 0) {
    reasons.push(`Bought together ${comboCount}x before`);
  }

  // 🟧 3. Time-of-Day Boost (0-0.15)
  const currentHour = new Date().getHours();
  const hourlyData = learningData.hourlyStats[currentHour] || {};
  const hourlyBoost = suggestion.items.reduce((sum, item) => {
    const hourCount = hourlyData[item.product.id] || 0;
    return sum + Math.min(0.05, hourCount * 0.05);
  }, 0);
  score += hourlyBoost;
  if (hourlyBoost > 0.05) {
    const timeLabel = getTimeLabel(currentHour);
    reasons.push(`Popular in ${timeLabel}`);
  }

  // 🟥 4. Recency Dampening (-0.1)
  const recentProductIds = new Set(
    learningData.lastTenSales.flatMap((sale) => sale.items)
  );
  const hasRecentItems = suggestion.items.some((item) =>
    recentProductIds.has(item.product.id)
  );
  if (hasRecentItems) {
    score -= 0.1;
    reasons.push('Recently sold (less likely)');
  }

  // 🟨 5. Low Stock Penalty (-0.2)
  const hasLowStock = suggestion.items.some((item) => item.product.stock <= 1);
  if (hasLowStock) {
    score -= 0.2;
    reasons.push('Low stock warning');
  }

  // 🟪 6. Weird Combo Penalty (-0.1 per mismatch)
  // Simple category detection from product names
  const categories = suggestion.items.map((item) =>
    detectCategory(item.product.name)
  );
  const uniqueCategories = new Set(categories);
  if (uniqueCategories.size > 2 && suggestion.items.length > 2) {
    const weirdPenalty = (uniqueCategories.size - 2) * 0.1;
    score -= weirdPenalty;
    reasons.push('Unusual combination');
  }

  // ⬜ 7. Simplicity Bonus (0-0.15)
  const simplicityBonus = (4 - suggestion.items.length) * 0.05;
  score += simplicityBonus;
  if (suggestion.items.length === 1) {
    reasons.push('Simple single item');
  }

  // Normalize to 0-1
  const confidence = Math.min(1, Math.max(0, score));

  return { confidence, reasons };
}

/**
 * Detect product category from name (simple heuristic)
 */
function detectCategory(name: string): string {
  const lower = name.toLowerCase();
  if (lower.match(/biscuit|cookie|chips|namkeen|snack/)) return 'snacks';
  if (lower.match(/milk|curd|butter|cheese|paneer|dairy/)) return 'dairy';
  if (lower.match(/bread|pav|roti|chapati/)) return 'bakery';
  if (lower.match(/rice|wheat|atta|dal|pulses/)) return 'grains';
  if (lower.match(/oil|ghee|masala|spice/)) return 'cooking';
  if (lower.match(/soap|shampoo|detergent|paste/)) return 'hygiene';
  if (lower.match(/tea|coffee|juice|drink/)) return 'beverages';
  return 'other';
}

/**
 * Get time label for current hour
 */
function getTimeLabel(hour: number): string {
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

/**
 * Build item list with quantities from product array
 */
function buildItemList(products: Product[]): Array<{ product: Product; quantity: number }> {
  const itemMap = new Map<string, { product: Product; quantity: number }>();
  
  for (const product of products) {
    const existing = itemMap.get(product.id);
    if (existing) {
      existing.quantity++;
    } else {
      itemMap.set(product.id, { product, quantity: 1 });
    }
  }
  
  return Array.from(itemMap.values());
}

/**
 * Format product list for display (Hour 5 utility)
 */
export function formatProductList(products: Product[]): string {
  return products.map((p) => p.name).join(' + ');
}
