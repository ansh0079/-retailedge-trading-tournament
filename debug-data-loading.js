// Debug script to check PE, ROE, and FMP rating data loading
console.log('🔍 Starting data loading debug...');

// Test with a known stock symbol
const testSymbol = 'AAPL';

async function debugDataLoading() {
  try {
    console.log(`📊 Testing data loading for ${testSymbol}...`);
    
    // Check if the API key is available
    const API_KEY = 'h43nCTpMeyiIiNquebaqktc7ChUHMxIz';
    console.log('🔑 API Key:', API_KEY.substring(0, 10) + '...');
    
    // Test quote endpoint
    const quoteUrl = `https://financialmodelingprep.com/api/v3/quote/${testSymbol}?apikey=${API_KEY}`;
    console.log('🌐 Quote URL:', quoteUrl);
    
    const quoteResponse = await fetch(quoteUrl);
    const quoteData = await quoteResponse.json();
    console.log('📈 Quote Data:', quoteData);
    
    if (quoteData && quoteData[0]) {
      const quote = quoteData[0];
      console.log('💰 PE from quote:', quote.pe);
      console.log('📊 Price:', quote.price);
      console.log('📈 Change:', quote.change);
    }
    
    // Test ratios endpoint
    const ratiosUrl = `https://financialmodelingprep.com/api/v3/ratios/${testSymbol}?apikey=${API_KEY}`;
    console.log('🌐 Ratios URL:', ratiosUrl);
    
    const ratiosResponse = await fetch(ratiosUrl);
    const ratiosData = await ratiosResponse.json();
    console.log('📊 Ratios Data:', ratiosData);
    
    if (ratiosData && ratiosData[0]) {
      const ratios = ratiosData[0];
      console.log('💹 ROE from ratios:', ratios.returnOnEquityTTM);
      console.log('💰 PE from ratios:', ratios.peRatio);
    }
    
    // Test key metrics endpoint
    const metricsUrl = `https://financialmodelingprep.com/api/v3/key-metrics-ttm/${testSymbol}?apikey=${API_KEY}`;
    console.log('🌐 Metrics URL:', metricsUrl);
    
    const metricsResponse = await fetch(metricsUrl);
    const metricsData = await metricsResponse.json();
    console.log('📈 Metrics Data:', metricsData);
    
    if (metricsData && metricsData[0]) {
      const metrics = metricsData[0];
      console.log('💹 ROE from metrics:', metrics.returnOnEquityTTM);
      console.log('💰 PE from metrics:', metrics.peRatioTTM);
    }
    
    // Test ratings endpoint
    const ratingsUrl = `https://financialmodelingprep.com/api/v3/rating/${testSymbol}?apikey=${API_KEY}`;
    console.log('🌐 Ratings URL:', ratingsUrl);
    
    const ratingsResponse = await fetch(ratingsUrl);
    const ratingsData = await ratingsResponse.json();
    console.log('⭐ Ratings Data:', ratingsData);
    
    if (ratingsData && ratingsData[0]) {
      const rating = ratingsData[0];
      console.log('⭐ FMP Rating:', rating.rating);
      console.log('📊 Rating Score:', rating.ratingScore);
    }
    
  } catch (error) {
    console.error('❌ Debug error:', error);
  }
}

// Run the debug
debugDataLoading();