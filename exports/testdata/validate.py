"""
Validation script for transaction data
Checks data quality and calculates statistics
"""

import csv
import json
from datetime import datetime
from collections import Counter, defaultdict

def load_products():
    """Load products from CSV"""
    products = {}
    with open('products.csv', 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            products[row['product_id']] = {
                'name': row['name'],
                'price': float(row['price']),
                'category': row['category']
            }
    return products

def load_transactions():
    """Load transactions from CSV"""
    transactions = []
    with open('transactions.csv', 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            row['amount'] = float(row['amount'])
            row['items'] = json.loads(row['items_json'])
            row['timestamp_dt'] = datetime.strptime(row['timestamp'], '%Y-%m-%d %H:%M:%S')
            transactions.append(row)
    return transactions

def validate_amounts(transactions):
    """Validate that amounts match sum of items"""
    errors = []
    for txn in transactions:
        calculated = sum(item['qty'] * item['unit_price'] for item in txn['items'])
        if abs(calculated - txn['amount']) > 0.01:  # Allow tiny float tolerance
            errors.append({
                'sale_id': txn['sale_id'],
                'expected': calculated,
                'actual': txn['amount'],
                'diff': abs(calculated - txn['amount'])
            })
    return errors

def calculate_stats(transactions, products):
    """Calculate dataset statistics"""
    stats = {}
    
    # Basic counts
    stats['total_transactions'] = len(transactions)
    
    # Date range
    dates = [txn['timestamp_dt'].date() for txn in transactions]
    stats['unique_days'] = len(set(dates))
    stats['date_range'] = f"{min(dates)} to {max(dates)}"
    stats['avg_txns_per_day'] = len(transactions) / len(set(dates))
    
    # Multi-item analysis
    multi_item = [txn for txn in transactions if len(txn['items']) > 1]
    stats['multi_item_count'] = len(multi_item)
    stats['multi_item_pct'] = (len(multi_item) / len(transactions)) * 100
    
    # Combo frequency
    combo_freq = Counter()
    for txn in transactions:
        combo = tuple(sorted([item['product_id'] for item in txn['items']]))
        combo_freq[combo] += 1
    
    stats['top_combos'] = []
    for combo, freq in combo_freq.most_common(10):
        combo_names = [products[pid]['name'] for pid in combo]
        stats['top_combos'].append({
            'combo': ' + '.join(combo_names),
            'frequency': freq
        })
    
    # Time distribution
    hour_dist = defaultdict(int)
    for txn in transactions:
        hour = txn['timestamp_dt'].hour
        hour_dist[hour] += 1
    
    stats['peak_hours'] = sorted(hour_dist.items(), key=lambda x: x[1], reverse=True)[:5]
    
    # Amount distribution
    amounts = [txn['amount'] for txn in transactions]
    stats['avg_amount'] = sum(amounts) / len(amounts)
    stats['min_amount'] = min(amounts)
    stats['max_amount'] = max(amounts)
    
    return stats

def print_report(stats, amount_errors):
    """Print validation report"""
    print("=" * 70)
    print("TRANSACTION DATA VALIDATION REPORT")
    print("=" * 70)
    
    print("\n📊 DATASET OVERVIEW")
    print(f"  Total Transactions: {stats['total_transactions']}")
    print(f"  Date Range: {stats['date_range']}")
    print(f"  Unique Days: {stats['unique_days']}")
    print(f"  Avg Transactions/Day: {stats['avg_txns_per_day']:.1f}")
    
    print("\n🔢 AMOUNT VALIDATION")
    if amount_errors:
        print(f"  ❌ FAILED: {len(amount_errors)} transactions have amount mismatches")
        for err in amount_errors[:5]:
            print(f"     {err['sale_id']}: Expected ₹{err['expected']:.2f}, Got ₹{err['actual']:.2f}")
    else:
        print(f"  ✅ PASSED: All amounts match sum(unit_price × qty)")
    
    print("\n🛒 COMBO ANALYSIS")
    print(f"  Multi-item Transactions: {stats['multi_item_count']} ({stats['multi_item_pct']:.1f}%)")
    if stats['multi_item_pct'] >= 30:
        print(f"  ✅ PASSED: Multi-item rate ≥30% (target met)")
    else:
        print(f"  ❌ FAILED: Multi-item rate <30% (target not met)")
    
    print("\n🏆 TOP 10 COMBOS")
    for i, combo in enumerate(stats['top_combos'], 1):
        print(f"  {i:2d}. {combo['frequency']:3d}x: {combo['combo']}")
    
    print("\n⏰ PEAK HOURS")
    for hour, count in stats['peak_hours']:
        time_label = f"{hour:02d}:00"
        if 7 <= hour <= 10:
            period = "(Morning)"
        elif 12 <= hour <= 14:
            period = "(Noon)"
        elif 17 <= hour <= 20:
            period = "(Evening)"
        else:
            period = ""
        print(f"  {time_label} {period}: {count} transactions")
    
    print("\n💰 AMOUNT STATISTICS")
    print(f"  Average: ₹{stats['avg_amount']:.2f}")
    print(f"  Range: ₹{stats['min_amount']:.2f} - ₹{stats['max_amount']:.2f}")
    
    print("\n" + "=" * 70)
    print("VALIDATION SUMMARY")
    print("=" * 70)
    
    checks = [
        ("Amount validation", len(amount_errors) == 0),
        ("Date coverage (≥15 days)", stats['unique_days'] >= 15),
        ("Multi-item rate (≥30%)", stats['multi_item_pct'] >= 30),
        ("Transaction volume (≥500)", stats['total_transactions'] >= 500),
    ]
    
    all_passed = all(check[1] for check in checks)
    
    for check_name, passed in checks:
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"  {status}: {check_name}")
    
    print("\n" + "=" * 70)
    if all_passed:
        print("🎉 ALL CHECKS PASSED - Dataset ready for recommendation testing!")
    else:
        print("⚠️  SOME CHECKS FAILED - Review issues above")
    print("=" * 70)

if __name__ == '__main__':
    print("Loading data...")
    products = load_products()
    transactions = load_transactions()
    
    print("Validating amounts...")
    amount_errors = validate_amounts(transactions)
    
    print("Calculating statistics...")
    stats = calculate_stats(transactions, products)
    
    print_report(stats, amount_errors)
