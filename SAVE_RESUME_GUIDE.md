# Tournament Save & Resume Guide

## Overview

Your tournament now has **automatic save & resume** capability! You can close your laptop and resume tournaments later without losing progress.

## How It Works

### 🔄 Auto-Save Features

1. **Periodic Checkpoints**
   - Automatically saves every **5 days** during the tournament
   - Checkpoint files stored in `tournament_checkpoints/` folder

2. **Save on Pause**
   - When you click "Pause", tournament state is immediately saved
   - Safe to close your laptop after pausing

3. **Auto-Load on Startup**
   - When you restart the server, all saved tournaments are automatically loaded
   - They appear as "Saved Tournaments" in the UI

4. **Cleanup on Completion**
   - When tournament finishes, checkpoint is deleted
   - Final results saved to `tournament_results/` folder

---

## Usage Workflow

### Starting a New Tournament

```
1. Configure tournament (days, speed, teams)
2. Click "Start Tournament"
3. Tournament runs with auto-saves every 5 days
```

### Closing Your Laptop

**Option 1: Pause First (Recommended)**
```
1. Click "Pause" button
2. Wait for "Tournament paused and saved" message
3. Close your laptop
4. Tournament state is safely saved
```

**Option 2: Close Modal**
```
1. Click X to close tournament modal
2. Tournament continues running in background
3. Auto-saves continue every 5 days
4. Note: Closing modal doesn't pause the tournament
```

**Option 3: Stop Server**
```
1. Close the terminal/server (Ctrl+C)
2. Last auto-save (every 5 days) will be preserved
3. Progress between last save and shutdown is lost
```

### Resuming After Reopening

1. **Start the server**:
   ```bash
   node tournament-server.js
   ```

2. **Server automatically loads saved tournaments**:
   ```
   📂 Loaded saved tournament: tourney_123... (Day 15/30)
   ✅ Loaded 1 saved tournament(s)
   ```

3. **Open the app** and go to Tournament tab

4. **See saved tournaments** at the top:
   ```
   ╔══════════════════════════════════════════╗
   ║  💾 Saved Tournaments (1)                ║
   ╠══════════════════════════════════════════╣
   ║  Day 15 / 30                             ║
   ║  4 teams • Saved 1/20/2026, 2:30 PM      ║
   ║                          [▶️ Resume]     ║
   ╚══════════════════════════════════════════╝
   ```

5. **Click "Resume"** to continue from where you left off

---

## File Structure

```
working version/
├── tournament_checkpoints/          # Save files
│   └── tourney_123_checkpoint.json  # State snapshot
├── tournament_results/              # Final results
│   └── tourney_123.json             # Completed tournament
└── tournament.js                    # Manager with save/resume
```

### Checkpoint File Contents

```json
{
  "experimentId": "tourney_1234567890_abc123",
  "status": "paused",
  "currentDay": 15,
  "savedAt": 1737398400000,
  "checkpointDay": 15,
  "config": {
    "days": 30,
    "simulationSpeed": 2000,
    "teams": [1, 2, 3, 4],
    "watchlist": ["AAPL", "GOOGL", ...]
  },
  "teams": [...],
  "leaderboard": [...],
  "logs": [...]
}
```

---

## API Endpoints

### Get Saved Tournaments
```bash
GET /api/tournament/saved
```

**Response:**
```json
{
  "saved": [
    {
      "experimentId": "tourney_123...",
      "currentDay": 15,
      "totalDays": 30,
      "teams": 4,
      "savedAt": 1737398400000,
      "leaderboard": [...]
    }
  ]
}
```

### Resume Tournament
```bash
POST /api/tournament/resume/:experimentId
```

**Response:**
```json
{
  "success": true,
  "message": "Tournament resumed from Day 15",
  "currentDay": 15,
  "totalDays": 30
}
```

### Manual Checkpoint Save
```bash
POST /api/tournament/checkpoint/:experimentId
```

**Response:**
```json
{
  "success": true,
  "message": "Checkpoint saved"
}
```

---

## New Methods Added

### Backend (tournament.js)

```javascript
// Save checkpoint
await tournamentManager.saveCheckpoint(experimentId);

// Load all saved tournaments (auto-called on startup)
await tournamentManager.loadSavedTournaments();

// Get list of saved tournaments
const saved = await tournamentManager.getSavedTournaments();

// Resume from checkpoint
const result = await tournamentManager.resumeFromCheckpoint(experimentId);

// Delete checkpoint (cleanup)
await tournamentManager.deleteCheckpoint(experimentId);
```

### Frontend (index_ultimate.html)

```javascript
// Load saved tournaments list
const loadSavedTournaments = async () => { ... }

// Resume a saved tournament
const resumeSavedTournament = async (savedId) => { ... }
```

---

## Important Notes

### ✅ What Gets Saved

- Current day progress
- Team standings and returns
- All trades history
- Complete logs
- Leaderboard rankings
- Configuration (days, speed, teams, watchlist)

### ❌ What Doesn't Get Saved

- Progress between checkpoints (every 5 days)
- Real-time WebSocket connections (re-established on resume)
- In-flight API requests

### 🎯 Best Practices

1. **Pause before closing** - Ensures immediate save
2. **Check "Saved Tournaments"** - Verify your tournament was saved
3. **Regular checkpoints** - Happens automatically every 5 days
4. **Don't delete checkpoint files** - Located in `tournament_checkpoints/`

---

## Example Scenarios

### Scenario 1: Long Tournament (60 days)

```
Day 1-5:   Running... ✅ Checkpoint saved
Day 6-10:  Running... ✅ Checkpoint saved
Day 11:    Click "Pause" ✅ Saved
           Close laptop 💤
           [Next day]
           Open laptop, start server
           Click "Resume" ▶️
Day 11-15: Running... ✅ Checkpoint saved
...
Day 60:    Complete! 🏁
           Checkpoint deleted, final results saved
```

### Scenario 2: Emergency Laptop Shutdown

```
Day 1-12:  Running... ✅ Checkpoints at Day 5, 10
Day 13:    Laptop battery dies 🔋
           [Lost progress on Days 11-13]
           Restart server
           Resume from Day 10 checkpoint
Day 10-15: Re-run days 10-15
...
```

### Scenario 3: Multiple Saved Tournaments

```
Tournament A: Paused at Day 20/30
Tournament B: Paused at Day 45/90
Tournament C: Running Day 10/60

UI shows:
┌─────────────────────────────────┐
│ 💾 Saved Tournaments (2)        │
├─────────────────────────────────┤
│ Tournament A                     │
│ Day 20/30 • 4 teams             │
│                    [▶️ Resume]  │
├─────────────────────────────────┤
│ Tournament B                     │
│ Day 45/90 • 4 teams             │
│                    [▶️ Resume]  │
└─────────────────────────────────┘

Resume any saved tournament independently!
```

---

## Troubleshooting

### Problem: Saved tournament not appearing

**Solution:**
1. Check `tournament_checkpoints/` folder exists
2. Look for `*_checkpoint.json` files
3. Restart the server to trigger auto-load
4. Check server logs for "Loaded saved tournament" messages

### Problem: Resume button doesn't work

**Solution:**
1. Check server is running (http://localhost:3002)
2. Check browser console for errors
3. Verify experimentId in checkpoint file
4. Try manual API call: `POST /api/tournament/resume/:id`

### Problem: Lost progress between saves

**Solution:**
- Checkpoints save every 5 days
- Progress lost if crash happens between checkpoints
- **Recommendation**: Click "Pause" before closing laptop

### Problem: Old saved tournaments accumulating

**Solution:**
- Completed tournaments auto-delete checkpoints
- Manual cleanup: Delete files in `tournament_checkpoints/`
- Or resume and let them complete naturally

---

## Technical Details

### Auto-Save Timing

```javascript
// In runSimulation loop:
if (day % 5 === 0) {
  await this.saveCheckpoint(experimentId);
}
```

### Resume Logic

```javascript
// Resumes from currentDay, not Day 1
for (let day = tournament.currentDay; day <= days; day++) {
  // Continue simulation...
}
```

### State Restoration

All tournament state is preserved:
- Teams array with all properties
- Trades history
- Returns array
- Logs array
- Leaderboard
- Configuration

---

## Summary

🎉 **You can now:**
- Close your laptop during tournaments
- Resume exactly where you left off
- Run 30-90 day tournaments without keeping laptop open
- Have multiple saved tournaments
- Never lose more than 5 days of progress (auto-saves)
- Manually pause to save immediately

🚀 **Perfect for:**
- Long-running tournaments (30-90 days)
- Testing over multiple sessions
- Comparing different tournament configurations
- Running tournaments while traveling

---

Enjoy your persistent tournaments! 🏆💾
