# 🚀 Quick Start: Deploy to Render.com

**Goal**: Get your AI Tournament running in the cloud in 10 minutes so it runs 24/7 without your computer.

---

## ✅ What You Need

1. **GitHub Account** - Free at https://github.com
2. **Render Account** - Free at https://render.com
3. **Anthropic API Key** - Get at https://console.anthropic.com (REQUIRED)

---

## 📦 Step 1: Push to GitHub (3 minutes)

```bash
cd "C:\Users\ansh0\Downloads\working version"

# Initialize git
git init

# Add all files
git add .

# Commit
git commit -m "Deploy RetailEdge Pro to Render"

# Create new repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

---

## 🌐 Step 2: Deploy to Render (5 minutes)

### Option A: Use render.yaml (Recommended - Fastest)

1. Go to https://dashboard.render.com
2. Click **"New +" → "Blueprint"**
3. Connect your GitHub repository
4. Render will automatically detect `render.yaml` and configure everything
5. **Set Environment Variables**:
   - Click on the created service
   - Go to "Environment" tab
   - Add: `ANTHROPIC_API_KEY` = `your-api-key-here`
6. Click "Deploy"

### Option B: Manual Setup

1. Go to https://dashboard.render.com
2. Click **"New +" → "Web Service"**
3. Connect your GitHub repository
4. Configure:
   ```
   Name: retailedge-proxy
   Runtime: Node
   Build Command: npm install && npm run build
   Start Command: node proxy-server.js
   ```
5. **Environment Variables** (click "Advanced"):
   ```
   NODE_ENV = production
   PORT = 3002
   ANTHROPIC_API_KEY = your-api-key-here
   ```
6. **Persistent Disk**:
   - Name: `tournament-data`
   - Mount Path: `/opt/render/project/src`
   - Size: 1 GB
7. Select **Free Plan**
8. Click **"Create Web Service"**

---

## ✅ Step 3: Test It (2 minutes)

1. Wait for deployment to complete (you'll see "Live" status)
2. Copy your Render URL: `https://retailedge-proxy-xxxx.onrender.com`
3. Test health endpoint: Visit `https://your-url.onrender.com/api/health`

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2026-01-26T...",
  "marketStatus": {...},
  "tournamentRunning": false
}
```

4. Visit your app: `https://your-url.onrender.com`
5. Click **"Tournament Logs"** button in header
6. Click **"Start Tournament"** and watch it run!

---

## 🎉 Done!

Your tournament is now running in the cloud 24/7!

### What Happens Now:

- ✅ Tournament runs continuously on Render's servers
- ✅ Auto-pauses at 4:00 PM ET (market close)
- ✅ Auto-resumes at 9:30 AM ET (market open)
- ✅ You can close your computer - tournament keeps running
- ✅ Access from anywhere with the Render URL
- ✅ Persistent database saves all trades and results

### Tournament Controls:

- **Green Pulsing Indicator**: Shows tournament is running
- **Tournament Logs Button**: Opens modal with live logs/trades
- **Pause Button**: Temporarily pause the tournament
- **Resume Button**: Resume a paused tournament
- **Stop Button**: End the tournament permanently

---

## ⚠️ Important Notes

### Free Tier Sleep Issue:
Render free tier services sleep after 15 minutes of inactivity. To keep your tournament running:

1. Sign up at https://uptimerobot.com (free)
2. Add a monitor:
   - Type: HTTP(s)
   - URL: `https://your-render-url.onrender.com/api/health`
   - Interval: Every 5 minutes
3. This will ping your service and keep it awake

### API Key Security:
- NEVER commit your `ANTHROPIC_API_KEY` to GitHub
- Always set it in Render's Environment Variables (it's encrypted there)
- The app checks for the key and warns if missing

### Market Hours:
- Tournament only trades during US market hours: 9:30 AM - 4:00 PM ET (Mon-Fri)
- Outside these hours, tournament auto-pauses
- This is by design to prevent trading when markets are closed

---

## 🔧 Troubleshooting

### "Tournament won't start"
- Check Render logs: Dashboard → Your Service → Logs
- Verify `ANTHROPIC_API_KEY` is set in Environment Variables
- Ensure market hours are active (9:30 AM - 4:00 PM ET, weekdays)

### "Can't see the app"
- Make sure service status shows "Live" (not "Build in progress")
- Try the `/api/health` endpoint first to verify server is responding
- Check browser console (F12) for errors

### "Buttons don't appear"
- Make sure tournament is actually started (check `/api/market/status`)
- Open Tournament Logs modal - buttons should appear there
- Check console for state debugging logs

---

## 📚 Next Steps

- Read full guide: `DEPLOYMENT_GUIDE_RENDER.md`
- Tournament controls: `TOURNAMENT_CONTROLS.md`
- Local testing: `START_APP.md`

**Need help?** Check Render docs: https://render.com/docs

---

**Your AI Tournament is now running 24/7 in the cloud! 🎊**
