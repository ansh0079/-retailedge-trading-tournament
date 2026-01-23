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
    tournamentProcess = spawn('python', [
      'ultimate_trading_tournament.py',
      '--days', days.toString(),
      '--teams', teams.join(','),
      '--watchlist', watchlistFile
    ], {
      cwd: __dirname,
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: true, // Make it truly detached so it can run independently
      shell: true // Use shell for better cross-platform support
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
        currentExperimentId = null; // Clear when tournament ends normally
      } else {
        console.log(`[Tournament ${experimentId}] Process exited unexpectedly. Keeping reference for status check.`);
        // Keep the reference for a bit to allow status checks
        setTimeout(() => {
          if (tournamentProcess && tournamentProcess.killed) {
            tournamentProcess = null;
            currentExperimentId = null;
          }
        }, 5000);
      }
    });
    
    tournamentProcess.on('error', (error) => {
      console.error(`[Tournament ${experimentId}] Process error:`, error);
      tournamentProcess = null;
      currentExperimentId = null;
    });
    
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
    const isRunning = tournamentProcess && !tournamentProcess.killed && tournamentProcess.exitCode === null;
    if (isRunning && currentExperimentId) {
      res.json({
        status: 'running',
        experiment_id: currentExperimentId, // Return actual experiment ID
        message: 'Tournament is running in background'
      });
    } else {
      res.json({
        status: 'idle',
        message: 'No tournament currently running'
      });
    }
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
      
      res.json({ 
        success: true, 
        message: 'Tournament stop requested',
        experiment_id: experimentId
      });
    } else {
      res.json({ success: true, message: 'No tournament running' });
    }
  } catch (error) {
    console.error('Tournament stop error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/tournament/results', async (req, res) => {
  try {
    // Load tournament results from database
    const sqlite3 = require('sqlite3').verbose();
    const fs = require('fs');
    const dbPath = path.join(__dirname, 'tournament.db');
    
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
