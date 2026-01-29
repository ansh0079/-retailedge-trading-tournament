# 🔄 Fix: Update Tournament to Use New Team Names

## Problem

The tournament UI is still showing old team names and strategy labels because the `tournament_data.json` file has cached data with the old configuration:

- ❌ "Claude (Sonnet)" instead of "Team Alpha"
- ❌ "Kimi" instead of "Team Beta"  
- ❌ "DeepSeek V3" instead of "Team Gamma"
- ❌ "Gemini Pro" instead of "Team Delta"
- ❌ Still has `personality` field

---

## Solution: Delete Cached Tournament Data

### Option 1: Delete the File (Recommended)

```powershell
# Delete the cached tournament data
Remove-Item "c:\Users\ansh0\Downloads\working version\tournament_data.json"
```

Then restart the proxy server:

```powershell
node proxy-server.js
```

**Result**: Tournament will start fresh with new team names (Team Alpha, Beta, Gamma, Delta) and strategy-based configuration.

---

### Option 2: Rename the File (Keep as Backup)

```powershell
# Rename to keep as backup
Rename-Item "c:\Users\ansh0\Downloads\working version\tournament_data.json" `
            "c:\Users\ansh0\Downloads\working version\tournament_data_OLD.json"
```

Then restart the proxy server:

```powershell
node proxy-server.js
```

---

## What Will Happen

### Before (Current - Old Data)

```json
{
  "teams": [
    {
      "id": 1,
      "name": "Claude (Sonnet)",
      "strategy": "balanced",
      "personality": "analytical and cautious"
    }
  ]
}
```

### After (New Configuration)

```json
{
  "teams": [
    {
      "id": 1,
      "name": "Team Alpha",
      "model": "Claude-3-Sonnet",
      "strategy": "balanced",
      "strategyDescription": "Balanced approach with moderate risk tolerance",
      "positionSizeMultiplier": 1.0,
      "confidenceThreshold": 60
    }
  ]
}
```

---

## ⚠️ Important Notes

### Will I Lose Tournament Data?

- ✅ **Yes**, but that's intentional - you want to start fresh with the new configuration
- ✅ The old data is from yesterday anyway (saved at 2026-01-28)
- ✅ You can keep a backup by renaming the file instead of deleting

### What About Active Trades?

- The cached data shows:
  - Team 1 (Claude): No trades, $50,000 cash
  - Team 2 (Kimi): 9 trades, $49,997.60 portfolio value
  - Team 3 (DeepSeek): 1 trade, $50,000 portfolio value
  - Team 4 (Gemini): No trades, $50,000 cash

- If you delete the file, all teams will reset to $50,000 starting capital

---

## 🚀 Quick Fix Commands

### Step 1: Stop the Server

Press `Ctrl+C` in the terminal running `proxy-server.js`

### Step 2: Delete Cached Data

```powershell
Remove-Item "c:\Users\ansh0\Downloads\working version\tournament_data.json"
```

### Step 3: Restart Server

```powershell
node proxy-server.js
```

### Step 4: Verify New Team Names

Check the console output - you should see:

```
[Tournament] Starting fresh tournament
[Tournament] Team Alpha initialized
[Tournament] Team Beta initialized
[Tournament] Team Gamma initialized
[Tournament] Team Delta initialized
```

---

## 🔍 Verify the Fix

After restarting, check the UI:

### Team Names Should Show

- ✅ **Team Alpha** (Claude-3-Sonnet) - Balanced Strategy
- ✅ **Team Beta** (Kimi-K2) - Aggressive Strategy
- ✅ **Team Gamma** (DeepSeek-V3) - Conservative Strategy
- ✅ **Team Delta** (Gemini-Pro) - Momentum Strategy

### Strategy Labels Should Show

- ✅ "Balanced Strategy" (not "analytical and cautious")
- ✅ "Aggressive Strategy" (not "bold and trend-following")
- ✅ "Conservative Strategy" (not "conservative and dividend-focused")
- ✅ "Momentum Strategy" (not "data-driven and adaptive")

---

## 📊 Why This Happened

The tournament persistence system (lines 1336-1398 in `proxy-server.js`) saves tournament state to disk every time there's a significant change. When the server restarts, it loads this saved data if it's less than 24 hours old.

Since your cached data is from yesterday (2026-01-28) and is less than 24 hours old, the server loaded it with the old team names and personality fields.

By deleting the file, you force the server to start fresh with the new `TEAM_CONFIGS` we updated.

---

## ✅ Success Checklist

After following the steps above:

- [ ] Deleted `tournament_data.json`
- [ ] Restarted `proxy-server.js`
- [ ] Saw "Starting fresh tournament" in console
- [ ] UI shows "Team Alpha" instead of "Claude (Sonnet)"
- [ ] UI shows "Team Beta" instead of "Kimi"
- [ ] UI shows "Team Gamma" instead of "DeepSeek V3"
- [ ] UI shows "Team Delta" instead of "Gemini Pro"
- [ ] No personality labels visible (no "analytical and cautious", etc.)
- [ ] Strategy descriptions show instead (e.g., "Balanced Strategy")

---

**Ready to fix it? Run the commands above!** 🚀
