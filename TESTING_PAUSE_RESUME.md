# 🎯 Testing Pause/Resume Buttons

## ✅ What Was Implemented

### Features
- **Market Hours Control** - Auto-pause/resume during US market hours (9:30 AM - 4:00 PM ET)
- **Manual Controls** - Pause/Resume/Stop buttons
- **Market Status Display** - Shows if market is open/closed
- **Tournament Status** - Shows Live/Paused indicators

### Button Visibility Logic

**Pause Button** (Yellow):
- Shows when: Tournament is running AND not paused
- Action: Pauses the tournament

**Resume Button** (Green/Gray):
- Shows when: Tournament is paused OR not running
- Green: When market is open
- Gray/Disabled: When market is closed
- Action: Resumes tournament (only works during market hours)

**Stop Button** (Red):
- Shows when: Tournament is running
- Action: Fully stops tournament (cannot resume)

## 🧪 How to Test

### Step 1: Start a Tournament
1. Go to http://localhost:3002
2. Click **"AI Tournament"** button (top right)
3. Click **"Start Tournament"**
4. Wait for it to start successfully

### Step 2: Check Tournament Running Indicator
1. Look at the top of the page
2. You should see green pulsing dot with **"Tournament Running"**
3. Click **"Tournament Logs"** button (purple)

### Step 3: Verify Buttons in Modal
Inside the Tournament Logs modal header, you should see:
- **Market Status badge** (Market Open/Closed with ET time)
- **Tournament Status badge** (Live or Paused)
- **Pause button** (if running)
- **Stop button** (if running)

### Step 4: Test Pause
1. Click **"Pause"** button
2. Status should change to **"Paused"**
3. **"Resume"** button should appear
4. If market is closed, resume button will be gray/disabled

### Step 5: Test Resume
1. Click **"Resume"** button (only works during market hours)
2. Status should change back to **"Live"**
3. **"Pause"** button should reappear

## ⚠️ Common Issues

### Issue: No buttons visible
**Cause:** `tournamentRunning` state is false
**Fix:** Check console for tournament status

### Issue: Cannot see Tournament Logs button
**Cause:** Browser cache
**Fix:** Clear cache (Ctrl+Shift+Delete) or use incognito

### Issue: Resume button is gray
**Cause:** Market is closed
**Solution:** This is correct behavior! Tournament only runs during US market hours

## 📊 Check Backend Status

### Check if tournament is running:
```bash
curl http://localhost:3002/api/tournament/status/current
```

### Check market status:
```bash
curl http://localhost:3002/api/market/status
```

Should return:
```json
{
  "isOpen": true/false,
  "currentTime": "14:30",
  "dayOfWeek": "Mon",
  "timezone": "America/New_York",
  "marketHours": "9:30 AM - 4:00 PM ET",
  "tournamentPaused": false,
  "tournamentRunning": true/false
}
```

## 🔍 Debugging in Browser

Open console (F12) and check:
```javascript
// Check state
console.log('Tournament Running:', tournamentRunning);
console.log('Tournament Paused:', tournamentPaused);
console.log('Market Status:', marketStatus);

// Force reload market status
fetch('http://localhost:3002/api/market/status')
  .then(r => r.json())
  .then(console.log);
```

## ✅ Expected Behavior

1. **During Market Hours (9:30 AM - 4:00 PM ET Mon-Fri):**
   - Can start tournament
   - Can pause/resume manually
   - Tournament auto-resumes if paused

2. **Outside Market Hours:**
   - Can start tournament (it will start paused)
   - Cannot resume (button disabled)
   - Tournament auto-pauses
   - Will auto-resume when market opens

## 📝 Notes

- All data/trades are preserved when paused
- Tournament process runs independently
- State persists across server restarts
- Market hours check runs every minute

---

**If buttons still don't show, start a tournament first and then open the logs modal!**
