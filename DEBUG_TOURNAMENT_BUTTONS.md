# Debugging Tournament Control Buttons

## The Issue
The Pause/Resume/Stop buttons are not showing in the Tournament Logs modal.

## How to Debug

### Step 1: Open Browser Console
1. Press F12 or right-click → Inspect
2. Go to the "Console" tab

### Step 2: Start a Tournament
1. Click "AI Tournament" from the sidebar
2. Click "Start AI Tournament" button
3. Watch the console for logs

### Step 3: Open Tournament Logs Modal
1. Click "Tournament Logs" button in the top navigation
2. Check the console for these debug messages:

```
📂 Opening Tournament Logs Modal
Current State: { tournamentRunning: true/false, tournamentPaused: true/false, marketStatus: {...} }

🔍 TournamentLogsModal Props: {
  tournamentRunning: true/false,
  tournamentPaused: true/false,
  marketStatus: {...},
  showPauseBtn: true/false,
  showResumeBtn: true/false,
  showStopBtn: true/false
}
```

### Step 4: Check Button Visibility Logic

**Pause Button shows when:**
- `tournamentRunning === true`
- `tournamentPaused === false`

**Resume Button shows when:**
- `tournamentPaused === true` OR
- `tournamentRunning === false`

**Stop Button shows when:**
- `tournamentRunning === true`

### Step 5: Verify Tournament State

In the console, type:
```javascript
// Check if tournament is actually running
fetch('http://localhost:3002/api/tournament/status/current')
  .then(r => r.json())
  .then(d => console.log('Tournament Status:', d));

// Check market status
fetch('http://localhost:3002/api/market/status')
  .then(r => r.json())
  .then(d => console.log('Market Status:', d));
```

## Common Issues

### Issue 1: Tournament Already Running Error
**Symptom:** Get 400 error "Tournament already running" when trying to start
**Solution:**
```bash
# Stop the running tournament
curl -X POST http://localhost:3002/api/tournament/stop
```

### Issue 2: tournamentRunning is False But Tournament is Running
**Cause:** State not synced between backend and frontend
**Solution:** The `loadMarketStatus()` function should update this every 30 seconds
**Check:**
```javascript
// In console, manually trigger state refresh
// This will show in React DevTools or you can add a global function
```

### Issue 3: Buttons Show But Do Nothing
**Check console for errors when clicking buttons**
Expected logs:
- Pause: `✅ Tournament paused`
- Resume: `✅ Tournament resumed`
- Stop: `✅ Tournament stopped`

## Expected Behavior

### When Tournament is Running (Not Paused)
- ✅ Green "Live" badge visible
- ✅ Yellow "Pause" button visible
- ✅ Red "Stop" button visible
- ❌ "Resume" button NOT visible

### When Tournament is Paused
- ✅ Yellow "Paused" badge visible
- ✅ Green "Resume" button visible (if market open) or Gray "Market Closed" (if market closed)
- ✅ Red "Stop" button visible
- ❌ "Pause" button NOT visible

### When No Tournament Running
- ❌ No status badges
- ✅ "Resume" button shows (but does nothing since there's no tournament)
- ❌ "Pause" and "Stop" buttons NOT visible

## Manual Test

To force the buttons to show for testing:

1. Open console
2. Type:
```javascript
// This will force the buttons to appear (temporary hack for testing)
React.render(
  React.createElement(TournamentLogsModal, {
    isOpen: true,
    onClose: () => console.log('close'),
    logs: [],
    trades: [],
    isLoading: false,
    tournamentRunning: true,  // FORCE TRUE
    tournamentPaused: false,  // FORCE FALSE
    marketStatus: { isOpen: true, currentTime: '10:00', dayOfWeek: 'Mon' },
    onPause: () => console.log('pause'),
    onResume: () => console.log('resume'),
    onStop: () => console.log('stop')
  }),
  document.body.appendChild(document.createElement('div'))
);
```

## Files to Check

1. **src/index.source.html** (line 19026-19150): Modal component
2. **src/index.source.html** (line 19635-19651): loadMarketStatus function
3. **src/index.source.html** (line 22669-22681): Modal invocation

## Backend Verification

Check if backend has correct state:

```bash
# Check tournament status
curl http://localhost:3002/api/tournament/status/current

# Check market status
curl http://localhost:3002/api/market/status

# Expected response when running:
{
  "status": "running",
  "experiment_id": "tournament_1234567890",
  "message": "Tournament is running in background"
}
```

## Next Steps if Still Not Working

1. Share the console output from Step 3
2. Share the response from the curl commands
3. Check if tournament actually started (look for .tournament_state.json file)
4. Hard refresh: Ctrl+Shift+R
5. Clear localStorage and restart
