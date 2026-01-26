# Fixes Applied

## Issue 1: AI Tournament Showing Only a Few Companies

**Problem:** The AI Tournament was only showing stocks that had been successfully fetched, not the full list from localStorage.

**Root Cause:**
- The tournament was prioritizing the `stocks` prop (successfully fetched stocks)
- Many stocks failed to fetch due to using company names (BOEING, CHEVRON) instead of ticker symbols (BA, CVX)
- This resulted in only showing the handful of stocks that successfully loaded

**Solution:**
- Changed tournament to **prioritize `curatedStocks` from localStorage** (the full list)
- Enriches symbols with fetched data if available
- Now shows all stocks in your list, not just the ones that loaded

**Location:** `src/index.source.html` lines 10224-10267

---

## Issue 2: Tournament Crashes When Tab is Closed

**Problem:** The application would crash when closing the AI Tournament modal.

**Root Cause:**
- EventSource connections weren't being cleaned up properly
- No error handling around `close()` operations
- Optional chaining (`?.`) doesn't prevent errors if the object itself throws

**Solution:**
- Added proper `try-catch` blocks around all EventSource cleanup
- Added explicit null checks before calling `.close()`
- Applied fix to three locations:
  1. `handleClose()` function
  2. `useEffect` cleanup
  3. `connectToSSE()` function

**Locations:**
- `src/index.source.html` lines 10369-10388
- `src/index.source.html` lines 10415-10435
- `src/index.source.html` lines 10446-10463

---

## Issue 3: Company Names Being Imported as Symbols

**Problem:** When importing watchlists, company names like "BOEING", "CHEVRON" were being accepted as valid ticker symbols.

**Root Cause:**
- The regex filter `/^[A-Z]+$/` accepts any all-caps string
- Length check was too permissive (<=10 characters)
- Company names passed validation

**Solution:**
- **Reduced max length from 10 to 5 characters** (tickers are typically 1-5 chars)
- **Added company name → ticker mapping** for 30+ common companies:
  - BOEING → BA
  - CHEVRON → CVX
  - CITIGROUP → C
  - JPMORGAN → JPM
  - And many more...
- Import now automatically converts company names to proper tickers

**Location:** `src/index.source.html` lines 17894-17959

---

## Issue 4: pollIntervalRef is not defined

**Problem:** When exiting the AI Tournament modal, the application crashed with "ReferenceError: pollIntervalRef is not defined".

**Root Cause:**
- The `pollIntervalRef` variable was used throughout the tournament component for polling status
- However, it was never declared with `useRef()` at the top of the component
- This caused a crash when trying to clear the interval on component unmount

**Solution:**
- Added missing declaration: `const pollIntervalRef = useRef(null);`
- Placed it right after `eventSourceRef` declaration
- Now the polling interval can be properly created and cleaned up

**Location:** `src/index.source.html` line 10222 (added)

---

## Issue 5: Start AI Tournament Button Not Responding

**Problem:** Clicking the "Start AI Tournament" button appeared to do nothing - no tournament would start.

**Root Cause:**
- Backend API returns `experiment_id` (snake_case) in response
- Frontend was expecting `data.experimentId` (camelCase)
- This caused `undefined` to be passed to `setExperimentId()` and `connectToSSE()`
- Tournament appeared to do nothing because the experiment ID was never set

**Solution:**
- Added comprehensive debug logging throughout `startTournament()` function:
  - Log when button is clicked
  - Log API request/response details
  - Log experiment ID extraction
  - Log errors with full details
- Fixed experiment ID extraction to handle both formats:
  ```javascript
  const expId = data.experiment_id || data.experimentId;
  ```
- This ensures compatibility with backend's snake_case format

**Location:** `src/index.source.html` lines 10283-10320

**Debug Output:**
When the button is clicked, you should now see in the browser console:
- `🎯 Start Tournament button clicked`
- `📋 Setting tournament status to running...`
- `📊 Tournament symbols count: X`
- `🌐 Sending POST request to /api/tournament/start...`
- `📡 Response status: 200`
- `📦 Response data: {...}`
- `🆔 Experiment ID: tournament_XXXXX`

---

## Issue 6: Incorrect Team Names in Frontend

**Problem:** The frontend displayed incorrect AI model names for tournament teams, not matching the Python backend configuration.

**Root Cause:**
- Frontend showed: Team Beta (GPT-4-Turbo) and Team Gamma (DeepSeek-V3)
- Backend actually uses: Team 2 = DeepSeek-V3, Team 3 = Kimi AI
- GPT-4-Turbo is not used in this tournament at all
- The team names were outdated from an earlier version

**Solution:**
- Updated `getTeamName()` function to match Python backend teams:
  - Team 1: Team Alpha (Claude-3-Sonnet) ✓ correct
  - Team 2: Team Beta (DeepSeek-V3) - FIXED (was GPT-4-Turbo)
  - Team 3: Team Gamma (Kimi AI) - FIXED (was DeepSeek-V3)
  - Team 4: Team Delta (Gemini-Pro) ✓ correct

**Location:** `src/index.source.html` line 10422-10424

**Backend Reference:**
- Python file: `ultimate_trading_tournament.py`
- Team 2: AI_Team_DeepSeek (line 1185-1192)
- Team 3: AI_Team_Kimi (line 1252-1266)

---

## Issue 7: Tournament Already Running Error (400)

**Problem:** When clicking "Start AI Tournament" button, getting error: `{"error":"Tournament already running"}` with 400 status.

**Root Cause:**
- A Python tournament process was still running from a previous session
- The backend checks if `tournamentProcess` exists before starting a new one
- If a tournament crashed or was never properly stopped, the process reference persists
- This prevents new tournaments from starting until the old one is stopped

**Solution:**
Stop the running tournament process using the API:
```bash
curl -X POST http://localhost:3002/api/tournament/stop
```

Or restart the proxy server:
```bash
# Stop server (Ctrl+C)
# Start server again
node proxy-server.js
```

**Prevention:**
- The tournament backend runs as a detached process (intentionally)
- Always properly stop tournaments before closing the application
- If you encounter this error, use the stop endpoint before starting a new tournament

**API Endpoints:**
- Start: `POST /api/tournament/start`
- Stop: `POST /api/tournament/stop`
- Status: `GET /api/tournament/status/:experimentId`

---

## Build Process

After making changes to `src/index.source.html`, the application was rebuilt using:

```bash
node build/build.js
```

This compiles the React/Babel code into `dist/app.js` and creates the production `dist/index.html`.

---

## Issue 8: SSE Endpoints Missing (404 Errors)

**Problem:** After successfully starting a tournament, the frontend received 404 errors when trying to connect to SSE (Server-Sent Events) endpoints for live updates:
- `GET /api/tournament/sse/leaderboard/:experimentId` - 404
- `GET /api/tournament/sse/logs/:experimentId` - 404

**Root Cause:**
- Frontend `connectToSSE()` function expected real-time SSE endpoints for leaderboard and logs
- These endpoints were never implemented in proxy-server.js
- Tournament would start successfully but provide no live updates to the UI
- Users couldn't see tournament progress, leaderboard changes, or logs

**Solution:**
Implemented two SSE endpoints in proxy-server.js:

1. **Leaderboard SSE Endpoint** (`/api/tournament/sse/leaderboard/:experimentId`):
   - Polls `ultimate_tournament.db` every 2 seconds
   - Queries teams table filtered by experiment_id
   - Streams leaderboard updates (team rankings, returns, trades, cash, holdings)
   - Returns data in format: `{leaderboard: [{team_id, name, return, trades, cash, holdings}]}`

2. **Logs SSE Endpoint** (`/api/tournament/sse/logs/:experimentId`):
   - Polls `ultimate_tournament.db` every 1 second
   - Queries logs table for new entries (id > lastLogId)
   - Streams new log messages as they're created
   - Returns data in format: `{message, type, timestamp}`
   - Tracks last log ID to only send new logs

**Additional Fix:**
- Updated `/api/tournament/results` endpoint to use correct database name (`ultimate_tournament.db` instead of `tournament.db`)

**Implementation Details:**
- Both endpoints use read-only database connections
- Automatic cleanup on client disconnect (clears polling intervals)
- Gracefully handles missing database (tournament not started yet)
- Console logging for SSE connection/disconnection events

**Location:** `proxy-server.js` lines 473-621 (inserted before existing results endpoint)

**Testing:**
After restarting proxy-server.js:
1. Start a tournament - should get 200 response with experiment_id
2. SSE connections should succeed (no 404 errors)
3. Leaderboard should update every 2 seconds with team standings
4. Logs should stream in real-time as tournament progresses

---

## Testing Checklist

- [x] Build completes successfully
- [x] AI Tournament shows full stock list from localStorage
- [x] Tournament can be closed without errors
- [x] Imported watchlists with company names convert to tickers
- [x] All stocks load properly with valid ticker symbols
- [ ] SSE endpoints return 200 (not 404) after tournament start
- [ ] Leaderboard updates in real-time during tournament
- [ ] Logs stream to UI as tournament progresses

---

## Notes

- If localStorage contains invalid symbols (company names), you may need to clear it:
  - Open browser console (F12)
  - Run: `localStorage.removeItem('curatedStocks')`
  - Refresh the page
  - The app will repopulate with the default 949+ stock list

- The watchlist importer now handles these formats:
  - Ticker symbols: `AAPL, MSFT, GOOGL`
  - Company names: `APPLE, MICROSOFT, GOOGLE` (auto-converts)
  - Mixed: `AAPL, MICROSOFT, NVDA, TESLA`
