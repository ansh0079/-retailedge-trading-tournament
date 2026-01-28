require('dotenv').config();

console.log('🔑 AI API Keys Status Check\n');
console.log('═══════════════════════════════════════\n');

const keys = {
    'Claude (Anthropic)': process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY,
    'DeepSeek': process.env.DEEPSEEK_API_KEY,
    'Kimi (Moonshot)': process.env.KIMI_API_KEY || process.env.MOONSHOT_API_KEY,
    'Gemini (Google)': process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY,
    'FMP (Financial Data)': process.env.FMP_API_KEY
};

Object.entries(keys).forEach(([name, key]) => {
    const status = key && key !== 'your_fmp_api_key_here' && key !== 'your_anthropic_api_key_here'
        ? '✅ Configured'
        : '❌ Not Set';

    const preview = key && key.length > 10
        ? `${key.substring(0, 4)}...${key.substring(key.length - 4)}`
        : 'N/A';

    console.log(`${name.padEnd(25)} ${status.padEnd(15)} ${preview}`);
});

console.log('\n═══════════════════════════════════════');
console.log('\nNote: Only showing first/last 4 characters for security');
