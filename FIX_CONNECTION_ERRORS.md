# Fix Connection Errors - Quick Guide

## The Error You're Seeing

```
GET http://localhost:3002/api/tournament/results net::ERR_CONNECTION_REFUSED
```

## Why This Happens

You're viewing the app **locally** (opening `index.html` from your computer), but the backend server isn't running. The app is trying to connect to `localhost:3002` but nothing is listening on that port.

## Solution 1: Deploy to Render (RECOMMENDED)

This is the best solution because:
- ✅ Backend and frontend run together
- ✅ No connection errors
- ✅ Works 24/7
- ✅ Accessible from anywhere

### Deploy Now:

```bash
git add .
git commit -m "Fix PE/ROE/Rating + Add Technical Analysis + Fix API URLs"
git push origin main
```

Then:
1. Wait ~3 minutes for Render to deploy
2. Visit your Render URL (e.g., `https://your-app.onrender.com`)
3. Hard refresh: `Ctrl + Shift + R`
4. **No more connection errors!** ✅

## Solution 2: Run Backend Locally

If you want to test locally:

### Step 1: Start the Backend Server

```bash
node tournament-server.js
```

You should see:
```
🏆 AI TOURNAMENT SERVER
📡 Server running at http://localhost:3002
✅ Ready to run AI trading tournaments!
```

### Step 2: Open the App

Now open `index.html` in your browser. The connection errors will be gone because the server is running.

## Solution 3: Ignore the Errors (Temporary)

The connection errors are **non-critical**. The app will still work for viewing stocks, but these features won't work:
- ❌ AI Tournament logs
- ❌ Tournament leaderboard
- ❌ StockTwits sentiment (uses backend proxy)
- ❌ Reddit sentiment (uses backend proxy)
- ❌ Claude AI analysis (uses backend proxy)

But these features **will work**:
- ✅ Stock screener
- ✅ Stock data (PE, ROE, Rating)
- ✅ Fundamentals tab
- ✅ Technical Analysis tab
- ✅ Charts
- ✅ News
- ✅ Watchlist

## What's Happening

The app has two parts:

### Frontend (index.html)
- Runs in your browser
- Shows the UI
- Fetches stock data from FMP API directly

### Backend (tournament-server.js)
- Runs on a server (Render or your computer)
- Provides API proxy for CORS-restricted APIs
- Runs the AI tournament
- Serves the frontend files

When you open `index.html` locally without the backend running, the frontend works but can't connect to the backend for tournament features.

## Recommended Action

**Deploy to Render** so everything works together:

```bash
# One command to deploy everything
git add . && git commit -m "Complete deployment: PE/ROE/Rating + Technical Analysis" && git push origin main
```

After ~3 minutes:
1. Visit your Render URL
2. Hard refresh
3. Everything works! ✅

## Why Deploy is Better Than Local

| Feature | Local (without server) | Local (with server) | Render (deployed) |
|---------|----------------------|-------------------|------------------|
| Stock data | ✅ | ✅ | ✅ |
| PE/ROE/Rating | ✅ | ✅ | ✅ |
| Technical Analysis | ✅ | ✅ | ✅ |
| AI Tournament | ❌ | ✅ | ✅ |
| StockTwits | ❌ | ✅ | ✅ |
| Reddit | ❌ | ✅ | ✅ |
| Claude AI | ❌ | ✅ | ✅ |
| 24/7 Running | ❌ | ❌ | ✅ |
| Accessible anywhere | ❌ | ❌ | ✅ |
| No setup needed | ✅ | ❌ | ✅ |

## Quick Fix for Now

If you just want to test the PE/ROE/Rating fixes without deploying:

1. **Ignore the console errors** (they're harmless for now)
2. **Look at the stock table** - PE, ROE, Rating should show data
3. **Click on a stock** - Fundamentals and Technical Analysis should work
4. **Deploy later** when you're ready for full functionality

## Deploy Command (Copy & Paste)

```bash
git add . && git commit -m "Fix PE/ROE/Rating + Technical Analysis + API URLs" && git push origin main
```

That's it! Render will handle the rest. 🚀

---

**TL;DR**: The connection errors are because you're viewing locally without the backend server. Deploy to Render to fix them permanently, or start the backend locally with `node tournament-server.js`.
