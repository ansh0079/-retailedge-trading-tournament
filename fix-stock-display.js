// Fix Stock Display - Load All Stocks from localStorage
// Run this in your browser console (F12) to check what's in your localStorage

console.log('='.repeat(60));
console.log('📊 Stock Display Diagnostic');
console.log('='.repeat(60));

// Check curatedStocks
const curatedStocks = localStorage.getItem('curatedStocks');
if (curatedStocks) {
  const parsed = JSON.parse(curatedStocks);
  console.log('✅ CuratedStocks in localStorage:', parsed.length, 'stocks');
  console.log('First 10:', parsed.slice(0, 10));
  console.log('Last 10:', parsed.slice(-10));
} else {
  console.log('❌ No curatedStocks found in localStorage');
}

// Check other stock-related storage
console.log('\n📦 Other Storage:');
console.log('- watchlist:', localStorage.getItem('watchlist') ? JSON.parse(localStorage.getItem('watchlist')).length : 0);
console.log('- portfolio:', localStorage.getItem('portfolio') ? JSON.parse(localStorage.getItem('portfolio')).length : 0);

// Check if stocks are being filtered
console.log('\n🔍 Current Display:');
console.log('- Check the network tab for API calls');
console.log('- Look for any 429 (rate limit) errors');
console.log('- Check console for loading errors');

console.log('\n' + '='.repeat(60));
console.log('💡 Solutions:');
console.log('='.repeat(60));
console.log('1. If you have 949 stocks in localStorage but only 66 showing:');
console.log('   - API rate limits may be blocking requests');
console.log('   - Check console for errors');
console.log('   - Refresh the page to retry');
console.log('\n2. To add more stocks:');
console.log('   - Click "Import" button');
console.log('   - Paste stock symbols (one per line)');
console.log('   - Or upload CSV/JSON file');
console.log('\n3. To reset and reload:');
console.log('   - Run: localStorage.removeItem("curatedStocks")');
console.log('   - Refresh the page');
console.log('   - Re-import your stock list');
console.log('='.repeat(60));
