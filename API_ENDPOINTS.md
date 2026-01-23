# 🔒 Secure Backend API Endpoints

All API keys are now stored securely on the backend. The frontend should NEVER include API keys.

## 📍 Base URL

- **Local**: `http://localhost:3002`
- **Production**: `https://your-backend.onrender.com`

Use the `API_URL` variable in the frontend (already configured).

---

## 📊 Stock Data Endpoints

### Get Stock Quote
```
GET /api/quote/:symbol

Example: /api/quote/AAPL

Response:
[{
  "symbol": "AAPL",
  "price": 178.23,
  "change": 2.15,
  "changesPercentage": 1.22,
  "dayHigh": 179.50,
  "dayLow": 176.80,
  "open": 177.00,
  "previousClose": 176.08
}]
```

### Get Batch Quotes
```
POST /api/quotes/batch
Body: { "symbols": ["AAPL", "MSFT", "GOOGL"] }

Response: Array of quote objects
```

### Get Historical Data
```
GET /api/historical/:symbol?timeframe=1min

Timeframes: 1min, 5min, 15min, 30min, 1hour, 4hour

Example: /api/historical/AAPL?timeframe=1hour
```

---

## 🏢 Company Fundamentals

### Company Profile
```
GET /api/profile/:symbol

Example: /api/profile/AAPL

Response: {
  "symbol": "AAPL",
  "companyName": "Apple Inc.",
  "sector": "Technology",
  "industry": "Consumer Electronics",
  "description": "...",
  "ceo": "Tim Cook",
  "website": "https://www.apple.com",
  ...
}
```

### Financial Ratios
```
GET /api/ratios/:symbol

Example: /api/ratios/AAPL
```

### Income Statement
```
GET /api/financials/:symbol?period=annual

Periods: annual, quarter

Example: /api/financials/AAPL?period=annual
```

### Balance Sheet
```
GET /api/balance-sheet/:symbol?period=annual

Example: /api/balance-sheet/AAPL?period=annual
```

### Cash Flow
```
GET /api/cash-flow/:symbol?period=annual

Example: /api/cash-flow/AAPL?period=annual
```

### Earnings Data
```
GET /api/earnings/:symbol

Example: /api/earnings/AAPL
```

---

## 📈 Technical Analysis

### Technical Indicators
```
GET /api/technical/:symbol?interval=1hour

Intervals: 1min, 5min, 15min, 30min, 1hour, 4hour, daily

Example: /api/technical/AAPL?interval=1hour
```

---

## 📰 News & Sentiment

### Stock News
```
GET /api/news/:symbol?limit=10

Example: /api/news/AAPL?limit=20
```

### StockTwits Sentiment
```
GET /api/stocktwits/:symbol

Example: /api/stocktwits/AAPL

Response: {
  "messages": [...],
  "sentiment": {...}
}
```

### Reddit Sentiment
```
GET /api/reddit/:subreddit/search?q=AAPL

Subreddits: wallstreetbets, stocks, investing, etc.

Example: /api/reddit/wallstreetbets/search?q=AAPL
```

---

## 🔍 Search & Discovery

### Symbol Search
```
GET /api/search?q=apple

Example: /api/search?q=tesla

Response: [{
  "symbol": "TSLA",
  "name": "Tesla, Inc.",
  "currency": "USD",
  "stockExchange": "NASDAQ"
}, ...]
```

---

## 📊 Market Overview

### Market Indexes
```
GET /api/market/indexes

Returns: S&P 500, DOW, NASDAQ, Russell 2000
```

### Market Gainers/Losers
```
GET /api/market/:type

Types: gainers, losers, actives

Example: /api/market/gainers
```

---

## 🤖 AI Services

### Claude AI
```
POST /api/claude
Body: {
  "messages": [
    { "role": "user", "content": "Analyze AAPL stock" }
  ],
  "options": {
    "model": "claude-3-5-sonnet-20241022",
    "max_tokens": 4096
  }
}
```

---

## 🏆 Tournament Endpoints

### Start Tournament
```
POST /api/tournament/start
Body: {
  "days": 30,
  "teams": [1, 2, 3],
  "watchlist": ["AAPL", "MSFT"],
  "simulationSpeed": 2000
}
```

### Get Tournament Status
```
GET /api/tournament/status/:experimentId
```

### Get Tournament Results
```
GET /api/tournament/results
```

### Pause Tournament
```
POST /api/tournament/pause/:experimentId
```

### Resume Tournament
```
POST /api/tournament/resume/:experimentId
```

### Extend Tournament
```
POST /api/tournament/extend/:experimentId
Body: { "additionalDays": 10 }
```

### Adjust Speed
```
POST /api/tournament/speed/:experimentId
Body: { "speedMs": 1000 }
```

---

## 🔧 Utility Endpoints

### Health Check
```
GET /health

Response: {
  "status": "ok",
  "service": "AI Tournament Server",
  "activeTournaments": 0
}
```

### API Keys Status
```
GET /api/keys/status

Response: {
  "valid": true,
  "missing": [],
  "available": ["FMP", "FINNHUB", "ANTHROPIC", ...]
}
```

---

## 🛠️ Frontend Migration Guide

### Before (Insecure - API key exposed):
```javascript
const response = await fetch(
  `https://financialmodelingprep.com/stable/quote?symbol=AAPL&apikey=YOUR_KEY_HERE`
);
```

### After (Secure - API key on backend):
```javascript
const response = await fetch(`${API_URL}/api/quote/AAPL`);
```

---

## 🔒 Security Benefits

✅ **API Keys Hidden** - Never exposed to browser/network
✅ **Rate Limiting** - Controlled on backend
✅ **CORS Protection** - Proper origin checking
✅ **Error Handling** - Consistent error responses
✅ **Monitoring** - Server-side logging
✅ **Caching** - Optional response caching
✅ **Failover** - Automatic fallback to backup APIs

---

## 📝 Example Frontend Usage

```javascript
// Use the API_URL variable (already configured in your frontend)

// Get stock quote
const quote = await fetch(`${API_URL}/api/quote/AAPL`)
  .then(r => r.json());

// Get batch quotes
const quotes = await fetch(`${API_URL}/api/quotes/batch`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ symbols: ['AAPL', 'MSFT', 'GOOGL'] })
}).then(r => r.json());

// Get company profile
const profile = await fetch(`${API_URL}/api/profile/AAPL`)
  .then(r => r.json());

// Get news
const news = await fetch(`${API_URL}/api/news/AAPL?limit=10`)
  .then(r => r.json());

// Call Claude AI
const analysis = await fetch(`${API_URL}/api/claude`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    messages: [{ role: 'user', content: 'Analyze AAPL' }]
  })
}).then(r => r.json());
```

---

## 🚀 Next Steps

1. ✅ Backend API service created (`api-service.js`)
2. ✅ All endpoints added to `tournament-server.js`
3. ✅ API keys moved to `.env` file
4. ⏳ Update frontend to use these endpoints
5. ⏳ Test locally
6. ⏳ Deploy to Render

---

**All API keys are now secure! 🔒**
