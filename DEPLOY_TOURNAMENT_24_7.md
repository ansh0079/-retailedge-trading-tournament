# 🚀 Deploy RetailEdge Tournament to Render (24/7 Online)

## Quick Deploy to Render

Your app is already configured for Render deployment. Follow these steps to get it running online 24/7:

### Step 1: Prepare for Deployment

1. **Ensure all changes are saved** ✅ (Already done)
2. **Build the app** ✅ (Already done - `npm run build:app`)
3. **Push to GitHub** (Required for Render)

### Step 2: Push to GitHub

```bash
# Initialize git if not already done
git init

# Add all files
git add .

# Commit changes
git commit -m "Fix: Enable real FMP stock data loading + tournament ready"

# Add your GitHub repository as remote
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# Push to GitHub
git push -u origin main
```

### Step 3: Deploy to Render

#### Option A: Using Render Dashboard (Easiest)

1. **Go to** [https://render.com](https://render.com)
2. **Sign in** with GitHub
3. **Click "New +"** → **"Web Service"**
4. **Connect your repository**
5. **Render will auto-detect** your `render.yaml` configuration
6. **Set Environment Variables:**
   - `FMP_API_KEY` = `h43nCTpMeyiIiNquebaqktc7ChUHMxIz`
   - `ANTHROPIC_API_KEY` = `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`
   - `DEEPSEEK_API_KEY` = `sk-d9a6e65b55e243389a2a5bdf40840e72`
   - `PORT` = `3002` (optional, Render sets this automatically)
7. **Click "Create Web Service"**
8. **Wait for deployment** (5-10 minutes)

#### Option B: Using Render Blueprint (Automated)

Render will automatically use your `render.yaml` file which contains:

```yaml
services:
  - type: web
    name: retailedge-proxy
    env: node
    buildCommand: npm install && npm run build
    startCommand: node proxy-server.js
```

### Step 4: Configure Environment Variables in Render

After creating the service, add these environment variables in the Render dashboard:

| Key | Value |
|-----|-------|
| `FMP_API_KEY` | `h43nCTpMeyiIiNquebaqktc7ChUHMxIz` |
| `ANTHROPIC_API_KEY` | `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` |
| `DEEPSEEK_API_KEY` | `sk-d9a6e65b55e243389a2a5bdf40840e72` |
| `NODE_ENV` | `production` |

### Step 5: Access Your Live App

Once deployed, Render will give you a URL like:

```
https://retailedge-proxy.onrender.com
```

Or your custom domain:

```
https://retailedge-trading-tournament-1.onrender.com
```

## 🎯 Tournament Will Run 24/7

Once deployed to Render:

- ✅ **Always online** - Even when your laptop is closed
- ✅ **Auto-restart** - If the server crashes, Render restarts it
- ✅ **Free tier available** - 750 hours/month free
- ✅ **Auto-deploy** - Push to GitHub → Auto-deploys
- ✅ **Environment variables** - Securely stored
- ✅ **Logs available** - View server logs in dashboard

## 📊 Tournament Features That Will Work

1. **AI Trading Tournament** - 4 teams trading autonomously
2. **Real-time stock data** - From FMP API
3. **AI analysis** - Using Claude/DeepSeek/Kimi
4. **Leaderboard** - Live rankings
5. **Trade history** - Persistent storage
6. **Cost tracking** - AI budget monitoring

## 🔧 Alternative: Deploy to Railway (Even Easier)

If you prefer Railway:

1. Go to [https://railway.app](https://railway.app)
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Railway auto-detects Node.js
5. Add environment variables (same as above)
6. Click "Deploy"

Railway advantages:

- Even simpler than Render
- $5 free credit/month
- Instant deployments
- Built-in database if needed

## 🐛 Troubleshooting

### If deployment fails

1. **Check build logs** in Render dashboard
2. **Verify package.json** has all dependencies
3. **Check Node version** (Render uses Node 18 by default)

### If tournament doesn't start

1. **Check server logs** in Render dashboard
2. **Verify environment variables** are set correctly
3. **Test API endpoint**: `https://your-app.onrender.com/health`

### If stock data doesn't load

1. **Verify FMP_API_KEY** is set in Render environment variables
2. **Check API quota** - FMP free tier has limits
3. **View logs** for API errors

## 📝 Important Notes

### Render Free Tier Limitations

- **Spins down after 15 min of inactivity** - First request after spin-down takes ~30 seconds
- **750 hours/month free** - Enough for continuous running
- **Upgrade to paid** ($7/month) for always-on service

### Keep Tournament Running

To prevent spin-down on free tier, you can:

1. **Upgrade to paid tier** ($7/month) - Recommended for 24/7 tournament
2. **Use a ping service** - [UptimeRobot](https://uptimerobot.com) pings your app every 5 minutes
3. **Self-ping** - Add cron job in your app to ping itself

## 🎉 Next Steps

1. **Push code to GitHub** (if not already done)
2. **Deploy to Render** using steps above
3. **Set environment variables** in Render dashboard
4. **Access your live app** at the Render URL
5. **Monitor tournament** - Check leaderboard and logs

Your tournament will now run 24/7 in the cloud! 🚀
