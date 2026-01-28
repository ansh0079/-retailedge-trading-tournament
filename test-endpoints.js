const fetch = require('node-fetch');
require('dotenv').config();
const API_KEY = process.env.FMP_API_KEY || 'h43nCTpMeyiIiNquebaqktc7ChUHMxIz';

async function test() {
    console.log('Testing different quote endpoints...\n');

    const endpoints = [
        `https://financialmodelingprep.com/api/v3/quote/AAPL?apikey=${API_KEY}`,
        `https://financialmodelingprep.com/stable/quote/AAPL?apikey=${API_KEY}`,
        `https://financialmodelingprep.com/api/v3/profile/AAPL?apikey=${API_KEY}`,
    ];

    for (const url of endpoints) {
        console.log(`\nTesting: ${url.split('?')[0]}`);
        try {
            const res = await fetch(url);
            console.log('Status:', res.status);
            const text = await res.text();
            const preview = text.substring(0, 200);
            console.log('Response:', preview);
        } catch (err) {
            console.error('Error:', err.message);
        }
    }
}

test();
