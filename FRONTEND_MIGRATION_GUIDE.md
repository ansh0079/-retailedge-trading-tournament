# 🔄 Frontend Migration Guide - Remove Hardcoded API Keys

## ⚠️ Current Issue

Your frontend (`src/index_ultimate.html`) has hardcoded API keys around line 774:

```javascript
const API_KEYS = {
  FMP: 'h43nCTpMeyiIiNquebaqktc7ChUHMxIz',
  FINNHUB: 'd4fitqpr01qufc4upqn0d4fitqpr01qufc4upqng',
  // ... etc
}
```

**This is a security risk!** Anyone can view source and steal your API keys.

---

## ✅ Solution

All API calls now go through your secure backend. The backend handles API keys internally.

---

## 🔧 Required Changes

### Step 1: Remove API Keys from Frontend

**Find and DELETE** the entire `API_KEYS` object in `src/index_ultimate.html` (around line 774):

```javascript
// DELETE THIS ENTIRE BLOCK:
const API_KEYS = {
  FMP: 'h43nCTpMeyiIiNquebaqktc7ChUHMxIz',
  FINNHUB: 'd4fitqpr01qufc4upqn0d4fitqpr01qufc4upqng',
  POLYGON: 'jw1O1SBXYgDMTWrI77hV4ZN9_Y1j0ggf',
  INTRINIO: 'OjBmYmVhY2IyZTA3MTM2OWM4YjcwMWQwYzRlODk2NTBj',
  TIINGO: '404d2953727ee5736d7b2e0671596633d730a1dc',
  ALPHA_VANTAGE: 'KUR4BDPE2H6NJMHO',
  NEWS_API: '81a0be9978ed47c5a3d154aa0bc2feae',
  MARKETAUX: 'Eo8lyvncd3gFJVlVbTuZpKq2PQA3LeX2F1scj2XA'
};
```

### Step 2: Update API Calls

Replace all direct API calls with backend proxy calls.

#### Example 1: Stock Quote

**Before:**
```javascript
const response = await fetch(
  `https://financialmodelingprep.com/stable/quote?symbol=${symbol}&apikey=${API_KEYS.FMP}`
);
```

**After:**
```javascript
const response = await fetch(`${API_URL}/api/quote/${symbol}`);
```

#### Example 2: Historical Data

**Before:**
```javascript
const response = await fetch(
  `https://financialmodelingprep.com/stable/historical-chart/1hour?symbol=${symbol}&apikey=${API_KEYS.FMP}`
);
```

**After:**
```javascript
const response = await fetch(
  `${API_URL}/api/historical/${symbol}?timeframe=1hour`
);
```

#### Example 3: Company Profile

**Before:**
```javascript
const response = await fetch(
  `https://financialmodelingprep.com/stable/profile/${symbol}?apikey=${API_KEYS.FMP}`
);
```

**After:**
```javascript
const response = await fetch(`${API_URL}/api/profile/${symbol}`);
```

#### Example 4: Batch Quotes

**Before:**
```javascript
const response = await fetch(
  `https://financialmodelingprep.com/stable/quote?symbols=${symbols.join(',')}&apikey=${API_KEYS.FMP}`
);
```

**After:**
```javascript
const response = await fetch(`${API_URL}/api/quotes/batch`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ symbols })
});
```

#### Example 5: StockTwits (Already Proxied)

**Current (via localhost:3002):**
```javascript
const response = await fetch(`http://localhost:3002/api/stocktwits/${symbol}`);
```

**Keep this, but use API_URL:**
```javascript
const response = await fetch(`${API_URL}/api/stocktwits/${symbol}`);
```

#### Example 6: Claude AI

**Before:**
```javascript
const response = await fetch('http://localhost:3002/api/claude', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ messages })
});
```

**After (using API_URL):**
```javascript
const response = await fetch(`${API_URL}/api/claude`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ messages })
});
```

---

## 🔍 Search & Replace Patterns

Use these patterns to find all instances that need updating:

### Find:
```
https://financialmodelingprep.com/stable/quote?symbol=
```
### Replace with:
```
${API_URL}/api/quote/
```

### Find:
```
&apikey=${API_KEYS.FMP}
```
### Replace with:
```
(delete this part)
```

### Find:
```
?apikey=${API_KEYS.FMP}
```
### Replace with:
```
(delete this part)
```

---

## 📋 Complete Mapping Table

| Old FMP Endpoint | New Backend Endpoint |
|------------------|---------------------|
| `/quote?symbol=X&apikey=...` | `/api/quote/X` |
| `/profile/X?apikey=...` | `/api/profile/X` |
| `/ratios/X?apikey=...` | `/api/ratios/X` |
| `/income-statement/X?apikey=...` | `/api/financials/X` |
| `/balance-sheet-statement/X?apikey=...` | `/api/balance-sheet/X` |
| `/cash-flow-statement/X?apikey=...` | `/api/cash-flow/X` |
| `/earnings?symbol=X&apikey=...` | `/api/earnings/X` |
| `/historical-chart/1hour?symbol=X&apikey=...` | `/api/historical/X?timeframe=1hour` |
| `/technical-indicator/1hour?symbol=X&apikey=...` | `/api/technical/X?interval=1hour` |
| `/stock-news?symbol=X&apikey=...` | `/api/news/X` |
| `/search?query=X&apikey=...` | `/api/search?q=X` |
| `/stock-market/gainers?apikey=...` | `/api/market/gainers` |

---

## 🧪 Testing After Migration

### 1. Start Backend
```bash
npm install  # Install dotenv if needed
npm run tournament
```

### 2. Check Health
```bash
curl http://localhost:3002/health
```

Should return:
```json
{
  "status": "ok",
  "service": "AI Tournament Server",
  "activeTournaments": 0
}
```

### 3. Test API Key Status
```bash
curl http://localhost:3002/api/keys/status
```

Should show all your API keys are available.

### 4. Test Stock Quote
```bash
curl http://localhost:3002/api/quote/AAPL
```

Should return Apple stock data.

### 5. Open Frontend
```bash
npx http-server src -p 8080
```

Open browser console (F12) and check for errors.

---

## ⚡ Quick Migration Option

**Option A: Manual (Recommended for learning)**
- Search and replace as shown above
- Test each change
- Understand the new architecture

**Option B: Automated (Faster)**
I can create a script to automatically update your frontend file if you'd like.

---

## 🎯 Benefits After Migration

✅ **Secure** - No API keys in frontend code
✅ **Easier** - Simpler API calls
✅ **Faster** - Backend can cache responses
✅ **Reliable** - Backend handles failover between APIs
✅ **Deployable** - Safe to push to GitHub

---

## 📊 Migration Checklist

- [ ] Remove `API_KEYS` object from frontend
- [ ] Update all FMP API calls to use backend
- [ ] Update StockTwits calls to use `API_URL`
- [ ] Update Reddit calls to use `API_URL`
- [ ] Update Claude AI calls to use `API_URL`
- [ ] Test locally with backend running
- [ ] Check browser console for errors
- [ ] Verify all features work
- [ ] Deploy backend to Render
- [ ] Update frontend `API_URL` with production backend URL
- [ ] Deploy frontend

---

## 🆘 Need Help?

If you want me to:
1. **Automatically update the frontend** - I can do this for you
2. **Show specific examples** - Tell me which API calls you want to see
3. **Debug issues** - Share any errors you encounter

Just let me know!

---

**Ready to make your app secure? Let's do it! 🔒**
