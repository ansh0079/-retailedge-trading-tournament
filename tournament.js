// server/tournament.js
const { EventEmitter } = require('events');
const fs = require('fs').promises;
const path = require('path');

class TournamentManager extends EventEmitter {
    constructor() {
        super();
        this.activeTournaments = new Map(); // experiment_id -> tournament data
        this.resultsDir = path.join(__dirname, 'tournament_results');
        this.checkpointsDir = path.join(__dirname, 'tournament_checkpoints');
        this.init();
    }

    async init() {
        try {
            await fs.mkdir(this.resultsDir, { recursive: true });
            await fs.mkdir(this.checkpointsDir, { recursive: true });
            console.log('✅ Tournament results directory initialized');
            console.log('✅ Tournament checkpoints directory initialized');

            // Auto-load any saved tournaments on startup
            await this.loadSavedTournaments();
        } catch (error) {
            console.log('Tournament directories already exist');
        }
    }

    async startTournament(config) {
        const experimentId = `tourney_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Default to 30 days if not specified, max 90 days
        const days = Math.min(config.days || 30, 90);
        const simulationSpeed = config.simulationSpeed || 2000; // milliseconds per day
        const realTime = config.realTime || false; // Real-time mode during market hours

        const tournament = {
            experimentId,
            config: {
                ...config,
                days,
                simulationSpeed,
                realTime
            },
            status: 'running',
            startTime: Date.now(),
            currentDay: 0,
            maxDays: 90, // Can be extended up to 90 days
            realTimeStartDate: realTime ? new Date() : null,
            teams: this.initializeTeams(config.teams),
            portfolio: {
                holdings: [],
                initialValue: 100000, // $100K starting capital per team
                cash: 100000
            },
            logs: [],
            leaderboard: []
        };

        this.activeTournaments.set(experimentId, tournament);

        console.log(`🏆 Tournament ${experimentId} started with ${config.teams.length} teams for ${days} days (extendable to 90)`);
        console.log(`⚡ Simulation speed: ${simulationSpeed}ms per day`);

        // Start simulation in background
        this.runSimulation(experimentId);

        return { experimentId, status: 'running', days, maxDays: 90 };
    }

    initializeTeams(teamIds) {
        const teamConfigs = {
            1: { name: 'Team Alpha', model: 'Claude-3-Sonnet', riskProfile: 'aggressive' },
            2: { name: 'Team Beta', model: 'GPT-4-Turbo', riskProfile: 'balanced' },
            3: { name: 'Team Gamma', model: 'DeepSeek-V3', riskProfile: 'conservative' },
            4: { name: 'Team Delta', model: 'Gemini-Pro', riskProfile: 'dynamic' }
        };

        return teamIds.map(id => ({
            teamId: id,
            ...teamConfigs[id],
            portfolioValue: 100000,
            trades: [],
            returns: [],
            totalReturn: 0,
            active: true
        }));
    }

    // Check if US market is currently open (9:30 AM - 4:00 PM ET, Mon-Fri)
    isMarketOpen() {
        const now = new Date();
        const et = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));

        const day = et.getDay(); // 0 = Sunday, 6 = Saturday
        const hour = et.getHours();
        const minute = et.getMinutes();

        // Check if weekend
        if (day === 0 || day === 6) return false;

        // Check if during market hours (9:30 AM - 4:00 PM)
        const currentMinutes = hour * 60 + minute;
        const marketOpen = 9 * 60 + 30; // 9:30 AM
        const marketClose = 16 * 60; // 4:00 PM

        return currentMinutes >= marketOpen && currentMinutes < marketClose;
    }

    // Get next market open time
    getNextMarketOpen() {
        const now = new Date();
        const et = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));

        const nextOpen = new Date(et);
        nextOpen.setHours(9, 30, 0, 0);

        // If market already opened today, move to next day
        if (et.getHours() >= 16 || (et.getHours() === 16 && et.getMinutes() > 0)) {
            nextOpen.setDate(nextOpen.getDate() + 1);
        }

        // Skip weekends
        while (nextOpen.getDay() === 0 || nextOpen.getDay() === 6) {
            nextOpen.setDate(nextOpen.getDate() + 1);
        }

        return nextOpen;
    }

    async runSimulation(experimentId) {
        const tournament = this.activeTournaments.get(experimentId);
        if (!tournament) return;

        const { days, watchlist } = tournament.config;
        const startDate = tournament.realTimeStartDate || new Date();
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + days);

        this.log(experimentId, `🏆 Starting ${days}-day REAL-TIME tournament`);
        this.log(experimentId, `📅 Start: ${startDate.toLocaleDateString()}`);
        this.log(experimentId, `📅 End: ${endDate.toLocaleDateString()}`);
        this.log(experimentId, `📊 Trading universe: ${watchlist.length} stocks`);
        this.log(experimentId, `⏰ Trading only during US market hours (9:30 AM - 4:00 PM ET, Mon-Fri)`);

        let tradingDay = 0;

        // Real-time loop - runs continuously until tournament end date
        while (new Date() < endDate) {
            // Check if tournament was paused or stopped
            const currentTournament = this.activeTournaments.get(experimentId);
            if (!currentTournament || currentTournament.status === 'paused') {
                this.log(experimentId, '⏸️ Tournament paused');
                await new Promise(resolve => setTimeout(resolve, 60000)); // Check again in 1 minute
                continue;
            }

            // Check if market is open
            if (this.isMarketOpen()) {
                tradingDay++;
                tournament.currentDay = tradingDay;

                this.log(experimentId, `\n📅 Trading Day ${tradingDay} - ${new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })}`);

                // Each team makes trading decisions
                for (const team of tournament.teams) {
                    if (!team.active) continue;

                    try {
                        // AI decision making
                        const decisions = await this.simulateTeamDecisions(team, watchlist, tradingDay);

                        // Execute trades and calculate returns
                        const dayReturn = await this.executeTrades(team, decisions, tradingDay);

                        team.returns.push(dayReturn);
                        team.totalReturn = team.returns.reduce((sum, r) => sum + r, 0);
                        team.portfolioValue = 100000 * (1 + team.totalReturn / 100);

                        this.log(experimentId, `💰 ${team.name}: ${dayReturn > 0 ? '+' : ''}${dayReturn.toFixed(2)}% (Total: ${team.totalReturn.toFixed(2)}%)`);

                    } catch (error) {
                        this.log(experimentId, `❌ ${team.name} error: ${error.message}`, 'error');
                        team.active = false;
                    }
                }

                // Update leaderboard
                tournament.leaderboard = [...tournament.teams]
                    .sort((a, b) => b.totalReturn - a.totalReturn)
                    .map((team, idx) => ({ ...team, rank: idx + 1 }));

                this.emit('leaderboardUpdate', { experimentId, leaderboard: tournament.leaderboard });

                // Auto-save checkpoint every 5 trading days
                if (tradingDay % 5 === 0) {
                    await this.saveCheckpoint(experimentId);
                }

                // Wait 1 hour before next trading cycle (4 trades per day during market hours)
                await new Promise(resolve => setTimeout(resolve, 60 * 60 * 1000));
            } else {
                // Market closed - wait until next market open
                const nextOpen = this.getNextMarketOpen();
                const waitTime = nextOpen - new Date();
                this.log(experimentId, `🌙 Market closed. Next open: ${nextOpen.toLocaleString('en-US', { timeZone: 'America/New_York' })}`);
                await new Promise(resolve => setTimeout(resolve, Math.min(waitTime, 60 * 60 * 1000))); // Check every hour
            }
        }

        // Tournament complete
        tournament.status = 'completed';
        tournament.endTime = Date.now();

        this.log(experimentId, '🏁 Tournament completed!');
        this.log(experimentId, `🥇 Winner: ${tournament.leaderboard[0]?.name} with ${tournament.leaderboard[0]?.totalReturn.toFixed(2)}% return`);

        // Save results
        await this.saveResults(experimentId);

        // Delete checkpoint since tournament is complete
        await this.deleteCheckpoint(experimentId);

        this.emit('tournamentComplete', { experimentId, results: tournament, status: 'completed', leaderboard: tournament.leaderboard });
    }

    async simulateTeamDecisions(team, watchlist, day) {
        // Simulate AI decision making
        // In production, this would call actual AI models

        const decisions = [];

        // Select 3-5 random stocks to trade
        const numTrades = Math.floor(Math.random() * 3) + 3;
        const selectedStocks = watchlist.sort(() => 0.5 - Math.random()).slice(0, numTrades);

        for (const symbol of selectedStocks) {
            // Simulate AI analysis
            const analysis = {
                symbol,
                signal: Math.random() > 0.5 ? 'BUY' : 'SELL',
                confidence: Math.random() * 100,
                positionSize: Math.random() * 0.1, // 0-10% of portfolio
                targetPrice: 0,
                stopLoss: 0
            };

            // Add some strategy based on team profile
            if (team.riskProfile === 'conservative' && analysis.confidence < 70) {
                analysis.signal = 'HOLD';
            } else if (team.riskProfile === 'aggressive') {
                analysis.positionSize *= 1.5; // Larger positions
            }

            if (analysis.signal !== 'HOLD') {
                decisions.push(analysis);
            }
        }

        return decisions;
    }

    async executeTrades(team, decisions, day) {
        // Simulate trade execution and returns
        let dayReturn = 0;

        for (const decision of decisions) {
            // Simulate market movement (-5% to +5% random)
            const marketMove = (Math.random() - 0.5) * 10;

            if (decision.signal === 'BUY') {
                dayReturn += marketMove * decision.positionSize;
            } else if (decision.signal === 'SELL') {
                dayReturn -= marketMove * decision.positionSize; // Inverse
            }

            // Record trade
            team.trades.push({
                day,
                symbol: decision.symbol,
                signal: decision.signal,
                return: marketMove * decision.positionSize,
                confidence: decision.confidence
            });
        }

        return dayReturn;
    }

    log(experimentId, message, type = 'info') {
        const tournament = this.activeTournaments.get(experimentId);
        if (tournament) {
            tournament.logs.push({
                time: new Date().toISOString(),
                message,
                type
            });
        }
        console.log(`[${experimentId}] ${message}`);
        this.emit('log', { experimentId, message, type });
    }

    async saveResults(experimentId) {
        const tournament = this.activeTournaments.get(experimentId);
        if (!tournament) return;

        const resultFile = path.join(this.resultsDir, `${experimentId}.json`);
        await fs.writeFile(resultFile, JSON.stringify(tournament, null, 2));

        this.log(experimentId, `💾 Results saved to ${resultFile}`);
    }

    getTournament(experimentId) {
        return this.activeTournaments.get(experimentId);
    }

    async getAllResults() {
        try {
            const files = await fs.readdir(this.resultsDir);
            const jsonFiles = files.filter(f => f.endsWith('.json'));
            const contents = await Promise.all(
                jsonFiles.map(f => fs.readFile(path.join(this.resultsDir, f), 'utf8'))
            );
            return contents.map(c => JSON.parse(c));
        } catch (error) {
            return [];
        }
    }

    async getLatestResult() {
        // Check active tournaments first
        const activeTournaments = Array.from(this.activeTournaments.values());
        if (activeTournaments.length > 0) {
            return activeTournaments[activeTournaments.length - 1];
        }

        // Otherwise check saved results
        const results = await this.getAllResults();
        return results.sort((a, b) => (b.endTime || b.startTime) - (a.endTime || a.startTime))[0] || null;
    }

    // Extend tournament duration (up to 90 days max)
    extendTournament(experimentId, additionalDays) {
        const tournament = this.activeTournaments.get(experimentId);
        if (!tournament) {
            return { success: false, message: 'Tournament not found' };
        }

        if (tournament.status !== 'running') {
            return { success: false, message: 'Tournament is not running' };
        }

        const newDays = tournament.config.days + additionalDays;
        if (newDays > tournament.maxDays) {
            return {
                success: false,
                message: `Cannot extend beyond ${tournament.maxDays} days. Current: ${tournament.config.days}, Max additional: ${tournament.maxDays - tournament.config.days}`
            };
        }

        tournament.config.days = newDays;
        this.log(experimentId, `📅 Tournament extended by ${additionalDays} days. New duration: ${newDays} days`);

        return {
            success: true,
            newDays,
            message: `Tournament extended to ${newDays} days`
        };
    }

    // Adjust simulation speed during runtime
    setSimulationSpeed(experimentId, speedMs) {
        const tournament = this.activeTournaments.get(experimentId);
        if (!tournament) {
            return { success: false, message: 'Tournament not found' };
        }

        const oldSpeed = tournament.config.simulationSpeed;
        tournament.config.simulationSpeed = speedMs;

        this.log(experimentId, `⚡ Simulation speed changed from ${oldSpeed}ms to ${speedMs}ms per day`);

        return {
            success: true,
            oldSpeed,
            newSpeed: speedMs,
            message: `Speed adjusted to ${speedMs}ms per day`
        };
    }

    // Pause tournament
    async pauseTournament(experimentId) {
        const tournament = this.activeTournaments.get(experimentId);
        if (!tournament) {
            return { success: false, message: 'Tournament not found' };
        }

        tournament.status = 'paused';
        this.log(experimentId, '⏸️ Tournament paused');

        // Save checkpoint when pausing
        await this.saveCheckpoint(experimentId);

        return { success: true, message: 'Tournament paused and saved' };
    }

    // Resume tournament
    resumeTournament(experimentId) {
        const tournament = this.activeTournaments.get(experimentId);
        if (!tournament) {
            return { success: false, message: 'Tournament not found' };
        }

        tournament.status = 'running';
        this.log(experimentId, '▶️ Tournament resumed');

        // Continue simulation from current day
        this.runSimulation(experimentId);

        return { success: true, message: 'Tournament resumed' };
    }

    // Save checkpoint (state snapshot)
    async saveCheckpoint(experimentId) {
        const tournament = this.activeTournaments.get(experimentId);
        if (!tournament) return;

        const checkpointFile = path.join(this.checkpointsDir, `${experimentId}_checkpoint.json`);

        const checkpoint = {
            ...tournament,
            savedAt: Date.now(),
            checkpointDay: tournament.currentDay
        };

        await fs.writeFile(checkpointFile, JSON.stringify(checkpoint, null, 2));
        console.log(`💾 Checkpoint saved for ${experimentId} at Day ${tournament.currentDay}`);
    }

    // Load saved tournaments from checkpoints
    async loadSavedTournaments() {
        try {
            const files = await fs.readdir(this.checkpointsDir);
            const checkpointFiles = files.filter(f => f.endsWith('_checkpoint.json'));

            for (const file of checkpointFiles) {
                const content = await fs.readFile(path.join(this.checkpointsDir, file), 'utf8');
                const checkpoint = JSON.parse(content);

                // Only load tournaments that were running or paused
                if (checkpoint.status === 'running' || checkpoint.status === 'paused') {
                    // Mark as paused until user resumes
                    checkpoint.status = 'paused';
                    this.activeTournaments.set(checkpoint.experimentId, checkpoint);
                    console.log(`📂 Loaded saved tournament: ${checkpoint.experimentId} (Day ${checkpoint.currentDay}/${checkpoint.config.days})`);
                }
            }

            if (checkpointFiles.length > 0) {
                console.log(`✅ Loaded ${checkpointFiles.length} saved tournament(s)`);
            }
        } catch (error) {
            console.log('No saved tournaments found');
        }
    }

    // Get all saved (paused) tournaments
    async getSavedTournaments() {
        const saved = [];
        for (const [id, tournament] of this.activeTournaments.entries()) {
            if (tournament.status === 'paused') {
                saved.push({
                    experimentId: id,
                    currentDay: tournament.currentDay,
                    totalDays: tournament.config.days,
                    teams: tournament.teams.length,
                    savedAt: tournament.savedAt,
                    leaderboard: tournament.leaderboard
                });
            }
        }
        return saved;
    }

    // Resume from checkpoint
    async resumeFromCheckpoint(experimentId) {
        const tournament = this.activeTournaments.get(experimentId);
        if (!tournament) {
            return { success: false, message: 'Saved tournament not found' };
        }

        if (tournament.status !== 'paused') {
            return { success: false, message: 'Tournament is not paused' };
        }

        tournament.status = 'running';
        this.log(experimentId, `▶️ Resuming tournament from Day ${tournament.currentDay}`);

        // Continue simulation from current day
        this.runSimulation(experimentId);

        return {
            success: true,
            message: `Tournament resumed from Day ${tournament.currentDay}`,
            currentDay: tournament.currentDay,
            totalDays: tournament.config.days
        };
    }

    // Delete checkpoint (cleanup)
    async deleteCheckpoint(experimentId) {
        try {
            const checkpointFile = path.join(this.checkpointsDir, `${experimentId}_checkpoint.json`);
            await fs.unlink(checkpointFile);
            console.log(`🗑️ Checkpoint deleted for ${experimentId}`);
        } catch (error) {
            // File might not exist, that's okay
        }
    }
}

module.exports = TournamentManager;
