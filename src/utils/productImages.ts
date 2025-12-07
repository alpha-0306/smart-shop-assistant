/**
 * Product Image Utilities
 * Provides fallback stock images for products based on their names
 */

export interface ProductImageMapping {
  keywords: string[];
  imageUrl: string;
  category: string;
}

// Stock product images from reliable sources
export const productImageMappings: ProductImageMapping[] = [
  // Biscuits & Snacks
  {
    keywords: ['parle-g', 'parle g', 'biscuit', 'glucose'],
    imageUrl: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400&h=400&fit=crop',
    category: 'biscuits'
  },
  {
    keywords: ['hide', 'seek', 'hide & seek', 'chocolate biscuit'],
    imageUrl: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=400&h=400&fit=crop',
    category: 'biscuits'
  },
  {
    keywords: ['chips', 'lays', 'namkeen', 'snack'],
    imageUrl: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400&h=400&fit=crop',
    category: 'snacks'
  },
  {
    keywords: ['candy', 'toffee', 'sweet'],
    imageUrl: 'https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?w=400&h=400&fit=crop',
    category: 'candy'
  },

  // Beverages
  {
    keywords: ['tea', 'chai', 'tata tea'],
    imageUrl: 'https://images.unsplash.com/photo-1594631661960-0e22e0946e40?w=400&h=400&fit=crop',
    category: 'beverages'
  },
  {
    keywords: ['coffee', 'instant coffee', 'nescafe'],
    imageUrl: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400&h=400&fit=crop',
    category: 'beverages'
  },
  {
    keywords: ['cold drink', 'soft drink', 'cola', 'pepsi', 'coke'],
    imageUrl: 'https://images.unsplash.com/photo-1581636625402-29b2a704ef13?w=400&h=400&fit=crop',
    category: 'beverages'
  },
  {
    keywords: ['juice', 'fruit juice', 'packaged juice'],
    imageUrl: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400&h=400&fit=crop',
    category: 'beverages'
  },

  // Dairy
  {
    keywords: ['milk', 'amul milk', 'dairy'],
    imageUrl: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&h=400&fit=crop',
    category: 'dairy'
  },

  // Bakery
  {
    keywords: ['bread', 'britannia bread', 'pav', 'loaf'],
    imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=400&fit=crop',
    category: 'bakery'
  },

  // Instant Food
  {
    keywords: ['maggi', 'noodles', 'instant noodles'],
    imageUrl: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&h=400&fit=crop',
    category: 'instant'
  },

  // Cooking Essentials
  {
    keywords: ['oil', 'sunflower oil', 'cooking oil'],
    imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&h=400&fit=crop',
    category: 'cooking'
  },
  {
    keywords: ['salt', 'tata salt', 'namak'],
    imageUrl: 'https://images.unsplash.com/photo-1472162314594-a27637f1bf1f?w=400&h=400&fit=crop',
    category: 'staples'
  },
  {
    keywords: ['sugar', 'chini'],
    imageUrl: 'https://images.unsplash.com/photo-1587735243615-c03f25aaff15?w=400&h=400&fit=crop',
    category: 'staples'
  },

  // Grains
  {
    keywords: ['atta', 'flour', 'wheat flour', 'aashirvaad'],
    imageUrl: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&h=400&fit=crop',
    category: 'grains'
  },
  {
    keywords: ['rice', 'chawal', 'basmati'],
    imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&h=400&fit=crop',
    category: 'grains'
  },
  {
    keywords: ['dal', 'toor dal', 'pulses', 'lentils'],
    imageUrl: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400&h=400&fit=crop',
    category: 'pulses'
  },

  // Hygiene & Household
  {
    keywords: ['toothpaste', 'colgate', 'dental'],
    imageUrl: 'https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?w=400&h=400&fit=crop',
    category: 'hygiene'
  },
  {
    keywords: ['soap', 'bathing soap', 'bar soap'],
    imageUrl: 'https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=400&h=400&fit=crop',
    category: 'hygiene'
  },
  {
    keywords: ['detergent', 'washing powder', 'surf'],
    imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop',
    category: 'household'
  },

  // Generic fallbacks by category
  {
    keywords: ['packet', 'pack'],
    imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop',
    category: 'generic'
  }
];

/**
 * Get stock image URL for a product based on its name
 * DISABLED: Stock images removed as they don't represent Indian products accurately
 */
export function getProductStockImage(productName: string): string | null {
  // Always return null - no stock images
  return null;
}

/**
 * Get product category based on name
 */
export function getProductCategory(productName: string): string {
  if (!productName) return 'general';
  
  const lowerName = productName.toLowerCase();
  
  for (const mapping of productImageMappings) {
    for (const keyword of mapping.keywords) {
      if (lowerName.includes(keyword.toLowerCase())) {
        return mapping.category;
      }
    }
  }
  
  return 'general';
}

/**
 * Component helper to get image source with fallback
 */
export function getProductImageSource(photoUri?: string, productName?: string) {
  if (photoUri) {
    return { uri: photoUri };
  }
  
  // No stock images - always return null to show package icon
  return null;
}