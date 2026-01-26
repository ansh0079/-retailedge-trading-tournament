# 🚀 DEPLOY TO RENDER NOW - Step-by-Step Checklist

Follow these steps EXACTLY to deploy your AI Tournament to the cloud in 10 minutes.

---

## ✅ PRE-DEPLOYMENT CHECKLIST

### 1. Get Your API Key ⚠️ REQUIRED
- [ ] Go to https://console.anthropic.com
- [ ] Sign in or create account
- [ ] Click "Get API Keys"
- [ ] Copy your API key (starts with `sk-ant-...`)
- [ ] **Save it somewhere safe** - you'll need it in Step 2

### 2. Verify Files Are Ready
- [ ] File exists: `render.yaml` ✅ (already created)
- [ ] File exists: `proxy-server.js` ✅ (already created)
- [ ] File exists: `.gitignore` ✅ (already created)
- [ ] Health check endpoint exists in proxy-server.js ✅ (already added)

---

## 📦 STEP 1: PUSH TO GITHUB (3 minutes)

### Option A: If you DON'T have a GitHub repo yet

```bash
# 1. Open Command Prompt or Terminal
cd "C:\Users\ansh0\Downloads\working version"

# 2. Initialize git (if not already done)
git init

# 3. Add all files
git add .

# 4. Commit
git commit -m "Deploy RetailEdge Pro AI Tournament to Render"

# 5. Go to GitHub.com and create a NEW repository
#    - Click the "+" icon → "New repository"
#    - Name it: retailedge-pro (or any name you want)
#    - Make it PRIVATE (recommended for API keys safety)
#    - DON'T initialize with README
#    - Click "Create repository"

# 6. Copy the commands GitHub shows you, they'll look like:
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git branch -M main
git push -u origin main
```

### Option B: If you ALREADY have a GitHub repo

```bash
cd "C:\Users\ansh0\Downloads\working version"
git add .
git commit -m "Add Render deployment configuration"
git push
```

**Checkpoint**: Visit your GitHub repo URL - you should see all your files there.

---

## 🌐 STEP 2: DEPLOY TO RENDER (5 minutes)

### A. Create Render Account (if needed)
- [ ] Go to https://render.com
- [ ] Click "Get Started for Free"
- [ ] Sign up with GitHub (easiest - it'll auto-connect)

### B. Deploy Your Service

#### Method 1: Blueprint (Easiest - render.yaml does everything)

1. **Go to Dashboard**
   - [ ] Visit https://dashboard.render.com

2. **Create New Blueprint**
   - [ ] Click "New +" button (top right)
   - [ ] Select "Blueprint"

3. **Connect Repository**
   - [ ] Select your GitHub repository
   - [ ] Click "Connect"
   - [ ] Render will detect `render.yaml` automatically

4. **Review Configuration**
   - [ ] Service name: `retailedge-proxy` ✅
   - [ ] Build command: `npm install && npm run build` ✅
   - [ ] Start command: `node proxy-server.js` ✅

5. **Add Environment Variables** ⚠️ CRITICAL
   - [ ] Click on the service that was created
   - [ ] Go to "Environment" tab (left sidebar)
   - [ ] Click "Add Environment Variable"
   - [ ] Add:
     ```
     Key: ANTHROPIC_API_KEY
     Value: sk-ant-... (paste your API key from Pre-deployment step 1)
     ```
   - [ ] Click "Save Changes"

6. **Verify Disk is Configured**
   - [ ] Go to "Disk" tab (left sidebar)
   - [ ] Should show: `tournament-data` mounted at `/opt/render/project/src` ✅
   - [ ] If NOT there, click "Add Disk" and configure:
     - Name: `tournament-data`
     - Mount Path: `/opt/render/project/src`
     - Size: 1 GB

7. **Deploy**
   - [ ] Click "Create Resources" or "Deploy"
   - [ ] Wait 2-3 minutes (watch the logs)

---

## ✅ STEP 3: VERIFY DEPLOYMENT (2 minutes)

### A. Check Service Status
- [ ] In Render dashboard, service should show "Live" (green indicator)
- [ ] Copy your service URL: `https://retailedge-proxy-XXXXX.onrender.com`

### B. Test Health Endpoint
- [ ] Open new browser tab
- [ ] Visit: `https://YOUR-RENDER-URL.onrender.com/api/health`
- [ ] You should see JSON response like:
```json
{
  "status": "healthy",
  "timestamp": "2026-01-26T...",
  "marketStatus": {...},
  "tournamentRunning": false,
  "tournamentPaused": false
}
```

### C. Test the App
- [ ] Visit: `https://YOUR-RENDER-URL.onrender.com`
- [ ] You should see the RetailEdge Pro interface
- [ ] Click "Tournament Logs" button in header
- [ ] Modal should open with "Start Tournament" button

### D. Start a Tournament!
- [ ] In the Tournament Logs modal, click "Start Tournament"
- [ ] Wait a few seconds
- [ ] You should see:
   - Green pulsing "Tournament Running" indicator in header
   - Logs appearing in the modal
   - Trades appearing in the Trades tab
- [ ] **SUCCESS!** 🎉

---

## 🔧 STEP 4: KEEP IT AWAKE (Optional but Recommended)

Render free tier sleeps after 15 minutes of inactivity. To prevent this:

### A. Set Up UptimeRobot
1. **Create Account**
   - [ ] Go to https://uptimerobot.com
   - [ ] Sign up for free account

2. **Add Monitor**
   - [ ] Click "Add New Monitor"
   - [ ] Monitor Type: `HTTP(s)`
   - [ ] Friendly Name: `RetailEdge Pro Health`
   - [ ] URL: `https://YOUR-RENDER-URL.onrender.com/api/health`
   - [ ] Monitoring Interval: `5 minutes`
   - [ ] Click "Create Monitor"

3. **Verify**
   - [ ] Monitor should show "Up" status
   - [ ] This will ping your service every 5 minutes and keep it awake

---

## 🎯 WHAT HAPPENS NOW

### Your Tournament is Cloud-Hosted! 🎊

- ✅ **Runs 24/7** - Even when your computer is off
- ✅ **Auto Market Hours** - Pauses at 4 PM ET, resumes at 9:30 AM ET
- ✅ **Persistent Data** - All trades saved to database on persistent disk
- ✅ **Access Anywhere** - Visit your Render URL from any device
- ✅ **Real-time Updates** - Live logs and trades stream automatically

### Tournament Controls Available

1. **Green Indicator** - Shows when tournament is running
2. **Tournament Logs Button** - Opens control panel
3. **Pause** - Temporarily pause trading
4. **Resume** - Continue after pause
5. **Stop** - End tournament (results saved)

### How to Access

- **Your App**: `https://YOUR-RENDER-URL.onrender.com`
- **Health Check**: `https://YOUR-RENDER-URL.onrender.com/api/health`
- **Market Status**: `https://YOUR-RENDER-URL.onrender.com/api/market/status`
- **Render Dashboard**: https://dashboard.render.com (to view logs, manage service)

---

## ❓ TROUBLESHOOTING

### Problem: Service shows "Deploy failed"
**Solution**:
1. Check Render logs: Dashboard → Your Service → Logs
2. Look for error messages
3. Common issues:
   - Missing dependencies → Check package.json
   - Build errors → Try running `npm install && npm run build` locally first

### Problem: Health endpoint returns 404
**Solution**:
1. Check proxy-server.js has the health endpoint (should be around line 30)
2. Redeploy: Dashboard → Manual Deploy → Deploy Latest Commit

### Problem: Tournament won't start
**Solution**:
1. **Check API Key**: Environment → Verify `ANTHROPIC_API_KEY` is set correctly
2. **Check Market Hours**: Tournament only runs 9:30 AM - 4:00 PM ET, Mon-Fri
3. **Check Logs**: Dashboard → Logs → Look for errors
4. **Browser Console**: Press F12 → Console tab → Look for error messages

### Problem: App loads but looks broken (no styles)
**Solution**:
1. Check build ran successfully: Logs should show `npm run build` completed
2. Check dist/ folder was created during build
3. Redeploy if needed

### Problem: "ANTHROPIC_API_KEY not set" warning
**Solution**:
1. Dashboard → Environment → Add `ANTHROPIC_API_KEY`
2. Value should be your Anthropic API key (starts with `sk-ant-`)
3. Click "Save Changes"
4. Service will auto-redeploy

---

## 📚 ADDITIONAL RESOURCES

- **Quick Start**: `RENDER_DEPLOYMENT_QUICK_START.md`
- **Full Guide**: `DEPLOYMENT_GUIDE_RENDER.md`
- **Deployment Summary**: `RENDER_DEPLOYMENT_SUMMARY.md`
- **Tournament Controls**: `TOURNAMENT_CONTROLS.md`
- **Local Development**: `START_APP.md`

---

## ✅ FINAL CHECKLIST

Before you celebrate:
- [ ] Service is "Live" in Render dashboard
- [ ] Health endpoint responds with 200 OK
- [ ] App loads at Render URL
- [ ] Tournament can start successfully
- [ ] Green indicator appears when running
- [ ] Logs appear in Tournament Logs modal
- [ ] UptimeRobot is monitoring (optional but recommended)

---

## 🎉 CONGRATULATIONS!

Your AI Trading Tournament is now running in the cloud!

**You can now**:
- Close your computer
- Access the app from anywhere
- Let tournaments run for days/weeks
- Monitor from your phone
- Share the URL with others

**The tournament will**:
- Run continuously on Render
- Auto-pause at market close (4 PM ET)
- Auto-resume at market open (9:30 AM ET)
- Save all trades to persistent database
- Keep running until you stop it

---

**Enjoy your cloud-hosted AI Trading Tournament! 🚀📈🤖**
