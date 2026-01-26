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

// Check for AI API keys (tournament supports multiple AI providers)
const apiKeys = {
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
  DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY,
  KIMI_API_KEY: process.env.KIMI_API_KEY,
  GOOGLE_API_KEY: process.env.GOOGLE_API_KEY
};

const missingKeys = Object.entries(apiKeys).filter(([key, value]) => !value).map(([key]) => key);
if (missingKeys.length > 0) {
  console.error('⚠️  WARNING: Some AI API keys not set in environment variables');
  console.error('   Missing keys:', missingKeys.join(', '));
  console.error('   Tournament teams will be limited to available API keys');
  console.error('   Set these in your .env file or hosting platform to enable all teams');
}

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

// Explicit root route - serve index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Health check endpoint for Render.com
app.get('/api/health', (req, res) => {
  const fs = require('fs');
  const marketStatus = isUSMarketOpen();

  // Check if tournament is running
  let tournamentRunning = false;
  try {
    const stateData = fs.readFileSync(TOURNAMENT_STATE_FILE, 'utf8');
    const state = JSON.parse(stateData);
    tournamentRunning = state.running && state.pid && isPidRunning(state.pid);
  } catch (err) {
    // State file doesn't exist or is invalid
  }

  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    marketStatus: marketStatus,
    tournamentRunning: tournamentRunning,
    tournamentPaused: tournamentPaused
  });
});

// Serve static files from dist folder
app.use(express.static(path.join(__dirname, 'dist'), {
  index: false, // Don't serve index.html automatically
  fallthrough: true // Continue to next middleware if file not found
}));

// NOTE: Catch-all route moved to end of file (after all API routes)

// Store background processes
let enhancedAnalysisBackend = null;

// Tournament state file for persistence across server restarts
const TOURNAMENT_STATE_FILE = path.join(__dirname, '.tournament_state.json');
let tournamentPaused = false;

// ═══════════════════════════════════════════════════════════════════════════
// US MARKET HOURS CHECKER (9:30 AM - 4:00 PM Eastern Time)
// ═══════════════════════════════════════════════════════════════════════════

function isUSMarketOpen() {
  const now = new Date();
  const etOptions = { timeZone: 'America/New_York', hour: 'numeric', minute: 'numeric', hour12: false };
  const etTime = new Intl.DateTimeFormat('en-US', etOptions).format(now);
  const [hours, minutes] = etTime.split(':').map(Number);
  const currentMinutes = hours * 60 + minutes;
  
  const marketOpen = 9 * 60 + 30;  // 9:30 AM
  const marketClose = 16 * 60;     // 4:00 PM
  
  const dayOfWeek = new Date().toLocaleDateString('en-US', { timeZone: 'America/New_York', weekday: 'short' });
  const isWeekday = !['Sat', 'Sun'].includes(dayOfWeek);
  const isOpen = isWeekday && currentMinutes >= marketOpen && currentMinutes < marketClose;
  
  return { isOpen, currentTime: etTime, dayOfWeek };
}

// Load tournament state on server start
function loadTournamentState() {
  const fs = require('fs');
  try {
    if (fs.existsSync(TOURNAMENT_STATE_FILE)) {
      const data = JSON.parse(fs.readFileSync(TOURNAMENT_STATE_FILE, 'utf8'));
      console.log('📁 Loaded tournament state:', data);
      
      if (data.pid) {
        try {
          process.kill(data.pid, 0);
          console.log(`✅ Tournament process ${data.pid} is still running!`);
          currentExperimentId = data.experimentId;
          tournamentPaused = data.paused || false;
          return data;
        } catch (e) {
          console.log(`⚠️ Tournament process ${data.pid} no longer running`);
          // Keep experiment ID for data continuity
          currentExperimentId = data.experimentId;
          tournamentPaused = true;
          return { ...data, paused: true, processLost: true };
        }
      }
    }
  } catch (error) {
    console.log('No existing tournament state found');
  }
  return null;
}

// Save tournament state with pause info
function saveTournamentState(experimentId, pid, paused = false) {
  const fs = require('fs');
  try {
    const state = {
      experimentId,
      pid,
      paused,
      running: true,
      startedAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };
    fs.writeFileSync(TOURNAMENT_STATE_FILE, JSON.stringify(state, null, 2));
    console.log('💾 Saved tournament state:', state);
  } catch (error) {
    console.error('Failed to save tournament state:', error);
  }
}

// Update pause state only
function updatePauseState(paused) {
  const fs = require('fs');
  try {
    if (fs.existsSync(TOURNAMENT_STATE_FILE)) {
      const data = JSON.parse(fs.readFileSync(TOURNAMENT_STATE_FILE, 'utf8'));
      data.paused = paused;
      data.lastUpdated = new Date().toISOString();
      fs.writeFileSync(TOURNAMENT_STATE_FILE, JSON.stringify(data, null, 2));
    }
  } catch (e) { /* ignore */ }
}

// Clear tournament state
function clearTournamentState() {
  const fs = require('fs');
  try {
    if (fs.existsSync(TOURNAMENT_STATE_FILE)) {
      fs.unlinkSync(TOURNAMENT_STATE_FILE);
      console.log('🗑️ Cleared tournament state');
    }
  } catch (error) {
    console.error('Failed to clear tournament state:', error);
  }
}

// Auto-pause/resume based on market hours (check every minute)
setInterval(() => {
  if (!tournamentProcess || tournamentProcess.killed) return;
  
  const market = isUSMarketOpen();
  
  if (!market.isOpen && !tournamentPaused) {
    console.log(`🔔 Market closed (${market.currentTime} ET) - Auto-pausing tournament`);
    try {
      process.kill(tournamentProcess.pid, 'SIGSTOP');
      tournamentPaused = true;
      updatePauseState(true);
    } catch (e) { console.error('Auto-pause failed:', e); }
  } else if (market.isOpen && tournamentPaused) {
    console.log(`🔔 Market opened (${market.currentTime} ET) - Auto-resuming tournament`);
    try {
      process.kill(tournamentProcess.pid, 'SIGCONT');
      tournamentPaused = false;
      updatePauseState(false);
    } catch (e) { console.error('Auto-resume failed:', e); }
  }
}, 60000);

// Load state on server startup
const existingTournament = loadTournamentState();
if (existingTournament) {
  currentExperimentId = existingTournament.experimentId;
  tournamentPaused = existingTournament.paused || false;
  const market = isUSMarketOpen();
  console.log(`🔄 Reconnected to tournament: ${currentExperimentId}`);
  console.log(`📊 Paused: ${tournamentPaused} | Market: ${market.isOpen ? 'OPEN' : 'CLOSED'} (${market.currentTime} ET)`);
}

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

// AI Tournament endpoints
let tournamentProcess = null;
let currentExperimentId = null;

app.post('/api/tournament/start', async (req, res) => {
  try {
    const { days, teams, watchlist } = req.body;
    console.log('🏆 Starting AI Tournament...');
    
    if (tournamentProcess) {
      return res.status(400).json({ error: 'Tournament already running' });
    }
    
    // Create watchlist file if needed
    const fs = require('fs');
    const watchlistFile = path.join(__dirname, 'tournament_watchlist.txt');
    if (watchlist && watchlist.length > 0) {
      fs.writeFileSync(watchlistFile, watchlist.join('\n'));
    }
    
    // Generate experiment ID before spawning
    let experimentId = `tournament_${Date.now()}`;
    currentExperimentId = experimentId; // Store for status checks
    
    // Spawn tournament process - make it detached so it can run independently
    // This ensures the tournament continues even if the frontend disconnects or modal closes
    // Use python3 for Linux compatibility (Render) or python for Windows
    const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';
    tournamentProcess = spawn(pythonCmd, [
      'ultimate_trading_tournament.py',
      '--days', days.toString(),
      '--teams', teams.join(','),
      '--watchlist', watchlistFile
    ], {
      cwd: __dirname,
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: true, // Make it truly detached so it can run independently
      shell: true, // Use shell for better cross-platform support
      env: {
        ...process.env, // Pass all environment variables
        ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
        DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY,
        KIMI_API_KEY: process.env.KIMI_API_KEY,
        GOOGLE_API_KEY: process.env.GOOGLE_API_KEY
      }
    });
    
    // Unref the process so it can continue if parent exits
    // This ensures the tournament runs independently of the Node.js process lifecycle
    tournamentProcess.unref();
    
    // Keep reference for status checks, but process is now independent
    
    tournamentProcess.stdout.on('data', (data) => {
      const output = data.toString();
      console.log(`[Tournament ${experimentId}] ${output}`);
    });
    
    tournamentProcess.stderr.on('data', (data) => {
      const output = data.toString();
      console.error(`[Tournament ${experimentId} Error] ${output}`);
    });
    
    tournamentProcess.on('close', (code) => {
      console.log(`[Tournament ${experimentId}] Process exited with code ${code}`);
      // Only clear if it was intentionally stopped (code 0 or SIGTERM)
      // If it crashed (non-zero), we might want to keep the ID for debugging
      if (code === 0 || code === null) {
        tournamentProcess = null;
        currentExperimentId = null;
        clearTournamentState(); // Clear state when tournament ends normally
      } else {
        console.log(`[Tournament ${experimentId}] Process exited unexpectedly. Keeping reference for status check.`);
        // Keep the reference for a bit to allow status checks
        setTimeout(() => {
          if (tournamentProcess && tournamentProcess.killed) {
            tournamentProcess = null;
            currentExperimentId = null;
            clearTournamentState();
          }
        }, 5000);
      }
    });
    
    tournamentProcess.on('error', (error) => {
      console.error(`[Tournament ${experimentId}] Process error:`, error);
      tournamentProcess = null;
      currentExperimentId = null;
      clearTournamentState();
    });
    
    // Save state for persistence across server restarts
    saveTournamentState(experimentId, tournamentProcess.pid);
    
    res.json({
      success: true,
      experiment_id: experimentId,
      message: 'Tournament started'
    });
  } catch (error) {
    console.error('Tournament start error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/tournament/status/:experimentId', async (req, res) => {
  try {
    const requestedExperimentId = req.params.experimentId;
    
    // Check if the requested experiment matches the current one
    const isRunning = tournamentProcess && !tournamentProcess.killed && currentExperimentId === requestedExperimentId;
    
    if (isRunning) {
      // Tournament is running - return active status
      res.json({
        status: 'running',
        current_day: 1, // TODO: Parse from tournament output or database
        total_days: 7,
        logs: [], // TODO: Store logs in memory or database
        experiment_id: currentExperimentId
      });
    } else if (currentExperimentId && currentExperimentId !== requestedExperimentId) {
      // Different experiment ID - tournament might have restarted
      res.json({
        status: 'idle',
        message: 'Experiment ID mismatch - tournament may have restarted',
        experiment_id: requestedExperimentId
      });
    } else {
      // No tournament running
      res.json({
        status: 'idle',
        experiment_id: requestedExperimentId
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get current tournament status (without experiment ID)
app.get('/api/tournament/status/current', async (req, res) => {
  try {
    const fs = require('fs');

    // First check if we have a running process in memory (simplest check)
    if (tournamentProcess && currentExperimentId) {
      return res.json({
        status: 'running',
        experiment_id: currentExperimentId,
        paused: tournamentPaused,
        message: 'Tournament is running in background'
      });
    }

    // Check state file for orphaned/persisted tournament
    if (fs.existsSync(TOURNAMENT_STATE_FILE)) {
      try {
        const state = JSON.parse(fs.readFileSync(TOURNAMENT_STATE_FILE, 'utf8'));
        if (state.running && state.experimentId) {
          currentExperimentId = state.experimentId; // Reconnect
          return res.json({
            status: 'running',
            experiment_id: state.experimentId,
            paused: state.paused || false,
            message: 'Tournament is running (from state file)',
            startedAt: state.startedAt
          });
        }
      } catch (e) {
        console.log('Error reading tournament state:', e);
      }
    }

    res.json({
      status: 'idle',
      experiment_id: 'current',
      message: 'No tournament currently running'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/tournament/stop', async (req, res) => {
  try {
    if (tournamentProcess && !tournamentProcess.killed) {
      console.log(`[Tournament ${currentExperimentId}] Stopping tournament...`);
      // Try graceful shutdown first
      tournamentProcess.kill('SIGTERM');
      
      // Wait a bit for graceful shutdown, then force kill if needed
      setTimeout(() => {
        if (tournamentProcess && !tournamentProcess.killed) {
          console.log(`[Tournament ${currentExperimentId}] Force killing tournament...`);
          tournamentProcess.kill('SIGKILL');
        }
      }, 5000);
      
      const experimentId = currentExperimentId;
      tournamentProcess = null;
      currentExperimentId = null;
      clearTournamentState();
      
      res.json({ 
        success: true, 
        message: 'Tournament stop requested',
        experiment_id: experimentId
      });
    } else {
      // Also try to stop by reading state file (for orphaned processes)
      const fs = require('fs');
      try {
        if (fs.existsSync(TOURNAMENT_STATE_FILE)) {
          const state = JSON.parse(fs.readFileSync(TOURNAMENT_STATE_FILE, 'utf8'));
          if (state.pid) {
            process.kill(state.pid, 'SIGTERM');
            clearTournamentState();
            return res.json({ success: true, message: 'Orphaned tournament stopped' });
          }
        }
      } catch (e) {
        console.log('No orphaned tournament to stop');
      }
      res.json({ success: true, message: 'No tournament running' });
    }
  } catch (error) {
    console.error('Tournament stop error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Pause tournament (send SIGSTOP signal)
app.post('/api/tournament/pause', async (req, res) => {
  try {
    if (tournamentProcess && !tournamentProcess.killed) {
      console.log(`[Tournament ${currentExperimentId}] Manual pause requested...`);
      process.kill(tournamentProcess.pid, 'SIGSTOP');
      tournamentPaused = true;
      updatePauseState(true);
      res.json({ success: true, message: 'Tournament paused', paused: true });
    } else {
      res.status(400).json({ error: 'No tournament running' });
    }
  } catch (error) {
    console.error('Pause error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Resume tournament (send SIGCONT signal)
app.post('/api/tournament/resume', async (req, res) => {
  try {
    const market = isUSMarketOpen();
    
    if (tournamentProcess && !tournamentProcess.killed) {
      // Check if market is open before resuming
      if (!market.isOpen) {
        return res.json({ 
          success: false, 
          message: `Cannot resume - Market is CLOSED (${market.currentTime} ET, ${market.dayOfWeek}). Tournament will auto-resume when market opens.`,
          marketOpen: false
        });
      }
      
      console.log(`[Tournament ${currentExperimentId}] Manual resume requested...`);
      process.kill(tournamentProcess.pid, 'SIGCONT');
      tournamentPaused = false;
      updatePauseState(false);
      res.json({ success: true, message: 'Tournament resumed', paused: false, marketOpen: true });
    } else {
      res.status(400).json({ error: 'No tournament running' });
    }
  } catch (error) {
    console.error('Resume error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get tournament logs
app.get('/api/tournament/logs', async (req, res) => {
  try {
    // TODO: Load from SQLite database
    // For now, return empty array
    res.json({ logs: [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get tournament trades
app.get('/api/tournament/trades', async (req, res) => {
  try {
    // TODO: Load from SQLite database
    // For now, return empty array
    res.json({ trades: [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// SSE endpoint for tournament leaderboard updates
app.get('/api/tournament/sse/leaderboard/:experimentId', async (req, res) => {
  const { experimentId } = req.params;

  // Set up SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });

  console.log(`[SSE] Client connected to leaderboard stream for ${experimentId}`);

  // Send initial connection message
  res.write(`data: ${JSON.stringify({ message: 'Connected to leaderboard updates' })}\n\n`);

  // Poll database every 2 seconds for updates
  const intervalId = setInterval(async () => {
    try {
      const sqlite3 = require('sqlite3').verbose();
      const fs = require('fs');
      const dbPath = path.join(__dirname, 'ultimate_tournament.db');

      if (!fs.existsSync(dbPath)) {
        return; // Database not created yet
      }

      const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
        if (err) {
          console.error('[SSE Leaderboard] Database error:', err);
          return;
        }
      });

      db.all(`
        SELECT team_id, name, total_return, total_trades, current_cash, current_holdings_value
        FROM teams
        WHERE experiment_id = ?
        ORDER BY total_return DESC
      `, [experimentId], (err, rows) => {
        if (err) {
          console.error('[SSE Leaderboard] Query error:', err);
          db.close();
          return;
        }

        if (rows && rows.length > 0) {
          const leaderboard = rows.map(row => ({
            team_id: row.team_id,
            name: row.name || `Team ${row.team_id}`,
            return: row.total_return || 0,
            trades: row.total_trades || 0,
            cash: row.current_cash || 0,
            holdings: row.current_holdings_value || 0
          }));

          res.write(`data: ${JSON.stringify({ leaderboard })}\n\n`);
        }

        db.close();
      });
    } catch (error) {
      console.error('[SSE Leaderboard] Error:', error);
    }
  }, 2000);

  // Clean up on client disconnect
  req.on('close', () => {
    clearInterval(intervalId);
    console.log(`[SSE] Client disconnected from leaderboard stream for ${experimentId}`);
  });
});

// SSE endpoint for tournament logs
app.get('/api/tournament/sse/logs/:experimentId', async (req, res) => {
  const { experimentId } = req.params;

  // Set up SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });

  console.log(`[SSE] Client connected to logs stream for ${experimentId}`);

  // Send initial connection message
  res.write(`data: ${JSON.stringify({ message: '📡 Connected to tournament logs', type: 'success' })}\n\n`);

  let lastLogId = 0;

  // Poll database every 1 second for new logs
  const intervalId = setInterval(async () => {
    try {
      const sqlite3 = require('sqlite3').verbose();
      const fs = require('fs');
      const dbPath = path.join(__dirname, 'ultimate_tournament.db');

      if (!fs.existsSync(dbPath)) {
        return; // Database not created yet
      }

      const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
        if (err) {
          console.error('[SSE Logs] Database error:', err);
          return;
        }
      });

      // Check if logs table exists and get new logs
      db.all(`
        SELECT name FROM sqlite_master WHERE type='table' AND name='logs'
      `, [], (err, tables) => {
        if (err || !tables || tables.length === 0) {
          db.close();
          return;
        }

        db.all(`
          SELECT id, timestamp, message, log_type
          FROM logs
          WHERE experiment_id = ? AND id > ?
          ORDER BY id ASC
        `, [experimentId, lastLogId], (err, rows) => {
          if (err) {
            console.error('[SSE Logs] Query error:', err);
            db.close();
            return;
          }

          if (rows && rows.length > 0) {
            rows.forEach(row => {
              lastLogId = Math.max(lastLogId, row.id);
              res.write(`data: ${JSON.stringify({
                message: row.message,
                type: row.log_type || 'info',
                timestamp: row.timestamp
              })}\n\n`);
            });
          }

          db.close();
        });
      });
    } catch (error) {
      console.error('[SSE Logs] Error:', error);
    }
  }, 1000);

  // Clean up on client disconnect
  req.on('close', () => {
    clearInterval(intervalId);
    console.log(`[SSE] Client disconnected from logs stream for ${experimentId}`);
  });
});

// Get tournament logs
app.get('/api/tournament/logs', async (req, res) => {
  try {
    const sqlite3 = require('sqlite3').verbose();
    const fs = require('fs');
    const dbPath = path.join(__dirname, 'ultimate_tournament.db');

    if (!fs.existsSync(dbPath)) {
      return res.json({ logs: [] });
    }

    const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY);

    db.all(`
      SELECT name FROM sqlite_master WHERE type='table' AND name='logs'
    `, [], (err, tables) => {
      if (err || !tables || tables.length === 0) {
        db.close();
        return res.json({ logs: [] });
      }

      db.all(`
        SELECT timestamp, message, log_type as type
        FROM logs
        ORDER BY id DESC
        LIMIT 100
      `, [], (err, rows) => {
        db.close();
        if (err) {
          return res.status(500).json({ error: err.message, logs: [] });
        }
        res.json({ logs: rows || [] });
      });
    });
  } catch (error) {
    res.status(500).json({ error: error.message, logs: [] });
  }
});

// Get tournament trades
app.get('/api/tournament/trades', async (req, res) => {
  try {
    const sqlite3 = require('sqlite3').verbose();
    const fs = require('fs');
    const dbPath = path.join(__dirname, 'ultimate_tournament.db');

    if (!fs.existsSync(dbPath)) {
      return res.json({ trades: [] });
    }

    const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY);

    db.all(`
      SELECT name FROM sqlite_master WHERE type='table' AND name='trades'
    `, [], (err, tables) => {
      if (err || !tables || tables.length === 0) {
        db.close();
        return res.json({ trades: [] });
      }

      db.all(`
        SELECT t.timestamp, t.action, t.symbol, t.shares, t.price, teams.name as team_name
        FROM trades t
        LEFT JOIN teams ON t.team_id = teams.team_id
        ORDER BY t.id DESC
        LIMIT 100
      `, [], (err, rows) => {
        db.close();
        if (err) {
          return res.status(500).json({ error: err.message, trades: [] });
        }
        res.json({ trades: rows || [] });
      });
    });
  } catch (error) {
    res.status(500).json({ error: error.message, trades: [] });
  }
});

// Market status endpoint - check if market is open
app.get('/api/market/status', async (req, res) => {
  try {
    const market = isUSMarketOpen();
    res.json({
      isOpen: market.isOpen,
      currentTime: market.currentTime,
      dayOfWeek: market.dayOfWeek,
      timezone: 'America/New_York',
      marketHours: '9:30 AM - 4:00 PM ET',
      tournamentPaused: tournamentPaused,
      tournamentRunning: tournamentProcess && !tournamentProcess.killed
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/tournament/results', async (req, res) => {
  try {
    // Load tournament results from database
    const sqlite3 = require('sqlite3').verbose();
    const fs = require('fs');
    const dbPath = path.join(__dirname, 'ultimate_tournament.db');
    
    let results = null;
    let leaderboard = [];
    
    // Check if database exists
    if (!fs.existsSync(dbPath)) {
      console.log('[Tournament Results] Database file not found, returning empty leaderboard');
      return res.json({ 
        results: null, 
        leaderboard: [],
        message: 'No tournament database found. Start a tournament to generate results.'
      });
    }
    
    // Use promise wrapper for database operations
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('[Tournament Results] Database connection error:', err);
        return res.status(500).json({ 
          error: 'Failed to connect to tournament database',
          details: err.message,
          leaderboard: []
        });
      }
    });
    
    // Check if teams table exists
    db.all("SELECT name FROM sqlite_master WHERE type='table' AND name='teams'", (err, tables) => {
      if (err) {
        console.error('[Tournament Results] Table check error:', err);
        db.close();
        return res.status(500).json({ 
          error: 'Database query error',
          details: err.message,
          leaderboard: []
        });
      }
      
      if (!tables || tables.length === 0) {
        console.log('[Tournament Results] Teams table not found');
        db.close();
        return res.json({ 
          results: null, 
          leaderboard: [],
          message: 'No tournament data found. Start a tournament to generate results.'
        });
      }
      
      // Get leaderboard data
      db.all('SELECT team_id, name, total_return, total_trades FROM teams ORDER BY total_return DESC', (err, rows) => {
        if (err) {
          console.error('[Tournament Results] Query error:', err);
          db.close();
          return res.status(500).json({ 
            error: 'Failed to fetch leaderboard',
            details: err.message,
            leaderboard: []
          });
        }
        
        if (rows && rows.length > 0) {
          leaderboard = rows.map(row => ({
            team_id: row.team_id,
            name: row.name || `Team ${row.team_id}`,
            return: row.total_return || 0,
            trades: row.total_trades || 0
          }));
          
          console.log(`[Tournament Results] Found ${leaderboard.length} teams in leaderboard`);
        } else {
          console.log('[Tournament Results] No teams found in database');
          leaderboard = [];
        }
        
        db.close((closeErr) => {
          if (closeErr) {
            console.error('[Tournament Results] Database close error:', closeErr);
          }
          
          res.json({
            results: {
              total_days: 7,
              total_trades: leaderboard.reduce((sum, t) => sum + (t.trades || 0), 0),
              best_return: leaderboard.length > 0 ? leaderboard[0].return : 0
            },
            leaderboard: leaderboard
          });
        });
      });
    });
  } catch (error) {
    console.error('[Tournament Results] Unexpected error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch tournament results',
      details: error.message,
      leaderboard: []
    });
  }
});

// Oracle endpoint removed

// Graceful shutdown
function shutdown() {
  console.log('\n🛑 Shutting down servers...');
  
  // Autonomous backend removed
  
  if (enhancedAnalysisBackend) {
    console.log('   Stopping Enhanced Analysis backend...');
    try {
      enhancedAnalysisBackend.kill('SIGTERM');
    } catch (error) {
      console.error('   Error stopping Enhanced Analysis backend:', error.message);
    }
  }
  
  // Note: Tournament process will continue running even if server shuts down
  // This is intentional - tournament should complete independently
  if (tournamentProcess && !tournamentProcess.killed) {
    console.log(`   ⚠️  Tournament ${currentExperimentId} is still running.`);
    console.log('   Tournament will continue in background. Use /api/tournament/stop to stop it.');
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

// Updated: 2026-01-26 01:49:13