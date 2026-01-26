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

console.log('✅ Config loaded:', window.APP_CONFIG.serverUrl);
