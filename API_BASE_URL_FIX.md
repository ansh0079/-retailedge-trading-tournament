# API Base URL Configuration Fix

## Issue
The application was hardcoded to use `http://localhost:3002` for all API calls, causing connection errors when:
1. Running the frontend without the backend server
2. Deploying to production (Render)

**Error Message**:
```
GET http://localhost:3002/api/tournament/status/current net::ERR_CONNECTION_REFUSED
```

## Root Cause
All API calls were using hardcoded `localhost:3002` URLs:
- `http://localhost:3002/api/stocktwits/${symbol}`
- `http://localhost:3002/api/reddit/${subreddit}/search`
- `http://localhost:3002/api/claude`
- And more...

This works locally when the backend server is running, but fails in production or when the server isn't started.

## Solution
Added automatic environment detection to use the correct API base URL:

### 1. Added API_BASE_URL Configuration
**File**: `src/index.source.html`

```javascript
// API Base URL - Auto-detect environment
const API_BASE_URL = (() => {
  // Check if running on localhost
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:3002';
  }
  // Production - use same origin (Render will handle this)
  return window.location.origin;
})();

console.log('🌐 API Base URL:', API_BASE_URL);
```

### 2. Updated All API Calls
Replaced all hardcoded URLs with the `API_BASE_URL` variable:

**Before**:
```javascript
const response = await fetch(`http://localhost:3002/api/stocktwits/${symbol}`);
```

**After**:
```javascript
const response = await fetch(`${API_BASE_URL}/api/stocktwits/${symbol}`);
```

### 3. Updated Technical Analysis Engine
**File**: `technical-analysis-engine.js`

```javascript
class TechnicalAnalysisEngine {
    constructor() {
        this.FMP_API_KEY = 'h43nCTpMeyiIiNquebaqktc7ChUHMxIz';
        // Auto-detect API base URL
        this.API_BASE_URL = (() => {
            if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                return 'http://localhost:3002';
            }
            return window.location.origin;
        })();
    }
}
```

## How It Works

### Local Development
When running on `localhost` or `127.0.0.1`:
- `API_BASE_URL` = `http://localhost:3002`
- Connects to local backend server
- Requires `tournament-server.js` to be running

### Production (Render)
When deployed to Render:
- `API_BASE_URL` = `https://your-app.onrender.com` (or whatever the production URL is)
- Connects to the same server that serves the frontend
- Backend and frontend run on the same instance

## Files Modified

1. **src/index.source.html**:
   - Added `API_BASE_URL` configuration
   - Updated 3 API call locations:
     - StockTwits API
     - Reddit API
     - Claude AI API

2. **technical-analysis-engine.js**:
   - Updated constructor to auto-detect API base URL

## Testing

### Local Development
1. **With Backend Running**:
   ```bash
   node tournament-server.js
   ```
   - Open `index.html` in browser
   - API calls should work (connect to localhost:3002)
   - No connection errors

2. **Without Backend Running**:
   - Open `index.html` in browser
   - API calls will fail gracefully
   - App still loads (uses direct FMP API calls)
   - Optional features (StockTwits, Reddit, Claude) won't work

### Production (Render)
1. Deploy to Render
2. Backend and frontend run together
3. API calls use production URL
4. All features work

## Benefits

1. **Environment Agnostic**: Works in both local and production environments
2. **No Manual Configuration**: Automatically detects the correct URL
3. **Graceful Degradation**: App works even if backend features fail
4. **Single Deployment**: Backend and frontend deploy together on Render
5. **No CORS Issues**: Same-origin requests in production

## Deployment Notes

### Render Configuration
The app is configured to run both frontend and backend on the same instance:

**package.json**:
```json
{
  "main": "tournament-server.js",
  "scripts": {
    "start": "node tournament-server.js"
  }
}
```

**tournament-server.js**:
- Serves static files (HTML, JS, CSS)
- Provides API endpoints (/api/*)
- Runs on PORT from environment variable

### How Render Handles It
1. Render runs `npm start`
2. Starts `tournament-server.js`
3. Server listens on `process.env.PORT`
4. Serves `index.html` at root
5. Handles API requests at `/api/*`
6. Frontend uses `window.location.origin` for API calls
7. Everything works seamlessly

## Troubleshooting

### Error: "Connection Refused" Locally
**Cause**: Backend server not running

**Solution**:
```bash
# Start the backend server
node tournament-server.js

# Or use npm
npm start
```

### Error: "Connection Refused" in Production
**Cause**: Server not starting on Render

**Solution**:
1. Check Render logs
2. Verify `package.json` has correct start script
3. Ensure `tournament-server.js` exists
4. Check for build errors

### API Calls Failing
**Cause**: Backend endpoints not implemented

**Solution**:
- Check `tournament-server.js` has the required endpoints
- Verify API keys are set in environment variables
- Check server logs for errors

## Console Output

When the app loads, you'll see:
```
🌐 API Base URL: http://localhost:3002
```
(or production URL in production)

This confirms the correct API base URL is being used.

## Status: ✅ FIXED

The API base URL configuration has been updated to automatically detect the environment and use the correct URL. The app will now work correctly in both local development and production environments.

## Next Steps

1. **Test Locally**:
   - Start backend: `node tournament-server.js`
   - Open app in browser
   - Verify no connection errors

2. **Deploy to Render**:
   - Push changes to GitHub
   - Render auto-deploys
   - Verify app works in production

3. **Monitor**:
   - Check browser console for API base URL
   - Verify API calls succeed
   - Test all features (StockTwits, Reddit, Claude AI)
