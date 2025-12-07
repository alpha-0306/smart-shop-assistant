# Test Data for Smart Shop Assistant Recommendation System

## Overview

This directory contains realistic transaction data for testing the recommendation engine. The data simulates 15 days of transactions from a typical Indian kirana store.

## Files

1. **products.csv** - 20 common kirana products with pricing
2. **transactions.csv** - 560 realistic transactions over 15 days
3. **generate_transactions.py** - Script used to generate the data

## Data Generation Methodology

### Source Data
- Used BigBasket Products.csv as reference for Indian product categories
- Mapped to 20 common kirana store products (avoiding age-restricted items)
- Prices set to realistic Indian retail values (₹5 - ₹180)

### Product Mapping

| Product ID | Name | Category | Price (₹) | Source |
|------------|------|----------|-----------|--------|
| p001 | Parle-G Biscuits 80g | snacks | 30 | Common kirana item |
| p002 | Lays Chips 40g | snacks | 20 | Common kirana item |
| p003 | Britannia Bread | bakery | 45 | Common kirana item |
| p004 | Amul Milk 500ml | dairy | 60 | Common kirana item |
| p005 | Tata Tea 250g | beverages | 150 | Common kirana item |
| p006 | Maggi Noodles 70g | instant food | 14 | Common kirana item |
| p007 | Sunflower Oil 1L | cooking | 180 | Common kirana item |
| p008 | Tata Salt 1kg | staple | 22 | Common kirana item |
| p009 | Aashirvaad Atta 1kg | grains | 55 | Common kirana item |
| p010 | Rice 1kg | grains | 70 | Common kirana item |
| p011 | Sugar 1kg | staple | 50 | Common kirana item |
| p012 | Toor Dal 500g | pulses | 90 | Common kirana item |
| p013 | Colgate Toothpaste 100g | hygiene | 85 | Common kirana item |
| p014 | Detergent Powder 1kg | household | 120 | Common kirana item |
| p015 | Cold Drink 500ml | soft drink | 40 | Common kirana item |
| p016 | Soap Bar | hygiene | 35 | Common kirana item |
| p017 | Hide & Seek Biscuits | snacks | 50 | Common kirana item |
| p018 | Instant Coffee Sachet | beverages | 10 | Common kirana item |
| p019 | Candy Packets | convenience | 5 | Common kirana item |
| p020 | Packaged Juice 200ml | beverages | 25 | Common kirana item |

### Transaction Patterns

**Time Distribution:**
- **Morning Peak (7-10 AM)**: 27% of transactions
  - Focus: Bread, Milk, Tea, Biscuits
  - Common combos: Bread + Milk, Biscuits + Tea
  
- **Noon (12-2 PM)**: 13% of transactions
  - Focus: Quick meals (Maggi, Atta, Dal)
  - Common combos: Maggi + Cold Drink
  
- **Evening Peak (5-8 PM)**: 31% of transactions
  - Focus: Snacks and beverages
  - Common combos: Chips + Cold Drink, Biscuits + Juice
  
- **Other Hours**: 29% of transactions
  - Mixed purchases

**Combo Patterns:**
- 71.2% multi-item transactions (2+ items)
- 28.8% single-item transactions
- Realistic quantities (70% qty=1, 25% qty=2, 5% qty=3)

## Dataset Statistics

```
Total Transactions: 560
Date Range: 2025-11-23 to 2025-12-07 (15 days)
Average Transactions/Day: 37.3
Multi-item Transactions: 399 (71.2%)

Top 10 Combos:
  73x: Parle-G Biscuits + Tata Tea
  66x: Britannia Bread + Amul Milk
  42x: Maggi Noodles (single)
  40x: Amul Milk + Sugar
  35x: Maggi Noodles + Cold Drink
  35x: Lays Chips + Cold Drink
  31x: Amul Milk (single)
  30x: Hide & Seek Biscuits + Packaged Juice
  27x: Cold Drink (single)
  26x: Parle-G Biscuits + Cold Drink
```

## Data Schema

### products.csv
```csv
product_id,name,category,price,unit,initial_stock
p001,Parle-G Biscuits 80g,snacks,30.0,packet,50
```

### transactions.csv
```csv
sale_id,timestamp,amount,currency,items_json
sale_20251123_0001,2025-11-23 19:07:19,50.0,INR,"[{""product_id"":""p001"",""qty"":1,""unit_price"":30.0}]"
```

**items_json format:**
```json
[
  {
    "product_id": "p001",
    "qty": 1,
    "unit_price": 30.0
  }
]
```

## Validation Results

✅ All amounts equal sum(unit_price × qty)  
✅ 15 unique date days covered  
✅ 71.2% multi-item combos (target: ≥30%)  
✅ Realistic time distribution (morning/evening peaks)  
✅ Common Indian kirana combos represented  

## Usage

### Load in JavaScript/TypeScript:
```typescript
import * as fs from 'fs';
import * as csv from 'csv-parser';

const transactions = [];
fs.createReadStream('transactions.csv')
  .pipe(csv())
  .on('data', (row) => {
    row.items = JSON.parse(row.items_json);
    transactions.push(row);
  });
```

### Load in Python:
```python
import pandas as pd
import json

df = pd.read_csv('transactions.csv')
df['items'] = df['items_json'].apply(json.loads)
```

## Expected Recommendation Performance

Based on this dataset, the recommendation system should achieve:

- **Top-1 Match Rate**: ≥65% (exact match)
- **Top-3 Hit Rate**: ≥90% (actual combo in top 3)
- **Precision@1**: ≥0.65
- **Recall@3**: ≥0.90
- **False Positive Rate**: ≤5%

## Notes

- All products are common Indian kirana items
- No age-restricted items (no alcohol, tobacco)
- Prices reflect realistic Indian retail values
- Time patterns reflect typical Indian shopping behavior
- Combos reflect common purchase patterns (breakfast, snacks, weekly shopping)

## Regeneration

To regenerate with different parameters:
```bash
python generate_transactions.py
```

Edit the script to adjust:
- Number of days
- Transactions per day
- Combo frequencies
- Time distributions
