# 🔍 Console Diagnostic Commands - Copy and Paste These

## Step 1: Check What Data is Loaded

```javascript
// Copy this entire block and paste in console
console.log('='.repeat(60));
console.log('📊 STOCK DATA DIAGNOSTIC');
console.log('='.repeat(60));

// Check if stocks are loaded
if (window.stocks) {
  console.log('✅ Stocks loaded:', window.stocks.length);
  console.log('First stock:', window.stocks[0]);
  
  // Check what fields exist
  const firstStock = window.stocks[0];
  console.log('\\n📋 Available fields:');
  Object.keys(firstStock).forEach(key => {
    console.log(`  - ${key}: ${firstStock[key]}`);
  });
  
  // Check for missing data
  console.log('\\n❌ Missing fields:');
  const requiredFields = ['changePct', 'pe', 'roe', 'rating', 'consensus'];
  requiredFields.forEach(field => {
    if (!firstStock[field] && firstStock[field] !== 0) {
      console.log(`  - ${field}: MISSING`);
    }
  });
} else {
  console.log('❌ window.stocks is undefined');
}

console.log('='.repeat(60));
```

## Step 2: Test API Endpoint

```javascript
// Test if the comprehensive endpoint works
fetch('http://localhost:3002/api/stock/AAPL/comprehensive')
  .then(r => r.json())
  .then(data => {
    console.log('='.repeat(60));
    console.log('✅ API TEST SUCCESSFUL');
    console.log('='.repeat(60));
    console.log('Quote data:', data.quote);
    console.log('Fundamentals:', data.fundamentals);
    console.log('Analysts:', data.analysts);
    console.log('='.repeat(60));
  })
  .catch(err => {
    console.log('='.repeat(60));
    console.log('❌ API TEST FAILED');
    console.log('='.repeat(60));
    console.error('Error:', err);
    console.log('='.repeat(60));
  });
```

## Step 3: Check Network Calls

1. Open DevTools (F12)
2. Go to **Network** tab
3. Reload the page
4. Look for calls to:
   - `/api/quotes/batch`
   - `/api/stock/`
   - `financialmodelingprep.com`

**What to check:**

- Are there any API calls at all?
- What's the response status (200, 404, 500)?
- What data is being returned?

## Step 4: Check for Errors

```javascript
// Check console for errors
console.log('='.repeat(60));
console.log('🔍 CHECKING FOR ERRORS');
console.log('='.repeat(60));
console.log('Check the console above for any red error messages');
console.log('Common issues:');
console.log('  - CORS errors (blocked by browser)');
console.log('  - 404 errors (endpoint not found)');
console.log('  - 403 errors (API key issue)');
console.log('  - Network errors (server not running)');
console.log('='.repeat(60));
```

## Step 5: Force Refresh Data

```javascript
// Try to manually trigger a data refresh
if (typeof loadStocks === 'function') {
  console.log('🔄 Triggering manual stock load...');
  loadStocks();
} else if (typeof fetchStocks === 'function') {
  console.log('🔄 Triggering manual stock fetch...');
  fetchStocks();
} else {
  console.log('❌ No stock loading function found');
  console.log('Available functions:', Object.keys(window).filter(k => k.includes('stock') || k.includes('load')));
}
```

---

## 📊 Expected Output (If Working)

If everything is working, you should see:

```
✅ Stocks loaded: 708
First stock: {
  symbol: "AAPL",
  price: 175.50,
  changePct: 1.44,
  pe: 28.837,
  roe: 147.2,
  rating: "A+",
  ...
}
```

## ❌ Problem Indicators

If you see:

- `window.stocks is undefined` → Stocks not loading at all
- `changePct: undefined` → API not being called
- `pe: undefined` → Fundamentals not being fetched
- `rating: undefined` → Analyst data not being fetched

---

## 🚀 Next Steps

After running these diagnostics, share the output with me and I'll know exactly what to fix!

The most likely scenarios are:

1. **Frontend not calling API** → Need to update stock loading code
2. **API not returning data** → Need to check server logs
3. **Data not being mapped** → Need to update field mapping
4. **Server not running** → Need to restart proxy-server.js

Let me know what you find! 🔧
