const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;
const FMP_API_KEY = process.env.FMP_API_KEY;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        fmpKeyConfigured: !!FMP_API_KEY,
        timestamp: new Date().toISOString()
    });
});

// Batch quotes endpoint - Fetches enriched stock data
app.post('/api/quotes/batch', async (req, res) => {
    try {
        const { symbols } = req.body;

        if (!symbols || !Array.isArray(symbols) || symbols.length === 0) {
            return res.status(400).json({ error: 'Symbols array is required' });
        }

        if (!FMP_API_KEY) {
            return res.status(500).json({ error: 'FMP API key not configured' });
        }

        console.log(`[API] Fetching data for ${symbols.length} symbols...`);

        // Fetch data in parallel for better performance
        const stockDataPromises = symbols.map(async (symbol) => {
            try {
                // Fetch multiple endpoints in parallel
                const [quoteRes, metricsRes, ratiosRes] = await Promise.all([
                    // Real-time quote
                    axios.get(`https://financialmodelingprep.com/api/v3/quote/${symbol}?apikey=${FMP_API_KEY}`),
                    // Key metrics (growth, ROE, etc.)
                    axios.get(`https://financialmodelingprep.com/api/v3/key-metrics-ttm/${symbol}?apikey=${FMP_API_KEY}`),
                    // Ratios (P/E, P/B, etc.)
                    axios.get(`https://financialmodelingprep.com/api/v3/ratios-ttm/${symbol}?apikey=${FMP_API_KEY}`)
                ]);

                const quote = quoteRes.data[0] || {};
                const metrics = metricsRes.data[0] || {};
                const ratios = ratiosRes.data[0] || {};

                // Combine all data into enriched stock object
                return {
                    symbol: quote.symbol || symbol,
                    name: quote.name || symbol,
                    price: quote.price || 0,
                    change: quote.change || 0,
                    changesPercentage: quote.changesPercentage || 0,
                    dayLow: quote.dayLow || 0,
                    dayHigh: quote.dayHigh || 0,
                    yearLow: quote.yearLow || 0,
                    yearHigh: quote.yearHigh || 0,
                    marketCap: quote.marketCap || 0,
                    volume: quote.volume || 0,
                    avgVolume: quote.avgVolume || 0,
                    open: quote.open || 0,
                    previousClose: quote.previousClose || 0,
                    eps: quote.eps || 0,
                    pe: quote.pe || ratios.peRatioTTM || 0,

                    // Growth metrics (for Growth tab)
                    revenueGrowth: metrics.revenuePerShareTTM || 0,
                    earningsGrowth: metrics.netIncomePerShareTTM || 0,
                    epsGrowth: metrics.earningsYield || 0,

                    // Value metrics (for Value tab)
                    pb: ratios.priceToBookRatioTTM || 0,
                    priceToBook: ratios.priceToBookRatioTTM || 0,
                    dividendYield: ratios.dividendYieldTTM || 0,
                    debtToEquity: ratios.debtEquityRatioTTM || 0,

                    // Profitability metrics
                    roe: metrics.roeTTM || 0,
                    roa: metrics.roaTTM || 0,
                    grossMargin: ratios.grossProfitMarginTTM || 0,
                    operatingMargin: ratios.operatingProfitMarginTTM || 0,
                    netMargin: ratios.netProfitMarginTTM || 0,

                    // Momentum indicators (for Momentum tab)
                    // Note: FMP doesn't provide RSI in basic endpoints
                    // We'll calculate a simple momentum score based on price change
                    momentum: quote.changesPercentage || 0,
                    priceChange: quote.change || 0,

                    // Additional useful metrics
                    sharesOutstanding: quote.sharesOutstanding || 0,
                    timestamp: quote.timestamp || Date.now()
                };
            } catch (error) {
                console.error(`[API] Error fetching ${symbol}:`, error.message);
                // Return minimal data for failed symbols
                return {
                    symbol,
                    name: symbol,
                    price: 0,
                    change: 0,
                    changesPercentage: 0,
                    error: error.message
                };
            }
        });

        const stockData = await Promise.all(stockDataPromises);

        // Filter out completely failed requests
        const validStocks = stockData.filter(stock => stock.price > 0);

        console.log(`[API] Successfully fetched ${validStocks.length}/${symbols.length} stocks`);

        res.json(validStocks);
    } catch (error) {
        console.error('[API] Batch quotes error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// Get technical indicators (RSI, MACD, etc.) for Momentum/Oversold tabs
app.get('/api/technical/:symbol', async (req, res) => {
    try {
        const { symbol } = req.params;
        const { period = '1day', type = 'rsi' } = req.query;

        if (!FMP_API_KEY) {
            return res.status(500).json({ error: 'FMP API key not configured' });
        }

        // Fetch technical indicator from FMP
        const response = await axios.get(
            `https://financialmodelingprep.com/api/v3/technical_indicator/${period}/${symbol}?type=${type}&period=14&apikey=${FMP_API_KEY}`
        );

        res.json(response.data);
    } catch (error) {
        console.error(`[API] Technical indicator error:`, error.message);
        res.status(500).json({ error: error.message });
    }
});

// Get stock screener results (pre-filtered stocks)
app.get('/api/screener', async (req, res) => {
    try {
        const {
            marketCapMoreThan,
            marketCapLowerThan,
            priceMoreThan,
            priceLowerThan,
            betaMoreThan,
            betaLowerThan,
            volumeMoreThan,
            volumeLowerThan,
            dividendMoreThan,
            dividendLowerThan,
            limit = 100
        } = req.query;

        if (!FMP_API_KEY) {
            return res.status(500).json({ error: 'FMP API key not configured' });
        }

        // Build query parameters
        const params = new URLSearchParams({
            apikey: FMP_API_KEY,
            limit
        });

        if (marketCapMoreThan) params.append('marketCapMoreThan', marketCapMoreThan);
        if (marketCapLowerThan) params.append('marketCapLowerThan', marketCapLowerThan);
        if (priceMoreThan) params.append('priceMoreThan', priceMoreThan);
        if (priceLowerThan) params.append('priceLowerThan', priceLowerThan);
        if (betaMoreThan) params.append('betaMoreThan', betaMoreThan);
        if (betaLowerThan) params.append('betaLowerThan', betaLowerThan);
        if (volumeMoreThan) params.append('volumeMoreThan', volumeMoreThan);
        if (volumeLowerThan) params.append('volumeLowerThan', volumeLowerThan);
        if (dividendMoreThan) params.append('dividendMoreThan', dividendMoreThan);
        if (dividendLowerThan) params.append('dividendLowerThan', dividendLowerThan);

        const response = await axios.get(
            `https://financialmodelingprep.com/api/v3/stock-screener?${params.toString()}`
        );

        res.json(response.data);
    } catch (error) {
        console.error('[API] Screener error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// Start server
app.listen(PORT, () => {
    console.log('\n🚀 RetailEdge API Server Started!');
    console.log(`📊 API running at: http://localhost:${PORT}`);
    console.log(`🔑 FMP API Key: ${FMP_API_KEY ? '✅ Configured' : '❌ Not configured'}`);
    console.log('\n📡 Available Endpoints:');
    console.log(`   GET  /health - Health check`);
    console.log(`   POST /api/quotes/batch - Fetch enriched stock data`);
    console.log(`   GET  /api/technical/:symbol - Get technical indicators`);
    console.log(`   GET  /api/screener - Stock screener`);
    console.log('\n⚠️  Press Ctrl+C to stop the server\n');
});
