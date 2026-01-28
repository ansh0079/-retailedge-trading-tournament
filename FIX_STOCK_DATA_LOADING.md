# Fix: Stock Data Not Loading from FMP

## Problem

The app is using hardcoded DEMO_STOCKS instead of fetching real stock data from the FMP API.

## Root Causes

1. **DEMO_STOCKS** is defined with mock data (lines 4680-4821 in index.source.html)
2. **FMP_API_KEY** is referenced in the frontend but not defined
3. The app should fetch data through the proxy server at `/api/quotes/batch`

## Solution

### Step 1: Define API Configuration

Add this near line 962 (after window.API_BASE_URL is set):

```javascript
// FMP API Configuration - Use proxy server, not direct API calls
window.FMP_API_KEY = ''; // Not needed - proxy handles this
window.USE_DEMO_DATA = false; // Disable demo mode

// Default stock symbols to load
window.DEFAULT_STOCK_SYMBOLS = [
  'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'TSLA', 'META', 'BRK.B', 'UNH', 'JPM',
  'V', 'PG', 'MA', 'HD', 'CVX', 'LLY', 'ABBV', 'MRK', 'AVGO', 'COST',
  'PEP', 'KO', 'ADBE', 'TMO', 'WMT', 'MCD', 'CSCO', 'ACN', 'ABT', 'CRM'
];
```

### Step 2: Replace DEMO_STOCKS Usage

Find where DEMO_STOCKS is used (around line 25193-25196) and replace:

```javascript
// OLD CODE:
const defaultSymbols = typeof DEMO_STOCKS !== 'undefined'
  ? DEMO_STOCKS.map(s => s.symbol)
  : ['AAPL', 'MSFT', 'GOOGL', 'NVDA', 'AMZN', 'TSLA', 'META', 'JPM', 'V', 'UNH'];

// NEW CODE:
const defaultSymbols = window.DEFAULT_STOCK_SYMBOLS || 
  ['AAPL', 'MSFT', 'GOOGL', 'NVDA', 'AMZN', 'TSLA', 'META', 'JPM', 'V', 'UNH'];
```

### Step 3: Fix FMP_API_KEY References

Replace all `FMP_API_KEY` references with proxy server calls.

For example, line 1130:

```javascript
// OLD:
const response = await fetch(`https://financialmodelingprep.com/stable/${endpoint}/${symbol}?apikey=${FMP_API_KEY}`);

// NEW:
const response = await fetch(`${window.API_BASE_URL}/api/quotes/batch`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ symbols: [symbol] })
});
```

### Step 4: Update Batch Fetching

The BatchAPIProcessor (line 3955) already uses the proxy correctly. Ensure all stock data loading uses this.

## Quick Fix Script

Run this to apply the fix automatically:
