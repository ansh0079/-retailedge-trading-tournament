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
const KIMI_API_KEY = process.env.KIMI_API_KEY || process.env.MOONSHOT_API_KEY;
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;
const FMP_API_KEY = process.env.FMP_API_KEY || 'h43nCTpMeyiIiNquebaqktc7ChUHMxIz';

// Log which AI API keys are available
console.log('🤖 AI API Keys Status:');
console.log(`   - Claude (Sonnet): ${CLAUDE_API_KEY ? '✅ Available' : '❌ Not set'}`);
console.log(`   - Kimi (K2): ${KIMI_API_KEY ? '✅ Available' : '❌ Not set'}`);
console.log(`   - DeepSeek (V3): ${DEEPSEEK_API_KEY ? '✅ Available' : '❌ Not set'}`);
console.log(`   - Gemini (Pro): ${GEMINI_API_KEY ? '✅ Available' : '❌ Not set'}`);

if (!CLAUDE_API_KEY && !KIMI_API_KEY && !DEEPSEEK_API_KEY && !GEMINI_API_KEY) {
  console.error('⚠️  WARNING: No AI API keys found. Set at least one of:');
  console.error('   ANTHROPIC_API_KEY, KIMI_API_KEY, DEEPSEEK_API_KEY, or GEMINI_API_KEY');
}

// ═══════════════════════════════════════════════════════════════════════════════
// AI COST MANAGER - Budget Tracking & Controls with Priority Levels
// ═══════════════════════════════════════════════════════════════════════════════

class AICostManager {
  constructor() {
    // Cost per 1K tokens (USD) - Updated pricing
    this.aiPricing = {
      'claude-3-5-sonnet': { input: 0.003, output: 0.015 },  // $3/$15 per 1M tokens
      'claude-3-sonnet': { input: 0.003, output: 0.015 },    // $3/$15 per 1M tokens
      'claude-3-haiku': { input: 0.00025, output: 0.00125 }, // $0.25/$1.25 per 1M tokens
      'deepseek-chat': { input: 0.00014, output: 0.00028 },  // $0.14/$0.28 per 1M tokens (BEST VALUE!)
      'gemini-1.5-flash': { input: 0.000075, output: 0.0003 }, // $0.075/$0.30 per 1M tokens
      'gemini-pro': { input: 0.0005, output: 0.0015 },       // $0.50/$1.50 per 1M tokens
      'moonshot-v1-8k': { input: 0.0003, output: 0.0006 },   // ~$0.30/$0.60 per 1M tokens (Kimi)
      'kimi-k2': { input: 0.0003, output: 0.0006 }           // ~$0.30/$0.60 per 1M tokens
    };

    // Budget limits
    this.dailyBudget = 1.00;   // $1/day
    this.monthlyBudget = 10.00; // $10/month

    // Priority levels for analysis (controls cost per analysis)
    this.priorityLevels = {
      'CRITICAL': {  // High-value decisions (holdings, large moves)
        maxCost: 0.01,  // 1 cent max per analysis
        description: 'Critical trading decisions'
      },
      'HIGH': {      // Important but not urgent
        maxCost: 0.005, // 0.5 cents
        description: 'High priority analysis'
      },
      'MEDIUM': {    // Normal trading rounds
        maxCost: 0.002, // 0.2 cents
        description: 'Standard analysis'
      },
      'LOW': {       // Background/educational
        maxCost: 0.001, // 0.1 cents
        description: 'Low priority/cached preferred'
      }
    };

    // Track spending
    this.spending = this.loadSpendingData();

    // Tournament state
    this.tournamentPausedByBudget = false;

    // Cache stats
    this.cacheStats = { hits: 0, misses: 0 };
  }
  
  loadSpendingData() {
    const dataFile = path.join(__dirname, 'ai_cost_data.json');
    try {
      if (fs.existsSync(dataFile)) {
        const data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
        const today = new Date().toDateString();
        
        // Reset daily spending if new day
        if (data.lastUpdated !== today) {
          data.today = 0;
          data.lastUpdated = today;
        }
        
        return data;
      }
    } catch (error) {
      console.warn('Could not load cost data:', error.message);
    }
    
    // Default structure
    return {
      today: 0,
      thisMonth: 0,
      totalRequests: 0,
      lastUpdated: new Date().toDateString(),
      byTeam: {
        'Value Hunter': { cost: 0, requests: 0 },
        'Growth Seeker': { cost: 0, requests: 0 },
        'Momentum Trader': { cost: 0, requests: 0 },
        'Risk Manager': { cost: 0, requests: 0 }
      },
      byModel: {}
    };
  }
  
  saveSpendingData() {
    const dataFile = path.join(__dirname, 'ai_cost_data.json');
    try {
      this.spending.lastUpdated = new Date().toDateString();
      fs.writeFileSync(dataFile, JSON.stringify(this.spending, null, 2));
    } catch (error) {
      console.error('Failed to save cost data:', error.message);
    }
  }
  
  estimateCost(model, inputTokens, outputTokens = 500) {
    const pricing = this.aiPricing[model];
    if (!pricing) return 0;
    
    const inputCost = (inputTokens / 1000) * pricing.input;
    const outputCost = (outputTokens / 1000) * pricing.output;
    
    return inputCost + outputCost;
  }
  
  canAffordAnalysis() {
    const remainingDaily = this.dailyBudget - this.spending.today;
    const remainingMonthly = this.monthlyBudget - this.spending.thisMonth;
    
    if (remainingDaily < 0.01) {
      console.warn(`⛔ Daily budget exhausted ($${this.spending.today.toFixed(2)} / $${this.dailyBudget})`);
      return false;
    }
    
    if (remainingMonthly < 0.01) {
      console.warn(`⛔ Monthly budget exhausted ($${this.spending.thisMonth.toFixed(2)} / $${this.monthlyBudget})`);
      return false;
    }
    
    return true;
  }
  
  recordCost(teamName, model, inputTokens, outputTokens) {
    const cost = this.estimateCost(model, inputTokens, outputTokens);
    
    this.spending.today += cost;
    this.spending.thisMonth += cost;
    this.spending.totalRequests++;
    
    // Track by team
    if (this.spending.byTeam[teamName]) {
      this.spending.byTeam[teamName].cost += cost;
      this.spending.byTeam[teamName].requests++;
    }
    
    // Track by model
    if (!this.spending.byModel[model]) {
      this.spending.byModel[model] = { cost: 0, requests: 0 };
    }
    this.spending.byModel[model].cost += cost;
    this.spending.byModel[model].requests++;
    
    this.saveSpendingData();
    
    console.log(`💰 [${teamName}] ${model}: $${cost.toFixed(4)} | Daily: $${this.spending.today.toFixed(4)} / $${this.dailyBudget} | Monthly: $${this.spending.thisMonth.toFixed(2)} / $${this.monthlyBudget}`);
    
    // Check if we should pause tournament
    if (!this.canAffordAnalysis() && !this.tournamentPausedByBudget) {
      console.error('⛔ AI BUDGET EXCEEDED - Tournament should be paused!');
      this.tournamentPausedByBudget = true;
    }
    
    return cost;
  }
  
  estimateTokenCount(data) {
    // Rough estimation: 1 token ≈ 4 characters
    const jsonString = JSON.stringify(data);
    return Math.ceil(jsonString.length / 4);
  }
  
  getSpendingReport() {
    return {
      today: this.spending.today,
      dailyBudget: this.dailyBudget,
      remainingDaily: this.dailyBudget - this.spending.today,
      monthly: this.spending.thisMonth,
      monthlyBudget: this.monthlyBudget,
      remainingMonthly: this.monthlyBudget - this.spending.thisMonth,
      totalRequests: this.spending.totalRequests,
      byTeam: this.spending.byTeam,
      byModel: this.spending.byModel,
      budgetExceeded: !this.canAffordAnalysis()
    };
  }
  
  resetIfNewMonth() {
    const now = new Date();
    const lastUpdate = new Date(this.spending.lastUpdated);
    
    if (now.getMonth() !== lastUpdate.getMonth() || now.getFullYear() !== lastUpdate.getFullYear()) {
      console.log('📊 New month - resetting monthly AI budget');
      this.spending.thisMonth = 0;
      this.saveSpendingData();
    }
  }
}

// Initialize global cost manager
const costManager = new AICostManager();

// ═══════════════════════════════════════════════════════════════════════════════
// AI COST ALERT SYSTEM - Budget Warnings & Notifications
// ═══════════════════════════════════════════════════════════════════════════════

class AICostAlertSystem {
  constructor(costManager) {
    this.costManager = costManager;
    this.alerts = [];
    this.lastAlertTime = {};

    // Alert thresholds (percentages of budget)
    this.thresholds = {
      dailyWarning: 0.50,    // 50% of daily budget
      dailyCritical: 0.80,   // 80% of daily budget
      monthlyWarning: 0.50,  // 50% of monthly budget
      monthlyCritical: 0.80, // 80% of monthly budget
      perAnalysisHigh: 0.05  // Alert if single analysis > 5 cents
    };

    // Minimum time between same alert type (ms)
    this.alertCooldown = 5 * 60 * 1000; // 5 minutes
  }

  checkAlerts() {
    const report = this.costManager.getSpendingReport();
    const alerts = [];
    const now = Date.now();

    // Daily budget alerts
    const dailyPercent = report.today / report.dailyBudget;
    if (dailyPercent >= this.thresholds.dailyCritical) {
      if (this.canAlert('daily_critical')) {
        alerts.push({
          type: 'CRITICAL',
          category: 'daily',
          message: `Daily AI spending at ${(dailyPercent * 100).toFixed(0)}% ($${report.today.toFixed(4)} / $${report.dailyBudget})`,
          action: 'Tournament will pause when budget exhausted',
          timestamp: new Date().toISOString()
        });
        this.lastAlertTime['daily_critical'] = now;
      }
    } else if (dailyPercent >= this.thresholds.dailyWarning) {
      if (this.canAlert('daily_warning')) {
        alerts.push({
          type: 'WARNING',
          category: 'daily',
          message: `Daily AI spending at ${(dailyPercent * 100).toFixed(0)}% ($${report.today.toFixed(4)} / $${report.dailyBudget})`,
          action: 'Consider reducing trade frequency',
          timestamp: new Date().toISOString()
        });
        this.lastAlertTime['daily_warning'] = now;
      }
    }

    // Monthly budget alerts
    const monthlyPercent = report.monthly / report.monthlyBudget;
    if (monthlyPercent >= this.thresholds.monthlyCritical) {
      if (this.canAlert('monthly_critical')) {
        alerts.push({
          type: 'CRITICAL',
          category: 'monthly',
          message: `Monthly AI spending at ${(monthlyPercent * 100).toFixed(0)}% ($${report.monthly.toFixed(2)} / $${report.monthlyBudget})`,
          action: 'Increase budget or switch to cheaper models',
          timestamp: new Date().toISOString()
        });
        this.lastAlertTime['monthly_critical'] = now;
      }
    } else if (monthlyPercent >= this.thresholds.monthlyWarning) {
      if (this.canAlert('monthly_warning')) {
        alerts.push({
          type: 'WARNING',
          category: 'monthly',
          message: `Monthly AI spending at ${(monthlyPercent * 100).toFixed(0)}% ($${report.monthly.toFixed(2)} / $${report.monthlyBudget})`,
          action: 'Monitor spending closely',
          timestamp: new Date().toISOString()
        });
        this.lastAlertTime['monthly_warning'] = now;
      }
    }

    // Budget exhausted alert
    if (report.budgetExceeded) {
      if (this.canAlert('budget_exhausted')) {
        alerts.push({
          type: 'CRITICAL',
          category: 'exhausted',
          message: 'AI budget exhausted - Tournament paused',
          action: 'Add budget or wait for daily reset',
          timestamp: new Date().toISOString()
        });
        this.lastAlertTime['budget_exhausted'] = now;
      }
    }

    // Store and log alerts
    if (alerts.length > 0) {
      this.alerts.push(...alerts);
      // Keep only last 50 alerts
      if (this.alerts.length > 50) {
        this.alerts = this.alerts.slice(-50);
      }

      alerts.forEach(alert => {
        const icon = alert.type === 'CRITICAL' ? '🚨' : '⚠️';
        console.log(`${icon} [COST ALERT] ${alert.message} - ${alert.action}`);
      });
    }

    return alerts;
  }

  canAlert(alertKey) {
    const lastTime = this.lastAlertTime[alertKey];
    if (!lastTime) return true;
    return (Date.now() - lastTime) > this.alertCooldown;
  }

  getRecentAlerts(limit = 10) {
    return this.alerts.slice(-limit);
  }

  clearAlerts() {
    this.alerts = [];
    this.lastAlertTime = {};
  }
}

// Initialize alert system
const costAlertSystem = new AICostAlertSystem(costManager);

// ═══════════════════════════════════════════════════════════════════════════════
// HYBRID ANALYSIS SYSTEM - Local + AI for Cost Optimization
// Uses free local rule-based analysis, reserves AI for high-priority only
// ═══════════════════════════════════════════════════════════════════════════════

class HybridAnalysisSystem {
  constructor() {
    // Track which stocks have been analyzed with AI recently
    this.aiAnalysisCache = new Map(); // symbol -> { timestamp, analysis }
    this.aiCacheDuration = 30 * 60 * 1000; // 30 minutes
  }

  // Free local rule-based analysis (no API cost)
  runLocalAnalysis(stockData) {
    const factors = [];
    let score = 50;

    // Momentum signals
    if (stockData.changesPercentage > 3) {
      factors.push('Strong upward momentum');
      score += 10;
    } else if (stockData.changesPercentage < -3) {
      factors.push('Strong downward momentum');
      score -= 5;
    }

    // Volume signals
    if (stockData.volumeRatio > 2) {
      factors.push('Volume surge (2x+ average)');
      score += 10;
    } else if (stockData.volumeRatio > 1.5) {
      factors.push('Above average volume');
      score += 5;
    }

    // Valuation signals
    if (stockData.pe && stockData.pe > 0) {
      if (stockData.pe < 15) {
        factors.push('Value (low P/E)');
        score += 10;
      } else if (stockData.pe > 40) {
        factors.push('Growth premium (high P/E)');
        score -= 5;
      }
    }

    // 52-week position
    if (stockData.yearHigh && stockData.price >= stockData.yearHigh * 0.95) {
      factors.push('Near 52-week high');
      score += 5;
    } else if (stockData.yearLow && stockData.price <= stockData.yearLow * 1.05) {
      factors.push('Near 52-week low');
      score += 5; // Potential bounce
    }

    // Day range position
    if (stockData.dayHigh && stockData.dayLow) {
      const dayRange = (stockData.price - stockData.dayLow) / (stockData.dayHigh - stockData.dayLow);
      if (dayRange >= 0.8) {
        factors.push('Near day high');
      } else if (dayRange <= 0.2) {
        factors.push('Near day low');
      }
    }

    // Generate verdict
    let verdict;
    if (score >= 75) verdict = 'STRONG BUY';
    else if (score >= 60) verdict = 'BUY';
    else if (score >= 45) verdict = 'HOLD';
    else if (score >= 35) verdict = 'REDUCE';
    else verdict = 'SELL';

    return {
      score,
      verdict,
      factors,
      reasoning: factors.length > 0
        ? `Local analysis: ${factors.join(', ')}.`
        : 'Neutral technical profile.',
      source: 'local',
      cost: 0
    };
  }

  // Determine if AI analysis is worth the cost
  shouldUseAI(stockData, team, competitivePosition) {
    // Check if budget allows
    if (!costManager.canAffordAnalysis()) {
      return false;
    }

    // Use AI more sparingly - only for high-priority situations:

    // 1. Significant price moves (>5%)
    if (Math.abs(stockData.changesPercentage || 0) > 5) {
      return true;
    }

    // 2. High volume spikes (3x+ average)
    if ((stockData.volumeRatio || 1) > 3) {
      return true;
    }

    // 3. Team is trailing badly and needs better decisions
    if (competitivePosition.isTrailing && competitivePosition.gapPercent > 5) {
      return true;
    }

    // 4. Stock already in team's holdings (more important decision)
    if (team.holdings && team.holdings[stockData.symbol]) {
      return true;
    }

    // 5. Random sampling - use AI for ~20% of other trades to maintain diversity
    if (Math.random() < 0.2) {
      return true;
    }

    return false;
  }

  // Check if we have recent AI analysis cached
  getCachedAIAnalysis(symbol) {
    const cached = this.aiAnalysisCache.get(symbol);
    if (cached && (Date.now() - cached.timestamp) < this.aiCacheDuration) {
      return cached.analysis;
    }
    return null;
  }

  // Cache AI analysis result
  cacheAIAnalysis(symbol, analysis) {
    this.aiAnalysisCache.set(symbol, {
      timestamp: Date.now(),
      analysis
    });

    // Cleanup old entries
    if (this.aiAnalysisCache.size > 100) {
      const oldestKey = this.aiAnalysisCache.keys().next().value;
      this.aiAnalysisCache.delete(oldestKey);
    }
  }

  // Get analysis stats
  getStats() {
    return {
      cachedAnalyses: this.aiAnalysisCache.size,
      cacheDurationMinutes: this.aiCacheDuration / 60000
    };
  }
}

// Initialize hybrid analysis system
const hybridAnalysis = new HybridAnalysisSystem();

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

// ═══════════════════════════════════════════════════════════════════════════════
// AI MODEL API CALLS - Each team uses their respective AI model
// ═══════════════════════════════════════════════════════════════════════════════

// Call Claude API (Sonnet) for Team 1
async function callClaudeAPI(prompt, teamName = 'Value Hunter') {
  if (!CLAUDE_API_KEY) return null;
  
  // Check budget before making API call
  if (!costManager.canAffordAnalysis()) {
    console.warn(`⛔ [${teamName}] Budget exceeded - skipping Claude API call`);
    return null;
  }

  try {
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
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 300,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const result = await response.json();
    if (result.error) {
      console.error('[Claude API] Error:', result.error.message);
      return null;
    }
    
    // Track cost
    if (result.usage) {
      costManager.recordCost(
        teamName,
        'claude-3-sonnet',
        result.usage.input_tokens || 0,
        result.usage.output_tokens || 0
      );
    }
    
    return result.content?.[0]?.text || '';
  } catch (error) {
    console.error('[Claude API] Request failed:', error.message);
    return null;
  }
}

// Call Kimi API (K2) for Team 2
async function callKimiAPI(prompt) {
  if (!KIMI_API_KEY) return null;

  try {
    const response = await fetchWithRetry('https://api.moonshot.cn/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${KIMI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeoutMs: 30000,
      retries: 1,
      body: JSON.stringify({
        model: 'moonshot-v1-8k',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 300,
        temperature: 0.7
      })
    });

    const result = await response.json();
    if (result.error) {
      console.error('[Kimi API] Error:', result.error.message || result.error);
      return null;
    }
    return result.choices?.[0]?.message?.content || '';
  } catch (error) {
    console.error('[Kimi API] Request failed:', error.message);
    return null;
  }
}

// Call DeepSeek API (V3) for Team 3
async function callDeepSeekAPI(prompt, teamName = 'Momentum Trader') {
  if (!DEEPSEEK_API_KEY) return null;
  
  // Check budget before making API call
  if (!costManager.canAffordAnalysis()) {
    console.warn(`⛔ [${teamName}] Budget exceeded - skipping DeepSeek API call`);
    return null;
  }

  try {
    const response = await fetchWithRetry('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeoutMs: 30000,
      retries: 1,
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 300,
        temperature: 0.7
      })
    });

    const result = await response.json();
    if (result.error) {
      console.error('[DeepSeek API] Error:', result.error.message || result.error);
      return null;
    }
    
    // Track cost
    if (result.usage) {
      costManager.recordCost(
        teamName,
        'deepseek-chat',
        result.usage.prompt_tokens || 0,
        result.usage.completion_tokens || 0
      );
    }
    return result.choices?.[0]?.message?.content || '';
  } catch (error) {
    console.error('[DeepSeek API] Request failed:', error.message);
    return null;
  }
}

// Call Gemini API (Pro) for Team 4
async function callGeminiAPI(prompt) {
  if (!GEMINI_API_KEY) return null;

  try {
    const response = await fetchWithRetry(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        timeoutMs: 30000,
        retries: 1,
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            maxOutputTokens: 300,
            temperature: 0.7
          }
        })
      }
    );

    const result = await response.json();
    if (result.error) {
      console.error('[Gemini API] Error:', result.error.message || result.error);
      return null;
    }
    return result.candidates?.[0]?.content?.parts?.[0]?.text || '';
  } catch (error) {
    console.error('[Gemini API] Request failed:', error.message);
    return null;
  }
}

// Get AI trading decision - routes to the correct AI based on team
async function getAITradingDecision(team, marketData, competitivePosition) {
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

  let content = null;

  // Route to the correct AI API based on team model
  try {
    switch (team.model) {
      case 'Claude-3-Sonnet':
        console.log(`[AI] Calling Claude Sonnet API for ${team.name}...`);
        content = await callClaudeAPI(prompt);
        break;

      case 'Kimi-K2':
        console.log(`[AI] Calling Kimi K2 API for ${team.name}...`);
        content = await callKimiAPI(prompt);
        break;

      case 'DeepSeek-V3':
        console.log(`[AI] Calling DeepSeek V3 API for ${team.name}...`);
        content = await callDeepSeekAPI(prompt);
        break;

      case 'Gemini-Pro':
        console.log(`[AI] Calling Gemini Pro API for ${team.name}...`);
        content = await callGeminiAPI(prompt);
        break;

      default:
        console.log(`[AI] Unknown model ${team.model} for ${team.name}, trying Claude fallback...`);
        content = await callClaudeAPI(prompt);
    }

    if (!content) {
      console.log(`[AI] No response from ${team.model} for ${team.name} - using smart fallback`);
      return null;
    }

    // Parse JSON response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const decision = JSON.parse(jsonMatch[0]);
      console.log(`[AI] ${team.name} (${team.model}) decision: ${decision.action} ${decision.shares || ''} ${decision.symbol || ''}`);
      return decision;
    }

    console.log(`[AI] Could not parse JSON from ${team.model} response for ${team.name}`);
    return null;
  } catch (error) {
    console.error(`[AI] Error getting decision for ${team.name} (${team.model}):`, error.message);
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

// ═══════════════════════════════════════════════════════════════════════════════
// SMART FILTER - 2-Tier Filtering System
// Tier 1: Technical screening narrows ~950 stocks to ~50 (score-based)
// Tier 2: DeepSeek AI analysis narrows ~50 to top ~15 for AI teams
// ═══════════════════════════════════════════════════════════════════════════════

// Filter configuration thresholds
const FILTER_CONFIG = {
  PRICE_MOVE_THRESHOLD: 2.0,      // Minimum % price move to consider
  VOLUME_SPIKE_THRESHOLD: 1.5,    // Volume must be 1.5x average
  RSI_OVERSOLD: 30,               // RSI below this = oversold
  RSI_OVERBOUGHT: 70,             // RSI above this = overbought
  MIN_SCORE: 40,                  // Minimum score to pass Tier 1
  MAX_TIER1_RESULTS: 50,          // Max stocks from Tier 1 for AI analysis
  MAX_FINAL_STOCKS: 15            // Final narrowed list for teams
};

// Cache for filtered stocks (refreshed every 5 minutes)
let filteredStocksCache = {
  tier1Stocks: [],                // Stocks that passed technical screen
  aiFilteredStocks: [],           // Stocks approved by DeepSeek AI
  stocks: [],                     // Final list for teams (alias for aiFilteredStocks)
  lastUpdate: null,
  cacheDuration: 5 * 60 * 1000    // 5 minutes
};

// Fetch technical data for filtering
async function fetchTechnicalData(symbols) {
  try {
    // Batch fetch quotes
    const batchSize = 50;
    const allQuotes = [];

    for (let i = 0; i < symbols.length; i += batchSize) {
      const batch = symbols.slice(i, i + batchSize);
      const symbolList = batch.join(',');
      const url = `https://financialmodelingprep.com/stable/quote?symbol=${symbolList}&apikey=${FMP_API_KEY}`;

      const response = await fetchWithRetry(url, { timeoutMs: 15000, retries: 2 });
      const data = await response.json();

      if (Array.isArray(data)) {
        allQuotes.push(...data);
      }

      // Small delay between batches to avoid rate limits
      if (i + batchSize < symbols.length) {
        await sleep(200);
      }
    }

    return allQuotes;
  } catch (error) {
    console.error('[SmartFilter] Error fetching technical data:', error.message);
    return [];
  }
}

// Fetch RSI and technical indicators for a stock
async function fetchTechnicalIndicators(symbol) {
  try {
    const url = `https://financialmodelingprep.com/stable/technical-indicator/1day/${symbol}?period=14&type=rsi&apikey=${FMP_API_KEY}`;
    const response = await fetchWithRetry(url, { timeoutMs: 10000, retries: 1 });
    const data = await response.json();

    if (Array.isArray(data) && data.length > 0) {
      return {
        rsi: data[0].rsi,
        date: data[0].date
      };
    }
    return null;
  } catch (error) {
    return null;
  }
}

// Smart Filter: Screen stocks based on technical criteria
async function smartFilterStocks(watchlist) {
  const now = Date.now();

  // Return cached results if still valid
  if (filteredStocksCache.lastUpdate &&
      (now - filteredStocksCache.lastUpdate) < filteredStocksCache.cacheDuration &&
      filteredStocksCache.stocks.length > 0) {
    console.log(`[SmartFilter] Using cached results (${filteredStocksCache.stocks.length} stocks)`);
    return filteredStocksCache.stocks;
  }

  console.log(`[SmartFilter] Screening ${watchlist.length} stocks...`);

  // Fetch all quotes
  const quotes = await fetchTechnicalData(watchlist);

  if (quotes.length === 0) {
    console.log('[SmartFilter] No quotes received, using random selection');
    return watchlist.slice(0, 20);
  }

  const results = [];

  for (const quote of quotes) {
    if (!quote.symbol || !quote.price) continue;

    let score = 0;
    const signals = [];

    // 1. Price Move Score (25 points)
    const changePercent = Math.abs(quote.changesPercentage || 0);
    if (changePercent >= FILTER_CONFIG.PRICE_MOVE_THRESHOLD) {
      score += 25;
      signals.push(`Price ${quote.changesPercentage >= 0 ? '+' : ''}${quote.changesPercentage?.toFixed(1)}%`);
    }

    // 2. Volume Spike Score (20 points)
    const volumeRatio = quote.avgVolume > 0 ? quote.volume / quote.avgVolume : 1;
    if (volumeRatio >= FILTER_CONFIG.VOLUME_SPIKE_THRESHOLD) {
      score += 20;
      signals.push(`Volume ${volumeRatio.toFixed(1)}x avg`);
    }

    // 3. Near 52-week High/Low (20 points)
    if (quote.yearHigh && quote.price >= quote.yearHigh * 0.95) {
      score += 20;
      signals.push('Near 52w high');
    } else if (quote.yearLow && quote.price <= quote.yearLow * 1.05) {
      score += 20;
      signals.push('Near 52w low');
    }

    // 4. Market Cap preference (10 points for mid-large cap)
    if (quote.marketCap >= 10000000000) { // $10B+
      score += 10;
      signals.push('Large cap');
    } else if (quote.marketCap >= 2000000000) { // $2B+
      score += 5;
      signals.push('Mid cap');
    }

    // 5. P/E Ratio signals (15 points)
    if (quote.pe && quote.pe > 0) {
      if (quote.pe < 15) {
        score += 15;
        signals.push(`Low P/E (${quote.pe.toFixed(1)})`);
      } else if (quote.pe > 50) {
        score += 10;
        signals.push(`High P/E (${quote.pe.toFixed(1)})`);
      }
    }

    // 6. Day range position (10 points)
    if (quote.dayHigh && quote.dayLow && quote.dayHigh !== quote.dayLow) {
      const dayRange = (quote.price - quote.dayLow) / (quote.dayHigh - quote.dayLow);
      if (dayRange >= 0.8) {
        score += 10;
        signals.push('Near day high');
      } else if (dayRange <= 0.2) {
        score += 10;
        signals.push('Near day low');
      }
    }

    // Only include stocks that pass minimum score
    if (score >= FILTER_CONFIG.MIN_SCORE) {
      results.push({
        symbol: quote.symbol,
        price: quote.price,
        change: quote.change,
        changesPercentage: quote.changesPercentage,
        volume: quote.volume,
        avgVolume: quote.avgVolume,
        volumeRatio: Math.round(volumeRatio * 100) / 100,
        marketCap: quote.marketCap,
        pe: quote.pe,
        yearHigh: quote.yearHigh,
        yearLow: quote.yearLow,
        score: score,
        signals: signals,
        sector: getStockSector(quote.symbol)
      });
    }
  }

  // Sort by score (highest first)
  results.sort((a, b) => b.score - a.score);

  // Limit to MAX_TIER1_RESULTS for Tier 2 processing
  const tier1Results = results.slice(0, FILTER_CONFIG.MAX_TIER1_RESULTS);

  // Cache Tier 1 results
  filteredStocksCache.tier1Stocks = tier1Results;

  console.log(`[SmartFilter] ✅ TIER 1: ${results.length} stocks passed technical screen (Score ≥ ${FILTER_CONFIG.MIN_SCORE})`);
  console.log(`[SmartFilter] Top ${tier1Results.length} stocks sent to Tier 2 AI analysis`);

  // Log top 10 from Tier 1
  if (tier1Results.length > 0) {
    console.log('[SmartFilter] Tier 1 Top 10:');
    tier1Results.slice(0, 10).forEach((s, i) => {
      console.log(`  ${i+1}. ${s.symbol}: Score ${s.score} - ${s.signals.join(', ')}`);
    });
  }

  // Tier 2: AI-powered filtering using DeepSeek
  const aiFilteredStocks = await tier2AIFilter(tier1Results);

  // Cache final results
  filteredStocksCache.aiFilteredStocks = aiFilteredStocks;
  filteredStocksCache.stocks = aiFilteredStocks; // Alias for backward compatibility
  filteredStocksCache.lastUpdate = now;

  return aiFilteredStocks;
}

// ═══════════════════════════════════════════════════════════════════════════════
// TIER 2: Unbiased Technical Filtering with Sector Diversification
// Uses pure scoring + sector balancing - NO AI to avoid bias toward any team
// (Using DeepSeek here would give Team 3 an unfair advantage)
// ═══════════════════════════════════════════════════════════════════════════════

async function tier2AIFilter(tier1Stocks) {
  if (tier1Stocks.length === 0) {
    console.log('[SmartFilter] TIER 2: No stocks from Tier 1 to analyze');
    return [];
  }

  console.log(`\n[SmartFilter] 📊 TIER 2: Unbiased selection from ${tier1Stocks.length} stocks...`);

  // Group stocks by sector
  const sectorGroups = {};
  for (const stock of tier1Stocks) {
    const sector = stock.sector || 'Other';
    if (!sectorGroups[sector]) {
      sectorGroups[sector] = [];
    }
    sectorGroups[sector].push(stock);
  }

  // Sort each sector's stocks by score
  for (const sector of Object.keys(sectorGroups)) {
    sectorGroups[sector].sort((a, b) => b.score - a.score);
  }

  // Sort sectors by their top stock's score
  const sectors = Object.keys(sectorGroups).sort((a, b) =>
    (sectorGroups[b][0]?.score || 0) - (sectorGroups[a][0]?.score || 0)
  );

  console.log(`[SmartFilter] Found stocks in ${sectors.length} sectors`);

  // Select stocks using round-robin across sectors for diversity
  const selected = [];
  const sectorCounts = {};

  // First pass: Take top stock from each sector (ensures diversity)
  for (const sector of sectors) {
    if (selected.length >= FILTER_CONFIG.MAX_FINAL_STOCKS) break;

    const topStock = sectorGroups[sector][0];
    if (topStock) {
      topStock.tier2Rank = selected.length + 1;
      topStock.selectionMethod = 'sector_top';
      selected.push(topStock);
      sectorCounts[sector] = 1;
    }
  }

  // Second pass: Fill remaining slots with highest-scoring stocks
  // ensuring sector balance (max 3 per sector to prevent concentration)
  if (selected.length < FILTER_CONFIG.MAX_FINAL_STOCKS) {
    const remaining = tier1Stocks
      .filter(s => !selected.find(sel => sel.symbol === s.symbol))
      .sort((a, b) => b.score - a.score);

    for (const stock of remaining) {
      if (selected.length >= FILTER_CONFIG.MAX_FINAL_STOCKS) break;

      const sector = stock.sector || 'Other';
      const currentCount = sectorCounts[sector] || 0;

      // Allow max 3 stocks per sector for diversity
      if (currentCount < 3) {
        stock.tier2Rank = selected.length + 1;
        stock.selectionMethod = 'score_fill';
        selected.push(stock);
        sectorCounts[sector] = currentCount + 1;
      }
    }
  }

  // Third pass: If still not enough, take any remaining by score (ignore sector limit)
  if (selected.length < FILTER_CONFIG.MAX_FINAL_STOCKS) {
    const stillRemaining = tier1Stocks
      .filter(s => !selected.find(sel => sel.symbol === s.symbol))
      .sort((a, b) => b.score - a.score)
      .slice(0, FILTER_CONFIG.MAX_FINAL_STOCKS - selected.length);

    for (const stock of stillRemaining) {
      stock.tier2Rank = selected.length + 1;
      stock.selectionMethod = 'overflow';
      selected.push(stock);
    }
  }

  console.log(`[SmartFilter] ✅ TIER 2: Selected ${selected.length} stocks (unbiased, sector-balanced):`);

  // Log selected stocks
  selected.forEach((s, i) => {
    console.log(`  ${i+1}. ${s.symbol} | Score: ${s.score} | ${s.sector} | ${s.signals.slice(0, 2).join(', ')}`);
  });

  // Log sector distribution
  const finalSectorCounts = {};
  selected.forEach(s => {
    finalSectorCounts[s.sector] = (finalSectorCounts[s.sector] || 0) + 1;
  });
  console.log('[SmartFilter] Sector distribution:',
    Object.entries(finalSectorCounts).map(([s, c]) => `${s}: ${c}`).join(', ')
  );

  return selected;
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

async function executeAITrade(team, filteredStocks) {
  // Get competitive position
  const competitivePos = getCompetitivePosition(team);
  const holdingsSymbols = Object.keys(team.holdings).filter(s => team.holdings[s].shares > 0);

  let action, symbol, shares, reasoning;
  let usedAI = false;
  let localAnalysis = null;

  // First, pick a candidate stock to analyze
  let candidateStock = null;
  if (filteredStocks.length > 0) {
    // Pick from top filtered stocks
    const topStocks = filteredStocks.slice(0, Math.min(10, filteredStocks.length));
    candidateStock = topStocks[Math.floor(Math.random() * topStocks.length)];
  }

  // Run local analysis first (free)
  if (candidateStock) {
    localAnalysis = hybridAnalysis.runLocalAnalysis(candidateStock);
    console.log(`[Hybrid] ${team.name} local analysis for ${candidateStock.symbol}: Score ${localAnalysis.score}, ${localAnalysis.verdict}`);
  }

  // Determine if we should use expensive AI or stick with local analysis
  const shouldUseAI = candidateStock && hybridAnalysis.shouldUseAI(candidateStock, team, competitivePos);

  let aiDecision = null;
  if (shouldUseAI) {
    // Try to get real AI decision (costs money)
    aiDecision = await getAITradingDecision(team, filteredStocks, competitivePos);
    usedAI = true;
  } else if (candidateStock) {
    console.log(`[Hybrid] ${team.name}: Using local analysis (saving AI cost)`);
  }

  if (aiDecision && aiDecision.action !== 'HOLD') {
    // Use AI decision
    action = aiDecision.action;
    symbol = aiDecision.symbol;
    shares = aiDecision.shares || Math.floor(10 + Math.random() * 30);
    reasoning = aiDecision.reasoning || generateReasoning(team, action, symbol);

    console.log(`[AI Trade] ${team.name}: ${action} ${shares} ${symbol} (AI decision)`);
  } else if (aiDecision && aiDecision.action === 'HOLD') {
    // AI decided to hold - skip this trade
    console.log(`[AI Trade] ${team.name}: HOLD - ${aiDecision.reasoning}`);
    return null;
  } else if (localAnalysis && candidateStock) {
    // Use local analysis to make decision
    console.log(`[Hybrid Trade] ${team.name}: Using local analysis decision`);

    // Determine action based on local analysis score and team strategy
    if (localAnalysis.score >= 60 || (localAnalysis.score >= 50 && team.strategy === 'aggressive')) {
      action = 'BUY';
      symbol = candidateStock.symbol;
      shares = Math.floor(10 + Math.random() * 30);
      reasoning = `${localAnalysis.reasoning} [Local analysis: ${localAnalysis.verdict}]`;
    } else if (holdingsSymbols.length > 0 && localAnalysis.score < 40) {
      action = 'SELL';
      symbol = holdingsSymbols[Math.floor(Math.random() * holdingsSymbols.length)];
      shares = Math.floor(10 + Math.random() * 30);
      reasoning = `Local analysis suggests reducing exposure. ${localAnalysis.factors.join(', ') || 'Neutral signals'}`;
    } else {
      // Hold - no clear signal
      console.log(`[Hybrid] ${team.name}: Local analysis inconclusive (score: ${localAnalysis.score}) - skipping trade`);
      return null;
    }
  } else {
    // Fallback to smart selection from filtered stocks
    console.log(`[Hybrid Trade] ${team.name}: Using smart fallback selection`);

    // Trailing teams may be more aggressive
    let buyProbability = 0.5;
    if (competitivePos.isTrailing) {
      buyProbability = 0.65;
    } else if (competitivePos.isLeading) {
      buyProbability = 0.4;
    }

    if (holdingsSymbols.length === 0 || Math.random() < buyProbability) {
      action = 'BUY';
      // Pick from filtered stocks (prioritize higher scores)
      if (filteredStocks.length > 0) {
        // Weight selection toward higher-scoring stocks
        const topStocks = filteredStocks.slice(0, Math.min(10, filteredStocks.length));
        symbol = topStocks[Math.floor(Math.random() * topStocks.length)].symbol;
      } else {
        symbol = tournamentState.watchlist[Math.floor(Math.random() * tournamentState.watchlist.length)];
      }
    } else {
      action = 'SELL';
      symbol = holdingsSymbols[Math.floor(Math.random() * holdingsSymbols.length)];
    }

    shares = Math.floor(10 + Math.random() * 40);
    reasoning = generateReasoning(team, action, symbol);
  }

  // Get real-time price
  let price = await getRealTimePrice(symbol);
  if (!price) {
    console.log(`[Tournament] Skipping trade - no price for ${symbol}`);
    return null;
  }

  // Adjust shares based on strategy and position
  if (competitivePos.isTrailing && (team.strategy === 'aggressive' || team.strategy === 'momentum')) {
    shares = Math.floor(shares * 1.3);
  }
  if (competitivePos.isLeading && team.strategy === 'conservative') {
    shares = Math.floor(shares * 0.8);
  }

  const tradeValue = price * shares;

  // Validate BUY
  if (action === 'BUY') {
    if (team.cash < tradeValue) {
      shares = Math.floor(team.cash / price);
      if (shares < 1) {
        console.log(`[Tournament] ${team.name} cannot afford ${symbol}`);
        return null;
      }
    }
  }

  // Validate SELL
  if (action === 'SELL') {
    const holding = team.holdings[symbol];
    if (!holding || holding.shares < shares) {
      shares = holding ? holding.shares : 0;
      if (shares < 1) {
        console.log(`[Tournament] ${team.name} has no ${symbol} to sell`);
        return null;
      }
    }
  }

  // Get filtered stock data for additional context
  const stockData = filteredStocks.find(s => s.symbol === symbol);

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
    // Analysis source tracking
    analysisSource: usedAI ? 'ai' : 'local',
    aiGenerated: usedAI,
    localScore: localAnalysis?.score || null,
    localVerdict: localAnalysis?.verdict || null,
    filterScore: stockData?.score || null,
    filterSignals: stockData?.signals || [],
    competitiveContext: {
      rank: competitivePos.rank,
      position: competitivePos.position,
      gapToLeader: competitivePos.isLeading ? 0 : competitivePos.gapPercent
    }
  };
}

async function executeTradingRound() {
  if (!tournamentState.running || !isMarketOpen()) return;

  // Check cost alerts before trading
  const alerts = costAlertSystem.checkAlerts();

  // Check if budget is exhausted
  if (!costManager.canAffordAnalysis()) {
    console.log('[Tournament] ⛔ Budget exhausted - skipping AI trading round');
    return;
  }

  console.log('[Tournament] Executing trading round...');

  // Run SmartFilter to get screened stocks for all teams
  const filteredStocks = await smartFilterStocks(tournamentState.watchlist);

  // Store filtered stocks in tournament state for API access
  tournamentState.filteredStocks = filteredStocks;

  // Pre-fetch prices for filtered stocks
  const symbolsToFetch = filteredStocks.slice(0, 30).map(s => s.symbol);
  if (symbolsToFetch.length > 0) {
    await fetchRealTimePrices(symbolsToFetch);
  }

  // Each team has a chance to make a trade
  for (const team of tournamentState.teams) {
    // 40% chance per team per round to make a trade
    if (Math.random() < 0.4) {
      const trade = await executeAITrade(team, filteredStocks);

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

// Get AI cost spending report
app.get('/api/ai/costs', (req, res) => {
  try {
    const report = costManager.getSpendingReport();
    // Include alerts in the report
    report.alerts = costAlertSystem.getRecentAlerts(5);
    report.newAlerts = costAlertSystem.checkAlerts();
    res.json(report);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// AI Cost Alerts endpoint
app.get('/api/ai/alerts', (req, res) => {
  try {
    const newAlerts = costAlertSystem.checkAlerts();
    const recentAlerts = costAlertSystem.getRecentAlerts(20);
    const report = costManager.getSpendingReport();
    const hybridStats = hybridAnalysis.getStats();

    res.json({
      newAlerts,
      recentAlerts,
      spending: {
        today: report.today,
        dailyBudget: report.dailyBudget,
        dailyPercent: ((report.today / report.dailyBudget) * 100).toFixed(1),
        monthly: report.monthly,
        monthlyBudget: report.monthlyBudget,
        monthlyPercent: ((report.monthly / report.monthlyBudget) * 100).toFixed(1),
        budgetExceeded: report.budgetExceeded
      },
      hybridAnalysis: {
        cachedAnalyses: hybridStats.cachedAnalyses,
        cacheDurationMinutes: hybridStats.cacheDurationMinutes,
        description: 'Local analysis is free; AI is used only for high-priority situations'
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Tournament results endpoint - returns trades with AI reasoning, metrics, and sector allocation
app.get('/api/tournament/results', async (req, res) => {
  try {
    const marketStatus = getMarketStatus();
    res.json({
      status: tournamentState.running ? 'running' : 'idle',
      marketOpen: marketStatus.open,
      marketMessage: marketStatus.message,
      dataSource: 'Real-time FMP API + 2-Tier Unbiased Filtering',
      watchlistCount: tournamentState.watchlist.length,
      filtering: {
        tier1Count: filteredStocksCache.tier1Stocks?.length || 0,
        tier2Count: filteredStocksCache.aiFilteredStocks?.length || 0,
        method: 'Unbiased technical scoring + sector diversification (no AI bias)',
        description: `${tournamentState.watchlist.length} stocks → Tier 1 Technical Screen → ${filteredStocksCache.tier1Stocks?.length || 0} stocks → Tier 2 Sector-Balanced Selection → ${filteredStocksCache.aiFilteredStocks?.length || 0} stocks for teams`
      },
      filteredStocksCount: tournamentState.filteredStocks?.length || 0,
      filteredStocks: (tournamentState.filteredStocks || []).slice(0, 20), // Final filtered stocks for teams
      trades: tournamentState.trades,
      portfolioHistory: tournamentState.portfolioHistory,
      teams: tournamentState.teams.map(t => {
        // Calculate performance metrics
        const metrics = calculatePerformanceMetrics(t);
        // Calculate sector allocation
        const sectorAllocation = calculateSectorAllocation(t);

        return {
          id: t.id,
          name: t.name,
          model: t.model,
          strategy: t.strategy,
          personality: t.personality,
          focuses: t.focuses,
          portfolioValue: Math.round(t.portfolioValue * 100) / 100,
          cash: Math.round(t.cash * 100) / 100,
          invested: Math.round(t.invested * 100) / 100,
          realizedPnL: Math.round((t.realizedPnL || 0) * 100) / 100,
          unrealizedPnL: Math.round((t.unrealizedPnL || 0) * 100) / 100,
          totalPnL: Math.round(((t.realizedPnL || 0) + (t.unrealizedPnL || 0)) * 100) / 100,
          totalTrades: t.totalTrades,
          // Performance Metrics
          metrics: metrics,
          // Sector Allocation
          sectorAllocation: sectorAllocation,
          // Holdings with sector info
          holdings: Object.entries(t.holdings || {}).map(([symbol, pos]) => ({
            symbol,
            sector: getStockSector(symbol),
            shares: pos.shares,
            avgCost: Math.round(pos.avgCost * 100) / 100,
            currentPrice: Math.round(pos.currentPrice * 100) / 100,
            marketValue: Math.round(pos.marketValue * 100) / 100,
            unrealizedPnL: Math.round(pos.unrealizedPnL * 100) / 100,
            pnlPercent: Math.round((pos.unrealizedPnL / (pos.avgCost * pos.shares)) * 10000) / 100
          })),
          tradeHistory: (t.tradeHistory || []).slice(0, 20) // Last 20 trades
        };
      })
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
