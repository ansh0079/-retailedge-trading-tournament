# 🔧 Application Troubleshooting Guide

## Quick Fixes

### 1. Application Not Loading / Blank Screen

**Try these in order:**

1. **Hard Refresh Browser**
   - Press `Ctrl + F5` (Windows) or `Cmd + Shift + R` (Mac)
   - This clears cache and reloads files

2. **Check Browser Console**
   - Press `F12` to open DevTools
   - Click "Console" tab
   - Look for red error messages
   - Copy any errors you see

3. **Check Network Tab**
   - In DevTools, click "Network" tab
   - Refresh the page
   - Look for files with red status (404, 500, etc.)
   - Check if `app.js`, `react.production.min.js` are loading

4. **Restart Server**
   ```bash
   # Stop current server (Ctrl+C)
   # Then restart:
   node proxy-server.js
   ```

### 2. JavaScript Errors

**Common errors and fixes:**

- **"React is not defined"**
  - Run: `node build/vendor.js`
  - Then rebuild: `npm run build`

- **"Cannot read property of undefined"**
  - Usually means API data is missing
  - Check API keys are set correctly
  - Check browser console for API errors

- **"Failed to fetch"**
  - Server might not be running
  - Check if port 3002 is available
  - Try: `http://localhost:3002`

### 3. API Errors (429, 401, 404)

**If you see API errors:**

- **429 (Rate Limited)**: Wait a few minutes, then refresh
- **401 (Unauthorized)**: API key expired or invalid
- **404 (Not Found)**: Endpoint doesn't exist (may be normal for some features)

### 4. Rebuild Application

If nothing works, rebuild from scratch:

```bash
# 1. Rebuild vendor files
node build/vendor.js

# 2. Rebuild application
npm run build

# 3. Restart server
node proxy-server.js
```

## How to Report Issues

Since I can't see screenshots directly, please describe:

1. **What you see:**
   - Blank screen?
   - Error message?
   - Partially loaded?
   - Wrong layout?

2. **Browser Console Errors:**
   - Press F12 → Console tab
   - Copy any red error messages

3. **What you were doing:**
   - Just opened the app?
   - After making changes?
   - After rebuild?

4. **Browser and URL:**
   - Which browser?
   - What URL are you on?
   - Is it `http://localhost:3002`?

## Common Issues

### Issue: "Application not loading"
**Solution:** Check if server is running, hard refresh browser

### Issue: "JavaScript errors in console"
**Solution:** Rebuild application with `npm run build`

### Issue: "API errors everywhere"
**Solution:** Check API keys, wait if rate limited

### Issue: "React errors"
**Solution:** Run `node build/vendor.js` then rebuild

## Quick Diagnostic Commands

```bash
# Check if server is running
Get-Process -Name node

# Check if files exist
Test-Path dist\app.js
Test-Path dist\vendor\react.production.min.js

# Rebuild everything
npm run build

# Restart server
node proxy-server.js
```
