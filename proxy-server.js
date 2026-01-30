// Simple CORS Proxy for StockTwits and Reddit APIs
// Run with: node proxy-server.js

const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
const PORT = 3002; // Changed to 3002 to avoid conflict

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

// Serve static files from dist folder
app.use(express.static(path.join(__dirname, 'dist')));

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
  const { messages } = req.body;
  // You would typically get this from process.env.ANTHROPIC_API_KEY
  const API_KEY = process.env.ANTHROPIC_API_KEY || 'YOUR_ANTHROPIC_API_KEY'; 
  
  if (!API_KEY || API_KEY === 'YOUR_ANTHROPIC_API_KEY') {
     // Return a mock response if no key is set, to demonstrate functionality
     console.log('⚠️ No Anthropic API key found. Returning mock response.');
     return res.json({
       content: [{
         text: JSON.stringify({
           predictions: {
             oneDay: { price: 0, change: 0, confidence: 50 },
             sevenDay: { price: 0, change: 0, confidence: 50 },
             thirtyDay: { price: 0, change: 0, confidence: 50 }
           },
           recommendation: "HOLD",
           recommendationStrength: 5,
           targetPrice: 0,
           stopLoss: 0,
           keyInsights: ["API Key missing", "Please configure backend"],
           risks: ["Configuration required"],
           opportunities: ["Add API Key"],
           technicalScore: 50,
           fundamentalScore: 50,
           sentimentScore: 50,
           summary: "Please configure your Anthropic API key in proxy-server.js to enable real AI analysis."
         })
       }]
     });
  }

  try {
    console.log('📡 Proxying Claude request...');
    const response = await fetchWithRetry('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      timeoutMs: 20000,
      retries: 1,
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1024,
        messages: messages
      })
    });
    
    const data = await response.json();
    if (data.error) {
      throw new Error(data.error.message);
    }
    res.json(data);
  } catch (error) {
    console.error('❌ Claude proxy error:', error.message);
    res.status(500).json({ error: 'Failed to fetch Claude analysis' });
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

app.listen(PORT, () => {
  console.log(`\n✅ CORS Proxy Server running on http://localhost:${PORT}`);
  console.log(`📡 Proxying:`);
  console.log(`   - StockTwits: http://localhost:${PORT}/api/stocktwits/:symbol`);
  console.log(`   - Reddit: http://localhost:${PORT}/api/reddit/:subreddit/search?q=:query`);
  console.log(`\n🔥 Ready to serve social sentiment data!\n`);
});
