const fetch = require('node-fetch');
require('dotenv').config();
const API_KEY = process.env.FMP_API_KEY || 'h43nCTpMeyiIiNquebaqktc7ChUHMxIz';

async function test() {
    console.log('Testing /stable/quote/ endpoint...');
    const url = `https://financialmodelingprep.com/stable/quote/AAPL?apikey=${API_KEY}`;
    console.log('URL:', url);

    try {
        const res = await fetch(url);
        console.log('Status:', res.status);
        const text = await res.text();
        console.log('Response:', text);
    } catch (err) {
        console.error('Error:', err.message);
    }
}

test();
