import csv
import json
import random
from datetime import datetime, timedelta

# Product data
products = {
    'p001': {'name': 'Parle-G Biscuits 80g', 'price': 30.0, 'category': 'snacks'},
    'p002': {'name': 'Lays Chips 40g', 'price': 20.0, 'category': 'snacks'},
    'p003': {'name': 'Britannia Bread', 'price': 45.0, 'category': 'bakery'},
    'p004': {'name': 'Amul Milk 500ml', 'price': 60.0, 'category': 'dairy'},
    'p005': {'name': 'Tata Tea 250g', 'price': 150.0, 'category': 'beverages'},
    'p006': {'name': 'Maggi Noodles 70g', 'price': 14.0, 'category': 'instant food'},
    'p007': {'name': 'Sunflower Oil 1L', 'price': 180.0, 'category': 'cooking'},
    'p008': {'name': 'Tata Salt 1kg', 'price': 22.0, 'category': 'staple'},
    'p009': {'name': 'Aashirvaad Atta 1kg', 'price': 55.0, 'category': 'grains'},
    'p010': {'name': 'Rice 1kg', 'price': 70.0, 'category': 'grains'},
    'p011': {'name': 'Sugar 1kg', 'price': 50.0, 'category': 'staple'},
    'p012': {'name': 'Toor Dal 500g', 'price': 90.0, 'category': 'pulses'},
    'p013': {'name': 'Colgate Toothpaste 100g', 'price': 85.0, 'category': 'hygiene'},
    'p014': {'name': 'Detergent Powder 1kg', 'price': 120.0, 'category': 'household'},
    'p015': {'name': 'Cold Drink 500ml', 'price': 40.0, 'category': 'soft drink'},
    'p016': {'name': 'Soap Bar', 'price': 35.0, 'category': 'hygiene'},
    'p017': {'name': 'Hide & Seek Biscuits', 'price': 50.0, 'category': 'snacks'},
    'p018': {'name': 'Instant Coffee Sachet', 'price': 10.0, 'category': 'beverages'},
    'p019': {'name': 'Candy Packets', 'price': 5.0, 'category': 'convenience'},
    'p020': {'name': 'Packaged Juice 200ml', 'price': 25.0, 'category': 'beverages'},
}

# Common combos with their frequencies
common_combos = [
    # Morning combos (7-10 AM)
    (['p003', 'p004'], 0.15),  # Bread + Milk
    (['p001', 'p005'], 0.10),  # Biscuits + Tea
    (['p004', 'p011'], 0.08),  # Milk + Sugar
    (['p003', 'p004', 'p011'], 0.05),  # Bread + Milk + Sugar
    
    # Noon combos (12-2 PM)
    (['p006'], 0.12),  # Maggi alone
    (['p006', 'p015'], 0.08),  # Maggi + Cold Drink
    (['p009', 'p012'], 0.06),  # Atta + Dal
    
    # Evening combos (5-8 PM)
    (['p002', 'p015'], 0.12),  # Chips + Cold Drink
    (['p001', 'p015'], 0.10),  # Biscuits + Cold Drink
    (['p017', 'p020'], 0.08),  # Premium Biscuits + Juice
    (['p019', 'p020'], 0.06),  # Candy + Juice
    
    # Weekly shopping combos
    (['p007', 'p008', 'p009'], 0.04),  # Oil + Salt + Atta
    (['p009', 'p010', 'p012'], 0.04),  # Atta + Rice + Dal
    (['p013', 'p016'], 0.06),  # Toothpaste + Soap
    (['p014', 'p016'], 0.05),  # Detergent + Soap
    
    # Single items (remaining probability)
    (['p001'], 0.08),
    (['p002'], 0.08),
    (['p004'], 0.10),
    (['p015'], 0.10),
    (['p019'], 0.08),
]

def generate_timestamp(day, hour_range):
    """Generate a random timestamp within the given hour range"""
    hour = random.randint(hour_range[0], hour_range[1])
    minute = random.randint(0, 59)
    second = random.randint(0, 59)
    return day.replace(hour=hour, minute=minute, second=second)

def select_combo(hour):
    """Select a combo based on time of day"""
    if 7 <= hour <= 10:
        # Morning - prefer breakfast items
        morning_combos = [c for c in common_combos if any(p in ['p003', 'p004', 'p005'] for p in c[0])]
        weights = [c[1] for c in morning_combos]
        return random.choices(morning_combos, weights=weights)[0][0]
    elif 12 <= hour <= 14:
        # Noon - prefer quick meals
        noon_combos = [c for c in common_combos if any(p in ['p006', 'p009', 'p012'] for p in c[0])]
        weights = [c[1] for c in noon_combos]
        return random.choices(noon_combos, weights=weights)[0][0]
    elif 17 <= hour <= 20:
        # Evening - prefer snacks
        evening_combos = [c for c in common_combos if any(p in ['p001', 'p002', 'p015', 'p017', 'p019', 'p020'] for p in c[0])]
        weights = [c[1] for c in evening_combos]
        return random.choices(evening_combos, weights=weights)[0][0]
    else:
        # Other times - random
        return random.choices(common_combos, weights=[c[1] for c in common_combos])[0][0]

def generate_transactions(start_date, num_days=15, txns_per_day=35):
    """Generate realistic transactions"""
    transactions = []
    sale_counter = 1
    
    for day_offset in range(num_days):
        current_day = start_date + timedelta(days=day_offset)
        
        # Vary transactions per day (30-45)
        daily_txns = random.randint(30, 45)
        
        # Time distribution: morning peak (7-10), noon (12-14), evening peak (17-20)
        time_slots = (
            [(7, 10)] * 12 +  # Morning peak
            [(10, 12)] * 4 +
            [(12, 14)] * 6 +  # Noon
            [(14, 17)] * 4 +
            [(17, 20)] * 14 +  # Evening peak
            [(20, 22)] * 5
        )
        
        for _ in range(daily_txns):
            hour_range = random.choice(time_slots)
            timestamp = generate_timestamp(current_day, hour_range)
            
            # Select combo based on hour
            product_ids = select_combo(timestamp.hour)
            
            # Generate items with quantities
            items = []
            total_amount = 0.0
            
            for pid in product_ids:
                qty = random.choices([1, 2, 3], weights=[0.7, 0.25, 0.05])[0]
                unit_price = products[pid]['price']
                items.append({
                    'product_id': pid,
                    'qty': qty,
                    'unit_price': unit_price
                })
                total_amount += qty * unit_price
            
            # Create transaction
            sale_id = f"sale_{current_day.strftime('%Y%m%d')}_{sale_counter:04d}"
            sale_counter += 1
            
            transactions.append({
                'sale_id': sale_id,
                'timestamp': timestamp.strftime('%Y-%m-%d %H:%M:%S'),
                'amount': round(total_amount, 2),
                'currency': 'INR',
                'items_json': json.dumps(items)
            })
    
    return transactions

# Generate transactions for 15 days starting from Nov 23, 2025
start_date = datetime(2025, 11, 23, 0, 0, 0)
transactions = generate_transactions(start_date, num_days=15)

# Write to CSV
with open('transactions.csv', 'w', newline='', encoding='utf-8') as f:
    writer = csv.DictWriter(f, fieldnames=['sale_id', 'timestamp', 'amount', 'currency', 'items_json'])
    writer.writeheader()
    writer.writerows(transactions)

print(f"Generated {len(transactions)} transactions")
print(f"Date range: {transactions[0]['timestamp']} to {transactions[-1]['timestamp']}")

# Calculate stats
multi_item_count = sum(1 for t in transactions if len(json.loads(t['items_json'])) > 1)
print(f"Multi-item transactions: {multi_item_count} ({multi_item_count/len(transactions)*100:.1f}%)")

# Top combos
combo_freq = {}
for t in transactions:
    items = json.loads(t['items_json'])
    combo = tuple(sorted([item['product_id'] for item in items]))
    combo_freq[combo] = combo_freq.get(combo, 0) + 1

top_combos = sorted(combo_freq.items(), key=lambda x: x[1], reverse=True)[:10]
print("\nTop 10 combos:")
for combo, freq in top_combos:
    combo_names = [products[pid]['name'] for pid in combo]
    print(f"  {freq:3d}x: {' + '.join(combo_names)}")
