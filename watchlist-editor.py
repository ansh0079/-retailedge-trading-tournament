#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Watchlist Editor for AI Trading Tournament
Edit and finalize your stock watchlist before running the tournament
"""

import os
import sys
from pathlib import Path

# Fix Windows console encoding
if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')

# Default watchlist from tournament
DEFAULT_WATCHLIST = [
    'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'NVDA', 'TSLA', 'AMD', 'INTC', 'AVGO',
    'ORCL', 'CRM', 'ADBE', 'CSCO', 'ACN', 'IBM', 'TXN', 'QCOM', 'AMAT', 'ADI',
    'JPM', 'BAC', 'WFC', 'GS', 'MS', 'C', 'USB', 'PNC', 'TFC', 'COF',
    'UNH', 'JNJ', 'PFE', 'ABT', 'TMO', 'MRK', 'LLY', 'ABBV', 'BMY', 'AMGN',
    'WMT', 'HD', 'NKE', 'MCD', 'SBUX', 'DIS', 'NFLX', 'CMCSA', 'COST', 'TGT',
    'BA', 'CAT', 'GE', 'MMM', 'HON', 'UNP', 'UPS', 'RTX', 'LMT', 'DE'
]

WATCHLIST_FILE = "tournament_watchlist.txt"

def load_watchlist():
    """Load watchlist from file or use default"""
    if Path(WATCHLIST_FILE).exists():
        with open(WATCHLIST_FILE, 'r') as f:
            return [line.strip().upper() for line in f if line.strip()]
    return DEFAULT_WATCHLIST.copy()

def save_watchlist(watchlist):
    """Save watchlist to file"""
    with open(WATCHLIST_FILE, 'w') as f:
        for symbol in watchlist:
            f.write(f"{symbol}\n")
    print(f"\n[OK] Watchlist saved to {WATCHLIST_FILE} ({len(watchlist)} stocks)")

def display_watchlist(watchlist):
    """Display current watchlist"""
    print("\n" + "="*60)
    print(f"CURRENT WATCHLIST ({len(watchlist)} stocks)")
    print("="*60)
    
    # Group by sector (simplified grouping)
    tech = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'NVDA', 'TSLA', 'AMD', 'INTC', 'AVGO', 
            'ORCL', 'CRM', 'ADBE', 'CSCO', 'ACN', 'IBM', 'TXN', 'QCOM', 'AMAT', 'ADI']
    finance = ['JPM', 'BAC', 'WFC', 'GS', 'MS', 'C', 'USB', 'PNC', 'TFC', 'COF']
    healthcare = ['UNH', 'JNJ', 'PFE', 'ABT', 'TMO', 'MRK', 'LLY', 'ABBV', 'BMY', 'AMGN']
    consumer = ['WMT', 'HD', 'NKE', 'MCD', 'SBUX', 'DIS', 'NFLX', 'CMCSA', 'COST', 'TGT']
    industrial = ['BA', 'CAT', 'GE', 'MMM', 'HON', 'UNP', 'UPS', 'RTX', 'LMT', 'DE']
    
    sectors = {
        'Technology': [s for s in watchlist if s in tech],
        'Finance': [s for s in watchlist if s in finance],
        'Healthcare': [s for s in watchlist if s in healthcare],
        'Consumer': [s for s in watchlist if s in consumer],
        'Industrial': [s for s in watchlist if s in industrial],
        'Other': [s for s in watchlist if s not in tech + finance + healthcare + consumer + industrial]
    }
    
    for sector, stocks in sectors.items():
        if stocks:
            print(f"\n{sector}:")
            # Print in columns
            for i in range(0, len(stocks), 10):
                print("  " + " ".join(f"{s:6}" for s in stocks[i:i+10]))
    
    print("\n" + "="*60)

def add_stock(watchlist):
    """Add a stock to watchlist"""
    symbol = input("\nEnter stock symbol to add (or 'cancel'): ").strip().upper()
    if symbol == 'CANCEL':
        return watchlist
    
    if not symbol:
        print("❌ Invalid symbol")
        return watchlist
    
    if symbol in watchlist:
        print(f"[WARNING] {symbol} is already in watchlist")
        return watchlist
    
    watchlist.append(symbol)
    print(f"[OK] Added {symbol}")
    return watchlist

def remove_stock(watchlist):
    """Remove a stock from watchlist"""
    symbol = input("\nEnter stock symbol to remove (or 'cancel'): ").strip().upper()
    if symbol == 'CANCEL':
        return watchlist
    
    if symbol in watchlist:
        watchlist.remove(symbol)
        print(f"[OK] Removed {symbol}")
    else:
        print(f"[ERROR] {symbol} not found in watchlist")
    
    return watchlist

def clear_watchlist():
    """Clear entire watchlist"""
    confirm = input("\n[WARNING] Clear entire watchlist? (yes/no): ").strip().lower()
    if confirm == 'yes':
        return []
    return None

def reset_to_default():
    """Reset to default watchlist"""
    confirm = input("\n[WARNING] Reset to default watchlist? (yes/no): ").strip().lower()
    if confirm == 'yes':
        return DEFAULT_WATCHLIST.copy()
    return None

def main():
    """Main watchlist editor"""
    print("\n" + "="*60)
    print("AI TRADING TOURNAMENT - WATCHLIST EDITOR")
    print("="*60)
    
    watchlist = load_watchlist()
    
    while True:
        display_watchlist(watchlist)
        
        print("\nOptions:")
        print("  1. Add stock")
        print("  2. Remove stock")
        print("  3. Clear all")
        print("  4. Reset to default")
        print("  5. Save and exit")
        print("  6. Exit without saving")
        
        choice = input("\nEnter choice (1-6): ").strip()
        
        if choice == '1':
            watchlist = add_stock(watchlist)
        elif choice == '2':
            watchlist = remove_stock(watchlist)
        elif choice == '3':
            result = clear_watchlist()
            if result is not None:
                watchlist = result
        elif choice == '4':
            result = reset_to_default()
            if result is not None:
                watchlist = result
        elif choice == '5':
            save_watchlist(watchlist)
            print("\n[OK] Watchlist finalized!")
            print(f"\nTo use this watchlist, run:")
            print(f"  python deepseek_python_20260119_ac400a.py --watchlist {WATCHLIST_FILE}")
            break
        elif choice == '6':
            print("\n[WARNING] Exiting without saving changes")
            break
        else:
            print("[ERROR] Invalid choice")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n[WARNING] Exiting...")
        sys.exit(0)
