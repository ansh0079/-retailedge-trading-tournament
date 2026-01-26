// update-frontend-apis.js - Automated frontend API migration script
const fs = require('fs');
const path = require('path');

const frontendFile = path.join(__dirname, 'src', 'index_ultimate.html');

console.log('🔄 Updating frontend API calls to use secure backend...\n');

// Read the file
let content = fs.readFileSync(frontendFile, 'utf8');
let changeCount = 0;

// Pattern replacements for FMP API calls
const replacements = [
  // Quote endpoint
  {
    pattern: /https:\/\/financialmodelingprep\.com\/stable\/quote\?symbol=\$\{symbol\}&apikey=\$\{[^}]+\}/g,
    replacement: '${API_URL}/api/quote/${symbol}',
    description: 'Quote API calls'
  },
  // Profile endpoint
  {
    pattern: /https:\/\/financialmodelingprep\.com\/stable\/profile\/\$\{symbol\}\?apikey=\$\{[^}]+\}/g,
    replacement: '${API_URL}/api/profile/${symbol}',
    description: 'Profile API calls'
  },
  // Ratios endpoint
  {
    pattern: /https:\/\/financialmodelingprep\.com\/stable\/ratios\/\$\{symbol\}\?apikey=\$\{[^}]+\}/g,
    replacement: '${API_URL}/api/ratios/${symbol}',
    description: 'Ratios API calls'
  },
  // Historical chart
  {
    pattern: /https:\/\/financialmodelingprep\.com\/stable\/historical-chart\/([^?]+)\?symbol=\$\{symbol\}&apikey=\$\{[^}]+\}/g,
    replacement: '${API_URL}/api/historical/${symbol}?timeframe=$1',
    description: 'Historical chart API calls'
  },
  // Earnings
  {
    pattern: /https:\/\/financialmodelingprep\.com\/stable\/earnings\?symbol=\$\{symbol\}&apikey=\$\{[^}]+\}/g,
    replacement: '${API_URL}/api/earnings/${symbol}',
    description: 'Earnings API calls'
  },
  // Technical indicators
  {
    pattern: /https:\/\/financialmodelingprep\.com\/stable\/technical-indicator\/([^?]+)\?symbol=\$\{symbol\}&apikey=\$\{[^}]+\}/g,
    replacement: '${API_URL}/api/technical/${symbol}?interval=$1',
    description: 'Technical indicators API calls'
  },
  // Income statement
  {
    pattern: /https:\/\/financialmodelingprep\.com\/stable\/income-statement\/\$\{symbol\}\?apikey=\$\{[^}]+\}/g,
    replacement: '${API_URL}/api/financials/${symbol}',
    description: 'Income statement API calls'
  },
  // Balance sheet
  {
    pattern: /https:\/\/financialmodelingprep\.com\/stable\/balance-sheet-statement\/\$\{symbol\}\?apikey=\$\{[^}]+\}/g,
    replacement: '${API_URL}/api/balance-sheet/${symbol}',
    description: 'Balance sheet API calls'
  },
  // Cash flow
  {
    pattern: /https:\/\/financialmodelingprep\.com\/stable\/cash-flow-statement\/\$\{symbol\}\?apikey=\$\{[^}]+\}/g,
    replacement: '${API_URL}/api/cash-flow/${symbol}',
    description: 'Cash flow API calls'
  },
  // News
  {
    pattern: /https:\/\/financialmodelingprep\.com\/stable\/stock-news\?symbol=\$\{symbol\}&limit=(\d+)&apikey=\$\{[^}]+\}/g,
    replacement: '${API_URL}/api/news/${symbol}?limit=$1',
    description: 'News API calls'
  },
  // Search
  {
    pattern: /https:\/\/financialmodelingprep\.com\/stable\/search\?query=\$\{([^}]+)\}&limit=\d+&apikey=\$\{[^}]+\}/g,
    replacement: '${API_URL}/api/search?q=${$1}',
    description: 'Search API calls'
  },
  // Generic FMP endpoint pattern (fallback)
  {
    pattern: /https:\/\/financialmodelingprep\.com\/stable\/([^?]+)\?symbol=\$\{symbol\}&apikey=\$\{FMP_API_KEY\}/g,
    replacement: '${API_URL}/api/$1/${symbol}',
    description: 'Generic FMP endpoint calls'
  },
  // Batch quotes pattern
  {
    pattern: /https:\/\/financialmodelingprep\.com\/stable\/([^?]+)\?symbols=\$\{[^}]+\.join\([^)]+\)\}&apikey=\$\{FMP_API_KEY\}/g,
    replacement: '${API_URL}/api/$1/batch',
    description: 'Batch API calls (needs manual review)'
  }
];

// Apply replacements
replacements.forEach(({ pattern, replacement, description }) => {
  const matches = content.match(pattern);
  if (matches) {
    console.log(`✓ ${description}: ${matches.length} replacements`);
    content = content.replace(pattern, replacement);
    changeCount += matches.length;
  }
});

// Additional cleanup - remove API key references
const apiKeyPatterns = [
  /&apikey=\$\{API_KEYS\.FMP\}/g,
  /\?apikey=\$\{API_KEYS\.FMP\}/g,
  /&apikey=\$\{FMP_API_KEY\}/g,
  /\?apikey=\$\{FMP_API_KEY\}/g
];

apiKeyPatterns.forEach(pattern => {
  const matches = content.match(pattern);
  if (matches) {
    console.log(`✓ Removed API key references: ${matches.length}`);
    content = content.replace(pattern, '');
    changeCount += matches.length;
  }
});

// Write back to file
fs.writeFileSync(frontendFile, content, 'utf8');

console.log(`\n✅ Migration complete!`);
console.log(`📊 Total changes: ${changeCount}`);
console.log(`📁 Updated file: ${frontendFile}`);
console.log(`\n⚠️  IMPORTANT: Review the file and test thoroughly!`);
console.log(`   Some complex API calls may need manual adjustment.`);
