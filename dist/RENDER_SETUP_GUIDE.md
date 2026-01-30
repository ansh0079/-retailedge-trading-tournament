# 🚀 Render Deployment Setup Guide

## Current Status
✅ Server is running `tournament-server.js` correctly
❌ Environment variables NOT configured (causing 404 errors)

## The Problem
Your Render logs show:
```
WARNING: FMP_API_KEY not set - financial data will not work
WARNING: ANTHROPIC_API_KEY not set - AI analysis will not work
```

This is why all API endpoints return 404 errors - the server can't process requests without API keys.

## The Solution: Add Environment Variables in Render Dashboard

### Step 1: Open Render Dashboard
1. Go to https://dashboard.render.com
2. Click on your service: **retailedge-trading-tournament-1**
3. Click the **Environment** tab in the left sidebar

### Step 2: Add These Environment Variables

Click **Add Environment Variable** and add each of these:

#### Required Variables:

**Variable 1:**
- Key: `FMP_API_KEY`
- Value: `h43nCTpMeyiIiNquebaqktc7ChUHMxIz`

**Variable 2:**
- Key: `ANTHROPIC_API_KEY`
- Value: `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`

**Variable 3:**
- Key: `DEEPSEEK_API_KEY`
- Value: `sk-d9a6e65b55e243389a2a5bdf40840e72`

**Variable 4:**
- Key: `NODE_ENV`
- Value: `production`

### Step 3: Save and Deploy
1. Click **Save Changes** at the bottom
2. Render will automatically redeploy your service (takes ~2 minutes)
3. Wait for the deployment to complete

### Step 4: Verify It Works

Once deployed, test these endpoints in your browser:

1. **Health Check:**
   ```
   https://retailedge-trading-tournament-1.onrender.com/health
   ```
   Should return: `{"status":"ok","service":"AI Tournament Server","activeTournaments":0}`

2. **API Keys Status:**
   ```
   https://retailedge-trading-tournament-1.onrender.com/api/keys/status
   ```
   Should show all keys as configured

3. **Tournament Status:**
   ```
   https://retailedge-trading-tournament-1.onrender.com/api/tournament/status/current
   ```
   Should return: `{"status":"idle","message":"No active tournament running"}`

4. **Latest Results:**
   ```
   https://retailedge-trading-tournament-1.onrender.com/api/tournament/results
   ```
   Should return tournament results or empty array

## What Happens Next

After adding the environment variables:
- ✅ `/api/quotes/batch` will work (stock data)
- ✅ `/api/tournament/status/current` will work (tournament status)
- ✅ `/api/tournament/results` will work (tournament results)
- ✅ All AI analysis features will work
- ✅ Your frontend will load data correctly

## Troubleshooting

### If you still see 404 errors:
1. Check Render logs: Dashboard → Logs tab
2. Verify environment variables are saved: Dashboard → Environment tab
3. Force a manual deploy: Dashboard → Manual Deploy → Deploy latest commit

### If deployment fails:
1. Check the build logs for errors
2. Verify `package.json` has correct start command: `"start": "node tournament-server.js"`
3. Ensure all dependencies are in `package.json`

## Important Notes

- ⚠️ **Never commit `.env` file to Git** - it's already in `.gitignore`
- ✅ Environment variables in Render are secure and encrypted
- ✅ Render auto-deploys on every Git push (if auto-deploy is enabled)
- ✅ Your local `.env` file is separate from Render's environment variables

## Current Deployment URL
https://retailedge-trading-tournament-1.onrender.com

## Files Updated
- ✅ `tournament-server.js` - Added `/api/tournament/status/current` endpoint
- ✅ `package.json` - Correct start command
- ✅ All API routes configured correctly

## Next Steps After Configuration
1. Add environment variables in Render (see Step 2 above)
2. Wait for auto-deploy to complete
3. Test the endpoints (see Step 4 above)
4. Open your frontend app - everything should work!
