require('dotenv').config();
const fs = require('fs');

const output = [];
output.push('AI API Keys Status Check');
output.push('========================\n');

const keys = {
    'Claude (Anthropic)': process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY,
    'DeepSeek': process.env.DEEPSEEK_API_KEY,
    'Kimi (Moonshot)': process.env.KIMI_API_KEY || process.env.MOONSHOT_API_KEY,
    'Gemini (Google)': process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY,
    'FMP (Financial Data)': process.env.FMP_API_KEY
};

Object.entries(keys).forEach(([name, key]) => {
    const isSet = key && key.length > 10 && !key.includes('your_');
    const status = isSet ? 'CONFIGURED' : 'NOT SET';
    const preview = isSet ? `${key.substring(0, 4)}...${key.substring(key.length - 4)}` : 'N/A';

    output.push(`${name}: ${status} (${preview})`);
});

const result = output.join('\n');
console.log(result);
fs.writeFileSync('ai-keys-status.txt', result);
console.log('\nSaved to: ai-keys-status.txt');
