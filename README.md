# 🚀 Retail Edge Pro - Quick Start

## Instant Start (Double-Click)

**👉 Just double-click `start.bat` to launch the app!**

It will:
- ✅ Start the server automatically
- ✅ Open your browser to http://localhost:3002
- ✅ Keep running in the background

That's it! The app is now running.

---

## 📚 Documentation

- **[START_APP.md](START_APP.md)** - Detailed startup instructions and troubleshooting
- **[TOURNAMENT_CONTROLS.md](TOURNAMENT_CONTROLS.md)** - Tournament pause/resume/stop controls guide
- **[FIXES_APPLIED.md](FIXES_APPLIED.md)** - Complete changelog of all fixes
- **[DEBUG_TOURNAMENT_BUTTONS.md](DEBUG_TOURNAMENT_BUTTONS.md)** - Debugging tournament controls

---

## ⚡ Quick Actions

### Start the App
```cmd
start.bat
```
Or double-click `start.bat`

### Stop the Server
Press `Ctrl+C` twice in the server window

### View Tournament Status
Open: http://localhost:3002/api/tournament/status/current

### Check Market Hours
Open: http://localhost:3002/api/market/status

---

## 🎮 Using the Tournament

1. **Start App**: Double-click `start.bat`
2. **Start Tournament**: 
   - Click "AI Tournament" in sidebar
   - Click "Start AI Tournament"
   - Wait for green "Tournament Running" indicator
3. **View Progress**: Click "Tournament Logs" button in top navigation
4. **Control Tournament**:
   - **Pause**: Yellow button (pauses the tournament)
   - **Resume**: Green button (only works during market hours)
   - **Stop**: Red button (terminates tournament completely)

---

## 🔍 Key Features

### Tournament Controls
- ✅ **Live Status Indicator**: Green pulsing light when running
- ✅ **Pause/Resume**: Manual control or auto-pause outside market hours
- ✅ **Market Hours Detection**: 9:30 AM - 4:00 PM ET (weekdays)
- ✅ **Tournament Logs**: Real-time trades and event logs
- ✅ **Persistence**: Tournaments survive server restarts

### Auto Pause/Resume
- 🕐 **4:00 PM ET**: Tournament auto-pauses when market closes
- 🕐 **9:30 AM ET**: Tournament auto-resumes when market opens
- 📅 **Weekends**: Stays paused on Sat/Sun

---

## 🆘 Troubleshooting

### Server Not Starting
```cmd
# Check if port is in use
netstat -ano | findstr :3002

# Kill existing process
taskkill /F /PID <PID_NUMBER>

# Try again
start.bat
```

### Tournament Buttons Not Showing
1. Ensure server is running (`start.bat`)
2. Open http://localhost:3002 (not file://)
3. Hard refresh: `Ctrl+Shift+R`
4. Check browser console (F12) for debug output

### "Tournament Already Running"
```cmd
# Stop existing tournament
curl -X POST http://localhost:3002/api/tournament/stop

# Or from browser console:
fetch('http://localhost:3002/api/tournament/stop', {method: 'POST'})
```

---

## 🛠️ Tech Stack

- **Frontend**: React 18 + Tailwind CSS
- **Backend**: Node.js + Express
- **Tournament**: Python (multi-AI agents)
- **Database**: SQLite3
- **Analysis**: Claude AI + Multi-source sentiment

---

## 📊 API Endpoints

- `GET /api/tournament/status/current` - Tournament status
- `GET /api/market/status` - Market hours and status
- `GET /api/tournament/logs` - Last 100 log entries
- `GET /api/tournament/trades` - Last 100 trades
- `POST /api/tournament/start` - Start new tournament
- `POST /api/tournament/pause` - Pause running tournament
- `POST /api/tournament/resume` - Resume paused tournament
- `POST /api/tournament/stop` - Stop and terminate tournament

---

## 💡 Pro Tips

1. **Bookmark it**: Add http://localhost:3002 to favorites
2. **Keep server running**: Don't close the server window
3. **Check logs**: Server window shows all activity
4. **Market hours matter**: Resume only works during trading hours
5. **State persists**: Your tournament continues even after restarting the server

---

## 📁 Important Files

- `start.bat` - One-click startup script
- `proxy-server.js` - Main backend server
- `ultimate_trading_tournament.py` - Tournament engine
- `.tournament_state.json` - Tournament persistence (auto-created)
- `ultimate_tournament.db` - Tournament database (auto-created)

---

## 🎯 What's New (Latest Updates)

### UI Changes
- ✅ Removed leaderboard tab
- ✅ Added "Tournament Logs" button (always visible)
- ✅ Added green pulsing status indicator when tournament runs
- ✅ Tournament controls in logs modal (Pause/Resume/Stop)

### Features Added
- ✅ Manual pause/resume controls
- ✅ Auto pause/resume based on market hours
- ✅ Market status indicator (Open/Closed with ET time)
- ✅ Live trades display (last 100 trades)
- ✅ Live event logs (last 100 events)
- ✅ Tournament state persistence across restarts
- ✅ Process reconnection on server restart

---

## 🚀 Getting Started

1. **First Time**:
   ```cmd
   npm install
   start.bat
   ```

2. **Every Time After**:
   ```cmd
   start.bat
   ```
   Or just double-click `start.bat`

3. **Use the App**:
   - Browser opens automatically
   - Start trading competitions
   - Monitor with Tournament Logs modal

---

**Need help?** Check [START_APP.md](START_APP.md) for detailed instructions!
