# 🔄 Update Deployed Tournament with Stock Data Fix

## Current Status

- ✅ **Already deployed** to Render: `https://retailedge-trading-tournament-1.onrender.com`
- ✅ **UptimeRobot configured** - Keeps server alive 24/7
- ✅ **Stock data fix applied** locally
- ⚠️ **Need to push update** to Render

## Quick Update Steps

### Option 1: Push via GitHub (Recommended)

If your repository is already connected to Render:

1. **Open a NEW PowerShell window** (to load Git PATH)
2. **Navigate to project:**

   ```powershell
   cd "c:\Users\ansh0\Downloads\working version"
   ```

3. **Commit and push the fix:**

   ```powershell
   git add .
   git commit -m "Fix: Enable real FMP stock data loading (disable demo mode)"
   git push origin main
   ```

4. **Render auto-deploys** - Wait 5-10 minutes for deployment

### Option 2: Manual Deploy via Render Dashboard

1. Go to [dashboard.render.com](https://dashboard.render.com)
2. Find your service: **retailedge-proxy** or **retailedge-trading-tournament-1**
3. Click **"Manual Deploy"** → **"Deploy latest commit"**
4. Or click **"Clear build cache & deploy"** if you want a fresh build

### Option 3: GitHub Desktop (If Git CLI doesn't work)

1. Open **GitHub Desktop**
2. Select your repository
3. You'll see changes in `src/index.source.html`
4. Write commit message: "Fix: Enable real FMP stock data loading"
5. Click **"Commit to main"**
6. Click **"Push origin"**
7. Render auto-deploys

## What Changed (Summary for Deployment)

### Files Modified

1. **`src/index.source.html`** (2 changes)
   - Added API configuration (lines 970-987)
   - Removed DEMO_STOCKS dependency (lines 25202-25208)

2. **Built files updated:**
   - `dist/index.html` - Rebuilt with `npm run build:app`
   - `dist/app.js` - Contains transpiled React code

### Key Changes

```javascript
// BEFORE (using demo data):
const defaultSymbols = typeof DEMO_STOCKS !== 'undefined'
  ? DEMO_STOCKS.map(s => s.symbol)
  : ['AAPL', 'MSFT', ...];

// AFTER (using real FMP data):
window.USE_DEMO_DATA = false;
window.DEFAULT_STOCK_SYMBOLS = ['AAPL', 'MSFT', 'GOOGL', ...];
const defaultSymbols = window.DEFAULT_STOCK_SYMBOLS || [...];
```

## Verify Deployment

After pushing, verify the fix is live:

### 1. Check Render Logs

- Go to Render dashboard
- Click on your service
- View **"Logs"** tab
- Look for:

  ```
  ✅ API Configuration loaded
  Demo Mode: DISABLED
  📊 Loading 40 stocks from FMP API via proxy...
  ```

### 2. Test the Live App

Open: `https://retailedge-trading-tournament-1.onrender.com`

**You should see:**

- ✅ Real stock prices (not mock data)
- ✅ Live price changes
- ✅ Actual P/E ratios, ROE, etc.
- ✅ Console log: "Demo Mode: DISABLED"

### 3. Test API Endpoint

```bash
curl -X POST https://retailedge-trading-tournament-1.onrender.com/api/quotes/batch \
  -H "Content-Type: application/json" \
  -d '{"symbols":["AAPL","MSFT","GOOGL"]}'
```

Should return real stock data from FMP.

## UptimeRobot Configuration

Since you already have UptimeRobot set up, make sure it's monitoring:

**Monitor URL:** `https://retailedge-trading-tournament-1.onrender.com/health`
**Interval:** Every 5 minutes
**Monitor Type:** HTTP(s)

This prevents Render free tier from spinning down.

## Environment Variables (Verify in Render)

Make sure these are set in Render dashboard:

| Variable | Value | Status |
|----------|-------|--------|
| `FMP_API_KEY` | `h43nCTpMeyiIiNquebaqktc7ChUHMxIz` | ✅ Should be set |
| `ANTHROPIC_API_KEY` | `sk-ant-api03-...` | ✅ Should be set |
| `DEEPSEEK_API_KEY` | `sk-d9a6e65b55e243389a2a5bdf40840e72` | ✅ Should be set |
| `NODE_ENV` | `production` | ✅ Auto-set |
| `PORT` | Auto-assigned by Render | ✅ Auto-set |

## Troubleshooting

### If deployment fails

1. **Check Render build logs** for errors
2. **Verify package.json** has all dependencies
3. **Try "Clear build cache & deploy"**

### If stock data still doesn't load after deploy

1. **Check browser console** on live site
2. **Verify FMP_API_KEY** is set in Render environment variables
3. **Check Render logs** for API errors
4. **Test API directly** with curl command above

### If Git push fails

1. **Open NEW PowerShell** (to load Git PATH)
2. **Or use GitHub Desktop** instead
3. **Or manually upload** via GitHub web interface

## Next Steps

1. ✅ **Local fix complete** - Stock data loading from FMP
2. ⏳ **Push to GitHub** - Choose one of the 3 options above
3. ⏳ **Render auto-deploys** - Wait 5-10 minutes
4. ✅ **UptimeRobot keeps it alive** - Already configured
5. 🎉 **Tournament runs 24/7** with real stock data!

---

**Quick Command (if Git works in new terminal):**

```powershell
cd "c:\Users\ansh0\Downloads\working version"
git add .
git commit -m "Fix: Enable real FMP stock data loading"
git push origin main
```

Then check Render dashboard for deployment progress!
