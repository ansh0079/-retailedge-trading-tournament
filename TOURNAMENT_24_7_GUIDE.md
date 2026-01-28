# 🏆 Tournament 24/7 Robustness Guide

## Objective

Run the tournament **automatically** during US market hours (9:30 AM - 4:00 PM ET, Mon-Fri), with data persistence across sessions, and keep it running even when your laptop is closed.

---

## ✅ Current State (What's Already Working)

### 1. **Data Persistence** ✅

- Tournament data is saved to `tournament_data.json`
- Includes: team portfolios, holdings, trade history, portfolio history
- Data survives server restarts

### 2. **Auto-Save Mechanism** ✅

- Server logs show: `[Tournament] State saved to disk`
- Saves after each trade and portfolio update

---

## 🔧 What Needs to Be Added

### 1. **Auto Start/Stop Based on Market Hours**

**Problem:** Tournament runs 24/7, wasting API calls and resources outside market hours.

**Solution:** Add market hours detection to the tournament server.

#### Implementation

Create a new file `market-hours-scheduler.js`:

```javascript
// Market Hours Scheduler
// Automatically starts/stops tournament during US market hours

const schedule = require('node-schedule');
const { spawn } = require('child_process');

// US Market Hours: 9:30 AM - 4:00 PM ET (Mon-Fri)
// Convert to your local timezone if needed

let tournamentProcess = null;

function isMarketOpen() {
  const now = new Date();
  const et = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  
  const day = et.getDay(); // 0 = Sunday, 6 = Saturday
  const hour = et.getHours();
  const minute = et.getMinutes();
  
  // Check if weekday (Mon-Fri)
  if (day === 0 || day === 6) return false;
  
  // Check if within market hours (9:30 AM - 4:00 PM ET)
  const currentTime = hour * 60 + minute;
  const marketOpen = 9 * 60 + 30; // 9:30 AM
  const marketClose = 16 * 60; // 4:00 PM
  
  return currentTime >= marketOpen && currentTime < marketClose;
}

function startTournament() {
  if (tournamentProcess) {
    console.log('⚠️ Tournament already running');
    return;
  }
  
  console.log('🚀 Starting tournament (Market Open)...');
  tournamentProcess = spawn('node', ['proxy-server.js'], {
    stdio: 'inherit',
    cwd: __dirname
  });
  
  tournamentProcess.on('exit', (code) => {
    console.log(`Tournament exited with code ${code}`);
    tournamentProcess = null;
  });
}

function stopTournament() {
  if (!tournamentProcess) {
    console.log('⚠️ Tournament not running');
    return;
  }
  
  console.log('🛑 Stopping tournament (Market Closed)...');
  tournamentProcess.kill('SIGTERM');
  tournamentProcess = null;
}

// Schedule: Start at 9:30 AM ET every weekday
schedule.scheduleJob('30 9 * * 1-5', function() {
  console.log('📅 Market Opening - Starting Tournament');
  startTournament();
});

// Schedule: Stop at 4:00 PM ET every weekday
schedule.scheduleJob('0 16 * * 1-5', function() {
  console.log('📅 Market Closing - Stopping Tournament');
  stopTournament();
});

// On startup, check if market is open
console.log('🕐 Market Hours Scheduler Started');
if (isMarketOpen()) {
  console.log('✅ Market is currently OPEN');
  startTournament();
} else {
  console.log('❌ Market is currently CLOSED');
  console.log('⏰ Tournament will auto-start at next market open (9:30 AM ET)');
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down scheduler...');
  stopTournament();
  process.exit(0);
});
```

**Install required package:**

```bash
npm install node-schedule
```

---

### 2. **Keep Laptop Running When Closed**

**Problem:** Windows puts laptop to sleep when lid closes, stopping the server.

**Solution:** Configure Windows power settings.

#### Windows Power Settings

1. **Open Power Options:**
   - Press `Win + X` → Select "Power Options"
   - Click "Choose what closing the lid does"

2. **Configure Lid Settings:**
   - Set "When I close the lid" to **"Do nothing"** (for Plugged in)
   - Click "Save changes"

3. **Prevent Sleep:**
   - Go to "Change plan settings" → "Change advanced power settings"
   - Expand "Sleep" → Set "Sleep after" to **"Never"** (when plugged in)
   - Expand "Hard disk" → Set "Turn off hard disk after" to **"Never"**

#### Alternative: Use PowerShell to prevent sleep

```powershell
# Run this in PowerShell (Admin) to prevent sleep while server runs
powercfg /change standby-timeout-ac 0
powercfg /change monitor-timeout-ac 30
```

---

### 3. **Auto-Restart on Crash**

**Problem:** If server crashes, tournament stops until manually restarted.

**Solution:** Use PM2 process manager.

#### Install PM2

```bash
npm install -g pm2
```

#### Create PM2 Ecosystem File

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'tournament-scheduler',
    script: 'market-hours-scheduler.js',
    watch: false,
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',
    restart_delay: 5000,
    error_file: './logs/scheduler-error.log',
    out_file: './logs/scheduler-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    env: {
      NODE_ENV: 'production'
    }
  }]
};
```

#### Start with PM2

```bash
# Start the scheduler
pm2 start ecosystem.config.js

# Save PM2 config to auto-start on reboot
pm2 save

# Setup PM2 to start on Windows boot
pm2 startup
```

---

### 4. **Data Backup Strategy**

**Problem:** If `tournament_data.json` gets corrupted, all data is lost.

**Solution:** Automatic hourly backups.

#### Create Backup Script

Create `backup-tournament-data.js`:

```javascript
const fs = require('fs');
const path = require('path');

function backupTournamentData() {
  const sourceFile = path.join(__dirname, 'tournament_data.json');
  const backupDir = path.join(__dirname, 'backups');
  
  // Create backups directory if it doesn't exist
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir);
  }
  
  // Create timestamped backup
  const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
  const backupFile = path.join(backupDir, `tournament_data_${timestamp}.json`);
  
  try {
    if (fs.existsSync(sourceFile)) {
      fs.copyFileSync(sourceFile, backupFile);
      console.log(`✅ Backup created: ${backupFile}`);
      
      // Keep only last 7 days of backups
      cleanOldBackups(backupDir, 7);
    }
  } catch (error) {
    console.error('❌ Backup failed:', error.message);
  }
}

function cleanOldBackups(backupDir, daysToKeep) {
  const files = fs.readdirSync(backupDir);
  const now = Date.now();
  const maxAge = daysToKeep * 24 * 60 * 60 * 1000; // days to milliseconds
  
  files.forEach(file => {
    const filePath = path.join(backupDir, file);
    const stats = fs.statSync(filePath);
    const age = now - stats.mtimeMs;
    
    if (age > maxAge) {
      fs.unlinkSync(filePath);
      console.log(`🗑️ Deleted old backup: ${file}`);
    }
  });
}

// Run backup every hour
setInterval(backupTournamentData, 60 * 60 * 1000);

// Run backup on startup
backupTournamentData();

console.log('💾 Backup service started (hourly backups)');
```

Add to PM2:

```javascript
// Add to ecosystem.config.js apps array:
{
  name: 'tournament-backup',
  script: 'backup-tournament-data.js',
  autorestart: true
}
```

---

## 🚀 Complete Setup Instructions

### Step 1: Install Dependencies

```bash
npm install node-schedule
npm install -g pm2
```

### Step 2: Create Scheduler Files

1. Create `market-hours-scheduler.js` (code above)
2. Create `backup-tournament-data.js` (code above)
3. Create `ecosystem.config.js` (code above)

### Step 3: Configure Windows

1. Set lid close action to "Do nothing"
2. Disable sleep when plugged in
3. Keep laptop plugged in 24/7

### Step 4: Start Services

```bash
# Start everything with PM2
pm2 start ecosystem.config.js

# Save configuration
pm2 save

# Setup auto-start on boot
pm2 startup

# Check status
pm2 status
pm2 logs
```

### Step 5: Verify

```bash
# Check if scheduler is running
pm2 list

# View real-time logs
pm2 logs tournament-scheduler

# Monitor processes
pm2 monit
```

---

## 📊 Monitoring & Maintenance

### Daily Checks

```bash
# Check PM2 status
pm2 status

# View recent logs
pm2 logs --lines 50

# Check tournament data
cat tournament_data.json | grep "portfolioValue"
```

### Weekly Maintenance

```bash
# Restart services (during market close)
pm2 restart all

# Clear old logs
pm2 flush

# Check backups
ls -lh backups/
```

---

## 🔄 Data Persistence Verification

### Current Persistence (Already Working)

✅ `tournament_data.json` - Main tournament state  
✅ Auto-saves after each trade  
✅ Loads state on server restart  

### Enhanced Persistence (After Setup)

✅ Hourly backups to `backups/` folder  
✅ 7-day backup retention  
✅ Auto-recovery from crashes  
✅ Market hours awareness  

---

## 🆘 Troubleshooting

### Tournament Not Starting

```bash
# Check scheduler logs
pm2 logs tournament-scheduler

# Manually check market hours
node -e "console.log(new Date().toLocaleString('en-US', {timeZone: 'America/New_York'}))"
```

### Data Loss Recovery

```bash
# List available backups
ls -lh backups/

# Restore from backup
cp backups/tournament_data_2026-01-28T14-30-00.json tournament_data.json

# Restart tournament
pm2 restart tournament-scheduler
```

### Laptop Going to Sleep

```powershell
# Check current power settings
powercfg /query

# Force prevent sleep (run as Admin)
powercfg /change standby-timeout-ac 0
```

---

## ✅ Final Checklist

- [ ] Install `node-schedule` and `pm2`
- [ ] Create scheduler and backup scripts
- [ ] Configure Windows power settings
- [ ] Start services with PM2
- [ ] Enable PM2 auto-startup
- [ ] Verify tournament starts at 9:30 AM ET
- [ ] Verify tournament stops at 4:00 PM ET
- [ ] Check backups are being created
- [ ] Test laptop lid close (should keep running)
- [ ] Monitor for 1-2 days to ensure stability

---

## 🎯 Expected Behavior

**Weekday (Market Open):**

- 9:30 AM ET: Tournament auto-starts
- During market hours: Trades execute, data saves
- 4:00 PM ET: Tournament auto-stops, final save

**Weekday (After Hours):**

- Server idle, waiting for next market open
- Backups continue hourly
- Data preserved

**Weekend:**

- Server idle
- No trading activity
- Data preserved for Monday

**Laptop Closed:**

- Server continues running
- Tournament operates normally
- All data persists

---

**Your tournament will now run reliably during market hours, survive restarts, and preserve all trade data!** 🚀
