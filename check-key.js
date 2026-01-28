require('dotenv').config();
const key = process.env.FMP_API_KEY;
const defaultKey = 'h43nCTpMeyiIiNquebaqktc7ChUHMxIz';

console.log('Key defined:', !!key);
console.log('Is Default Key:', key === defaultKey);
console.log('Key Length:', key ? key.length : 0);
console.log('Key Start:', key ? key.substring(0, 4) : 'N/A');
