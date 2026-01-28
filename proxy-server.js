// Simple CORS Proxy for StockTwits and Reddit APIs
// Run with: node proxy-server.js

const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

// Data persistence file path
const TOURNAMENT_DATA_FILE = path.join(__dirname, 'tournament_data.json');

const app = express();
const PORT = process.env.PORT || 3002; // Use environment variable for cloud deployment

// API Keys - Use environment variables for security
const CLAUDE_API_KEY = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY;
const FMP_API_KEY = process.env.FMP_API_KEY || 'h43nCTpMeyiIiNquebaqktc7ChUHMxIz';

if (!CLAUDE_API_KEY) {
  console.error('⚠️  WARNING: ANTHROPIC_API_KEY not set in environment variables');
  console.error('   Please set ANTHROPIC_API_KEY in your .env file or hosting platform');
}

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

// Explicit root route - serve index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Serve static files from dist folder
app.use(express.static(path.join(__dirname, 'dist'), {
  index: false, // Don't serve index.html automatically
  fallthrough: true // Continue to next middleware if file not found
}));

// NOTE: Catch-all route moved to end of file (after all API routes)

// Store background processes
let enhancedAnalysisBackend = null;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function parseRetryAfterMs(headerValue) {
  if (!headerValue) return null;
  const trimmed = String(headerValue).trim();
  if (!trimmed) return null;

  const seconds = Number(trimmed);
  if (Number.isFinite(seconds)) return Math.max(0, seconds * 1000);

  const dateMs = Date.parse(trimmed);
  if (!Number.isFinite(dateMs)) return null;
  return Math.max(0, dateMs - Date.now());
}

async function fetchWithRetry(url, options = {}) {
  const {
    timeoutMs = 15000,
    retries = 2,
    retryDelayMs = 600,
    maxRetryDelayMs = 8000,
    jitterRatio = 0.25,
    ...fetchOptions
  } = options;

  const totalAttempts = Math.max(1, Number(retries) + 1);
  let lastError = null;
  let lastResponse = null;

  for (let attempt = 0; attempt < totalAttempts; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, { ...fetchOptions, signal: controller.signal });
      lastResponse = response;
      lastError = null;

      const canRetry = attempt < totalAttempts - 1;
      const shouldRetry = response.status === 429 || response.status === 408 || (response.status >= 500 && response.status <= 599);

      if (canRetry && shouldRetry) {
        const retryAfterMs = response.status === 429
          ? parseRetryAfterMs(response.headers?.get?.('Retry-After'))
          : null;
        const base = Math.min(maxRetryDelayMs, retryDelayMs * Math.pow(2, attempt));
        const jitter = base * jitterRatio * (Math.random() * 2 - 1);
        const waitMs = Math.max(0, Math.min(maxRetryDelayMs, (retryAfterMs ?? base) + jitter));
        console.warn(`⏳ [proxy] Retry ${attempt + 1}/${totalAttempts - 1} after ${Math.round(waitMs)}ms: ${url}`);
        await sleep(waitMs);
        continue;
      }

      return response;
    } catch (error) {
      lastError = error;
      lastResponse = null;

      const canRetry = attempt < totalAttempts - 1;
      if (canRetry) {
        const base = Math.min(maxRetryDelayMs, retryDelayMs * Math.pow(2, attempt));
        const jitter = base * jitterRatio * (Math.random() * 2 - 1);
        const waitMs = Math.max(0, Math.min(maxRetryDelayMs, base + jitter));
        console.warn(`⏳ [proxy] Retry ${attempt + 1}/${totalAttempts - 1} after ${Math.round(waitMs)}ms (error): ${url}`);
        await sleep(waitMs);
        continue;
      }

      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  if (lastResponse) return lastResponse;
  throw lastError || new Error('Request failed');
}

// Claude API proxy
app.post('/api/claude', async (req, res) => {
  const { messages, model, max_tokens } = req.body;
  
  if (!CLAUDE_API_KEY) {
     console.log('⚠️ No Anthropic API key found.');
     return res.status(500).json({ error: 'Claude API key not configured' });
  }

  try {
    console.log('📡 Proxying Claude request...');
    console.log('Model:', model || 'claude-3-5-sonnet-20241022');
    const response = await fetchWithRetry('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      timeoutMs: 30000,
      retries: 1,
      body: JSON.stringify({
        model: model || 'claude-3-5-sonnet-20241022',
        max_tokens: max_tokens || 2000,
        messages: messages
      })
    });
    
    const data = await response.json();
    if (data.error) {
      console.error('Claude API error:', data.error);
      throw new Error(data.error.message);
    }
    console.log('✅ Claude response received');
    res.json(data);
  } catch (error) {
    console.error('❌ Claude proxy error:', error.message);
    res.status(500).json({ error: 'Failed to fetch Claude analysis: ' + error.message });
  }
});

// StockTwits proxy
app.get('/api/stocktwits/:symbol', async (req, res) => {
  const { symbol } = req.params;
  const url = `https://api.stocktwits.com/api/2/streams/symbol/${symbol}.json`;
  
  try {
    console.log(`📡 Proxying StockTwits request for ${symbol}...`);
    const response = await fetchWithRetry(url, { timeoutMs: 15000, retries: 2 });
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('❌ StockTwits proxy error:', error.message);
    res.status(500).json({ error: 'Failed to fetch StockTwits data' });
  }
});

// Reddit proxy
app.get('/api/reddit/:subreddit/search', async (req, res) => {
  const { subreddit } = req.params;
  const { q } = req.query;
  const url = `https://www.reddit.com/r/${subreddit}/search.json?q=${q}&restrict_sr=1&limit=25&sort=new`;
  
  try {
    console.log(`📡 Proxying Reddit request for r/${subreddit} - ${q}...`);
    const response = await fetchWithRetry(url, {
      headers: {
        'User-Agent': 'RetailEdgePro/1.0 (Stock Analysis Tool)'
      },
      timeoutMs: 15000,
      retries: 2
    });
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error(`❌ Reddit proxy error (r/${subreddit}):`, error.message);
    res.status(500).json({ error: 'Failed to fetch Reddit data' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'CORS Proxy Server Running' });
});

// Autonomous Agent and Intelligent Agent removed

// Start Enhanced Analysis Backend
function startEnhancedAnalysisBackend() {
  console.log('\n📊 Starting Enhanced Analysis Backend...');
  
  try {
    // Spawn Python process for enhanced analysis backend
    enhancedAnalysisBackend = spawn('python', ['enhanced_analysis_backend.py'], {
      cwd: __dirname,
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: false,
      shell: true
    });

    enhancedAnalysisBackend.stdout.on('data', (data) => {
      const output = data.toString().trim();
      if (output) console.log(`[Enhanced Analysis] ${output}`);
    });

    enhancedAnalysisBackend.stderr.on('data', (data) => {
      const output = data.toString().trim();
      if (output && !output.includes('WARNING') && !output.includes('Tip:')) {
        console.error(`[Enhanced Analysis] ${output}`);
      }
    });

    enhancedAnalysisBackend.on('error', (error) => {
      console.error('❌ Failed to start Enhanced Analysis backend:', error.message);
      console.log('   Enhanced multi-source analysis will be unavailable');
    });

    enhancedAnalysisBackend.on('close', (code) => {
      if (code !== 0 && code !== null) {
        console.log(`⚠️  Enhanced Analysis backend exited with code ${code}`);
      }
      enhancedAnalysisBackend = null;
    });

    // Give it a moment to start
    setTimeout(() => {
      console.log('✅ Enhanced Analysis Backend started on http://localhost:5003');
      console.log('   Multi-source sentiment + 10-factor scoring');
    }, 2000);

  } catch (error) {
    console.error('❌ Error starting Enhanced Analysis backend:', error.message);
    console.log('   Continuing without enhanced analysis features...');
  }
}

// Enhanced Analysis proxy endpoint
app.get('/api/enhanced/analyze/:symbol', async (req, res) => {
  const { symbol } = req.params;
  
  try {
    console.log(`📊 Proxying enhanced analysis request for ${symbol}...`);
    const response = await fetchWithRetry(`http://localhost:5003/api/analyze/${symbol}`, {
      timeoutMs: 30000,
      retries: 1
    });
    
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error(`❌ Enhanced analysis error for ${symbol}:`, error.message);
    res.status(500).json({ error: 'Failed to fetch enhanced analysis' });
  }
});

// Enhanced Analysis health check proxy
app.get('/api/enhanced/health', async (req, res) => {
  try {
    const response = await fetchWithRetry('http://localhost:5003/api/health', {
      timeoutMs: 5000,
      retries: 1
    });
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(503).json({ status: 'unavailable', error: error.message });
  }
});

// Autonomous Agent and Multi-Agent endpoints removed

// ═══════════════════════════════════════════════════════════════════════════════
// AUTONOMOUS AI TOURNAMENT - Runs automatically during US market hours
// ═══════════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════════
// SECTOR MAPPING - For sector allocation tracking
// ═══════════════════════════════════════════════════════════════════════════════
const STOCK_SECTORS = {
  // Technology
  "AAPL": "Technology", "MSFT": "Technology", "GOOGL": "Technology", "GOOG": "Technology",
  "META": "Technology", "NVDA": "Technology", "AVGO": "Technology", "ADBE": "Technology",
  "CRM": "Technology", "CSCO": "Technology", "ORCL": "Technology", "AMD": "Technology",
  "INTC": "Technology", "QCOM": "Technology", "TXN": "Technology", "NOW": "Technology",
  "AMAT": "Technology", "ADI": "Technology", "LRCX": "Technology", "KLAC": "Technology",
  "SNPS": "Technology", "ADSK": "Technology", "NXPI": "Technology", "FTNT": "Technology",
  "TSM": "Technology", "ASML": "Technology", "MU": "Technology", "MRVL": "Technology",
  "ON": "Technology", "QRVO": "Technology", "STM": "Technology", "GFS": "Technology",
  "WOLF": "Technology", "LSCC": "Technology", "PANW": "Technology", "CRWD": "Technology",
  "ZS": "Technology", "OKTA": "Technology", "MDB": "Technology", "TEAM": "Technology",
  "DDOG": "Technology", "SNOW": "Technology", "NET": "Technology", "PLTR": "Technology",

  // Consumer Discretionary
  "AMZN": "Consumer Discretionary", "TSLA": "Consumer Discretionary", "HD": "Consumer Discretionary",
  "MCD": "Consumer Discretionary", "NKE": "Consumer Discretionary", "SBUX": "Consumer Discretionary",
  "LOW": "Consumer Discretionary", "TJX": "Consumer Discretionary", "BKNG": "Consumer Discretionary",
  "MAR": "Consumer Discretionary", "CMG": "Consumer Discretionary", "DHI": "Consumer Discretionary",
  "UBER": "Consumer Discretionary", "LYFT": "Consumer Discretionary", "ABNB": "Consumer Discretionary",
  "SHOP": "Consumer Discretionary", "ROKU": "Consumer Discretionary", "DKNG": "Consumer Discretionary",
  "RBLX": "Consumer Discretionary", "GME": "Consumer Discretionary", "AMC": "Consumer Discretionary",
  "RIVN": "Consumer Discretionary", "LCID": "Consumer Discretionary", "NIO": "Consumer Discretionary",
  "XPEV": "Consumer Discretionary", "LI": "Consumer Discretionary", "GM": "Consumer Discretionary",
  "F": "Consumer Discretionary",

  // Healthcare
  "UNH": "Healthcare", "JNJ": "Healthcare", "LLY": "Healthcare", "ABBV": "Healthcare",
  "MRK": "Healthcare", "TMO": "Healthcare", "ABT": "Healthcare", "DHR": "Healthcare",
  "BMY": "Healthcare", "AMGN": "Healthcare", "ISRG": "Healthcare", "SYK": "Healthcare",
  "VRTX": "Healthcare", "GILD": "Healthcare", "CI": "Healthcare", "REGN": "Healthcare",
  "ZTS": "Healthcare", "CVS": "Healthcare", "ELV": "Healthcare", "HUM": "Healthcare",
  "BDX": "Healthcare", "BSX": "Healthcare", "HCA": "Healthcare", "MCK": "Healthcare",

  // Financials
  "BRK.B": "Financials", "JPM": "Financials", "V": "Financials", "MA": "Financials",
  "BAC": "Financials", "WFC": "Financials", "MS": "Financials", "BLK": "Financials",
  "GS": "Financials", "AXP": "Financials", "SPGI": "Financials", "C": "Financials",
  "SCHW": "Financials", "PNC": "Financials", "CB": "Financials", "MMC": "Financials",
  "AON": "Financials", "CME": "Financials", "ICE": "Financials", "MCO": "Financials",
  "TRV": "Financials", "AFL": "Financials", "MET": "Financials", "PRU": "Financials",
  "AIG": "Financials", "COF": "Financials", "USB": "Financials", "TFC": "Financials",
  "ALL": "Financials", "PGR": "Financials", "COIN": "Financials", "SQ": "Financials",
  "PYPL": "Financials", "SOFI": "Financials", "HOOD": "Financials", "AFRM": "Financials",

  // Communication Services
  "NFLX": "Communication Services", "DIS": "Communication Services", "CMCSA": "Communication Services",
  "VZ": "Communication Services", "T": "Communication Services", "SNAP": "Communication Services",
  "PINS": "Communication Services", "TWLO": "Communication Services", "ZM": "Communication Services",
  "BABA": "Communication Services", "BIDU": "Communication Services", "BILI": "Communication Services",
  "NTES": "Communication Services", "JD": "Communication Services", "PDD": "Communication Services",

  // Energy
  "XOM": "Energy", "CVX": "Energy", "COP": "Energy", "SLB": "Energy", "EOG": "Energy",
  "PSX": "Energy", "MPC": "Energy", "ENPH": "Energy", "SEDG": "Energy", "FSLR": "Energy",
  "RUN": "Energy", "PLUG": "Energy", "BE": "Energy", "BLNK": "Energy", "CHPT": "Energy",
  "QS": "Energy", "HYLN": "Energy", "NKLA": "Energy", "FSR": "Energy", "GOEV": "Energy",

  // Industrials
  "HON": "Industrials", "UNP": "Industrials", "BA": "Industrials", "RTX": "Industrials",
  "UPS": "Industrials", "CAT": "Industrials", "DE": "Industrials", "GE": "Industrials",
  "LMT": "Industrials", "NOC": "Industrials", "GD": "Industrials", "NSC": "Industrials",
  "ITW": "Industrials", "EMR": "Industrials", "ROP": "Industrials", "PH": "Industrials",
  "ETN": "Industrials", "PCAR": "Industrials", "CARR": "Industrials", "WM": "Industrials",
  "RSG": "Industrials", "MSI": "Industrials", "TT": "Industrials", "AJG": "Industrials",
  "PAYX": "Industrials", "ADP": "Industrials", "FIS": "Industrials", "FISV": "Industrials",

  // Consumer Staples
  "PG": "Consumer Staples", "COST": "Consumer Staples", "PEP": "Consumer Staples",
  "KO": "Consumer Staples", "WMT": "Consumer Staples", "PM": "Consumer Staples",
  "MO": "Consumer Staples", "MDLZ": "Consumer Staples", "TGT": "Consumer Staples",
  "CL": "Consumer Staples", "KMB": "Consumer Staples", "MNST": "Consumer Staples",
  "SYY": "Consumer Staples", "ORLY": "Consumer Staples", "AZO": "Consumer Staples",

  // Real Estate
  "PLD": "Real Estate", "EQIX": "Real Estate", "PSA": "Real Estate", "CCI": "Real Estate",
  "SRE": "Real Estate", "APH": "Real Estate",

  // Utilities
  "NEE": "Utilities", "DUK": "Utilities", "SO": "Utilities", "D": "Utilities",
  "AEP": "Utilities", "ECL": "Utilities",

  // Materials
  "LIN": "Materials", "FCX": "Materials", "APD": "Materials", "SHW": "Materials",
  "DD": "Materials", "MMM": "Materials", "TEL": "Materials",

  // Other/Miscellaneous
  "INTU": "Technology", "WDAY": "Technology", "VEEV": "Technology", "PATH": "Technology",
  "DOCU": "Technology", "BB": "Technology", "NOK": "Technology", "SNDL": "Healthcare",
  "CLOV": "Healthcare", "WISH": "Consumer Discretionary", "RKT": "Financials"
};

// Get sector for a stock symbol
function getStockSector(symbol) {
  return STOCK_SECTORS[symbol] || 'Other';
}

// Full stock watchlist - all stocks from the app
const FULL_WATCHLIST = [
  // Major Tech & S&P 500
  "AAPL", "MSFT", "GOOGL", "GOOG", "AMZN", "NVDA", "TSLA", "META", "BRK.B", "UNH",
  "XOM", "JNJ", "JPM", "V", "PG", "MA", "HD", "CVX", "LLY", "ABBV", "MRK", "AVGO",
  "COST", "PEP", "KO", "ADBE", "TMO", "WMT", "MCD", "CSCO", "ACN", "ABT", "CRM",
  "NFLX", "DHR", "LIN", "NKE", "VZ", "CMCSA", "TXN", "DIS", "PM", "NEE", "BMY",
  "ORCL", "AMD", "INTC", "QCOM", "RTX", "UPS", "T", "HON", "UNP", "BA", "SPGI",
  "COP", "SBUX", "LOW", "INTU", "AMGN", "GE", "DE", "CAT", "PLD", "ISRG", "MS",
  "BLK", "GS", "AXP", "NOW", "AMAT", "TJX", "ELV", "ADI", "SYK", "BKNG", "MDLZ",
  "LMT", "VRTX", "GILD", "CI", "ADP", "REGN", "ZTS", "PGR", "CVS", "MMC", "TGT",
  "SLB", "LRCX", "CB", "ETN", "C", "MO", "SO", "BDX", "DUK", "SCHW", "BSX", "PNC",
  "PYPL", "EQIX", "FISV", "ITW", "MMM", "FCX", "AON", "CL", "APD", "USB", "CME",
  "ICE", "GM", "WM", "F", "NOC", "MCO", "NSC", "PSX", "CCI", "MPC", "SHW", "MCK",
  "EMR", "ROP", "EOG", "KLAC", "HCA", "ECL", "MSI", "GD", "PSA", "APH", "PH",
  "ADSK", "SNPS", "SRE", "AJG", "TEL", "TFC", "AIG", "COF", "MAR", "AFL", "TT",
  "MET", "NXPI", "FIS", "PCAR", "CARR", "TRV", "SYY", "ALL", "AEP", "AZO", "PAYX",
  "PRU", "ORLY", "FTNT", "HUM", "DHI", "D", "DD", "KMB", "MNST", "RSG", "CMG",
  // Tech Growth & Cloud
  "UBER", "LYFT", "ABNB", "COIN", "SHOP", "SQ", "ROKU", "SNAP", "PINS", "TWLO",
  "ZM", "DOCU", "DDOG", "SNOW", "NET", "CRWD", "ZS", "OKTA", "PANW", "MDB",
  "TEAM", "WDAY", "VEEV", "DKNG", "RBLX", "PATH", "PLTR", "SOFI", "HOOD", "AFRM",
  // EV & Clean Energy
  "RIVN", "LCID", "NIO", "XPEV", "LI", "ENPH", "SEDG", "FSLR", "RUN", "PLUG",
  "BE", "BLNK", "CHPT", "QS", "FSR", "GOEV", "NKLA", "HYLN",
  // Semiconductors
  "TSM", "ASML", "MU", "MRVL", "ON", "QRVO", "STM", "GFS", "WOLF", "LSCC",
  // Chinese Tech
  "BABA", "JD", "PDD", "BIDU", "NTES", "BILI", "NIO", "XPEV", "LI",
  // Meme & Retail Favorites
  "AMC", "GME", "BB", "NOK", "SNDL", "CLOV", "WISH", "RKT"
];

// Price cache to avoid excessive API calls
const priceCache = {
  prices: {},
  lastFetch: null,
  cacheDuration: 60000 // Cache for 1 minute
};

let tournamentState = {
  running: false,
  experimentId: null,
  teams: [],
  trades: [],
  watchlist: FULL_WATCHLIST,
  marketCheckInterval: null,
  tradeInterval: null,
  portfolioHistory: [], // Track portfolio values over time for charting
  portfolioUpdateInterval: null // For live P/L updates
};

// ═══════════════════════════════════════════════════════════════════════════════
// DATA PERSISTENCE - Save/Load tournament state to survive server restarts
// ═══════════════════════════════════════════════════════════════════════════════

function saveTournamentState() {
  try {
    // Only save the data we need to persist (exclude intervals and functions)
    const dataToSave = {
      experimentId: tournamentState.experimentId,
      teams: tournamentState.teams.map(t => ({
        id: t.id,
        name: t.name,
        model: t.model,
        strategy: t.strategy,
        personality: t.personality,
        focuses: t.focuses,
        portfolioValue: t.portfolioValue,
        cash: t.cash,
        invested: t.invested,
        realizedPnL: t.realizedPnL,
        unrealizedPnL: t.unrealizedPnL,
        totalTrades: t.totalTrades,
        holdings: t.holdings,
        tradeHistory: t.tradeHistory
      })),
      trades: tournamentState.trades,
      portfolioHistory: tournamentState.portfolioHistory,
      savedAt: new Date().toISOString()
    };

    fs.writeFileSync(TOURNAMENT_DATA_FILE, JSON.stringify(dataToSave, null, 2));
    console.log('[Tournament] State saved to disk');
  } catch (error) {
    console.error('[Tournament] Error saving state:', error.message);
  }
}

function loadTournamentState() {
  try {
    if (fs.existsSync(TOURNAMENT_DATA_FILE)) {
      const data = JSON.parse(fs.readFileSync(TOURNAMENT_DATA_FILE, 'utf8'));

      // Check if data is recent (within last 24 hours) to avoid loading stale data
      const savedAt = new Date(data.savedAt);
      const hoursSinceSave = (Date.now() - savedAt.getTime()) / (1000 * 60 * 60);

      if (hoursSinceSave > 24) {
        console.log('[Tournament] Saved data is older than 24 hours, starting fresh');
        return false;
      }

      if (data.teams && data.teams.length > 0) {
        tournamentState.experimentId = data.experimentId;
        tournamentState.teams = data.teams;
        tournamentState.trades = data.trades || [];
        tournamentState.portfolioHistory = data.portfolioHistory || [];

        console.log(`[Tournament] Restored state from ${savedAt.toLocaleString()}`);
        console.log(`[Tournament] ${data.teams.length} teams, ${data.trades?.length || 0} trades loaded`);
        return true;
      }
    }
  } catch (error) {
    console.error('[Tournament] Error loading state:', error.message);
  }
  return false;
}

// Team configurations with distinct AI personalities
const TEAM_CONFIGS = {
  1: {
    name: 'Claude (Sonnet)',
    model: 'Claude-3-Sonnet',
    strategy: 'balanced',
    personality: 'analytical and cautious',
    focuses: ['fundamentals', 'long-term value', 'risk management']
  },
  2: {
    name: 'Kimi',
    model: 'Kimi-K2',
    strategy: 'aggressive',
    personality: 'bold and trend-following',
    focuses: ['momentum', 'breakouts', 'market sentiment']
  },
  3: {
    name: 'DeepSeek V3',
    model: 'DeepSeek-V3',
    strategy: 'conservative',
    personality: 'conservative and dividend-focused',
    focuses: ['stability', 'dividends', 'blue chips']
  },
  4: {
    name: 'Gemini Pro',
    model: 'Gemini-Pro',
    strategy: 'momentum',
    personality: 'data-driven and adaptive',
    focuses: ['technical analysis', 'patterns', 'volume']
  }
};

// AI reasoning templates based on strategy
const REASONING_TEMPLATES = {
  BUY: {
    aggressive: [
      "Strong upward momentum detected. RSI indicates oversold conditions reversing. Entry point looks favorable for a quick gain.",
      "Breakout above key resistance level. Volume surge confirms bullish sentiment. Time to ride the wave.",
      "Market sentiment turning positive. Social media buzz increasing. This could run higher.",
      "Technical indicators aligning bullishly. MACD crossover signals buying opportunity."
    ],
    balanced: [
      "Solid fundamentals with reasonable P/E ratio. Recent dip provides good entry point with acceptable risk/reward.",
      "Company showing steady growth. Current price below intrinsic value estimate. Building position gradually.",
      "Diversification opportunity. This sector is underweight in portfolio. Risk-adjusted return looks attractive.",
      "Earnings beat expectations last quarter. Management guidance positive. Worth accumulating."
    ],
    conservative: [
      "Blue chip stock trading at discount to peers. Strong dividend yield provides downside protection.",
      "Defensive positioning ahead of market uncertainty. This name has weathered storms before.",
      "Cash-rich balance sheet and consistent earnings. Safe harbor in volatile markets.",
      "Low beta stock for portfolio stability. Dividend aristocrat with 20+ years of increases."
    ],
    momentum: [
      "Price crossed above 50-day MA with volume confirmation. Trend is clearly up.",
      "Relative strength vs. S&P500 improving. Sector rotation favoring this name.",
      "Cup and handle pattern completing. Technical setup suggests 15%+ upside potential.",
      "Institutional accumulation detected. Smart money flowing in."
    ]
  },
  SELL: {
    aggressive: [
      "Momentum fading. Taking profits before the crowd. Better opportunities elsewhere.",
      "Resistance level rejected twice. Risk/reward no longer favorable. Cutting position.",
      "Overbought on multiple timeframes. Time to lock in gains before pullback.",
      "Volume declining on up days. Distribution pattern forming. Exiting."
    ],
    balanced: [
      "Position reached target price. Rebalancing to maintain risk parameters.",
      "Valuation stretched relative to growth rate. Reducing exposure to manage risk.",
      "Sector allocation exceeded target. Trimming to stay diversified.",
      "Better risk-adjusted opportunities available. Reallocating capital."
    ],
    conservative: [
      "Taking partial profits to preserve capital. Will re-enter on pullback.",
      "Dividend yield compressed below acceptable threshold. Better income elsewhere.",
      "Macro headwinds emerging for this sector. Reducing exposure proactively.",
      "Position size grew too large. Trimming for portfolio balance."
    ],
    momentum: [
      "Trend broken. Price below 20-day MA with increasing volume. Exit signal triggered.",
      "Relative strength weakening. Rotating to stronger names.",
      "Head and shoulders pattern confirmed. Downside target activated.",
      "Momentum indicators diverging negatively. Time to step aside."
    ]
  }
};

// Competitive awareness reasoning based on ranking
const COMPETITIVE_REASONING = {
  leading: {
    aggressive: [
      "Currently in the lead. Pressing the advantage with calculated aggression to extend the gap.",
      "Holding first place. Not getting complacent - continuing momentum plays to stay ahead.",
      "Leading the pack. Taking measured risks to maintain dominance over competitors."
    ],
    balanced: [
      "In first place. Maintaining disciplined approach that got us here. No need to change strategy.",
      "Leading the tournament. Staying focused on fundamentals while protecting gains.",
      "Ahead of competitors. Balanced approach working well - continuing steady execution."
    ],
    conservative: [
      "Currently leading. Protecting gains with defensive positioning. No need for unnecessary risks.",
      "In first place. Shifting slightly more conservative to lock in the lead.",
      "Ahead of the pack. Quality over quantity now - preserving capital advantage."
    ],
    momentum: [
      "Leading the tournament. Momentum is on our side - riding the winners.",
      "In first place. Technical edge working - continuing trend-following approach.",
      "Ahead of competitors. Strong relative performance - no reason to deviate."
    ]
  },
  trailing: {
    aggressive: [
      "Behind in standings. Time to be more aggressive - need higher-beta plays to catch up.",
      "Trailing the leader. Increasing position sizes on high-conviction plays to close the gap.",
      "Need to make up ground. Taking calculated risks on momentum names to recover."
    ],
    balanced: [
      "Behind competitors. Slightly increasing risk tolerance while maintaining discipline.",
      "Trailing in standings. Looking for quality opportunities to improve position without overreaching.",
      "Need to catch up. Adjusting risk parameters modestly while staying true to fundamentals."
    ],
    conservative: [
      "Behind but not panicking. Sticking to quality names - one good trade can change everything.",
      "Trailing leaders. Patience is key - opportunities will come without chasing.",
      "Behind in standings. Maintaining discipline - conservative approach can still win."
    ],
    momentum: [
      "Trailing competitors. Scanning for breakout setups to quickly close the gap.",
      "Behind in standings. Need to catch the next big mover - watching for volume surges.",
      "Need to recover ground. Looking for high-momentum plays with clear technical patterns."
    ]
  },
  middle: {
    aggressive: [
      "Mid-pack position. Seeing opportunity to move up with aggressive positioning on this trade.",
      "Currently in the middle. Time to make a push - this setup could leap us ahead.",
      "Not leading but not trailing badly. Aggressive move here could change our position."
    ],
    balanced: [
      "Middle of the pack. Steady execution will get us to the top - no need to force trades.",
      "Mid-tier position. Continuing balanced approach - consistent gains add up.",
      "In the middle standings. Focused on quality setups that align with strategy."
    ],
    conservative: [
      "Middle position. Patient accumulation of quality names will pay off over time.",
      "Mid-pack. Not chasing - letting opportunities come to us with defensive names.",
      "Currently in middle. Conservative plays compounding - staying the course."
    ],
    momentum: [
      "Mid-standings position. Following the momentum wherever it leads for an edge.",
      "In the middle of the pack. Technical setups look good - executing on signals.",
      "Middle position. Trend-following strategy will separate us from the pack."
    ]
  }
};

// Get team's competitive position
function getCompetitivePosition(team) {
  const sortedTeams = [...tournamentState.teams].sort((a, b) => b.portfolioValue - a.portfolioValue);
  const rank = sortedTeams.findIndex(t => t.id === team.id) + 1;
  const totalTeams = sortedTeams.length;

  const leader = sortedTeams[0];
  const gap = leader.portfolioValue - team.portfolioValue;
  const gapPercent = ((gap / 50000) * 100).toFixed(2);

  return {
    rank,
    totalTeams,
    isLeading: rank === 1,
    isTrailing: rank === totalTeams,
    isMiddle: rank > 1 && rank < totalTeams,
    gap,
    gapPercent,
    leader: leader.name,
    position: rank === 1 ? 'leading' : (rank >= totalTeams - 1 ? 'trailing' : 'middle')
  };
}

// Check if US market is open (9:30 AM - 4:00 PM ET, Mon-Fri)
function isMarketOpen() {
  const now = new Date();
  const etOptions = { timeZone: 'America/New_York' };
  const etString = now.toLocaleString('en-US', etOptions);
  const et = new Date(etString);

  const day = et.getDay(); // 0 = Sunday, 6 = Saturday
  const hour = et.getHours();
  const minute = et.getMinutes();
  const timeInMinutes = hour * 60 + minute;

  // Market open: 9:30 AM (570 mins) to 4:00 PM (960 mins), Mon-Fri
  const marketOpen = 9 * 60 + 30; // 9:30 AM
  const marketClose = 16 * 60; // 4:00 PM

  const isWeekday = day >= 1 && day <= 5;
  const isDuringHours = timeInMinutes >= marketOpen && timeInMinutes < marketClose;

  return isWeekday && isDuringHours;
}

function getMarketStatus() {
  const now = new Date();
  const etOptions = { timeZone: 'America/New_York' };
  const etString = now.toLocaleString('en-US', etOptions);
  const et = new Date(etString);

  const day = et.getDay();
  const hour = et.getHours();
  const minute = et.getMinutes();

  if (day === 0 || day === 6) {
    return { open: false, message: 'Market closed (Weekend)' };
  }

  const timeInMinutes = hour * 60 + minute;
  const marketOpen = 9 * 60 + 30;
  const marketClose = 16 * 60;

  if (timeInMinutes < marketOpen) {
    const minsUntilOpen = marketOpen - timeInMinutes;
    const hrs = Math.floor(minsUntilOpen / 60);
    const mins = minsUntilOpen % 60;
    return { open: false, message: `Market opens in ${hrs}h ${mins}m` };
  }

  if (timeInMinutes >= marketClose) {
    return { open: false, message: 'Market closed for today' };
  }

  const minsUntilClose = marketClose - timeInMinutes;
  const hrs = Math.floor(minsUntilClose / 60);
  const mins = minsUntilClose % 60;
  return { open: true, message: `Market open (closes in ${hrs}h ${mins}m)` };
}

function generateReasoning(team, action, symbol) {
  const templates = REASONING_TEMPLATES[action][team.strategy];
  const baseReasoning = templates[Math.floor(Math.random() * templates.length)];

  // Add competitive awareness (50% chance to include competitive context)
  if (tournamentState.teams.length >= 2 && Math.random() < 0.5) {
    const position = getCompetitivePosition(team);
    const competitiveTemplates = COMPETITIVE_REASONING[position.position][team.strategy];
    const competitiveNote = competitiveTemplates[Math.floor(Math.random() * competitiveTemplates.length)];

    // Add specific competitor reference for more dynamic reasoning
    if (position.isTrailing && position.gap > 0) {
      return `${baseReasoning} [Tournament Awareness: ${competitiveNote} ${position.leader} leads by ${position.gapPercent}%.]`;
    } else if (position.isLeading) {
      const secondPlace = tournamentState.teams
        .filter(t => t.id !== team.id)
        .sort((a, b) => b.portfolioValue - a.portfolioValue)[0];
      const leadGap = ((team.portfolioValue - secondPlace.portfolioValue) / 50000 * 100).toFixed(2);
      return `${baseReasoning} [Tournament Awareness: ${competitiveNote} Leading ${secondPlace.name} by ${leadGap}%.]`;
    } else {
      return `${baseReasoning} [Tournament Awareness: ${competitiveNote}]`;
    }
  }

  return baseReasoning;
}

// ═══════════════════════════════════════════════════════════════════════════════
// REAL AI DECISION MAKING - Each team uses Claude to analyze and decide trades
// ═══════════════════════════════════════════════════════════════════════════════

// Fetch market data for AI analysis
async function fetchMarketDataForAI(symbols) {
  try {
    const symbolList = symbols.slice(0, 10).join(','); // Limit to 10 for API efficiency
    const url = `https://financialmodelingprep.com/stable/quote?symbol=${symbolList}&apikey=${FMP_API_KEY}`;
    const response = await fetchWithRetry(url, { timeoutMs: 10000, retries: 1 });
    const data = await response.json();

    if (Array.isArray(data)) {
      return data.map(quote => ({
        symbol: quote.symbol,
        price: quote.price,
        change: quote.change,
        changesPercentage: quote.changesPercentage,
        dayHigh: quote.dayHigh,
        dayLow: quote.dayLow,
        volume: quote.volume,
        avgVolume: quote.avgVolume,
        marketCap: quote.marketCap,
        pe: quote.pe,
        eps: quote.eps,
        yearHigh: quote.yearHigh,
        yearLow: quote.yearLow
      }));
    }
    return [];
  } catch (error) {
    console.error('[AI] Error fetching market data:', error.message);
    return [];
  }
}

// Get AI trading decision from Claude
async function getAITradingDecision(team, marketData, competitivePosition) {
  if (!CLAUDE_API_KEY) {
    console.log('[AI] No Claude API key - using simulated decision');
    return null;
  }

  try {
    // Build context about current holdings
    const holdingsSummary = Object.entries(team.holdings || {})
      .map(([sym, pos]) => `${sym}: ${pos.shares} shares @ $${pos.avgCost.toFixed(2)} (P/L: ${pos.unrealizedPnL >= 0 ? '+' : ''}$${pos.unrealizedPnL.toFixed(2)})`)
      .join('\n') || 'No current holdings';

    // Build market data summary
    const marketSummary = marketData.slice(0, 8).map(s =>
      `${s.symbol}: $${s.price?.toFixed(2)} (${s.changesPercentage >= 0 ? '+' : ''}${s.changesPercentage?.toFixed(2)}%) Vol: ${(s.volume/1000000).toFixed(1)}M P/E: ${s.pe?.toFixed(1) || 'N/A'}`
    ).join('\n');

    const prompt = `You are ${team.name}, an AI trading agent with a ${team.strategy} strategy. You are ${team.personality} and focus on ${team.focuses.join(', ')}.

TOURNAMENT STATUS:
- Your Portfolio: $${team.portfolioValue.toFixed(2)} (Cash: $${team.cash.toFixed(2)})
- Position: Rank ${competitivePosition.rank} of ${competitivePosition.totalTeams}
- ${competitivePosition.isLeading ? 'You are LEADING!' : competitivePosition.isTrailing ? `TRAILING by ${competitivePosition.gapPercent}%` : 'Middle of the pack'}

CURRENT HOLDINGS:
${holdingsSummary}

MARKET DATA (Today's movers):
${marketSummary}

Based on your strategy and the market conditions, decide on ONE trade action. Consider:
1. Your strategy (${team.strategy}) and risk tolerance
2. Current holdings and diversification
3. Competitive position in tournament
4. Today's market movements

Respond in this EXACT JSON format only:
{"action": "BUY" or "SELL" or "HOLD", "symbol": "TICKER", "shares": number, "reasoning": "2-3 sentence explanation"}

If HOLD, use: {"action": "HOLD", "symbol": null, "shares": 0, "reasoning": "explanation"}`;

    const response = await fetchWithRetry('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      timeoutMs: 30000,
      retries: 1,
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022', // Use Haiku for cost efficiency
        max_tokens: 300,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const result = await response.json();

    if (result.error) {
      console.error(`[AI] Claude API error for ${team.name}:`, result.error.message);
      return null;
    }

    const content = result.content?.[0]?.text || '';

    // Parse JSON response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const decision = JSON.parse(jsonMatch[0]);
      console.log(`[AI] ${team.name} decision: ${decision.action} ${decision.shares || ''} ${decision.symbol || ''}`);
      return decision;
    }

    return null;
  } catch (error) {
    console.error(`[AI] Error getting decision for ${team.name}:`, error.message);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// PERFORMANCE METRICS - Calculate Sharpe ratio, win rate, max drawdown, etc.
// ═══════════════════════════════════════════════════════════════════════════════

function calculatePerformanceMetrics(team) {
  const trades = team.tradeHistory || [];
  const startValue = 50000;
  const currentValue = team.portfolioValue;

  // Total Return
  const totalReturn = ((currentValue - startValue) / startValue) * 100;

  // Win Rate (for closed trades with realized P/L)
  const closedTrades = trades.filter(t => t.action === 'SELL' && t.realizedPnL !== undefined);
  const winningTrades = closedTrades.filter(t => t.realizedPnL > 0);
  const winRate = closedTrades.length > 0 ? (winningTrades.length / closedTrades.length) * 100 : 0;

  // Average Gain/Loss
  const avgGain = winningTrades.length > 0
    ? winningTrades.reduce((sum, t) => sum + t.realizedPnL, 0) / winningTrades.length
    : 0;
  const losingTrades = closedTrades.filter(t => t.realizedPnL <= 0);
  const avgLoss = losingTrades.length > 0
    ? Math.abs(losingTrades.reduce((sum, t) => sum + t.realizedPnL, 0) / losingTrades.length)
    : 0;

  // Profit Factor
  const grossProfit = winningTrades.reduce((sum, t) => sum + t.realizedPnL, 0);
  const grossLoss = Math.abs(losingTrades.reduce((sum, t) => sum + t.realizedPnL, 0));
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0;

  // Max Drawdown (from portfolio history)
  let maxDrawdown = 0;
  let peak = startValue;
  const history = tournamentState.portfolioHistory || [];
  for (const point of history) {
    const teamData = point.teams?.find(t => t.id === team.id);
    if (teamData) {
      if (teamData.portfolioValue > peak) {
        peak = teamData.portfolioValue;
      }
      const drawdown = ((peak - teamData.portfolioValue) / peak) * 100;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }
  }

  // Best and Worst Trade
  const bestTrade = closedTrades.length > 0
    ? closedTrades.reduce((best, t) => t.realizedPnL > best.realizedPnL ? t : best, closedTrades[0])
    : null;
  const worstTrade = closedTrades.length > 0
    ? closedTrades.reduce((worst, t) => t.realizedPnL < worst.realizedPnL ? t : worst, closedTrades[0])
    : null;

  // Sharpe Ratio (simplified - using daily returns from history)
  let sharpeRatio = 0;
  if (history.length > 2) {
    const returns = [];
    for (let i = 1; i < history.length; i++) {
      const prevData = history[i-1].teams?.find(t => t.id === team.id);
      const currData = history[i].teams?.find(t => t.id === team.id);
      if (prevData && currData && prevData.portfolioValue > 0) {
        returns.push((currData.portfolioValue - prevData.portfolioValue) / prevData.portfolioValue);
      }
    }
    if (returns.length > 1) {
      const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
      const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
      const stdDev = Math.sqrt(variance);
      // Annualized (assuming ~252 trading days, ~78 updates per day at 5min intervals)
      sharpeRatio = stdDev > 0 ? (avgReturn / stdDev) * Math.sqrt(252 * 78) : 0;
    }
  }

  return {
    totalReturn: Math.round(totalReturn * 100) / 100,
    winRate: Math.round(winRate * 100) / 100,
    avgGain: Math.round(avgGain * 100) / 100,
    avgLoss: Math.round(avgLoss * 100) / 100,
    profitFactor: profitFactor === Infinity ? 999 : Math.round(profitFactor * 100) / 100,
    maxDrawdown: Math.round(maxDrawdown * 100) / 100,
    sharpeRatio: Math.round(sharpeRatio * 100) / 100,
    totalTrades: trades.length,
    closedTrades: closedTrades.length,
    bestTrade: bestTrade ? {
      symbol: bestTrade.symbol,
      pnl: Math.round(bestTrade.realizedPnL * 100) / 100
    } : null,
    worstTrade: worstTrade ? {
      symbol: worstTrade.symbol,
      pnl: Math.round(worstTrade.realizedPnL * 100) / 100
    } : null
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTOR ALLOCATION - Calculate sector breakdown for each team
// ═══════════════════════════════════════════════════════════════════════════════

function calculateSectorAllocation(team) {
  const holdings = team.holdings || {};
  const sectors = {};
  let totalValue = 0;

  for (const [symbol, position] of Object.entries(holdings)) {
    const sector = getStockSector(symbol);
    const value = position.marketValue || (position.shares * position.currentPrice);

    if (!sectors[sector]) {
      sectors[sector] = { value: 0, holdings: [] };
    }
    sectors[sector].value += value;
    sectors[sector].holdings.push({
      symbol,
      shares: position.shares,
      value: Math.round(value * 100) / 100
    });
    totalValue += value;
  }

  // Calculate percentages
  const allocation = Object.entries(sectors).map(([sector, data]) => ({
    sector,
    value: Math.round(data.value * 100) / 100,
    percentage: totalValue > 0 ? Math.round((data.value / totalValue) * 10000) / 100 : 0,
    holdings: data.holdings
  })).sort((a, b) => b.value - a.value);

  return {
    totalInvested: Math.round(totalValue * 100) / 100,
    cashPercentage: Math.round((team.cash / team.portfolioValue) * 10000) / 100,
    sectors: allocation
  };
}

// Fetch real-time prices from FMP API
async function fetchRealTimePrices(symbols) {
  const now = Date.now();

  // Return cached prices if still valid
  if (priceCache.lastFetch && (now - priceCache.lastFetch) < priceCache.cacheDuration) {
    const cachedPrices = {};
    let allCached = true;
    for (const symbol of symbols) {
      if (priceCache.prices[symbol]) {
        cachedPrices[symbol] = priceCache.prices[symbol];
      } else {
        allCached = false;
        break;
      }
    }
    if (allCached) {
      return cachedPrices;
    }
  }

  try {
    // FMP allows batch quotes with comma-separated symbols
    const symbolList = symbols.join(',');
    const url = `https://financialmodelingprep.com/stable/quote?symbol=${symbolList}&apikey=${FMP_API_KEY}`;

    console.log(`[Tournament] Fetching real-time prices for ${symbols.length} symbols...`);

    const response = await fetchWithRetry(url, { timeoutMs: 10000, retries: 2 });
    const data = await response.json();

    const prices = {};
    if (Array.isArray(data)) {
      for (const quote of data) {
        if (quote.symbol && quote.price) {
          prices[quote.symbol] = quote.price;
          priceCache.prices[quote.symbol] = quote.price;
        }
      }
    }

    priceCache.lastFetch = now;
    console.log(`[Tournament] Fetched prices for ${Object.keys(prices).length} symbols`);
    return prices;
  } catch (error) {
    console.error('[Tournament] Error fetching prices:', error.message);
    // Return cached prices as fallback
    return priceCache.prices;
  }
}

// Get real-time price for a single symbol
async function getRealTimePrice(symbol) {
  // Check cache first
  if (priceCache.prices[symbol] && priceCache.lastFetch &&
      (Date.now() - priceCache.lastFetch) < priceCache.cacheDuration) {
    return priceCache.prices[symbol];
  }

  try {
    const url = `https://financialmodelingprep.com/stable/quote?symbol=${symbol}&apikey=${FMP_API_KEY}`;
    const response = await fetchWithRetry(url, { timeoutMs: 8000, retries: 1 });
    const data = await response.json();

    if (Array.isArray(data) && data.length > 0 && data[0].price) {
      priceCache.prices[symbol] = data[0].price;
      return data[0].price;
    }
  } catch (error) {
    console.error(`[Tournament] Error fetching price for ${symbol}:`, error.message);
  }

  // Return cached price or null
  return priceCache.prices[symbol] || null;
}

async function simulateTrade(team) {
  // Get competitive position to influence trading behavior
  const competitivePos = getCompetitivePosition(team);

  // Trailing teams may be more aggressive (more buys), leading teams more defensive (more sells)
  let buyProbability = 0.5;
  if (competitivePos.isTrailing) {
    buyProbability = 0.65; // Trailing teams buy more aggressively
  } else if (competitivePos.isLeading) {
    buyProbability = 0.4; // Leading teams take profits more often
  }

  // Determine action - but can only sell if we have holdings
  const holdingsSymbols = Object.keys(team.holdings).filter(s => team.holdings[s].shares > 0);
  let action, symbol;

  if (holdingsSymbols.length === 0 || Math.random() < buyProbability) {
    // BUY - pick random symbol from watchlist
    action = 'BUY';
    symbol = tournamentState.watchlist[Math.floor(Math.random() * tournamentState.watchlist.length)];
  } else {
    // SELL - pick from holdings
    action = 'SELL';
    symbol = holdingsSymbols[Math.floor(Math.random() * holdingsSymbols.length)];
  }

  // Get real-time price from FMP API
  let price = await getRealTimePrice(symbol);

  // If we couldn't get a real price, skip this trade
  if (!price) {
    console.log(`[Tournament] Skipping trade - no price available for ${symbol}`);
    return null;
  }

  // Adjust position size based on competitive position and strategy
  let baseShares = 5 + Math.random() * 45; // 5-50 shares base

  // Trailing aggressive/momentum teams take larger positions
  if (competitivePos.isTrailing && (team.strategy === 'aggressive' || team.strategy === 'momentum')) {
    baseShares *= 1.3; // 30% larger positions when trailing
  }
  // Leading conservative teams take smaller positions
  if (competitivePos.isLeading && team.strategy === 'conservative') {
    baseShares *= 0.8; // 20% smaller positions when leading
  }

  let shares = Math.floor(baseShares);
  const tradeValue = price * shares;

  // For BUY: check if team has enough cash
  if (action === 'BUY') {
    if (team.cash < tradeValue) {
      // Reduce shares to what we can afford (minimum 1 share)
      shares = Math.floor(team.cash / price);
      if (shares < 1) {
        console.log(`[Tournament] ${team.name} cannot afford to buy ${symbol} - insufficient cash`);
        return null;
      }
    }
  }

  // For SELL: check if team has enough shares
  if (action === 'SELL') {
    const holding = team.holdings[symbol];
    if (!holding || holding.shares < shares) {
      shares = holding ? holding.shares : 0;
      if (shares < 1) {
        console.log(`[Tournament] ${team.name} has no ${symbol} shares to sell`);
        return null;
      }
    }
  }

  const reasoning = generateReasoning(team, action, symbol);

  return {
    time: new Date().toLocaleTimeString('en-US', { timeZone: 'America/New_York' }),
    timestamp: new Date().toISOString(),
    team: team.name,
    teamId: team.id,
    model: team.model,
    action,
    symbol,
    price: Math.round(price * 100) / 100,
    shares,
    reasoning,
    competitiveContext: {
      rank: competitivePos.rank,
      position: competitivePos.position,
      gapToLeader: competitivePos.isLeading ? 0 : competitivePos.gapPercent
    }
  };
}

async function executeTradingRound() {
  if (!tournamentState.running || !isMarketOpen()) return;

  console.log('[Tournament] Executing trading round...');

  // Pre-fetch prices for a batch of random stocks to populate cache
  const randomSymbols = [];
  for (let i = 0; i < 20; i++) {
    const symbol = tournamentState.watchlist[Math.floor(Math.random() * tournamentState.watchlist.length)];
    if (!randomSymbols.includes(symbol)) {
      randomSymbols.push(symbol);
    }
  }
  await fetchRealTimePrices(randomSymbols);

  // Each team has a chance to make a trade
  for (const team of tournamentState.teams) {
    // 40% chance per team per round to make a trade
    if (Math.random() < 0.4) {
      const trade = await simulateTrade(team);

      // Skip if trade failed (no price available)
      if (!trade) continue;

      const tradeValue = trade.price * trade.shares;

      // Execute trade and update holdings
      if (trade.action === 'BUY') {
        // Deduct cash
        team.cash -= tradeValue;

        // Update or create holding
        if (!team.holdings[trade.symbol]) {
          team.holdings[trade.symbol] = {
            shares: 0,
            avgCost: 0,
            totalCost: 0,
            currentPrice: trade.price,
            marketValue: 0,
            unrealizedPnL: 0
          };
        }

        const holding = team.holdings[trade.symbol];
        const newTotalCost = holding.totalCost + tradeValue;
        const newShares = holding.shares + trade.shares;
        holding.avgCost = newTotalCost / newShares;
        holding.totalCost = newTotalCost;
        holding.shares = newShares;
        holding.currentPrice = trade.price;
        holding.marketValue = holding.shares * holding.currentPrice;
        holding.unrealizedPnL = holding.marketValue - holding.totalCost;

        trade.costBasis = holding.avgCost;

      } else {
        // SELL - realize P/L
        const holding = team.holdings[trade.symbol];
        if (holding && holding.shares >= trade.shares) {
          const costBasis = holding.avgCost * trade.shares;
          const proceeds = tradeValue;
          const realizedPnL = proceeds - costBasis;

          // Add cash from sale
          team.cash += proceeds;

          // Update holding
          holding.totalCost -= costBasis;
          holding.shares -= trade.shares;

          if (holding.shares === 0) {
            delete team.holdings[trade.symbol];
          } else {
            holding.marketValue = holding.shares * holding.currentPrice;
            holding.unrealizedPnL = holding.marketValue - holding.totalCost;
          }

          // Track realized P/L
          team.realizedPnL += realizedPnL;

          trade.realizedPnL = realizedPnL;
          trade.costBasis = holding ? holding.avgCost : 0;
        }
      }

      // Recalculate portfolio value and unrealized P/L
      let totalMarketValue = 0;
      let totalUnrealizedPnL = 0;
      for (const [sym, pos] of Object.entries(team.holdings)) {
        totalMarketValue += pos.marketValue;
        totalUnrealizedPnL += pos.unrealizedPnL;
      }
      team.invested = totalMarketValue;
      team.unrealizedPnL = totalUnrealizedPnL;
      team.portfolioValue = team.cash + totalMarketValue;

      // Add to team's trade history
      team.tradeHistory.unshift({
        ...trade,
        cashAfter: team.cash,
        portfolioValueAfter: team.portfolioValue
      });

      // Keep only last 50 trades per team
      if (team.tradeHistory.length > 50) {
        team.tradeHistory = team.tradeHistory.slice(0, 50);
      }

      team.totalTrades++;
      tournamentState.trades.unshift(trade);

      console.log(`[Tournament] ${team.name} ${trade.action} ${trade.shares} ${trade.symbol} @ $${trade.price.toFixed(2)} | Cash: $${team.cash.toFixed(2)} | Portfolio: $${team.portfolioValue.toFixed(2)}`);
    }
  }

  // Keep only last 200 trades
  if (tournamentState.trades.length > 200) {
    tournamentState.trades = tournamentState.trades.slice(0, 200);
  }

  // Record portfolio history for charting
  const historyPoint = {
    timestamp: new Date().toISOString(),
    time: new Date().toLocaleTimeString('en-US', { timeZone: 'America/New_York', hour: '2-digit', minute: '2-digit' }),
    teams: tournamentState.teams.map(t => ({
      id: t.id,
      name: t.name,
      portfolioValue: Math.round(t.portfolioValue * 100) / 100
    }))
  };
  tournamentState.portfolioHistory.push(historyPoint);

  // Keep only last 100 history points (enough for a good chart)
  if (tournamentState.portfolioHistory.length > 100) {
    tournamentState.portfolioHistory = tournamentState.portfolioHistory.slice(-100);
  }

  // Save state after each trading round
  saveTournamentState();
}

function startTournament() {
  if (tournamentState.running) return;

  console.log('🏆 Starting autonomous AI tournament with REAL-TIME market data...');
  console.log(`📊 Watching ${tournamentState.watchlist.length} stocks`);

  tournamentState.running = true;

  // Try to load existing state first
  const stateLoaded = loadTournamentState();

  if (!stateLoaded || tournamentState.teams.length === 0) {
    // No saved state or empty state - start fresh
    console.log('[Tournament] Starting fresh tournament');
    tournamentState.experimentId = `tournament_${Date.now()}`;
    tournamentState.portfolioHistory = [];
    tournamentState.trades = [];
    tournamentState.teams = [1, 2, 3, 4].map(id => ({
      id,
      ...TEAM_CONFIGS[id],
      portfolioValue: 50000,
      cash: 50000,
      invested: 0,
      realizedPnL: 0,
      unrealizedPnL: 0,
      totalTrades: 0,
      holdings: {},
      tradeHistory: []
    }));

    // Record initial portfolio values
    tournamentState.portfolioHistory.push({
      timestamp: new Date().toISOString(),
      time: new Date().toLocaleTimeString('en-US', { timeZone: 'America/New_York', hour: '2-digit', minute: '2-digit' }),
      teams: tournamentState.teams.map(t => ({
        id: t.id,
        name: t.name,
        portfolioValue: 50000
      }))
    });
  } else {
    console.log('[Tournament] Resuming from saved state');
  }

  // Execute trades every 2-5 minutes during market hours
  tournamentState.tradeInterval = setInterval(async () => {
    if (isMarketOpen()) {
      await executeTradingRound();
    }
  }, 120000 + Math.random() * 180000); // Random 2-5 min interval

  // Update portfolio values with live prices every 30 seconds
  tournamentState.portfolioUpdateInterval = setInterval(async () => {
    if (tournamentState.running) {
      await updatePortfolioValues();
    }
  }, 30000);

  // Initial trade round
  executeTradingRound();
}

// Update all team portfolio values with current market prices
async function updatePortfolioValues() {
  // Get all unique symbols held by all teams
  const allSymbols = new Set();
  for (const team of tournamentState.teams) {
    Object.keys(team.holdings).forEach(s => allSymbols.add(s));
  }

  if (allSymbols.size === 0) return;

  // Fetch current prices for all held symbols
  const prices = await fetchRealTimePrices([...allSymbols]);

  // Update each team's holdings and portfolio value
  for (const team of tournamentState.teams) {
    let totalMarketValue = 0;
    let totalUnrealizedPnL = 0;

    for (const [symbol, position] of Object.entries(team.holdings)) {
      const currentPrice = prices[symbol] || position.currentPrice;
      position.currentPrice = currentPrice;
      position.marketValue = position.shares * currentPrice;
      position.unrealizedPnL = position.marketValue - (position.shares * position.avgCost);

      totalMarketValue += position.marketValue;
      totalUnrealizedPnL += position.unrealizedPnL;
    }

    team.invested = totalMarketValue;
    team.unrealizedPnL = totalUnrealizedPnL;
    team.portfolioValue = team.cash + totalMarketValue;
  }

  console.log('[Tournament] Portfolio values updated with live prices');

  // Save state after portfolio update
  saveTournamentState();
}

function stopTournament() {
  if (!tournamentState.running) return;

  console.log('🛑 Stopping AI tournament (market closed)');

  tournamentState.running = false;
  if (tournamentState.tradeInterval) {
    clearInterval(tournamentState.tradeInterval);
    tournamentState.tradeInterval = null;
  }
  if (tournamentState.portfolioUpdateInterval) {
    clearInterval(tournamentState.portfolioUpdateInterval);
    tournamentState.portfolioUpdateInterval = null;
  }
}

// Check market status every minute and auto-start/stop tournament
function initMarketChecker() {
  console.log('📊 Initializing market hours checker...');

  // Check immediately
  if (isMarketOpen()) {
    startTournament();
  }

  // Then check every minute
  tournamentState.marketCheckInterval = setInterval(() => {
    const marketOpen = isMarketOpen();

    if (marketOpen && !tournamentState.running) {
      console.log('🔔 Market opened - starting tournament');
      startTournament();
    } else if (!marketOpen && tournamentState.running) {
      console.log('🔔 Market closed - stopping tournament');
      stopTournament();
    }
  }, 60000); // Check every minute
}

// Start the market checker when server starts
initMarketChecker();

// Tournament status endpoint
app.get('/api/tournament/status/current', async (req, res) => {
  try {
    const marketStatus = getMarketStatus();
    res.json({
      status: tournamentState.running ? 'running' : 'idle',
      marketOpen: marketStatus.open,
      marketMessage: marketStatus.message,
      experiment_id: tournamentState.experimentId,
      teams: tournamentState.teams.map(t => ({
        id: t.id,
        name: t.name,
        model: t.model,
        portfolioValue: t.portfolioValue,
        totalTrades: t.totalTrades
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Tournament results endpoint - returns trades with AI reasoning
app.get('/api/tournament/results', async (req, res) => {
  try {
    const marketStatus = getMarketStatus();
    res.json({
      status: tournamentState.running ? 'running' : 'idle',
      marketOpen: marketStatus.open,
      marketMessage: marketStatus.message,
      dataSource: 'Real-time FMP API',
      watchlistCount: tournamentState.watchlist.length,
      trades: tournamentState.trades,
      portfolioHistory: tournamentState.portfolioHistory,
      teams: tournamentState.teams.map(t => ({
        id: t.id,
        name: t.name,
        model: t.model,
        strategy: t.strategy,
        portfolioValue: Math.round(t.portfolioValue * 100) / 100,
        cash: Math.round(t.cash * 100) / 100,
        invested: Math.round(t.invested * 100) / 100,
        realizedPnL: Math.round((t.realizedPnL || 0) * 100) / 100,
        unrealizedPnL: Math.round((t.unrealizedPnL || 0) * 100) / 100,
        totalPnL: Math.round(((t.realizedPnL || 0) + (t.unrealizedPnL || 0)) * 100) / 100,
        totalTrades: t.totalTrades,
        holdings: Object.entries(t.holdings || {}).map(([symbol, pos]) => ({
          symbol,
          shares: pos.shares,
          avgCost: Math.round(pos.avgCost * 100) / 100,
          currentPrice: Math.round(pos.currentPrice * 100) / 100,
          marketValue: Math.round(pos.marketValue * 100) / 100,
          unrealizedPnL: Math.round(pos.unrealizedPnL * 100) / 100,
          pnlPercent: Math.round((pos.unrealizedPnL / (pos.avgCost * pos.shares)) * 10000) / 100
        })),
        tradeHistory: (t.tradeHistory || []).slice(0, 20) // Last 20 trades
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Graceful shutdown
function shutdown() {
  console.log('\n🛑 Shutting down servers...');

  // Stop market checker
  if (tournamentState.marketCheckInterval) {
    clearInterval(tournamentState.marketCheckInterval);
  }

  // Stop trade interval
  if (tournamentState.tradeInterval) {
    clearInterval(tournamentState.tradeInterval);
  }

  if (enhancedAnalysisBackend) {
    console.log('   Stopping Enhanced Analysis backend...');
    try {
      enhancedAnalysisBackend.kill('SIGTERM');
    } catch (error) {
      console.error('   Error stopping Enhanced Analysis backend:', error.message);
    }
  }

  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Catch-all handler: serve index.html ONLY for non-file, non-API routes (SPA routing)
// MUST be defined AFTER all API routes to avoid intercepting them
app.get('*', (req, res, next) => {
  // Skip API routes - these should have been handled by specific routes above
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  // Skip file requests - if express.static didn't serve it, it doesn't exist
  if (req.path.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|json|map)$/)) {
    return res.status(404).send('File not found');
  }
  // Serve index.html for all other routes (SPA routing)
  res.sendFile(path.join(__dirname, 'dist', 'index.html'), (err) => {
    if (err) {
      next(err);
    }
  });
});

app.listen(PORT, () => {
  console.log(`\n✅ CORS Proxy Server running on http://localhost:${PORT}`);
  console.log(`📡 Proxying:`);
  console.log(`   - StockTwits: http://localhost:${PORT}/api/stocktwits/:symbol`);
  console.log(`   - Reddit: http://localhost:${PORT}/api/reddit/:subreddit/search?q=:query`);
  console.log(`   - Claude AI: http://localhost:${PORT}/api/claude/analyze`);
  console.log(`\n🔥 Ready to serve social sentiment data!`);
  
  // Start AI backends after proxy is ready
  startEnhancedAnalysisBackend();
  // Autonomous Agent and Intelligent Agent removed
});
