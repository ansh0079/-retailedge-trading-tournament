# AI Tournament Controls - User Guide

## Overview
The AI Tournament now has full pause/resume/stop controls with visual status indicators.

## UI Changes

### 1. Tournament Status Indicator
- **Location**: Top navigation bar (next to tabs)
- **Green pulsing light**: Tournament is actively running
- **Text**: "Tournament Running"
- **Always visible**: Shows tournament state across all tabs

### 2. Tournament Logs Button
- **Location**: Top navigation bar (replaces old leaderboard tab)
- **Icon**: Scroll icon
- **Label**: "Tournament Logs"
- **Purpose**: Opens modal with logs and trades

### 3. Tournament Logs Modal

#### Status Badges (in modal header):
- **Live** (green): Tournament running normally
- **Paused** (yellow): Tournament temporarily stopped
- **Market Open/Closed** (green/red): US market hours (9:30 AM - 4:00 PM ET)

#### Control Buttons:

**Pause Button** (yellow)
- Visible when: Tournament is running and NOT paused
- Action: Pauses the tournament process (sends SIGSTOP)
- Icon: Pause icon

**Resume Button** (green/gray)
- Visible when: Tournament is paused OR stopped
- Action: Resumes the tournament process (sends SIGCONT)
- Disabled when: Market is closed
- Note: Shows "Market Closed" when market is closed
- Icon: Play icon

**Stop Button** (red)
- Visible when: Tournament is running
- Action: Completely stops and terminates tournament
- Warning: Shows confirmation dialog
- Note: Cannot be undone - all progress lost
- Icon: Stop icon

## Features

### Auto Pause/Resume
The tournament automatically pauses when US market closes and resumes when it opens:
- **Market Hours**: Monday-Friday, 9:30 AM - 4:00 PM Eastern Time
- **Auto-pause**: Happens at 4:00 PM ET
- **Auto-resume**: Happens at 9:30 AM ET next trading day
- **Manual override**: You can still manually pause/resume during market hours

### Live Updates
- **Trades**: Shows last 100 trades with BUY/SELL, symbol, shares, price, team name
- **Logs**: Shows last 100 event logs with timestamps
- **Refresh**: Auto-refreshes every 5 seconds when modal is open
- **Market status**: Updates every 30 seconds

### Data Display

**Trades Section**:
- Green badge: BUY orders
- Red badge: SELL orders
- Shows: Symbol, quantity, price, team name, timestamp
- Scrollable list (max 300px height)

**Logs Section**:
- Color-coded by type:
  - Red: Errors
  - Yellow: Warnings  
  - Green: Success messages
  - White: Info messages
- Monospace font for readability
- Scrollable list (max 400px height)

## Backend Endpoints

- `GET /api/market/status` - Check market hours and tournament state
- `GET /api/tournament/logs` - Get last 100 log entries
- `GET /api/tournament/trades` - Get last 100 trades
- `POST /api/tournament/pause` - Pause running tournament
- `POST /api/tournament/resume` - Resume paused tournament (only during market hours)
- `POST /api/tournament/stop` - Stop and terminate tournament

## Persistence
- Tournament state is saved to `.tournament_state.json`
- Survives server restarts
- Tracks process ID, experiment ID, pause state
- Automatically reconnects to orphaned processes

## Troubleshooting

**Buttons not showing:**
- Refresh the page
- Check console for errors
- Ensure `tournamentRunning` state is correct

**Resume button disabled:**
- Check if market is open (shows market status badge)
- Market must be open to resume tournament
- Wait for market hours or will auto-resume

**Tournament won't stop:**
- Check server console for errors
- Tournament process may have terminated unexpectedly
- Check `.tournament_state.json` file

**No logs/trades showing:**
- Tournament may not have started writing to database yet
- Check if `ultimate_tournament.db` exists
- Refresh the modal (close and reopen)

## Technical Details

**State Management**:
- `tournamentRunning`: Boolean - is tournament process alive
- `tournamentPaused`: Boolean - is tournament paused (SIGSTOP sent)
- `marketStatus`: Object - market hours and current time

**Process Signals**:
- `SIGSTOP`: Pause (suspend) process
- `SIGCONT`: Continue (resume) process
- `SIGTERM`: Graceful shutdown
- `SIGKILL`: Force kill (after 5s if SIGTERM fails)

