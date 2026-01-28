const fetch = require('node-fetch');
require('dotenv').config();
const API_KEY = process.env.FMP_API_KEY || 'h43nCTpMeyiIiNquebaqktc7ChUHMxIz';

async function test() {
    console.log('Testing with browser-like headers...\n');

    const url = `https://financialmodelingprep.com/stable/quote/AAPL?apikey=${API_KEY}`;

    try {
        const res = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'application/json, text/plain, */*',
                'Accept-Language': 'en-US,en;q=0.9',
                'Referer': 'https://financialmodelingprep.com/'
            }
        });

        console.log('Status:', res.status);
        const text = await res.text();
        console.log('Response:', text.substring(0, 500));

        if (text && text.length > 2) {
            const json = JSON.parse(text);
            console.log('\n✅ SUCCESS! Got', Array.isArray(json) ? json.length : 1, 'result(s)');
            if (Array.isArray(json) && json[0]) {
                console.log('Sample:', JSON.stringify(json[0], null, 2));
            }
        } else {
            console.log('\n❌ FAILED: Empty response');
        }
    } catch (err) {
        console.error('Error:', err.message);
    }
}

test();
