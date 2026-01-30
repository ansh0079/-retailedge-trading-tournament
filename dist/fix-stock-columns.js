// Fix Script: Enrich Stock Data with FMP API
// This script fetches missing data (Change%, P/E, ROE%, FMP Rating) for all stocks

console.log('🔧 Starting stock data enrichment...');

// Use API_BASE_URL from config.js (already defined globally)
// FMP_API_KEY is handled by the backend proxy server

// Function to enrich a single stock with FMP data
async function enrichStock(stock) {
    try {
        console.log(`📊 Enriching ${stock.symbol}...`);

        // Fetch comprehensive data from our proxy server
        const response = await fetch(`${API_BASE_URL}/api/stock/${stock.symbol}/comprehensive`);

        if (!response.ok) {
            console.warn(`⚠️ Failed to fetch data for ${stock.symbol}`);
            return stock;
        }

        const data = await response.json();

        // Extract the data we need
        const quote = data.quote || {};
        const metrics = data.fundamentals?.metrics || {};
        const ratios = data.fundamentals?.ratios || {};
        const analysts = data.analysts?.consensus || {};

        // Enrich the stock object
        return {
            ...stock,
            // Quote data
            price: quote.price || stock.price,
            changePct: quote.changesPercentage || quote.change || null,
            change: quote.change || null,
            volume: quote.volume || stock.volume,
            marketCap: quote.marketCap || stock.marketCap,

            // Fundamentals
            pe: metrics.peRatioTTM || quote.pe || null,
            roe: ratios.returnOnEquityTTM ? ratios.returnOnEquityTTM * 100 : null,
            revenueGrowth: metrics.revenueGrowth || null,
            grossMargin: ratios.grossProfitMarginTTM ? ratios.grossProfitMarginTTM * 100 : null,
            netMargin: ratios.netProfitMarginTTM ? ratios.netProfitMarginTTM * 100 : null,
            debtToEquity: ratios.debtEquityRatioTTM || null,
            currentRatio: ratios.currentRatioTTM || null,
            dividendYield: ratios.dividendYieldTTM ? ratios.dividendYieldTTM * 100 : null,

            // Analyst data
            analystRating: analysts.consensus || 'N/A',
            rating: analysts.consensus || 'N/A',

            // Mark as enriched
            _enriched: true
        };

    } catch (error) {
        console.error(`❌ Error enriching ${stock.symbol}:`, error);
        return stock;
    }
}

// Function to enrich all stocks
async function enrichAllStocks() {
    if (!window.stocks || !Array.isArray(window.stocks)) {
        console.error('❌ window.stocks not found or not an array');
        return;
    }

    console.log(`🚀 Enriching ${window.stocks.length} stocks...`);

    // Process in batches to avoid overwhelming the API
    const batchSize = 5;
    const enrichedStocks = [];

    for (let i = 0; i < window.stocks.length; i += batchSize) {
        const batch = window.stocks.slice(i, i + batchSize);

        console.log(`📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(window.stocks.length / batchSize)}`);

        const enrichedBatch = await Promise.all(
            batch.map(stock => enrichStock(stock))
        );

        enrichedStocks.push(...enrichedBatch);

        // Small delay between batches
        if (i + batchSize < window.stocks.length) {
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }

    // Update window.stocks with enriched data
    window.stocks = enrichedStocks;

    console.log('✅ Stock enrichment complete!');
    console.log('📊 Sample enriched stock:', window.stocks[0]);

    // Trigger a re-render if there's a render function
    if (typeof window.renderStocks === 'function') {
        window.renderStocks();
    } else if (typeof window.updateStockTable === 'function') {
        window.updateStockTable();
    } else {
        console.log('⚠️ No render function found. You may need to refresh the page to see changes.');
    }

    return enrichedStocks;
}

// Auto-run if stocks are already loaded
if (window.stocks && window.stocks.length > 0) {
    console.log('📊 Stocks detected, starting enrichment...');
    enrichAllStocks();
} else {
    console.log('⏳ Waiting for stocks to load...');

    // Watch for stocks to be loaded
    let checkInterval = setInterval(() => {
        if (window.stocks && window.stocks.length > 0) {
            clearInterval(checkInterval);
            console.log('📊 Stocks loaded, starting enrichment...');
            enrichAllStocks();
        }
    }, 1000);

    // Stop checking after 30 seconds
    setTimeout(() => {
        clearInterval(checkInterval);
        console.log('⏱️ Timeout: Stocks not loaded after 30 seconds');
    }, 30000);
}

// Export function for manual use
window.enrichAllStocks = enrichAllStocks;

console.log('💡 Tip: You can manually run enrichment by typing: enrichAllStocks()');
