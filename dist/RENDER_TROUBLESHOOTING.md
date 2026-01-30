# 🔧 Render Troubleshooting - 404 Error on /api/quotes/batch

## Current Status:
- ✅ Code is on GitHub (parent folder)
- ✅ tournament-server.js has /api/quotes/batch endpoint
- ✅ package.json configured correctly
- ❌ Getting 404 errors on Render

## Possible Causes:

### 1. Server Not Running
The Render service might have crashed or not started properly.

**Solution:**
1. Go to Render Dashboard
2. Click on your service
3. Check the **Logs** tab
4. Look for errors
5. Click **Manual Deploy** → **Deploy latest commit**

### 2. Wrong Start Command
Render might be using the wrong start command.

**Check:**
1. Go to Render Dashboard → Settings
2. Verify **Start Command** is: `npm start` or `node tournament-server.js`
3. Verify **Root Directory** is empty (uses repo root) or set to correct folder

### 3. Environment Variables Missing
The server needs FMP_API_KEY to work.

**Check:**
1. Go to Render Dashboard → Environment
2. Verify these are set:
   - `FMP_API_KEY`
   - `ANTHROPIC_API_KEY` (optional)
   - `DEEPSEEK_API_KEY` (optional)
   - `PORT` (should be auto-set by Render)

### 4. Build Failed
The deployment might have failed.

**Check:**
1. Go to Render Dashboard
2. Click on your service
3. Check **Events** tab
4. Look for "Deploy failed" or errors
5. If failed, check the build logs

## 🚀 Quick Fix Steps:

### Step 1: Check Render Logs
```
1. Open Render Dashboard
2. Click your service name
3. Click "Logs" tab
4. Look for:
   - "Server listening on port 3002" ✅ Good
   - Error messages ❌ Problem
   - No output ❌ Server not starting
```

### Step 2: Manual Redeploy
```
1. Go to your service in Render
2. Click "Manual Deploy"
3. Select "Deploy latest commit"
4. Wait 2-3 minutes
5. Check logs for "Server listening..."
```

### Step 3: Test the Endpoint
```
Open in browser:
https://retailedge-trading-tournament-1.onrender.com/api/health

Should return: Server status or health check response
If 404: Server isn't running properly
```

### Step 4: Verify Environment Variables
```
1. Render Dashboard → Environment tab
2. Make sure FMP_API_KEY is set
3. Click "Save Changes" if you add/modify any
4. Render will auto-redeploy
```

## 📊 Expected Render Logs:

When working correctly, you should see:
```
✅ API Service initialized
   FMP Key: h43nCTpMey...
   Claude Key: sk-ant-api...
✅ Tournament Manager initialized
Server listening on port 3002
```

## 🔍 Common Issues:

### Issue: "Cannot find module 'express'"
**Solution:** Render didn't run `npm install`
- Check Build Command is set to: `npm install`
- Or set to: `npm ci`

### Issue: "FMP_API_KEY not set"
**Solution:** Environment variable missing
- Add FMP_API_KEY in Render Environment tab
- Get key from your FMP account

### Issue: "Port already in use"
**Solution:** Multiple instances running
- Render should handle this automatically
- Try Manual Deploy → Clear build cache

### Issue: "Cannot POST /api/quotes/batch"
**Solution:** Express.json() middleware missing
- Already fixed in tournament-server.js
- Redeploy to get latest code

## ✅ Verification Checklist:

After fixing, verify these work:
- [ ] https://your-app.onrender.com (loads homepage)
- [ ] https://your-app.onrender.com/api/health (returns status)
- [ ] Stock data loads in the app
- [ ] No 404 errors in browser console
- [ ] Tournament indicator shows "Live"

## 🆘 If Still Not Working:

1. **Check Render Status Page**: https://status.render.com
2. **Restart the service**: Manual Deploy → Deploy latest commit
3. **Check logs carefully**: Look for the exact error message
4. **Verify package.json**: Make sure dependencies are listed
5. **Check Node version**: Render uses Node 16+ by default

## 📞 Next Steps:

1. Open Render Dashboard
2. Check the Logs tab
3. Look for error messages
4. Share the error here if you need help

---

**Most Common Fix:** Just click "Manual Deploy" in Render Dashboard!
