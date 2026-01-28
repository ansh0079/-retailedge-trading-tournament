const fetch = require('node-fetch');
console.log('Node version:', process.version);
try {
    new AbortController();
    console.log('AbortController: ✅ Present');
} catch (e) {
    console.log('AbortController: ❌ MISSING');
}

const API_KEY = process.env.FMP_API_KEY || 'h43nCTpMeyiIiNquebaqktc7ChUHMxIz';
async function test() {
    const symbol = 'AAPL';
    const url = `https://financialmodelingprep.com/stable/quote/${symbol}?apikey=${API_KEY}`;
    console.log('Fetching:', url);
    try {
        const res = await fetch(url);
        console.log('Status:', res.status);
        const text = await res.text();
        console.log('Body:', text.substring(0, 100));
    } catch (err) {
        console.error('Error:', err.message);
    }
}
test();
