const fetch = require('node-fetch');
require('dotenv').config();
const API_KEY = process.env.FMP_API_KEY || 'h43nCTpMeyiIiNquebaqktc7ChUHMxIz';

async function test() {
    console.log('Testing quote endpoint with current key...');
    console.log('Key:', API_KEY);

    const url = `https://financialmodelingprep.com/stable/quote/AAPL?apikey=${API_KEY}`;

    try {
        const res = await fetch(url);
        console.log('\nStatus:', res.status);
        console.log('Headers:', JSON.stringify(Object.fromEntries(res.headers.entries()), null, 2));
        const text = await res.text();
        console.log('\nResponse Body:');
        console.log(text);

        if (text) {
            try {
                const json = JSON.parse(text);
                console.log('\nParsed JSON:');
                console.log(JSON.stringify(json, null, 2));
            } catch (e) {
                console.log('Not valid JSON');
            }
        }
    } catch (err) {
        console.error('Error:', err.message);
    }
}

test();
