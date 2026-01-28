// RetailEdge Pro Configuration
// This file provides runtime configuration for the app

window.APP_CONFIG = {
    // Server URL - auto-detect based on environment
    serverUrl: window.location.origin,

    // Feature flags
    features: {
        aiAnalysis: true,
        tournament: true,
        socialSentiment: true
    },

    // API endpoints
    endpoints: {
        claude: '/api/claude',
        stocktwits: '/api/stocktwits',
        reddit: '/api/reddit',
        health: '/api/health'
    }
};

// Set API_BASE_URL for backend proxy
window.API_BASE_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3002' 
    : 'https://retailedge-trading-tournament-1.onrender.com';

console.log('✅ Config loaded:', window.APP_CONFIG.serverUrl);
console.log('✅ API_BASE_URL:', window.API_BASE_URL);
