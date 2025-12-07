import { useInventoryStore } from '../store/inventoryStore';
import { useSalesStore } from '../store/salesStore';
import { useRestockStore } from '../store/restockStore';
import { useShopContextStore } from '../store/shopContextStore';
import { getEarliestExpiry, daysUntilExpiry } from './expiryUtils';

/**
 * Detect language from user input
 */
export function detectLanguage(text: string): 'en' | 'hi' | 'kn' {
  // Hindi detection (Devanagari script)
  if (/[\u0900-\u097F]/.test(text)) return 'hi';
  
  // Kannada detection (Kannada script)
  if (/[\u0C80-\u0CFF]/.test(text)) return 'kn';
  
  const lowerText = text.toLowerCase();
  
  // Hindi keywords in Latin script (romanized Hindi)
  const hindiKeywords = [
    'aaj', 'kal', 'kya', 'kitna', 'kaun', 'kaise', 'bhaiya', 'didi', 'samaan', 'bikri',
    'paisa', 'rupaye', 'kharcha', 'faayda', 'nuksaan', 'dukaan', 'graahak', 'customer',
    'maal', 'stock', 'khatam', 'kam', 'zyada', 'accha', 'bura', 'theek', 'sahi',
    'kaam', 'vyavasaya', 'business', 'profit', 'loss', 'sale', 'kharidna', 'bechna',
    'hai', 'hain', 'ho', 'gaya', 'karo', 'karna', 'chahiye', 'batao', 'dikhao'
  ];
  
  // Kannada keywords in Latin script (romanized Kannada)
  const kannadaKeywords = [
    'enu', 'yaava', 'hegide', 'elli', 'yaake', 'anna', 'akka', 'saaman', 'vikrayi',
    'duddu', 'rupayi', 'kharchu', 'laabha', 'nashtaa', 'angadi', 'customer', 'graahaka',
    'stock', 'mugidu', 'kammi', 'jaasti', 'chennaagi', 'ketta', 'sari', 'olledu',
    'kelasa', 'vyaapaara', 'business', 'profit', 'loss', 'sale', 'kondu', 'beku',
    'ide', 'alla', 'aagide', 'maadi', 'heli', 'torsii'
  ];
  
  // Count matches for each language
  const hindiMatches = hindiKeywords.filter(keyword => lowerText.includes(keyword)).length;
  const kannadaMatches = kannadaKeywords.filter(keyword => lowerText.includes(keyword)).length;
  
  // If significant matches found, return that language
  if (hindiMatches > 0 && hindiMatches >= kannadaMatches) return 'hi';
  if (kannadaMatches > 0 && kannadaMatches > hindiMatches) return 'kn';
  
  // Default to English for pure English or ambiguous text
  return 'en';
}

/**
 * Build context summary for AI assistant
 */
export function buildContextSummary() {
  const shopContext = useShopContextStore.getState().context;
  const products = useInventoryStore.getState().products;
  const getLowStockProducts = useInventoryStore.getState().getLowStockProducts;
  const totalToday = useSalesStore.getState().totalToday;
  const getTodaySales = useSalesStore.getState().getTodaySales;
  const getTopProducts = useSalesStore.getState().getTopProducts;
  const getExpiringSoon = useRestockStore.getState().getExpiringSoon;
  const getRestocksForProduct = useRestockStore.getState().getRestocksForProduct;

  const todaySales = getTodaySales();
  const topProducts = getTopProducts(products).slice(0, 3);
  const lowStockProducts = getLowStockProducts();
  const expiringSoon = getExpiringSoon(3);

  // Build expiring products list with details
  const expiringProducts = expiringSoon.map((restock) => {
    const product = products.find((p) => p.id === restock.productId);
    if (!product || !restock.expiryDate) return null;
    
    return {
      id: product.id,
      name: product.name,
      stock: product.stock,
      earliestExpiryDays: daysUntilExpiry(restock.expiryDate),
    };
  }).filter(Boolean);

  // Get unique expiring products
  const uniqueExpiringProducts = Array.from(
    new Map(expiringProducts.map(item => [item!.id, item])).values()
  );

  const contextSummary = {
    shopName: shopContext.shopName,
    ownerName: shopContext.ownerName,
    primaryLanguage: shopContext.primaryLanguage,
    timezone: shopContext.timezone,
    currency: shopContext.currency,
    busyHours: shopContext.busyHours,
    demoMode: shopContext.demoMode,
    topProducts: topProducts.map((tp) => ({
      id: tp.product.id,
      name: tp.product.name,
      price: tp.product.price,
      stock: tp.product.stock,
      popularity: tp.product.popularity,
      soldCount: tp.count,
    })),
    lowStock: lowStockProducts.map((p) => {
      const restocks = getRestocksForProduct(p.id);
      const expiryDates = restocks.map(r => r.expiryDate).filter((d): d is number => d != null);
      const earliestExpiry = getEarliestExpiry(expiryDates);
      
      return {
        id: p.id,
        name: p.name,
        stock: p.stock,
        threshold: p.lowStockThreshold ?? 2,
        earliestExpiryDays: earliestExpiry ? daysUntilExpiry(earliestExpiry) : null,
      };
    }),
    expiringProducts: uniqueExpiringProducts,
    todayRevenue: totalToday,
    todaySalesCount: todaySales.length,
    totalProducts: products.length,
  };

  return contextSummary;
}

/**
 * Get system prompt for AI assistant
 */
export function getSystemPrompt(contextSummary: any, userLanguage: 'en' | 'hi' | 'kn'): string {
  const languageInstructions = {
    en: {
      greeting: "Bhaiya/Didi",
      noData: "Not enough data yet—better suggestions will come in a few days. You can try adding demo data to explore.",
      costMissing: "Cost data missing — please add restock costs to calculate profit.",
      style: "Use clear, professional English. Avoid mixing Hindi words unless they're common business terms (like 'bhaiya', 'didi')."
    },
    hi: {
      greeting: "भाई/दीदी",
      noData: "डेटा कम है—कुछ दिन में और सही सुझाव मिलेंगे। अभी आप चाहो तो डेमो डेटा डाल के देखो।",
      costMissing: "कॉस्ट डेटा नहीं है — प्रॉफिट देखने के लिए रीस्टॉक कॉस्ट जोड़ें।",
      style: "हिंदी में जवाब दें। अंग्रेजी के शब्द बिल्कुल न मिलाएं।"
    },
    kn: {
      greeting: "ಅಣ್ಣ/ಅಕ್ಕ",
      noData: "ಡೇಟಾ ಕಡಿಮೆ ಇದೆ—ಕೆಲವು ದಿನಗಳಲ್ಲಿ ಉತ್ತಮ ಸಲಹೆಗಳು ಸಿಗುತ್ತವೆ। ಈಗ ನೀವು ಬಯಸಿದರೆ ಡೆಮೋ ಡೇಟಾ ಹಾಕಿ ನೋಡಿ।",
      costMissing: "ಕಾಸ್ಟ್ ಡೇಟಾ ಇಲ್ಲ — ಲಾಭ ನೋಡಲು ರೀಸ್ಟಾಕ್ ಕಾಸ್ಟ್ ಸೇರಿಸಿ।",
      style: "ಕನ್ನಡದಲ್ಲಿ ಉತ್ತರಿಸಿ। ಇಂಗ್ಲಿಷ್ ಪದಗಳನ್ನು ಮಿಶ್ರ ಮಾಡಬೇಡಿ।"
    }
  };

  const lang = languageInstructions[userLanguage];

  return `You are "AI Shop Assistant" — a friendly, helpful kirana shop AI assistant.

CRITICAL LANGUAGE RULE: The user is writing in ${userLanguage.toUpperCase()}. You MUST respond ONLY in ${userLanguage.toUpperCase()}. ${lang.style}

Use the shop context provided below. Always reply in a short, clear, action-oriented way. Do NOT show charts, percentages, or technical analytics. Use a casual, respectful local style like a human helper speaking to the shop owner.

Rules:
• Speak in short sentences; 1–4 lines max for single-question replies.
• Start with "${lang.greeting}" if appropriate.
• Give actionable advice: what to do *today* (sell, discount, restock), why in one short phrase, and a simple suggestion.
• If uncertain, offer 2 short options the owner can pick.
• Always surface one concrete next step at the end.
• If the shop has no data, say: "${lang.noData}"
• If cost data missing for profit questions, say: "${lang.costMissing}"
• Respect shopContext: timezone, currency, busyHours, language, rounding rules.
• Keep responses friendly and short.

Shop Context:
${JSON.stringify(contextSummary, null, 2)}`;
}

/**
 * Call OpenAI API for chat completion
 */
export async function getAIResponse(
  userMessage: string,
  conversationHistory: Array<{ role: string; content: string }>,
  apiKey: string
): Promise<string> {
  const contextSummary = buildContextSummary();
  
  // Use preferred language from shop context, fallback to message detection
  let responseLanguage: 'en' | 'hi' | 'kn' = 'en';
  
  if (contextSummary.primaryLanguage === 'en') {
    responseLanguage = 'en';
  } else if (contextSummary.primaryLanguage === 'hi') {
    responseLanguage = 'hi';
  } else if (contextSummary.primaryLanguage === 'kn') {
    responseLanguage = 'kn';
  } else {
    // If no preference set, detect from message
    responseLanguage = detectLanguage(userMessage);
  }
  
  const systemPrompt = getSystemPrompt(contextSummary, responseLanguage);

  const messages = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory.slice(-10), // Last 5 exchanges
    { role: 'user', content: userMessage },
  ];

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        temperature: 0.7,
        max_tokens: 200,
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || 'Sorry, I could not process that.';
  } catch (error) {
    console.error('AI Assistant error:', error);
    throw error;
  }
}

/**
 * Calculate recommended reorder quantity
 */
export function calculateReorderQuantity(
  productId: string,
  targetCoverageDays: number = 7
): number {
  const product = useInventoryStore.getState().products.find(p => p.id === productId);
  if (!product) return 0;

  const sales = useSalesStore.getState().sales;
  const recentSales = sales.filter(s => s.timestamp > Date.now() - 7 * 24 * 60 * 60 * 1000);
  
  // Count how many times this product was sold
  const productSales = recentSales.filter(s => s.items.includes(productId)).length;
  const velocity = productSales / 7; // per day
  
  const needed = Math.ceil(velocity * targetCoverageDays);
  const toOrder = Math.max(0, needed - product.stock);
  
  return toOrder;
}
