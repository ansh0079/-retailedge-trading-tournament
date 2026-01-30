// tournament-server.js - Backend API server for AI Tournament
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const TournamentManager = require('./tournament');
const apiService = require('./api-service');

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize tournament manager
const tournamentManager = new TournamentManager();

// ═══════════════════════════════════════════════════════════════════════════
// FINANCIAL DATA API ROUTES (Secure Proxy)
// ═══════════════════════════════════════════════════════════════════════════

// Stock Quote
app.get('/api/quote/:symbol', async (req, res) => {
    try {
        const data = await apiService.getQuote(req.params.symbol);
        res.json(data);
    } catch (error) {
        console.error('Quote error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Batch Quotes (basic data only for speed)
app.post('/api/quotes/batch', async (req, res) => {
    try {
        const { symbols } = req.body;
        const data = await apiService.getBatchQuotes(symbols);
        res.json(data);
    } catch (error) {
        console.error('Batch quotes error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Enriched Quote (PE, ROE, Rating - on demand)
app.get('/api/quote/enriched/:symbol', async (req, res) => {
    try {
        const data = await apiService.getEnrichedQuote(req.params.symbol);
        res.json(data);
    } catch (error) {
        console.error('Enriched quote error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Historical Data
app.get('/api/historical/:symbol', async (req, res) => {
    try {
        const { timeframe } = req.query;
        const data = await apiService.getHistoricalData(req.params.symbol, timeframe);
        res.json(data);
    } catch (error) {
        console.error('Historical data error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Company Profile
app.get('/api/profile/:symbol', async (req, res) => {
    try {
        const data = await apiService.getProfile(req.params.symbol);
        res.json(data);
    } catch (error) {
        console.error('Profile error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Financial Ratios
app.get('/api/ratios/:symbol', async (req, res) => {
    try {
        const data = await apiService.getRatios(req.params.symbol);
        res.json(data);
    } catch (error) {
        console.error('Ratios error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Financials (Income Statement)
app.get('/api/financials/:symbol', async (req, res) => {
    try {
        const { period } = req.query;
        const data = await apiService.getFinancials(req.params.symbol, period);
        res.json(data);
    } catch (error) {
        console.error('Financials error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Balance Sheet
app.get('/api/balance-sheet/:symbol', async (req, res) => {
    try {
        const { period } = req.query;
        const data = await apiService.getBalanceSheet(req.params.symbol, period);
        res.json(data);
    } catch (error) {
        console.error('Balance sheet error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Cash Flow
app.get('/api/cash-flow/:symbol', async (req, res) => {
    try {
        const { period } = req.query;
        const data = await apiService.getCashFlow(req.params.symbol, period);
        res.json(data);
    } catch (error) {
        console.error('Cash flow error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Earnings
app.get('/api/earnings/:symbol', async (req, res) => {
    try {
        const data = await apiService.getEarnings(req.params.symbol);
        res.json(data);
    } catch (error) {
        console.error('Earnings error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Technical Indicators
app.get('/api/technical/:symbol', async (req, res) => {
    try {
        const { interval } = req.query;
        const data = await apiService.getTechnicalIndicators(req.params.symbol, interval);
        res.json(data);
    } catch (error) {
        console.error('Technical indicators error:', error);
        res.status(500).json({ error: error.message });
    }
});

// StockTwits Sentiment
app.get('/api/stocktwits/:symbol', async (req, res) => {
    try {
        const data = await apiService.getStockTwitsSentiment(req.params.symbol);
        res.json(data);
    } catch (error) {
        console.error('StockTwits error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Reddit Sentiment
app.get('/api/reddit/:subreddit/search', async (req, res) => {
    try {
        const { q } = req.query;
        const data = await apiService.getRedditSentiment(q, req.params.subreddit);
        res.json(data);
    } catch (error) {
        console.error('Reddit error:', error);
        res.status(500).json({ error: error.message });
    }
});

// News
app.get('/api/news/:symbol', async (req, res) => {
    try {
        const { limit } = req.query;
        const data = await apiService.getNews(req.params.symbol, limit);
        res.json(data);
    } catch (error) {
        console.error('News error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Symbol Search
app.get('/api/search', async (req, res) => {
    try {
        const { q } = req.query;
        const data = await apiService.searchSymbols(q);
        res.json(data);
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Market Indexes
app.get('/api/market/indexes', async (req, res) => {
    try {
        const data = await apiService.getMarketIndexes();
        res.json(data);
    } catch (error) {
        console.error('Market indexes error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Market Gainers/Losers
app.get('/api/market/:type', async (req, res) => {
    try {
        const data = await apiService.getGainersLosers(req.params.type);
        res.json(data);
    } catch (error) {
        console.error('Market movers error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Claude AI Proxy
app.post('/api/claude', async (req, res) => {
    try {
        const { messages, options } = req.body;
        const data = await apiService.callClaude(messages, options);
        res.json(data);
    } catch (error) {
        console.error('Claude API error:', error);
        res.status(500).json({ error: error.message });
    }
});

// DeepSeek AI Proxy
app.post('/api/deepseek', async (req, res) => {
    try {
        const { messages, options } = req.body;
        const data = await apiService.callDeepSeek(messages, options);
        res.json(data);
    } catch (error) {
        console.error('DeepSeek API error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Kimi AI Proxy
app.post('/api/kimi', async (req, res) => {
    try {
        const { messages, options } = req.body;
        const data = await apiService.callKimi(messages, options);
        res.json(data);
    } catch (error) {
        console.error('Kimi API error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Gemini AI Proxy
app.post('/api/gemini', async (req, res) => {
    try {
        const { messages, options } = req.body;
        const data = await apiService.callGemini(messages, options);
        res.json(data);
    } catch (error) {
        console.error('Gemini API error:', error);
        res.status(500).json({ error: error.message });
    }
});

// API Keys Status Check
app.get('/api/keys/status', (req, res) => {
    const status = apiService.checkAPIKeys();
    res.json(status);
});

// ═══════════════════════════════════════════════════════════════════════════
// TOURNAMENT API ROUTES
// ═══════════════════════════════════════════════════════════════════════════

// Start a new tournament
app.post('/api/tournament/start', async (req, res) => {
    try {
        const { days, teams, watchlist, simulationSpeed } = req.body;

        if (!teams || !watchlist) {
            return res.status(400).json({ error: 'Missing required fields: teams, watchlist' });
        }

        const result = await tournamentManager.startTournament({
            days: days || 30, // Default to 30 days
            teams,
            watchlist,
            simulationSpeed: simulationSpeed || 2000 // Default 2 seconds per day
        });
        res.json(result);
    } catch (error) {
        console.error('Error starting tournament:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get tournament status by ID
app.get('/api/tournament/status/:experimentId', (req, res) => {
    const tournament = tournamentManager.getTournament(req.params.experimentId);
    if (!tournament) {
        return res.status(404).json({ error: 'Tournament not found' });
    }
    res.json({
        status: tournament.status,
        current_day: tournament.currentDay,
        total_days: tournament.config.days,
        leaderboard: tournament.leaderboard,
        logs: tournament.logs.slice(-20) // Last 20 logs
    });
});

// Get latest tournament results
app.get('/api/tournament/results', async (req, res) => {
    try {
        const latest = await tournamentManager.getLatestResult();
        res.json({ results: latest });
    } catch (error) {
        console.error('Error getting results:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get all tournament results
app.get('/api/tournament/all-results', async (req, res) => {
    try {
        const results = await tournamentManager.getAllResults();
        res.json({ results });
    } catch (error) {
        console.error('Error getting all results:', error);
        res.status(500).json({ error: error.message });
    }
});

// Extend tournament duration
app.post('/api/tournament/extend/:experimentId', (req, res) => {
    try {
        const { experimentId } = req.params;
        const { additionalDays } = req.body;

        if (!additionalDays || additionalDays <= 0) {
            return res.status(400).json({ error: 'additionalDays must be a positive number' });
        }

        const result = tournamentManager.extendTournament(experimentId, additionalDays);
        res.json(result);
    } catch (error) {
        console.error('Error extending tournament:', error);
        res.status(500).json({ error: error.message });
    }
});

// Adjust simulation speed
app.post('/api/tournament/speed/:experimentId', (req, res) => {
    try {
        const { experimentId } = req.params;
        const { speedMs } = req.body;

        if (!speedMs || speedMs <= 0) {
            return res.status(400).json({ error: 'speedMs must be a positive number' });
        }

        const result = tournamentManager.setSimulationSpeed(experimentId, speedMs);
        res.json(result);
    } catch (error) {
        console.error('Error adjusting speed:', error);
        res.status(500).json({ error: error.message });
    }
});

// Pause tournament
app.post('/api/tournament/pause/:experimentId', async (req, res) => {
    try {
        const { experimentId } = req.params;
        const result = await tournamentManager.pauseTournament(experimentId);
        res.json(result);
    } catch (error) {
        console.error('Error pausing tournament:', error);
        res.status(500).json({ error: error.message });
    }
});

// Resume tournament
app.post('/api/tournament/resume/:experimentId', async (req, res) => {
    try {
        const { experimentId } = req.params;
        const result = await tournamentManager.resumeFromCheckpoint(experimentId);
        res.json(result);
    } catch (error) {
        console.error('Error resuming tournament:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get saved tournaments
app.get('/api/tournament/saved', async (req, res) => {
    try {
        const saved = await tournamentManager.getSavedTournaments();
        res.json({ saved });
    } catch (error) {
        console.error('Error getting saved tournaments:', error);
        res.status(500).json({ error: error.message });
    }
});

// Save checkpoint manually
app.post('/api/tournament/checkpoint/:experimentId', async (req, res) => {
    try {
        const { experimentId } = req.params;
        await tournamentManager.saveCheckpoint(experimentId);
        res.json({ success: true, message: 'Checkpoint saved' });
    } catch (error) {
        console.error('Error saving checkpoint:', error);
        res.status(500).json({ error: error.message });
    }
});

// ═══════════════════════════════════════════════════════════════════════════
// SERVER-SENT EVENTS (SSE) ENDPOINTS
// ═══════════════════════════════════════════════════════════════════════════

// SSE endpoint for leaderboard updates
app.get('/api/tournament/sse/leaderboard/:experimentId', (req, res) => {
    const { experimentId } = req.params;

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');

    console.log(`📡 SSE client connected for leaderboard: ${experimentId}`);

    // Send initial data
    const tournament = tournamentManager.getTournament(experimentId);
    if (tournament && tournament.leaderboard) {
        res.write(`data: ${JSON.stringify({ leaderboard: tournament.leaderboard })}\n\n`);
    }

    // Handler for leaderboard updates
    const sendLeaderboardUpdate = (data) => {
        if (data.experimentId === experimentId) {
            res.write(`data: ${JSON.stringify({ leaderboard: data.leaderboard })}\n\n`);
        }
    };

    // Handler for tournament completion
    const sendCompletionUpdate = (data) => {
        if (data.experimentId === experimentId) {
            res.write(`data: ${JSON.stringify({
                status: 'completed',
                leaderboard: data.leaderboard,
                results: data.results
            })}\n\n`);
        }
    };

    // Register event listeners
    tournamentManager.on('leaderboardUpdate', sendLeaderboardUpdate);
    tournamentManager.on('tournamentComplete', sendCompletionUpdate);

    // Clean up on client disconnect
    req.on('close', () => {
        console.log(`📡 SSE client disconnected from leaderboard: ${experimentId}`);
        tournamentManager.off('leaderboardUpdate', sendLeaderboardUpdate);
        tournamentManager.off('tournamentComplete', sendCompletionUpdate);
        res.end();
    });
});

// SSE endpoint for tournament logs
app.get('/api/tournament/sse/logs/:experimentId', (req, res) => {
    const { experimentId } = req.params;

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');

    console.log(`📡 SSE client connected for logs: ${experimentId}`);

    // Send recent logs
    const tournament = tournamentManager.getTournament(experimentId);
    if (tournament && tournament.logs) {
        tournament.logs.slice(-10).forEach(log => {
            res.write(`data: ${JSON.stringify({ message: log.message, type: log.type })}\n\n`);
        });
    }

    // Handler for new logs
    const sendLog = (data) => {
        if (data.experimentId === experimentId) {
            res.write(`data: ${JSON.stringify({ message: data.message, type: data.type })}\n\n`);
        }
    };

    // Register event listener
    tournamentManager.on('log', sendLog);

    // Clean up on client disconnect
    req.on('close', () => {
        console.log(`📡 SSE client disconnected from logs: ${experimentId}`);
        tournamentManager.off('log', sendLog);
        res.end();
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// HEALTH CHECK
// ═══════════════════════════════════════════════════════════════════════════

app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'AI Tournament Server',
        activeTournaments: tournamentManager.activeTournaments.size
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// START SERVER
// ═══════════════════════════════════════════════════════════════════════════

app.listen(PORT, () => {
    console.log('\n🏆 ═══════════════════════════════════════════════════════════');
    console.log('🏆  AI TOURNAMENT SERVER');
    console.log('🏆 ═══════════════════════════════════════════════════════════');
    console.log(`\n📡 Server running at http://localhost:${PORT}`);
    console.log(`\n📋 Available endpoints:`);
    console.log(`   POST   /api/tournament/start`);
    console.log(`   GET    /api/tournament/status/:id`);
    console.log(`   GET    /api/tournament/results`);
    console.log(`   GET    /api/tournament/all-results`);
    console.log(`   POST   /api/tournament/extend/:id`);
    console.log(`   POST   /api/tournament/speed/:id`);
    console.log(`   POST   /api/tournament/pause/:id`);
    console.log(`   POST   /api/tournament/resume/:id`);
    console.log(`   GET    /api/tournament/saved`);
    console.log(`   POST   /api/tournament/checkpoint/:id`);
    console.log(`   GET    /api/tournament/sse/leaderboard/:id`);
    console.log(`   GET    /api/tournament/sse/logs/:id`);
    console.log(`   GET    /health`);
    console.log(`\n✅ Ready to run AI trading tournaments!\n`);
});

module.exports = app;
