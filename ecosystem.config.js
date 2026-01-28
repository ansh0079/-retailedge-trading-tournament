module.exports = {
    apps: [
        {
            name: 'tournament-scheduler',
            script: 'market-hours-scheduler.js',
            watch: false,
            autorestart: true,
            max_restarts: 10,
            min_uptime: '10s',
            restart_delay: 5000,
            error_file: './logs/scheduler-error.log',
            out_file: './logs/scheduler-out.log',
            log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
            env: {
                NODE_ENV: 'production'
            }
        },
        {
            name: 'tournament-backup',
            script: 'backup-tournament-data.js',
            watch: false,
            autorestart: true,
            max_restarts: 10,
            min_uptime: '10s',
            restart_delay: 5000,
            error_file: './logs/backup-error.log',
            out_file: './logs/backup-out.log',
            log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
            env: {
                NODE_ENV: 'production'
            }
        }
    ]
};
