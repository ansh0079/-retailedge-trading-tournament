# 🚀 DEPLOY TO RENDER NOW - Tournament 24/7

## ⚠️ IMPORTANT: Your Local Server Stops When Laptop Closes

To run the tournament 24/7, you MUST deploy to Render. Here's how:

---

## 🎯 Quick Deploy - 3 Easy Steps

### Step 1: Commit Your Changes

**Option A: Using GitHub Desktop (Easiest)**

1. Open **GitHub Desktop**
2. You'll see these changed files:
   - `src/index.source.html` (demo mode disabled)
   - `proxy-server.js` (batch quote API fixed)
   - `dist/index.html` (rebuilt)
   - `dist/app.js` (rebuilt)
3. Write commit message: **"Fix: Enable real FMP data + correct batch API"**
4. Click **"Commit to main"**
5. Click **"Push origin"** (blue button at top)

**Option B: Using GitHub Web Interface**

1. Go to your repository on GitHub.com
2. Click **"Add file"** → **"Upload files"**
3. Drag these files:
   - `src/index.source.html`
   - `proxy-server.js`
   - `dist/index.html`
   - `dist/app.js`
4. Commit message: **"Fix: Enable real FMP data + correct batch API"**
5. Click **"Commit changes"**

**Option C: Open New PowerShell (Git will work)**

1. Close current PowerShell
2. Open **NEW** PowerShell window
3. Run:

   ```powershell
   cd "c:\Users\ansh0\Downloads\working version"
   git add .
   git commit -m "Fix: Enable real FMP data + correct batch API"
   git push origin main
   ```

---

### Step 2: Render Auto-Deploys

Once you push to GitHub:

- ✅ Render detects the changes automatically
- ✅ Starts building your app (5-10 minutes)
- ✅ Deploys to: `https://retailedge-trading-tournament-1.onrender.com`

**Monitor deployment:**

1. Go to [dashboard.render.com](https://dashboard.render.com)
2. Click on your service
3. Watch the **"Events"** tab for deployment progress

---

### Step 3: Verify It's Working

After deployment completes:

1. **Visit:** `https://retailedge-trading-tournament-1.onrender.com`
2. **Open Console** (F12)
3. **Check for:**
   - ✅ "Demo Mode: DISABLED"
   - ✅ "📊 Loading 40 stocks from FMP API via proxy..."
   - ✅ "✅ Batch quotes: Got X quotes"
   - ✅ Real stock prices displayed

4. **Check Render Logs:**
   - Go to Render dashboard
   - Click "Logs" tab
   - Look for: "✅ Batch quotes: Got 20 quotes"

---

## 🎉 After Deployment

### Your Tournament Will

- ✅ **Run 24/7** - Even when laptop is closed
- ✅ **Auto-restart** - If it crashes, Render restarts it
- ✅ **Stay alive** - UptimeRobot pings it every 5 minutes
- ✅ **Use real data** - FMP API via correct endpoint
- ✅ **Trade autonomously** - 4 AI teams competing

### Access From Anywhere

- 🌐 **Live App:** `https://retailedge-trading-tournament-1.onrender.com`
- 📊 **Leaderboard:** Check tournament standings
- 📈 **Trade History:** View all AI trades
- 💰 **Cost Tracking:** Monitor AI spending

---

## 📋 Files That Changed (Summary)

### 1. `src/index.source.html`

- Disabled demo mode: `window.USE_DEMO_DATA = false`
- Added 40 default stock symbols
- Removed DEMO_STOCKS dependency

### 2. `proxy-server.js`

- Fixed batch quote endpoint:
  - OLD: `/stable/quote/AAPL,MSFT`
  - NEW: `/stable/batch-quote?symbols=AAPL,MSFT`

### 3. `dist/index.html` & `dist/app.js`

- Rebuilt with `npm run build:app`
- Contains all fixes above

---

## 🐛 Troubleshooting

### If GitHub Desktop doesn't show changes

- Click **"Fetch origin"** to refresh
- Check you're in the right repository

### If Render doesn't auto-deploy

1. Go to Render dashboard
2. Click **"Manual Deploy"** → **"Deploy latest commit"**

### If deployment fails

1. Check Render logs for errors
2. Verify environment variables are set:
   - `FMP_API_KEY`
   - `ANTHROPIC_API_KEY`
   - `DEEPSEEK_API_KEY`

### If stock data still doesn't load

1. Clear browser cache
2. Hard refresh: `Ctrl + Shift + R`
3. Check Render logs for API errors

---

## ⏰ Timeline

- **Now:** Local server running (stops when laptop closes)
- **5 min:** Push changes to GitHub
- **10 min:** Render builds and deploys
- **15 min:** Tournament live 24/7! 🎉

---

## 🎯 DO THIS NOW

1. ✅ **Open GitHub Desktop** (or new PowerShell)
2. ✅ **Commit changes:** "Fix: Enable real FMP data + correct batch API"
3. ✅ **Push to GitHub**
4. ✅ **Wait for Render to deploy** (check dashboard)
5. ✅ **Verify at:** `https://retailedge-trading-tournament-1.onrender.com`

**Your tournament will then run 24/7 in the cloud!** 🚀
