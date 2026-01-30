// Market Hours Scheduler
// Automatically starts/stops tournament during US market hours

const schedule = require('node-schedule');
const { spawn } = require('child_process');

let tournamentProcess = null;

function isMarketOpen() {
    const now = new Date();
    const et = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));

    const day = et.getDay(); // 0 = Sunday, 6 = Saturday
    const hour = et.getHours();
    const minute = et.getMinutes();

    // Check if weekday (Mon-Fri)
    if (day === 0 || day === 6) return false;

    // Check if within market hours (9:30 AM - 4:00 PM ET)
    const currentTime = hour * 60 + minute;
    const marketOpen = 9 * 60 + 30; // 9:30 AM
    const marketClose = 16 * 60; // 4:00 PM

    return currentTime >= marketOpen && currentTime < marketClose;
}

function getNextMarketEvent() {
    const now = new Date();
    const et = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));

    if (isMarketOpen()) {
        return 'Market closes at 4:00 PM ET';
    } else {
        return 'Market opens at 9:30 AM ET';
    }
}

function startTournament() {
    if (tournamentProcess) {
        console.log('⚠️ Tournament already running');
        return;
    }

    console.log('🚀 Starting tournament (Market Open)...');
    tournamentProcess = spawn('node', ['proxy-server.js'], {
        stdio: 'inherit',
        cwd: __dirname
    });

    tournamentProcess.on('exit', (code) => {
        console.log(`Tournament exited with code ${code}`);
        tournamentProcess = null;
    });
}

function stopTournament() {
    if (!tournamentProcess) {
        console.log('⚠️ Tournament not running');
        return;
    }

    console.log('🛑 Stopping tournament (Market Closed)...');
    tournamentProcess.kill('SIGTERM');
    tournamentProcess = null;
}

// Schedule: Start at 9:30 AM ET every weekday
schedule.scheduleJob('30 9 * * 1-5', function () {
    console.log('📅 Market Opening - Starting Tournament');
    startTournament();
});

// Schedule: Stop at 4:00 PM ET every weekday
schedule.scheduleJob('0 16 * * 1-5', function () {
    console.log('📅 Market Closing - Stopping Tournament');
    stopTournament();
});

// On startup, check if market is open
console.log('🕐 Market Hours Scheduler Started');
console.log('📍 Current ET Time:', new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }));
console.log('📊 Next Event:', getNextMarketEvent());

if (isMarketOpen()) {
    console.log('✅ Market is currently OPEN');
    startTournament();
} else {
    console.log('❌ Market is currently CLOSED');
    console.log('⏰ Tournament will auto-start at next market open (9:30 AM ET)');
}

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down scheduler...');
    stopTournament();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Received SIGTERM, shutting down...');
    stopTournament();
    process.exit(0);
});
