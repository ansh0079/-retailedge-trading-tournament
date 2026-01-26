// Simple CORS Proxy for StockTwits and Reddit APIs
// Run with: node proxy-server.js

const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');
const { spawn } = require('child_process');

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
  tradeInterval: null
};

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
    name: 'GPT-4 Turbo',
    model: 'GPT-4-Turbo',
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
  return templates[Math.floor(Math.random() * templates.length)];
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
  const symbol = tournamentState.watchlist[Math.floor(Math.random() * tournamentState.watchlist.length)];
  const action = Math.random() > 0.5 ? 'BUY' : 'SELL';

  // Get real-time price from FMP API
  let price = await getRealTimePrice(symbol);

  // If we couldn't get a real price, skip this trade
  if (!price) {
    console.log(`[Tournament] Skipping trade - no price available for ${symbol}`);
    return null;
  }

  const shares = Math.floor(5 + Math.random() * 45); // 5-50 shares
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
    reasoning
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

      tournamentState.trades.unshift(trade);

      // Update team stats
      const tradeValue = trade.price * trade.shares;
      if (trade.action === 'BUY') {
        team.invested += tradeValue;
      } else {
        team.realized += (Math.random() - 0.4) * tradeValue * 0.15;
      }
      team.totalTrades++;
      team.portfolioValue = 50000 + team.realized + (Math.random() - 0.45) * 1500;

      console.log(`[Tournament] ${team.name} ${trade.action} ${trade.shares} ${trade.symbol} @ $${trade.price.toFixed(2)} (Real-time)`);
    }
  }

  // Keep only last 200 trades
  if (tournamentState.trades.length > 200) {
    tournamentState.trades = tournamentState.trades.slice(0, 200);
  }
}

function startTournament() {
  if (tournamentState.running) return;

  console.log('🏆 Starting autonomous AI tournament with REAL-TIME market data...');
  console.log(`📊 Watching ${tournamentState.watchlist.length} stocks`);

  tournamentState.running = true;
  tournamentState.experimentId = `tournament_${Date.now()}`;
  tournamentState.teams = [1, 2, 3, 4].map(id => ({
    id,
    ...TEAM_CONFIGS[id],
    portfolioValue: 50000,
    cash: 50000,
    invested: 0,
    realized: 0,
    totalTrades: 0
  }));

  // Execute trades every 2-5 minutes during market hours
  tournamentState.tradeInterval = setInterval(async () => {
    if (isMarketOpen()) {
      await executeTradingRound();
    }
  }, 120000 + Math.random() * 180000); // Random 2-5 min interval

  // Initial trade round
  executeTradingRound();
}

function stopTournament() {
  if (!tournamentState.running) return;

  console.log('🛑 Stopping AI tournament (market closed)');

  tournamentState.running = false;
  if (tournamentState.tradeInterval) {
    clearInterval(tournamentState.tradeInterval);
    tournamentState.tradeInterval = null;
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
      teams: tournamentState.teams.map(t => ({
        id: t.id,
        name: t.name,
        model: t.model,
        portfolioValue: Math.round(t.portfolioValue * 100) / 100,
        totalTrades: t.totalTrades,
        strategy: t.strategy
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
