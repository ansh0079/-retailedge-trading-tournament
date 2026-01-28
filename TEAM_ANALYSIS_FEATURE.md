# Team Analysis Feature - Implementation Guide

## Feature: Click Team to View Detailed Analysis

When a user clicks on a team in the tournament leaderboard, show a detailed analysis panel with:

1. **Team Overview**
   - Strategy & Personality
   - Current Portfolio Value
   - Performance Metrics (Win Rate, Sharpe Ratio, etc.)

2. **Trade History**
   - All trades with timestamps
   - Buy/Sell decisions with reasoning
   - AI analysis for each trade (if available)

3. **Current Holdings**
   - Stock positions
   - Unrealized P&L
   - Position sizes

4. **Performance Chart**
   - Portfolio value over time
   - Comparison to other teams

---

## Implementation Steps

### Step 1: Add API Endpoint for Team Details

Add to `proxy-server.js` or `tournament-server.js`:

```javascript
// Get detailed team analysis
app.get('/api/tournament/team/:teamId', (req, res) => {
  try {
    const { teamId } = req.params;
    const tournamentData = JSON.parse(fs.readFileSync(TOURNAMENT_DATA_FILE, 'utf8'));
    
    const team = tournamentData.teams.find(t => t.id === parseInt(teamId));
    
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }
    
    // Calculate additional metrics
    const winRate = team.tradeHistory.length > 0
      ? (team.tradeHistory.filter(t => t.action === 'SELL' && t.realizedPnL > 0).length / 
         team.tradeHistory.filter(t => t.action === 'SELL').length * 100).toFixed(2)
      : 0;
    
    const avgTradeSize = team.tradeHistory.length > 0
      ? (team.tradeHistory.reduce((sum, t) => sum + (t.price * t.shares), 0) / 
         team.tradeHistory.length).toFixed(2)
      : 0;
    
    const response = {
      ...team,
      metrics: {
        winRate,
        avgTradeSize,
        totalTrades: team.totalTrades,
        profitableTrades: team.tradeHistory.filter(t => t.action === 'SELL' && t.realizedPnL > 0).length,
        losingTrades: team.tradeHistory.filter(t => t.action === 'SELL' && t.realizedPnL < 0).length,
        returnPct: ((team.portfolioValue - 50000) / 50000 * 100).toFixed(2)
      },
      portfolioHistory: tournamentData.portfolioHistory
        .map(h => ({
          timestamp: h.timestamp,
          value: h.teams.find(t => t.id === parseInt(teamId))?.portfolioValue || 0
        }))
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error getting team details:', error);
    res.status(500).json({ error: error.message });
  }
});
```

### Step 2: Add Frontend Modal Component

Add to your HTML (in the tournament section):

```html
<!-- Team Analysis Modal -->
<div id="teamAnalysisModal" class="modal" style="display: none;">
  <div class="modal-content team-analysis">
    <span class="close-modal" onclick="closeTeamAnalysis()">&times;</span>
    
    <div class="team-header">
      <h2 id="teamName"></h2>
      <div class="team-strategy" id="teamStrategy"></div>
    </div>
    
    <div class="team-metrics-grid">
      <div class="metric-card">
        <div class="metric-label">Portfolio Value</div>
        <div class="metric-value" id="portfolioValue">$0</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Return</div>
        <div class="metric-value" id="returnPct">0%</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Win Rate</div>
        <div class="metric-value" id="winRate">0%</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Total Trades</div>
        <div class="metric-value" id="totalTrades">0</div>
      </div>
    </div>
    
    <div class="team-sections">
      <!-- Current Holdings -->
      <div class="section">
        <h3>📊 Current Holdings</h3>
        <div id="currentHoldings" class="holdings-list"></div>
      </div>
      
      <!-- Trade History -->
      <div class="section">
        <h3>📈 Trade History</h3>
        <div id="tradeHistory" class="trade-list"></div>
      </div>
      
      <!-- Performance Chart -->
      <div class="section">
        <h3>📉 Performance Over Time</h3>
        <canvas id="teamPerformanceChart"></canvas>
      </div>
    </div>
  </div>
</div>
```

### Step 3: Add CSS Styling

```css
.modal {
  position: fixed;
  z-index: 10000;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-content.team-analysis {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border-radius: 20px;
  padding: 30px;
  max-width: 900px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.close-modal {
  color: #aaa;
  float: right;
  font-size: 28px;
  font-weight: bold;
  cursor: pointer;
  transition: color 0.3s;
}

.close-modal:hover {
  color: #fff;
}

.team-header {
  margin-bottom: 30px;
  border-bottom: 2px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 20px;
}

.team-header h2 {
  color: #fff;
  margin: 0 0 10px 0;
  font-size: 28px;
}

.team-strategy {
  color: #888;
  font-size: 14px;
}

.team-metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  margin-bottom: 30px;
}

.metric-card {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.metric-label {
  color: #888;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 8px;
}

.metric-value {
  color: #fff;
  font-size: 24px;
  font-weight: bold;
}

.metric-value.positive {
  color: #00ff88;
}

.metric-value.negative {
  color: #ff4444;
}

.team-sections {
  display: flex;
  flex-direction: column;
  gap: 25px;
}

.section {
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
  padding: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.section h3 {
  color: #fff;
  margin: 0 0 15px 0;
  font-size: 18px;
}

.holdings-list, .trade-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.holding-item, .trade-item {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-left: 3px solid transparent;
}

.holding-item {
  border-left-color: #4CAF50;
}

.trade-item.buy {
  border-left-color: #00ff88;
}

.trade-item.sell {
  border-left-color: #ff4444;
}

.trade-main {
  flex: 1;
}

.trade-symbol {
  color: #fff;
  font-weight: bold;
  font-size: 16px;
}

.trade-details {
  color: #888;
  font-size: 13px;
  margin-top: 5px;
}

.trade-reasoning {
  color: #aaa;
  font-size: 12px;
  margin-top: 8px;
  font-style: italic;
  padding-left: 10px;
  border-left: 2px solid rgba(255, 255, 255, 0.2);
}

.trade-pnl {
  text-align: right;
  font-weight: bold;
  font-size: 16px;
}

.trade-pnl.positive {
  color: #00ff88;
}

.trade-pnl.negative {
  color: #ff4444;
}
```

### Step 4: Add JavaScript Functions

```javascript
// Global variable to store team data
let currentTeamData = null;

// Function to open team analysis
async function showTeamAnalysis(teamId) {
  try {
    // Fetch team details from API
    const response = await fetch(`${window.API_BASE_URL}/api/tournament/team/${teamId}`);
    const teamData = await response.json();
    currentTeamData = teamData;
    
    // Populate modal
    document.getElementById('teamName').textContent = teamData.name;
    document.getElementById('teamStrategy').textContent = 
      `${teamData.strategy} • ${teamData.personality}`;
    
    // Metrics
    document.getElementById('portfolioValue').textContent = 
      `$${teamData.portfolioValue.toLocaleString()}`;
    
    const returnPct = teamData.metrics.returnPct;
    const returnEl = document.getElementById('returnPct');
    returnEl.textContent = `${returnPct > 0 ? '+' : ''}${returnPct}%`;
    returnEl.className = `metric-value ${returnPct >= 0 ? 'positive' : 'negative'}`;
    
    document.getElementById('winRate').textContent = `${teamData.metrics.winRate}%`;
    document.getElementById('totalTrades').textContent = teamData.metrics.totalTrades;
    
    // Current Holdings
    const holdingsHTML = Object.entries(teamData.holdings).map(([symbol, holding]) => `
      <div class="holding-item">
        <div class="trade-main">
          <div class="trade-symbol">${symbol}</div>
          <div class="trade-details">
            ${holding.shares} shares @ $${holding.avgCost.toFixed(2)} 
            • Current: $${holding.currentPrice.toFixed(2)}
          </div>
        </div>
        <div class="trade-pnl ${holding.unrealizedPnL >= 0 ? 'positive' : 'negative'}">
          ${holding.unrealizedPnL >= 0 ? '+' : ''}$${holding.unrealizedPnL.toFixed(2)}
        </div>
      </div>
    `).join('');
    
    document.getElementById('currentHoldings').innerHTML = 
      holdingsHTML || '<div style="color: #888;">No current holdings</div>';
    
    // Trade History (most recent first)
    const tradesHTML = teamData.tradeHistory
      .slice().reverse()
      .map(trade => `
        <div class="trade-item ${trade.action.toLowerCase()}">
          <div class="trade-main">
            <div class="trade-symbol">
              ${trade.action} ${trade.symbol}
            </div>
            <div class="trade-details">
              ${trade.shares} shares @ $${trade.price.toFixed(2)} 
              • ${new Date(trade.timestamp).toLocaleString()}
            </div>
            ${trade.reasoning ? `
              <div class="trade-reasoning">
                ${trade.reasoning}
              </div>
            ` : ''}
          </div>
          <div class="trade-pnl">
            $${(trade.price * trade.shares).toFixed(2)}
          </div>
        </div>
      `).join('');
    
    document.getElementById('tradeHistory').innerHTML = 
      tradesHTML || '<div style="color: #888;">No trades yet</div>';
    
    // Show modal
    document.getElementById('teamAnalysisModal').style.display = 'flex';
    
    // Draw performance chart
    drawTeamPerformanceChart(teamData.portfolioHistory);
    
  } catch (error) {
    console.error('Error loading team analysis:', error);
    alert('Failed to load team analysis');
  }
}

// Function to close modal
function closeTeamAnalysis() {
  document.getElementById('teamAnalysisModal').style.display = 'none';
  currentTeamData = null;
}

// Function to draw performance chart
function drawTeamPerformanceChart(portfolioHistory) {
  const canvas = document.getElementById('teamPerformanceChart');
  const ctx = canvas.getContext('2d');
  
  // Simple chart implementation (you can use Chart.js for better charts)
  canvas.width = canvas.offsetWidth;
  canvas.height = 300;
  
  if (!portfolioHistory || portfolioHistory.length === 0) {
    ctx.fillStyle = '#888';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('No performance data yet', canvas.width / 2, canvas.height / 2);
    return;
  }
  
  // Draw chart (simplified - use Chart.js for production)
  const values = portfolioHistory.map(h => h.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  
  ctx.strokeStyle = '#00ff88';
  ctx.lineWidth = 2;
  ctx.beginPath();
  
  portfolioHistory.forEach((point, i) => {
    const x = (i / (portfolioHistory.length - 1)) * canvas.width;
    const y = canvas.height - ((point.value - min) / range) * canvas.height;
    
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });
  
  ctx.stroke();
}

// Add click handlers to team elements
// Add this to your tournament leaderboard rendering code:
// <div class="team-row" onclick="showTeamAnalysis(${team.id})">
```

### Step 5: Update Tournament Leaderboard

Modify your tournament leaderboard rendering to add click handlers:

```javascript
// In your tournament rendering code, add onclick to team rows:
const teamHTML = teams.map(team => `
  <div class="team-row" onclick="showTeamAnalysis(${team.id})" style="cursor: pointer;">
    <div class="team-rank">#${team.rank}</div>
    <div class="team-name">${team.name}</div>
    <div class="team-value">$${team.portfolioValue.toLocaleString()}</div>
    <div class="team-return ${team.return >= 0 ? 'positive' : 'negative'}">
      ${team.return >= 0 ? '+' : ''}${team.return}%
    </div>
  </div>
`).join('');
```

---

## Usage

1. **Add the API endpoint** to `proxy-server.js`
2. **Add the modal HTML** to your tournament page
3. **Add the CSS** to your stylesheet
4. **Add the JavaScript functions** to your script
5. **Update team rows** to be clickable

**Result:** Click any team in the leaderboard to see detailed analysis, trade history, current holdings, and performance chart!

---

## Next Steps (Optional Enhancements)

- Add export to CSV/PDF functionality
- Add comparison between multiple teams
- Add real-time updates to the modal
- Add filtering/sorting of trade history
- Add more advanced metrics (Sharpe ratio, max drawdown, etc.)
