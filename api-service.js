// api-service.js - Secure backend API proxy for all financial data
require('dotenv').config();
const fetch = require('node-fetch');

class APIService {
    constructor() {
        // API keys - FMP for financial data, AI models for analysis
        // All keys must be set via environment variables for security
        this.apiKeys = {
            FMP: process.env.FMP_API_KEY,
            ANTHROPIC: process.env.ANTHROPIC_API_KEY,
            DEEPSEEK: process.env.DEEPSEEK_API_KEY,
            KIMI: process.env.KIMI_API_KEY,
            GEMINI: process.env.GEMINI_API_KEY
        };

        // Request counters for rate limiting
        this.requestCounts = {};

        console.log('✅ API Service initialized');
        console.log(`   FMP Key: ${this.apiKeys.FMP ? this.apiKeys.FMP.substring(0, 10) + '...' : 'NOT SET'}`);
        console.log(`   Claude Key: ${this.apiKeys.ANTHROPIC ? this.apiKeys.ANTHROPIC.substring(0, 15) + '...' : 'NOT SET'}`);
        console.log(`   DeepSeek Key: ${this.apiKeys.DEEPSEEK ? this.apiKeys.DEEPSEEK.substring(0, 10) + '...' : 'NOT SET'}`);
        console.log(`   Kimi Key: ${this.apiKeys.KIMI ? 'SET' : 'NOT SET'}`);
        console.log(`   Gemini Key: ${this.apiKeys.GEMINI ? 'SET' : 'NOT SET'}`);

        // Warn if critical keys are missing
        if (!this.apiKeys.FMP) {
            console.error('⚠️  WARNING: FMP_API_KEY not set - financial data will not work');
        }
        if (!this.apiKeys.ANTHROPIC) {
            console.error('⚠️  WARNING: ANTHROPIC_API_KEY not set - AI analysis will not work');
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // FINANCIAL MODELING PREP (FMP) - Primary API
    // ═══════════════════════════════════════════════════════════════════════════

    async getFMPData(endpoint, symbol, params = {}) {
        const queryParams = new URLSearchParams({
            symbol,
            apikey: this.apiKeys.FMP,
            ...params
        });

        const url = `https://financialmodelingprep.com/stable/${endpoint}?${queryParams}`;
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`FMP API error: ${response.status}`);
        }

        return await response.json();
    }

    async getFMPBatch(endpoint, symbols, params = {}) {
        const queryParams = new URLSearchParams({
            symbols: symbols.join(','),
            apikey: this.apiKeys.FMP,
            ...params
        });

        const url = `https://financialmodelingprep.com/stable/${endpoint}?${queryParams}`;
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`FMP Batch API error: ${response.status}`);
        }

        return await response.json();
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // STOCK QUOTE & PRICE DATA
    // ═══════════════════════════════════════════════════════════════════════════

    async getQuote(symbol) {
        return await this.getFMPData('quote', symbol);
    }

    async getBatchQuotes(symbols) {
        try {
            // FMP stable doesn't support batch queries - fetch individually with enriched data
            const results = [];
            
            for (let i = 0; i < symbols.length; i++) {
                try {
                    const symbol = symbols[i];
                    
                    // Fetch quote, ratios, and analyst rating in parallel
                    const [quoteRes, ratiosRes, ratingRes] = await Promise.all([
                        fetch(`https://financialmodelingprep.com/stable/quote?symbol=${symbol}&apikey=${this.apiKeys.FMP}`),
                        fetch(`https://financialmodelingprep.com/stable/ratios?symbol=${symbol}&apikey=${this.apiKeys.FMP}`),
                        fetch(`https://financialmodelingprep.com/stable/grades-consensus?symbol=${symbol}&apikey=${this.apiKeys.FMP}`)
                    ]);
                    
                    const quote = quoteRes.ok ? (await quoteRes.json())[0] : null;
                    const ratios = ratiosRes.ok ? (await ratiosRes.json())[0] : null;
                    const rating = ratingRes.ok ? await ratingRes.json() : null;
                    
                    if (quote) {
                        // Merge data from all sources
                        const enrichedQuote = {
                            ...quote,
                            // Add ratios data (PE, ROE, etc.)
                            pe: ratios?.priceEarningsRatio || quote.pe || null,
                            roe: ratios?.returnOnEquity ? (ratios.returnOnEquity * 100) : null,
                            roa: ratios?.returnOnAssets ? (ratios.returnOnAssets * 100) : null,
                            debtToEquity: ratios?.debtEquityRatio || null,
                            currentRatio: ratios?.currentRatio || null,
                            // Add analyst rating (convert to letter grade)
                            rating: rating?.consensus || null,
                            analystRating: rating?.consensus || null
                        };
                        
                        results.push(enrichedQuote);
                    }
                    
                    // Small delay to avoid rate limits (50ms = 20 requests/second max)
                    if (i < symbols.length - 1) {
                        await new Promise(resolve => setTimeout(resolve, 50));
                    }
                } catch (err) {
                    console.warn(`Failed to fetch ${symbols[i]}:`, err.message);
                }
            }
            
            return results;
        } catch (error) {
            console.error('Batch quotes error:', error);
            return [];
        }
    }

    async getHistoricalData(symbol, timeframe = '1min', params = {}) {
        return await this.getFMPData(`historical-chart/${timeframe}`, symbol, params);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // COMPANY FUNDAMENTALS
    // ═══════════════════════════════════════════════════════════════════════════

    async getProfile(symbol) {
        return await this.getFMPData('profile', symbol);
    }

    async getRatios(symbol) {
        return await this.getFMPData('ratios', symbol);
    }

    async getFinancials(symbol, period = 'annual') {
        return await this.getFMPData('income-statement', symbol, { period });
    }

    async getBalanceSheet(symbol, period = 'annual') {
        return await this.getFMPData('balance-sheet-statement', symbol, { period });
    }

    async getCashFlow(symbol, period = 'annual') {
        return await this.getFMPData('cash-flow-statement', symbol, { period });
    }

    async getEarnings(symbol) {
        return await this.getFMPData('earnings', symbol);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // TECHNICAL INDICATORS
    // ═══════════════════════════════════════════════════════════════════════════

    async getTechnicalIndicators(symbol, interval = '1hour') {
        return await this.getFMPData(`technical-indicator/${interval}`, symbol);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // REMOVED: Finnhub, Polygon, and other backup APIs
    // Using only FMP (paid tier) for all financial data
    // ═══════════════════════════════════════════════════════════════════════════

    // ═══════════════════════════════════════════════════════════════════════════
    // SOCIAL SENTIMENT - STOCKTWITS
    // ═══════════════════════════════════════════════════════════════════════════

    async getStockTwitsSentiment(symbol) {
        try {
            const url = `https://api.stocktwits.com/api/2/streams/symbol/${symbol}.json`;
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`StockTwits API error: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('StockTwits error:', error);
            return null;
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SOCIAL SENTIMENT - REDDIT
    // ═══════════════════════════════════════════════════════════════════════════

    async getRedditSentiment(symbol, subreddit = 'wallstreetbets') {
        try {
            const url = `https://www.reddit.com/r/${subreddit}/search.json?q=${symbol}&restrict_sr=1&sort=new&limit=50`;
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'RetailEdge/1.0'
                }
            });

            if (!response.ok) {
                throw new Error(`Reddit API error: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Reddit error:', error);
            return null;
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // NEWS
    // ═══════════════════════════════════════════════════════════════════════════

    async getNews(symbol, limit = 10) {
        // Use only FMP for news
        const url = `https://financialmodelingprep.com/stable/stock-news?symbol=${symbol}&limit=${limit}&apikey=${this.apiKeys.FMP}`;
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`News API error: ${response.status}`);
        }

        return await response.json();
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // AI MODELS - CLAUDE
    // ═══════════════════════════════════════════════════════════════════════════

    async callClaude(messages, options = {}) {
        const url = 'https://api.anthropic.com/v1/messages';

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': this.apiKeys.ANTHROPIC,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: options.model || 'claude-3-5-sonnet-20241022',
                max_tokens: options.max_tokens || 4096,
                messages: messages,
                ...options
            })
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Claude API error: ${response.status} - ${error}`);
        }

        return await response.json();
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // WATCHLIST SEARCH
    // ═══════════════════════════════════════════════════════════════════════════

    async searchSymbols(query) {
        const url = `https://financialmodelingprep.com/stable/search?query=${query}&limit=10&apikey=${this.apiKeys.FMP}`;
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Symbol search error: ${response.status}`);
        }

        return await response.json();
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // AI MODELS - DEEPSEEK
    // ═══════════════════════════════════════════════════════════════════════════

    async callDeepSeek(messages, options = {}) {
        const url = 'https://api.deepseek.com/v1/chat/completions';

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKeys.DEEPSEEK}`
            },
            body: JSON.stringify({
                model: options.model || 'deepseek-chat',
                messages: messages,
                max_tokens: options.max_tokens || 4096,
                temperature: options.temperature || 0.7,
                ...options
            })
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`DeepSeek API error: ${response.status} - ${error}`);
        }

        return await response.json();
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // AI MODELS - KIMI (Moonshot AI)
    // ═══════════════════════════════════════════════════════════════════════════

    async callKimi(messages, options = {}) {
        const url = 'https://api.moonshot.cn/v1/chat/completions';

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKeys.KIMI}`
            },
            body: JSON.stringify({
                model: options.model || 'moonshot-v1-8k',
                messages: messages,
                max_tokens: options.max_tokens || 4096,
                temperature: options.temperature || 0.7,
                ...options
            })
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Kimi API error: ${response.status} - ${error}`);
        }

        return await response.json();
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // AI MODELS - GEMINI (Google)
    // ═══════════════════════════════════════════════════════════════════════════

    async callGemini(messages, options = {}) {
        const model = options.model || 'gemini-pro';
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKeys.GEMINI}`;

        // Convert messages to Gemini format
        const contents = messages.map(msg => ({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.content }]
        }));

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: contents,
                generationConfig: {
                    maxOutputTokens: options.max_tokens || 4096,
                    temperature: options.temperature || 0.7
                }
            })
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Gemini API error: ${response.status} - ${error}`);
        }

        return await response.json();
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // MARKET OVERVIEW
    // ═══════════════════════════════════════════════════════════════════════════

    async getMarketIndexes() {
        const indexes = ['^GSPC', '^DJI', '^IXIC', '^RUT']; // S&P500, DOW, NASDAQ, Russell
        return await this.getBatchQuotes(indexes);
    }

    async getGainersLosers(type = 'gainers') {
        const url = `https://financialmodelingprep.com/stable/stock-market/${type}?apikey=${this.apiKeys.FMP}`;
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Market movers error: ${response.status}`);
        }

        return await response.json();
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // UTILITY METHODS
    // ═══════════════════════════════════════════════════════════════════════════

    checkAPIKeys() {
        const missing = [];
        Object.entries(this.apiKeys).forEach(([key, value]) => {
            if (!value || value === 'your_api_key_here') {
                missing.push(key);
            }
        });

        return {
            valid: missing.length === 0,
            missing: missing,
            available: Object.keys(this.apiKeys).filter(k => this.apiKeys[k] && this.apiKeys[k] !== 'your_api_key_here')
        };
    }
}

module.exports = new APIService();
