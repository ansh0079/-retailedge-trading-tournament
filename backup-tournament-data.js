const fs = require('fs');
const path = require('path');

function backupTournamentData() {
    const sourceFile = path.join(__dirname, 'tournament_data.json');
    const backupDir = path.join(__dirname, 'backups');

    // Create backups directory if it doesn't exist
    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir);
        console.log('📁 Created backups directory');
    }

    // Create timestamped backup
    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    const backupFile = path.join(backupDir, `tournament_data_${timestamp}.json`);

    try {
        if (fs.existsSync(sourceFile)) {
            fs.copyFileSync(sourceFile, backupFile);
            const stats = fs.statSync(sourceFile);
            const sizeKB = (stats.size / 1024).toFixed(2);
            console.log(`✅ Backup created: ${path.basename(backupFile)} (${sizeKB} KB)`);

            // Keep only last 7 days of backups
            cleanOldBackups(backupDir, 7);
        } else {
            console.log('⚠️ No tournament data file found to backup');
        }
    } catch (error) {
        console.error('❌ Backup failed:', error.message);
    }
}

function cleanOldBackups(backupDir, daysToKeep) {
    try {
        const files = fs.readdirSync(backupDir);
        const now = Date.now();
        const maxAge = daysToKeep * 24 * 60 * 60 * 1000; // days to milliseconds

        let deletedCount = 0;
        files.forEach(file => {
            if (!file.startsWith('tournament_data_')) return;

            const filePath = path.join(backupDir, file);
            const stats = fs.statSync(filePath);
            const age = now - stats.mtimeMs;

            if (age > maxAge) {
                fs.unlinkSync(filePath);
                deletedCount++;
                console.log(`🗑️ Deleted old backup: ${file}`);
            }
        });

        if (deletedCount === 0) {
            console.log(`📦 All backups are within ${daysToKeep}-day retention period`);
        }
    } catch (error) {
        console.error('❌ Cleanup failed:', error.message);
    }
}

// Run backup every hour
const BACKUP_INTERVAL = 60 * 60 * 1000; // 1 hour
setInterval(backupTournamentData, BACKUP_INTERVAL);

// Run backup on startup
console.log('💾 Tournament Backup Service Started');
console.log(`⏰ Backup interval: ${BACKUP_INTERVAL / 1000 / 60} minutes`);
console.log('📅 Retention period: 7 days');
backupTournamentData();

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Backup service shutting down...');
    backupTournamentData(); // Final backup before exit
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Received SIGTERM, creating final backup...');
    backupTournamentData();
    process.exit(0);
});
