# 🔄 Update Your Render Deployment

Your app is already deployed at: **https://retailedge-trading-tournament-1.onrender.com**

However, the latest changes (health endpoint, tournament controls, etc.) need to be pushed to update the deployment.

---

## ✅ Quick Update Process (2 minutes)

### Step 1: Commit Latest Changes

```bash
cd "C:\Users\ansh0\Downloads\working version"

# Add all modified files
git add .

# Commit with a descriptive message
git commit -m "Add health endpoint, tournament controls, and Render deployment config"

# Push to GitHub
git push
```

### Step 2: Render Auto-Deploys

- Render automatically detects the push to GitHub
- It will start building and deploying within 30-60 seconds
- Watch the deployment: https://dashboard.render.com/web/retailedge-trading-tournament-1

### Step 3: Verify Updates

After deployment completes (2-3 minutes), test these endpoints:

1. **Health Check** (NEW):
   ```
   https://retailedge-trading-tournament-1.onrender.com/api/health
   ```
   Should return:
   ```json
   {
     "status": "healthy",
     "timestamp": "2026-01-26T...",
     "marketStatus": {...},
     "tournamentRunning": false,
     "tournamentPaused": false
   }
   ```

2. **Market Status**:
   ```
   https://retailedge-trading-tournament-1.onrender.com/api/market/status
   ```

3. **Main App**:
   ```
   https://retailedge-trading-tournament-1.onrender.com
   ```

---

## 🎯 What's New in This Update

### Backend Updates (proxy-server.js):
- ✅ `/api/health` endpoint for Render health checks
- ✅ Tournament pause/resume/stop functionality
- ✅ Auto market hours detection
- ✅ Persistent tournament state across restarts

### Configuration Updates:
- ✅ `render.yaml` - Deployment configuration with disk persistence
- ✅ `.gitignore` - Excludes sensitive files and databases
- ✅ Health check path configured

### Documentation:
- ✅ `DEPLOY_TO_RENDER_NOW.md` - Step-by-step deployment checklist
- ✅ `RENDER_DEPLOYMENT_QUICK_START.md` - 10-minute quick start
- ✅ `RENDER_DEPLOYMENT_SUMMARY.md` - Technical summary

---

## ⚠️ CRITICAL: Set Environment Variable

After deployment, you MUST set your API key:

1. Go to: https://dashboard.render.com/web/retailedge-trading-tournament-1
2. Click "Environment" (left sidebar)
3. Add Environment Variable:
   ```
   Key: ANTHROPIC_API_KEY
   Value: sk-ant-... (your API key from https://console.anthropic.com)
   ```
4. Click "Save Changes"
5. Service will auto-redeploy with the API key

**Without this, tournaments will NOT start!**

---

## 🔍 Monitor Deployment Progress

### Via Render Dashboard:
1. Go to: https://dashboard.render.com/web/retailedge-trading-tournament-1
2. Click "Logs" tab
3. Watch the build and deployment process in real-time

### Build Process:
```
Building... (installing dependencies)
↓
Running npm install && npm run build
↓
Starting server with node proxy-server.js
↓
Health check on /api/health
↓
Deploy complete! ✅
```

### Expected Log Output:
```
========================================
  🚀 RetailEdge Pro Proxy Server
========================================
Server running on port 3002
API Endpoints:
  - StockTwits: http://localhost:3002/api/stocktwits/:symbol
  - Reddit: http://localhost:3002/api/reddit/:subreddit/search?q=:query
  - Tournament: http://localhost:3002/api/tournament/*
Ready to serve social sentiment data!
```

---

## 🎮 Test Tournament Functionality

Once deployed and API key is set:

1. **Visit Your App**:
   ```
   https://retailedge-trading-tournament-1.onrender.com
   ```

2. **Open Tournament Logs**:
   - Click "Tournament Logs" button in header (if tournament running)
   - Or look for the tournament tab/section

3. **Start Tournament**:
   - Click "Start Tournament" button
   - Wait 10-15 seconds (server might be sleeping - free tier)
   - Green pulsing indicator should appear
   - Logs should start streaming

4. **Test Controls**:
   - **Pause**: Should pause the tournament
   - **Resume**: Should resume (only during market hours 9:30 AM - 4:00 PM ET)
   - **Stop**: Should stop tournament and save results

---

## 🛠️ Troubleshooting

### Problem: Push fails with "remote: Permission denied"
**Solution**: Set up GitHub authentication
```bash
# Use GitHub CLI (easiest)
gh auth login

# Or use personal access token
git remote set-url origin https://YOUR_TOKEN@github.com/YOUR_USERNAME/YOUR_REPO.git
```

### Problem: Build fails on Render
**Solution**: Check Render logs
1. Dashboard → Your Service → Logs
2. Look for error messages in red
3. Common issues:
   - Missing dependencies in package.json
   - Syntax errors in code
   - Build command errors

### Problem: Health endpoint still returns 404 after deployment
**Solution**:
1. Verify deployment completed successfully (check dashboard)
2. Clear browser cache or use incognito mode
3. Check Render logs for startup errors
4. Verify proxy-server.js has the health endpoint (around line 30-52)

### Problem: "ANTHROPIC_API_KEY not set" in logs
**Solution**:
1. Dashboard → Environment → Add Variable
2. Key: `ANTHROPIC_API_KEY`
3. Value: Your API key from Anthropic
4. Save → Service will auto-redeploy

---

## 📊 Current Deployment Status

**Your Render Service**: https://dashboard.render.com/web/retailedge-trading-tournament-1

**Current Status**:
- ✅ Service is deployed and running
- ❌ Health endpoint not yet available (needs code push)
- ⚠️ Need to verify ANTHROPIC_API_KEY is set

**Next Steps**:
1. ✅ Commit and push latest changes (see Step 1 above)
2. ⏳ Wait for Render auto-deployment (2-3 min)
3. ⚠️ Set ANTHROPIC_API_KEY in environment variables
4. ✅ Test health endpoint and tournament functionality

---

## 🎉 After Successful Update

You'll have:
- ✅ Health monitoring endpoint for Render
- ✅ Tournament controls (pause/resume/stop)
- ✅ Auto market hours management
- ✅ Persistent tournament state
- ✅ 24/7 cloud operation
- ✅ Access from anywhere

**Your tournament can now run continuously in the cloud!**

---

## 📚 Need Help?

- **Render Documentation**: https://render.com/docs
- **GitHub Help**: https://docs.github.com
- **Deployment Guide**: Read `DEPLOY_TO_RENDER_NOW.md`
- **Tournament Controls**: Read `TOURNAMENT_CONTROLS.md`

---

**Ready to update? Run the commands in Step 1 above!** 🚀
