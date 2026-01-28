const fetch = require('node-fetch');
require('dotenv').config();
const API_KEY = process.env.FMP_API_KEY || 'h43nCTpMeyiIiNquebaqktc7ChUHMxIz';

async function test() {
    const url = `https://financialmodelingprep.com/api/v3/quote/AAPL?apikey=${API_KEY}`;
    try {
        const res = await fetch(url);
        const text = await res.text();
        console.log(text);
    } catch (err) {
        console.error(err);
    }
}
test();
