# 🚀 AI Tournament Deployment Guide - Render

This guide will help you deploy your AI Trading Tournament to Render.com (100% free tier available).

## 📋 Prerequisites

- GitHub account
- Render account (sign up at https://render.com - it's free!)
- Your code pushed to a GitHub repository

---

## 🎯 Quick Start (5 minutes)

### Step 1: Push Code to GitHub

```bash
cd "C:\Users\ansh0\Downloads\working version"

# Initialize git if not already done
git init

# Add all files
git add .

# Commit
git commit -m "Ready for deployment"

# Add your GitHub remote (replace with your repo URL)
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git

# Push to GitHub
git push -u origin main
```

### Step 2: Deploy Backend to Render

1. **Go to Render Dashboard**: https://dashboard.render.com/

2. **Click "New +" → "Web Service"**

3. **Connect GitHub Repository**:
   - Select your repository
   - Click "Connect"

4. **Configure the Service**:
   ```
   Name: retailedge-proxy
   Region: Oregon (US West) - or closest to you
   Branch: main
   Root Directory: (leave blank)
   Runtime: Node
   Build Command: npm install && npm run build
   Start Command: node proxy-server.js
   ```

5. **Add Environment Variables**:
   - Click "Advanced" to expand environment variables
   - Add the following:
     - `NODE_ENV` = `production`
     - `PORT` = `3002`
     - `ANTHROPIC_API_KEY` = `your-api-key-here` (REQUIRED - get from https://console.anthropic.com)

6. **Enable Disk Persistence** (IMPORTANT):
   - Scroll down to "Persistent Disk"
   - Click "Add Disk"
   - Name: `tournament-data`
   - Mount Path: `/opt/render/project/src`
   - Size: 1 GB (free tier)
   - This ensures your tournament database persists between restarts

7. **Select Free Plan**:
   - Click "Free" plan
   - Click "Create Web Service"

8. **Wait for Deployment** (2-3 minutes):
   - You'll see logs showing the build process
   - Once complete, you'll get a URL like: `https://retailedge-proxy-xxxx.onrender.com`

9. **Test Your Backend**:
   - Open: `https://your-backend-url.onrender.com/api/health`
   - You should see:
   ```json
   {
     "status": "healthy",
     "timestamp": "2026-01-26T...",
     "marketStatus": { "isOpen": false, "currentTime": "...", "dayOfWeek": "..." },
     "tournamentRunning": false,
     "tournamentPaused": false
   }
   ```

### Step 3: Update Frontend

1. **Copy your Render backend URL** (from Step 2)

2. **Edit `src/index_ultimate.html`**:
   - Find this line (around line 630):
   ```javascript
   const API_URL = window.location.hostname === 'localhost'
     ? 'http://localhost:3002'
     : (window.TOURNAMENT_API_URL || 'https://your-backend.onrender.com');
   ```

   - Replace `'https://your-backend.onrender.com'` with your actual Render URL:
   ```javascript
   const API_URL = window.location.hostname === 'localhost'
     ? 'http://localhost:3002'
     : (window.TOURNAMENT_API_URL || 'https://ai-tournament-backend-xxxx.onrender.com');
   ```

3. **Commit and push changes**:
   ```bash
   git add src/index_ultimate.html
   git commit -m "Update backend URL"
   git push
   ```

### Step 4: Deploy Frontend

You have two options:

#### Option A: Netlify (Recommended - Easier)

1. **Go to Netlify**: https://app.netlify.com/

2. **Click "Add new site" → "Import an existing project"**

3. **Connect to GitHub** and select your repository

4. **Configure Build Settings**:
   ```
   Base directory: src
   Build command: (leave blank)
   Publish directory: src
   ```

5. **Deploy**:
   - Click "Deploy site"
   - Wait 1-2 minutes
   - You'll get a URL like: `https://your-app-name.netlify.app`

6. **Set Environment Variable** (Optional):
   - Site settings → Environment variables
   - Add: `TOURNAMENT_API_URL` = `https://your-render-backend-url.onrender.com`

#### Option B: Render Static Site

1. **Go to Render Dashboard**: https://dashboard.render.com/

2. **Click "New +" → "Static Site"**

3. **Connect Repository** and configure:
   ```
   Name: ai-tournament-frontend
   Branch: main
   Root Directory: src
   Build Command: (leave blank)
   Publish Directory: src
   ```

4. **Add Environment Variable**:
   - Click "Environment" tab
   - Add: `TOURNAMENT_API_URL` = `https://your-backend-url.onrender.com`

5. **Create Static Site**

---

## 🎉 You're Done!

Your AI Tournament is now live! Visit your frontend URL to use it.

**Important Notes:**

- **ANTHROPIC_API_KEY Required**:
  - The tournament WILL NOT START without this API key
  - Get yours at https://console.anthropic.com
  - Add it in Render dashboard → Environment → Environment Variables

- **Free Tier Limitations**:
  - Backend may sleep after 15 minutes of inactivity (takes 30-60 seconds to wake up)
  - 750 hours/month of runtime (enough for most use cases)
  - Use UptimeRobot (free) to ping `/api/health` every 5 minutes to keep it awake

- **Testing**:
  - Visit your frontend URL
  - Click "Tournament Logs" button in header
  - Click "Start Tournament"
  - Watch it run live with real-time logs!

- **Persistence**:
  - Tournaments continue running even if you close your computer
  - Results saved to persistent disk (survives restarts)
  - Auto-pauses at 4:00 PM ET, auto-resumes at 9:30 AM ET
  - You can manually pause/resume/stop tournaments

- **Tournament Controls**:
  - Green pulsing indicator shows when tournament is running
  - Click "Tournament Logs" to see live trades and logs
  - Use Pause/Resume/Stop buttons in the modal
  - Tournament automatically respects US market hours (9:30 AM - 4:00 PM ET)

---

## 🔧 Troubleshooting

### Backend won't start
- Check Render logs: Dashboard → Your Service → Logs
- Ensure all dependencies are in package.json
- Verify Start Command is: `npm start`

### Frontend can't connect to backend
- Check the API_URL in index_ultimate.html matches your Render backend URL
- Verify backend /health endpoint returns OK
- Check browser console for CORS errors

### Tournament doesn't start
- Open browser DevTools (F12) → Console
- Look for error messages
- Verify backend is awake (visit /health endpoint)

---

## 🚀 Advanced: Custom Domain

### For Netlify:
1. Go to Site Settings → Domain Management
2. Add custom domain
3. Follow DNS setup instructions

### For Render:
1. Go to your service → Settings → Custom Domain
2. Add your domain
3. Configure DNS records

---

## 📊 Monitoring

### Check Backend Health:
```
https://your-backend.onrender.com/health
```

### View Tournament Status:
```
GET https://your-backend.onrender.com/api/tournament/status/{experimentId}
```

### Get All Results:
```
GET https://your-backend.onrender.com/api/tournament/results
```

---

## 💡 Tips

1. **Keep Backend Awake**:
   - Use a service like UptimeRobot (free) to ping your backend every 5 minutes
   - Add your /health endpoint to prevent sleeping

2. **Development**:
   - Keep testing locally with `npm run tournament`
   - Push changes to GitHub
   - Render will auto-deploy on every push

3. **Cost**:
   - Everything described here uses FREE tiers
   - No credit card required
   - Perfect for personal projects and demos

---

## 🎯 Next Steps

- ✅ Tournament is deployed and running
- 📱 Share your frontend URL with others
- 🏆 Run multi-day tournaments
- 📊 Analyze results from anywhere
- 🔄 Pause/resume as needed

**Need Help?** Check the Render documentation: https://render.com/docs

---

**Congratulations! Your AI Tournament is now running in the cloud! 🎉**
