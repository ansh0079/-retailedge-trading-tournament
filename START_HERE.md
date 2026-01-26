# 🚀 Quick Start Guide

## Current Status

✅ Tournament server is **RUNNING** at http://localhost:3002
✅ Application is **READY** to use

## How to Access the Application

### Step 1: Open the HTML File

**Open in your browser:**
```
C:\Users\ansh0\Downloads\working version\index.html
```

**Ways to open:**
1. **Double-click** `index.html` in File Explorer
2. **Right-click** → Open with → Your browser (Chrome/Edge/Firefox)
3. **Drag and drop** `index.html` into an open browser window

### Step 2: Navigate to Tournament Tab

1. Once the app loads, you'll see several tabs at the top
2. Click on the **"🏆 Tournament"** or **"Leaderboard"** tab
3. You should see the tournament configuration panel

### Step 3: What You Should See

```
┌─────────────────────────────────────────────┐
│  🏆 AI Trading Tournament                   │
│                                             │
│  Tournament Configuration                   │
│  ┌──────────────────────────────────────┐  │
│  │ Days: [30] (max 90)                   │  │
│  │ Speed: [Normal (2s)]                  │  │
│  │ Teams: ☑️ 1 ☑️ 2 ☑️ 3 ☑️ 4          │  │
│  │                                       │  │
│  │ [🎮 Start Tournament]                │  │
│  └──────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

## Quick Test

1. **Set duration**: 30 days (default)
2. **Set speed**: Normal (2s per day)
3. **Select teams**: All 4 teams checked
4. **Click** "Start Tournament"
5. **Watch** the tournament run!

You should see:
- Day counter updating (Day 1/30, Day 2/30, etc.)
- Logs appearing in real-time
- Control buttons (Pause, +10 Days, Speed controls)

## Troubleshooting

### Problem: "Application not loading" or blank page

**Solution 1: Check Console**
1. Press `F12` to open Developer Tools
2. Click "Console" tab
3. Look for any red errors
4. Share the errors if you see any

**Solution 2: Try Different Browser**
- Chrome: Usually works best
- Edge: Should work fine
- Firefox: Should work fine
- Safari: May have issues

**Solution 3: Hard Refresh**
- Windows: `Ctrl + Shift + R`
- Mac: `Cmd + Shift + R`

### Problem: "Failed to connect to server"

**Check if server is running:**
```bash
# In command prompt/terminal:
cd "C:\Users\ansh0\Downloads\working version"
curl http://localhost:3002/health
```

**Should return:**
```json
{"status":"ok","service":"AI Tournament Server","activeTournaments":0}
```

**If server is NOT running:**
```bash
cd "C:\Users\ansh0\Downloads\working version"
node tournament-server.js
```

You should see:
```
🏆 ═══════════════════════════════════════════════════════════
🏆  AI TOURNAMENT SERVER
🏆 ═══════════════════════════════════════════════════════════

📡 Server running at http://localhost:3002
✅ Ready to run AI trading tournaments!
```

### Problem: Can't find index.html

**File location:**
```
C:\Users\ansh0\Downloads\working version\index.html
```

**Alternative location:**
```
C:\Users\ansh0\Downloads\working version\src\index_ultimate.html
```

Both files should work!

## Features Available

### ✅ 30-90 Day Tournaments
- Default: 30 days
- Maximum: 90 days
- Extendable during run

### ✅ Adjustable Speed
- Very Fast (0.5s per day)
- Fast (1s per day)
- Normal (2s per day) ← Default
- Slow (3s per day)
- Very Slow (5s per day)

### ✅ Tournament Controls (While Running)
- ⏸️ **Pause** - Pause and save tournament
- ➕ **+10 Days** - Extend duration
- ⚡ **Fast/Slow** - Adjust speed on the fly

### ✅ Save & Resume
- Auto-saves every 5 days
- Saves when you pause
- Shows "Saved Tournaments" when you restart
- Resume with one click!

## Need Help?

### Check Documentation
1. `TOURNAMENT_UPDATES.md` - 30-90 day & speed features
2. `SAVE_RESUME_GUIDE.md` - How to save and resume
3. `IMPLEMENTATION_COMPLETE.md` - Full feature list

### Server Status
- Health check: http://localhost:3002/health
- API docs: See `IMPLEMENTATION_COMPLETE.md`

### Browser Console
- Press `F12` → Console tab
- Look for error messages
- Share errors if you need help

## What's Next?

Once the app is working:
1. ✅ Start a test tournament (5-10 days)
2. ✅ Try adjusting speed
3. ✅ Try pausing and resuming
4. ✅ Test save/resume by closing and reopening
5. ✅ Run a full 30-day tournament!

---

**Current Status:**
- ✅ Server: RUNNING (port 3002)
- ✅ Files: Updated with all features
- ✅ Ready: Just open index.html!

Good luck! 🚀🏆
