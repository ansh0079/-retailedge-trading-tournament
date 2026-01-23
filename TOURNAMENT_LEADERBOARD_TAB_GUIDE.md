# 🏆 AI Tournament Leaderboard Tab Integration

## Overview

This guide shows how to add a **dedicated AI Tournament Leaderboard tab** to your main application, allowing users to view tournament results without opening the modal.

---

## 🎯 What This Adds

### **New Main Tab: "AI Tournament Leaderboard"**

- Shows real-time tournament results
- Auto-refreshes every 30 seconds when active
- Displays team rankings, returns, and stats
- Quick "Run Tournament" button
- Beautiful gradient UI with rank badges

---

## 📊 Visual Preview

```
┌────────────────────────────────────────────────────────────┐
│ [📊 Stock Screener] [🏆 AI Tournament Leaderboard] [💼 Portfolio] │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  🏆 AI Tournament Leaderboard        [🔄 Refresh Data]    │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ 🥇 1  Team Alpha (Claude-3-Sonnet)      +12.5%      │ │
│  │       Custom Strategy                    $112,500    │ │
│  │       Trades: 45 • Win Rate: 68%                    │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ 🥈 2  Team Beta (GPT-4-Turbo)            +8.3%      │ │
│  │       Custom Strategy                    $108,300    │ │
│  │       Trades: 38 • Win Rate: 62%                    │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  Stats: Best: +12.5% • Total Trades: 156 • Profitable: 3 │
└────────────────────────────────────────────────────────────┘
```

---

## 🚀 Implementation Steps

### **Step 1: Add State Variables**

Add these to your main App component state:

```javascript
// Main Page Tabs - NEW STATE
const [activeMainTab, setActiveMainTab] = useState('screener'); // 'screener', 'leaderboard', 'portfolio'

// Tournament Leaderboard State - NEW
const [tournamentLeaderboardData, setTournamentLeaderboardData] = useState([]);
const [tournamentLoading, setTournamentLoading] = useState(false);
const [tournamentError, setTournamentError] = useState(null);
```

### **Step 2: Add Leaderboard Loading Function**

```javascript
const loadTournamentLeaderboard = useCallback(async () => {
  setTournamentLoading(true);
  setTournamentError(null);
  
  try {
    const response = await fetch('http://localhost:3002/api/tournament/results');
    if (!response.ok) {
      throw new Error(`Failed to load: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Extract leaderboard from response
    const leaderboard = data.results?.leaderboard || data.leaderboard || [];
    setTournamentLeaderboardData(leaderboard);
    
    console.log('✅ Leaderboard loaded:', leaderboard.length, 'teams');
  } catch (err) {
    console.error('Leaderboard load error:', err);
    setTournamentError(err.message);
  } finally {
    setTournamentLoading(false);
  }
}, []);
```

### **Step 3: Add Auto-Refresh Effect**

```javascript
// Auto-refresh leaderboard when tab is active
useEffect(() => {
  if (activeMainTab === 'leaderboard') {
    loadTournamentLeaderboard();
    
    // Poll every 30 seconds when on leaderboard tab
    const interval = setInterval(loadTournamentLeaderboard, 30000);
    return () => clearInterval(interval);
  }
}, [activeMainTab, loadTournamentLeaderboard]);
```

### **Step 4: Add Tab Navigation UI**

Replace your main content area with this:

```javascript
{/* Main Page Tabs */}
<div className="mb-6">
  <div className="flex items-center gap-2 border-b border-slate-700">
    <button
      onClick={() => setActiveMainTab('screener')}
      className={`px-4 py-3 font-semibold transition flex items-center gap-2 ${
        activeMainTab === 'screener' 
          ? 'text-cyan-400 border-b-2 border-cyan-400' 
          : 'text-slate-400 hover:text-white'
      }`}
    >
      <i className="fas fa-chart-line"></i>
      Stock Screener
    </button>
    
    <button
      onClick={() => setActiveMainTab('leaderboard')}
      className={`px-4 py-3 font-semibold transition flex items-center gap-2 ${
        activeMainTab === 'leaderboard' 
          ? 'text-purple-400 border-b-2 border-purple-400' 
          : 'text-slate-400 hover:text-white'
      }`}
    >
      <i className="fas fa-trophy"></i>
      AI Tournament Leaderboard
    </button>
    
    <button
      onClick={() => setActiveMainTab('portfolio')}
      className={`px-4 py-3 font-semibold transition flex items-center gap-2 ${
        activeMainTab === 'portfolio' 
          ? 'text-emerald-400 border-b-2 border-emerald-400' 
          : 'text-slate-400 hover:text-white'
      }`}
    >
      <i className="fas fa-briefcase"></i>
      Portfolio
    </button>
  </div>
</div>
```

### **Step 5: Add Conditional Tab Content**

```javascript
{/* Tab Content - Conditional Rendering */}

{/* SCREENER TAB */}
{activeMainTab === 'screener' && (
  <>
    <div className="flex items-center justify-between mb-4">
      <button
        onClick={() => setShowWatchlistOnly(!showWatchlistOnly)}
        className={`px-4 py-2 rounded-lg font-semibold transition ${
          showWatchlistOnly
            ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
            : 'bg-slate-700 hover:bg-slate-600 text-white'
        }`}
      >
        <i className="fas fa-star mr-2"></i>
        {showWatchlistOnly ? 'Showing Watchlist Only' : 'Show Watchlist'}
      </button>
      <DelayBadge />
    </div>
    <StockTable 
      stocks={showWatchlistOnly ? stocks.filter(s => watchlist.includes(s.symbol)) : stocks}
      watchlist={watchlist}
      onStockClick={setSelectedStock}
      onToggleWatchlist={toggleWatchlist}
    />
  </>
)}

{/* LEADERBOARD TAB - NEW */}
{activeMainTab === 'leaderboard' && (
  <TournamentLeaderboardTab 
    leaderboard={tournamentLeaderboardData}
    isLoading={tournamentLoading}
    error={tournamentError}
    onRunTournament={() => {
      const portfolioSymbols = portfolioHoldings.map(h => h.symbol);
      setTournamentWatchlist(portfolioSymbols);
      setShowTournament(true);
    }}
    onRefresh={loadTournamentLeaderboard}
  />
)}

{/* PORTFOLIO TAB */}
{activeMainTab === 'portfolio' && (
  <PortfolioSection 
    holdings={portfolioHoldings}
    totalValue={portfolioValue}
    onUpdate={loadPortfolioData}
  />
)}
```

### **Step 6: Add TournamentLeaderboardTab Component**

```javascript
function TournamentLeaderboardTab({ leaderboard, isLoading, error, onRunTournament, onRefresh }) {
  if (isLoading) {
    return (
      <div className="glass-card p-12 rounded-xl text-center">
        <i className="fas fa-spinner animate-spin text-4xl text-purple-400 mb-4"></i>
        <p className="text-slate-400">Loading tournament leaderboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card p-8 rounded-xl text-center border border-red-500/30">
        <i className="fas fa-exclamation-triangle text-4xl text-red-400 mb-4"></i>
        <p className="text-red-300 mb-4">{error}</p>
        <button 
          onClick={onRefresh} 
          className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-semibold"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!leaderboard || leaderboard.length === 0) {
    return (
      <div className="glass-card p-12 rounded-xl text-center">
        <i className="fas fa-trophy text-6xl text-slate-700 mb-4"></i>
        <h3 className="text-xl font-bold text-white mb-2">No Tournament Data</h3>
        <p className="text-slate-400 mb-4">Run an AI Tournament to see the leaderboard</p>
        <button
          onClick={onRunTournament}
          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-lg font-semibold flex items-center gap-2 mx-auto"
        >
          <i className="fas fa-play"></i>
          Start AI Tournament
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="glass-card p-6 rounded-xl border border-purple-500/30 bg-gradient-to-br from-purple-500/5 to-pink-500/5">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <i className="fas fa-trophy text-yellow-400"></i>
            AI Tournament Leaderboard
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={onRefresh}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold text-sm flex items-center gap-2 transition"
            >
              <i className="fas fa-sync"></i>
              Refresh
            </button>
            <button
              onClick={onRunTournament}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-semibold text-sm flex items-center gap-2 transition"
            >
              <i className="fas fa-play"></i>
              New Tournament
            </button>
          </div>
        </div>
        
        <div className="space-y-3">
          {leaderboard.map((team, idx) => {
            const isTop3 = idx < 3;
            const rankColors = {
              0: 'bg-yellow-500/20 text-yellow-400 ring-2 ring-yellow-500/40',
              1: 'bg-slate-500/20 text-slate-400 ring-2 ring-slate-500/40',
              2: 'bg-orange-500/20 text-orange-400 ring-2 ring-orange-500/40'
            };
            
            return (
              <div
                key={team.teamId || idx}
                className={`rounded-lg p-4 border transition hover:scale-[1.02] cursor-pointer ${
                  isTop3 
                    ? 'bg-slate-800/70 border-purple-500/50 shadow-purple-500/10 shadow-lg' 
                    : 'bg-slate-800/50 border-slate-700/50 hover:border-purple-500/30'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {/* Rank Badge */}
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl transition ${
                      rankColors[idx] || 'bg-slate-700/20 text-slate-500'
                    }`}>
                      {idx + 1}
                    </div>
                    
                    {/* Team Info */}
                    <div>
                      <div className="font-bold text-white text-lg">
                        {team.name || `AI Team ${team.teamId}`}
                      </div>
                      <div className="text-sm text-slate-400 flex items-center gap-2">
                        <i className="fas fa-robot"></i>
                        {team.model || 'Custom Strategy'}
                        {team.active && (
                          <span className="px-2 py-0.5 bg-green-500/20 text-green-300 rounded text-xs">
                            <i className="fas fa-spinner animate-spin mr-1"></i>
                            Active
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Performance */}
                  <div className="text-right">
                    <div className={`text-3xl font-bold mb-1 ${
                      (team.totalReturn || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {team.totalReturn ? 
                        `${team.totalReturn > 0 ? '+' : ''}${team.totalReturn.toFixed(2)}%` : 
                        '0.00%'
                      }
                    </div>
                    <div className="text-sm text-slate-400">
                      <div>Portfolio: ${team.portfolioValue?.toLocaleString() || '100,000'}</div>
                      <div>Trades: {team.trades?.length || 0}</div>
                      {team.returns && team.returns.length > 0 && (
                        <div>Avg: {(team.returns.reduce((a, b) => a + b, 0) / team.returns.length).toFixed(2)}%</div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Mini Performance Chart */}
                {team.returns && team.returns.length > 0 && (
                  <div className="mt-3 flex items-end gap-1 h-12">
                    {team.returns.map((ret, i) => (
                      <div
                        key={i}
                        className={`flex-1 rounded-t ${ret > 0 ? 'bg-green-500' : 'bg-red-500'}`}
                        style={{ height: `${Math.min(Math.abs(ret) * 10, 48)}px`, minHeight: '2px' }}
                        title={`Day ${i + 1}: ${ret.toFixed(2)}%`}
                      ></div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="glass-card p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-green-400">
            {leaderboard[0]?.totalReturn ? 
              `${leaderboard[0].totalReturn > 0 ? '+' : ''}${leaderboard[0].totalReturn.toFixed(2)}%` : 
              '0%'
            }
          </div>
          <div className="text-xs text-slate-400">Best Performance</div>
        </div>
        <div className="glass-card p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-purple-400">
            {leaderboard.reduce((sum, t) => sum + (t.trades?.length || 0), 0)}
          </div>
          <div className="text-xs text-slate-400">Total Trades</div>
        </div>
        <div className="glass-card p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-cyan-400">
            {leaderboard.filter(t => (t.totalReturn || 0) > 0).length}
          </div>
          <div className="text-xs text-slate-400">Profitable Teams</div>
        </div>
      </div>
    </div>
  );
}
```

---

## 🎯 Key Features

### **1. Auto-Refresh**
- Loads data when tab becomes active
- Refreshes every 30 seconds
- Stops polling when tab is inactive

### **2. Three States**
- **Loading**: Spinner with message
- **Error**: Error message with retry button
- **Empty**: "No data" message with "Start Tournament" button
- **Data**: Full leaderboard display

### **3. Visual Hierarchy**
- Top 3 teams get special styling
- Rank badges with colors (gold/silver/bronze)
- Performance charts for each team
- Summary stats at bottom

### **4. Interactive**
- Click team cards for details (future enhancement)
- Refresh button for manual updates
- "New Tournament" button to start another

---

## 📊 API Response Format

The component expects this format from `/api/tournament/results`:

```json
{
  "results": {
    "leaderboard": [
      {
        "teamId": 1,
        "name": "Team Alpha",
        "model": "Claude-3-Sonnet",
        "totalReturn": 12.5,
        "portfolioValue": 112500,
        "trades": [...],
        "returns": [2.3, 1.8, -0.5, ...],
        "active": true
      }
    ]
  }
}
```

---

## 🔧 Customization Options

### **Change Refresh Interval**
```javascript
const interval = setInterval(loadTournamentLeaderboard, 60000); // 60 seconds
```

### **Add More Stats**
```javascript
<div className="glass-card p-4 rounded-lg text-center">
  <div className="text-2xl font-bold text-orange-400">
    {leaderboard.reduce((sum, t) => sum + (t.portfolioValue || 0), 0).toLocaleString()}
  </div>
  <div className="text-xs text-slate-400">Total Portfolio Value</div>
</div>
```

### **Change Rank Colors**
```javascript
const rankColors = {
  0: 'bg-purple-500/20 text-purple-400 ring-2 ring-purple-500/40', // Custom 1st place
  1: 'bg-blue-500/20 text-blue-400 ring-2 ring-blue-500/40',       // Custom 2nd place
  2: 'bg-green-500/20 text-green-400 ring-2 ring-green-500/40'     // Custom 3rd place
};
```

---

## ✅ Integration Checklist

- [ ] Add state variables (`activeMainTab`, `tournamentLeaderboardData`, etc.)
- [ ] Add `loadTournamentLeaderboard` function
- [ ] Add auto-refresh `useEffect`
- [ ] Add tab navigation UI
- [ ] Add conditional tab content rendering
- [ ] Add `TournamentLeaderboardTab` component
- [ ] Test tab switching
- [ ] Test auto-refresh
- [ ] Test "Run Tournament" button
- [ ] Test empty state
- [ ] Test error state

---

## 🎉 Benefits

1. ✅ **Better UX** - No need to open modal to see results
2. ✅ **Real-time** - Auto-refreshes while viewing
3. ✅ **Persistent** - Data stays loaded when switching tabs
4. ✅ **Visual** - Beautiful gradient UI with rank badges
5. ✅ **Interactive** - Quick access to run new tournaments

---

## 🚀 Ready to Integrate!

This leaderboard tab provides a professional, real-time view of tournament results directly in your main app!

**Status**: ✅ **READY TO USE**
