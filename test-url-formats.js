const fetch = require('node-fetch');
require('dotenv').config();
const API_KEY = process.env.FMP_API_KEY || 'h43nCTpMeyiIiNquebaqktc7ChUHMxIz';

async function test() {
    console.log('Testing different URL formats...\n');

    const formats = [
        `https://financialmodelingprep.com/stable/quote/AAPL?apikey=${API_KEY}`,
        `https://financialmodelingprep.com/stable/quote?symbol=AAPL&apikey=${API_KEY}`,
    ];

    for (const url of formats) {
        console.log(`\nTesting: ${url.split('?')[0]}`);
        console.log(`Params: ${url.split('?')[1].substring(0, 50)}...`);

        try {
            const res = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept': 'application/json'
                }
            });

            console.log('Status:', res.status);
            const text = await res.text();

            if (text && text.length > 2 && text !== '[]') {
                console.log('✅ SUCCESS!');
                console.log('Response preview:', text.substring(0, 200));
            } else {
                console.log('❌ Empty or failed');
            }
        } catch (err) {
            console.error('Error:', err.message);
        }
    }
}

test();
