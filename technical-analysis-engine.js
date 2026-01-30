// Technical Analysis Engine
// Generates professional-grade technical analysis reports with scenario playbooks

class TechnicalAnalysisEngine {
    constructor() {
        this.FMP_API_KEY = 'h43nCTpMeyiIiNquebaqktc7ChUHMxIz';
        this.API_BASE_URL = 'http://localhost:3002';
    }

    // ═══════════════════════════════════════════════════════════════
    // MAIN ANALYSIS FUNCTION
    // ═══════════════════════════════════════════════════════════════

    async generateFullAnalysis(symbol, timeframe = '1D') {
        try {
            console.log(`📊 Generating technical analysis for ${symbol} (${timeframe})...`);

            // Fetch historical data
            const historicalData = await this.fetchHistoricalData(symbol);
            if (!historicalData || historicalData.length < 200) {
                throw new Error('Insufficient historical data');
            }

            // Detect candlestick patterns
            const patterns = this.detectCandlestickPatterns(historicalData);

            // Calculate all technical indicators
            const indicators = this.calculateAllIndicators(historicalData);

            // Identify key levels with better precision
            const levels = this.identifyKeyLevels(historicalData, indicators);

            // Detect support/resistance zones
            const zones = this.identifySupportResistanceZones(historicalData);

            // Generate scenario playbook
            const scenarios = this.generateScenarioPlaybook(symbol, levels, indicators, patterns);

            // Generate narrative analysis
            const narrative = this.generateNarrative(symbol, levels, indicators, scenarios, patterns, zones);

            // Educational content
            const education = this.generateEducationalContent(levels, indicators);

            return {
                symbol,
                timeframe,
                summary: narrative.summary,
                bullsVsBears: narrative.bullsVsBears,
                bearishControl: narrative.bearishControl,
                bullishControl: narrative.bullishControl,
                scenarios,
                education,
                bigPicture: narrative.bigPicture,
                levels,
                indicators,
                patterns,
                zones,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error(`❌ Technical analysis error for ${symbol}:`, error);
            return null;
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // DATA FETCHING
    // ═══════════════════════════════════════════════════════════════

    async fetchHistoricalData(symbol) {
        try {
            const response = await fetch(
                `https://financialmodelingprep.com/api/v3/historical-price-full/${symbol}?apikey=${this.FMP_API_KEY}`
            );

            if (!response.ok) {
                throw new Error(`Failed to fetch historical data: ${response.status}`);
            }

            const data = await response.json();
            const historical = data.historical || [];

            // Convert to OHLCV format
            return historical.slice(0, 250).reverse().map(d => ({
                date: d.date,
                open: d.open,
                high: d.high,
                low: d.low,
                close: d.close,
                volume: d.volume
            }));

        } catch (error) {
            console.error('Error fetching historical data:', error);
            return null;
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // TECHNICAL INDICATORS
    // ═══════════════════════════════════════════════════════════════

    calculateAllIndicators(candles) {
        const closes = candles.map(c => c.close);
        const highs = candles.map(c => c.high);
        const lows = candles.map(c => c.low);
        const volumes = candles.map(c => c.volume);

        return {
            currentPrice: closes[closes.length - 1],
            ma20: this.calculateSMA(closes, 20),
            ma50: this.calculateSMA(closes, 50),
            ma200: this.calculateSMA(closes, 200),
            rsi: this.calculateRSI(closes, 14),
            macd: this.calculateMACD(closes),
            bollinger: this.calculateBollinger(closes, 20, 2),
            fibonacci: this.calculateFibonacci(highs, lows),
            vpvr: this.calculateVPVR(candles),
            superTrend: this.calculateSuperTrend(candles),
            ichimoku: this.calculateIchimoku(candles),
            atr: this.calculateATR(candles, 14),
            volume: {
                current: volumes[volumes.length - 1],
                average: this.calculateSMA(volumes, 20),
                trend: this.detectVolumeTrend(volumes)
            }
        };
    }

    calculateSMA(data, period) {
        if (data.length < period) return null;
        const slice = data.slice(-period);
        const sum = slice.reduce((a, b) => a + b, 0);
        return sum / period;
    }

    calculateRSI(closes, period = 14) {
        if (closes.length < period + 1) return null;

        let gains = 0;
        let losses = 0;

        for (let i = closes.length - period; i < closes.length; i++) {
            const change = closes[i] - closes[i - 1];
            if (change > 0) gains += change;
            else losses -= change;
        }

        const avgGain = gains / period;
        const avgLoss = losses / period;

        if (avgLoss === 0) return 100;
        const rs = avgGain / avgLoss;
        return 100 - (100 / (1 + rs));
    }

    calculateMACD(closes) {
        const ema12 = this.calculateEMA(closes, 12);
        const ema26 = this.calculateEMA(closes, 26);

        if (!ema12 || !ema26) return null;

        const macdLine = ema12 - ema26;
        return {
            macd: macdLine,
            signal: null, // Simplified
            histogram: null
        };
    }

    calculateEMA(data, period) {
        if (data.length < period) return null;

        const multiplier = 2 / (period + 1);
        let ema = data[data.length - period];

        for (let i = data.length - period + 1; i < data.length; i++) {
            ema = (data[i] - ema) * multiplier + ema;
        }

        return ema;
    }

    calculateBollinger(closes, period = 20, stdDev = 2) {
        const sma = this.calculateSMA(closes, period);
        if (!sma) return null;

        const slice = closes.slice(-period);
        const variance = slice.reduce((sum, val) => sum + Math.pow(val - sma, 2), 0) / period;
        const std = Math.sqrt(variance);

        return {
            upper: sma + (std * stdDev),
            middle: sma,
            lower: sma - (std * stdDev)
        };
    }

    calculateFibonacci(highs, lows) {
        const recentHigh = Math.max(...highs.slice(-60));
        const recentLow = Math.min(...lows.slice(-60));
        const diff = recentHigh - recentLow;

        return {
            high: recentHigh,
            low: recentLow,
            level236: recentHigh - (diff * 0.236),
            level382: recentHigh - (diff * 0.382),
            level500: recentHigh - (diff * 0.500),
            level618: recentHigh - (diff * 0.618),
            level786: recentHigh - (diff * 0.786)
        };
    }

    calculateVPVR(candles) {
        // Volume Profile Visible Range - Point of Control
        const priceVolume = {};

        candles.slice(-60).forEach(candle => {
            const avgPrice = (candle.high + candle.low + candle.close) / 3;
            const priceLevel = Math.round(avgPrice * 100) / 100;

            if (!priceVolume[priceLevel]) {
                priceVolume[priceLevel] = 0;
            }
            priceVolume[priceLevel] += candle.volume;
        });

        // Find Point of Control (highest volume price)
        let maxVolume = 0;
        let poc = 0;

        Object.entries(priceVolume).forEach(([price, volume]) => {
            if (volume > maxVolume) {
                maxVolume = volume;
                poc = parseFloat(price);
            }
        });

        return {
            poc,
            highVolumeNode: poc,
            description: 'High-volume price areas act like magnets'
        };
    }

    calculateSuperTrend(candles, period = 10, multiplier = 3) {
        if (candles.length < period) return null;

        const atr = this.calculateATR(candles, period);
        const lastCandle = candles[candles.length - 1];
        const hl2 = (lastCandle.high + lastCandle.low) / 2;

        const upperBand = hl2 + (multiplier * atr);
        const lowerBand = hl2 - (multiplier * atr);

        const trend = lastCandle.close > lowerBand ? 'bullish' : 'bearish';
        const signal = trend === 'bullish' ? lowerBand : upperBand;

        return {
            trend,
            signal: signal.toFixed(2),
            color: trend === 'bullish' ? 'green' : 'red'
        };
    }

    calculateIchimoku(candles) {
        if (candles.length < 52) return null;

        const getHL = (period) => {
            const slice = candles.slice(-period);
            const high = Math.max(...slice.map(c => c.high));
            const low = Math.min(...slice.map(c => c.low));
            return (high + low) / 2;
        };

        const tenkan = getHL(9);   // Conversion Line
        const kijun = getHL(26);   // Base Line
        const senkouA = (tenkan + kijun) / 2;  // Leading Span A
        const senkouB = getHL(52); // Leading Span B

        const currentPrice = candles[candles.length - 1].close;
        const cloudTop = Math.max(senkouA, senkouB);
        const cloudBottom = Math.min(senkouA, senkouB);

        return {
            tenkan,
            kijun,
            cloudTop,
            cloudBottom,
            position: currentPrice > cloudTop ? 'above' : currentPrice < cloudBottom ? 'below' : 'inside',
            bias: currentPrice > cloudTop ? 'bullish' : 'bearish'
        };
    }

    calculateATR(candles, period = 14) {
        if (candles.length < period + 1) return 0;

        const trs = [];
        for (let i = candles.length - period; i < candles.length; i++) {
            const high = candles[i].high;
            const low = candles[i].low;
            const prevClose = i > 0 ? candles[i - 1].close : candles[i].close;

            const tr = Math.max(
                high - low,
                Math.abs(high - prevClose),
                Math.abs(low - prevClose)
            );
            trs.push(tr);
        }

        return trs.reduce((a, b) => a + b, 0) / period;
    }

    detectVolumeTrend(volumes) {
        const recent = volumes.slice(-5);
        const previous = volumes.slice(-10, -5);

        const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
        const previousAvg = previous.reduce((a, b) => a + b, 0) / previous.length;

        if (recentAvg > previousAvg * 1.2) return 'increasing';
        if (recentAvg < previousAvg * 0.8) return 'declining';
        return 'stable';
    }

    // ═══════════════════════════════════════════════════════════════
    // SUPPORT & RESISTANCE
    // ═══════════════════════════════════════════════════════════════

    identifyKeyLevels(candles, indicators) {
        const closes = candles.map(c => c.close);
        const highs = candles.map(c => c.high);
        const lows = candles.map(c => c.low);

        const currentPrice = closes[closes.length - 1];

        // Find support and resistance
        const support = this.findSupport(lows, currentPrice);
        const resistance = this.findResistance(highs, currentPrice);

        return {
            current: currentPrice,
            support,
            resistance,
            ma20: indicators.ma20,
            ma200: indicators.ma200,
            fib618: indicators.fibonacci.level618,
            vpvrPOC: indicators.vpvr.poc,
            ichimokuCloud: {
                top: indicators.ichimoku?.cloudTop,
                bottom: indicators.ichimoku?.cloudBottom
            }
        };
    }

    findSupport(lows, currentPrice) {
        // Find recent low that's below current price
        const recentLows = lows.slice(-60);
        const supportLevels = recentLows.filter(low => low < currentPrice);

        if (supportLevels.length === 0) return currentPrice * 0.95;

        return Math.max(...supportLevels);
    }

    findResistance(highs, currentPrice) {
        // Find recent high that's above current price
        const recentHighs = highs.slice(-60);
        const resistanceLevels = recentHighs.filter(high => high > currentPrice);

        if (resistanceLevels.length === 0) return currentPrice * 1.05;

        return Math.min(...resistanceLevels);
    }

    // ═══════════════════════════════════════════════════════════════
    // SCENARIO PLAYBOOK
    // ═══════════════════════════════════════════════════════════════

    generateScenarioPlaybook(symbol, levels, indicators, patterns) {
        const { current, support, resistance, ma20 } = levels;
        const atr = indicators.atr || (current * 0.02);

        // Bearish scenario - more precise entry/stop based on ATR
        const bearishEntry = current > ma20 ? ma20 * 1.005 : resistance;
        const bearishStop = bearishEntry + (atr * 1.5);
        const bearishTarget1 = support;
        const bearishTarget2 = support * 0.95;

        const bearishRR1 = this.calculateRR(bearishEntry, bearishStop, bearishTarget1);
        const bearishRR2 = this.calculateRR(bearishEntry, bearishStop, bearishTarget2);

        // Bullish scenario - more precise entry/stop based on ATR
        const bullishEntry = current < ma20 ? ma20 * 0.995 : support * 1.01;
        const bullishStop = bullishEntry - (atr * 1.5);
        const bullishTarget1 = resistance;
        const bullishTarget2 = resistance * 1.05;

        const bullishRR1 = this.calculateRR(bullishEntry, bullishStop, bullishTarget1);
        const bullishRR2 = this.calculateRR(bullishEntry, bullishStop, bullishTarget2);

        // Determine confidence based on indicators and patterns
        const bearishConfidence = this.calculateConfidence('bearish', indicators, patterns);
        const bullishConfidence = this.calculateConfidence('bullish', indicators, patterns);

        return {
            bearish: {
                direction: 'Bearish',
                entry: `$${bearishEntry.toFixed(2)} (rejection at 20MA/Fib)`,
                stop: `$${bearishStop.toFixed(2)} (above 20MA)`,
                target1: {
                    price: `$${bearishTarget1.toFixed(2)}`,
                    rr: `${bearishRR1.toFixed(2)}:1`
                },
                target2: {
                    price: `$${bearishTarget2.toFixed(2)}`,
                    rr: `${bearishRR2.toFixed(2)}:1`
                },
                confidence: bearishConfidence,
                bestFor: 'Aggressive traders',
                whatToExpect: 'Quick move to lows if support fails'
            },
            bullish: {
                direction: 'Bullish',
                entry: `$${bullishEntry.toFixed(2)} (close above 20MA)`,
                stop: `$${bullishStop.toFixed(2)} (below 50% Fib)`,
                target1: {
                    price: `$${bullishTarget1.toFixed(2)}`,
                    rr: `${bullishRR1.toFixed(2)}:1`
                },
                target2: {
                    price: `$${bullishTarget2.toFixed(2)}`,
                    rr: `${bullishRR2.toFixed(2)}:1`
                },
                confidence: bullishConfidence,
                bestFor: 'Counter-trend players',
                whatToExpect: 'Must see volume + RSI >50'
            },
            noTradeZone: {
                range: `$${support.toFixed(2)}–$${resistance.toFixed(2)}`,
                advice: 'Price is coiled between major support and resistance—wait for a confirmed break before jumping in.'
            }
        };
    }

    calculateRR(entry, stop, target) {
        const risk = Math.abs(entry - stop);
        const reward = Math.abs(target - entry);
        return reward / risk;
    }

    calculateConfidence(direction, indicators, patterns) {
        let score = 0;

        if (direction === 'bearish') {
            if (indicators.rsi > 70) score += 2;
            if (indicators.currentPrice < indicators.ma20) score += 2;
            if (indicators.currentPrice < indicators.ma200) score += 1;
            if (indicators.superTrend?.trend === 'bearish') score += 2;
            if (indicators.volume.trend === 'declining') score += 1;
            if (indicators.macd?.macd < 0) score += 1;
            if (patterns?.all?.some(p => p.type === 'bearish')) score += 2;
        } else {
            if (indicators.rsi < 30) score += 2;
            if (indicators.currentPrice > indicators.ma20) score += 2;
            if (indicators.currentPrice > indicators.ma200) score += 1;
            if (indicators.superTrend?.trend === 'bullish') score += 2;
            if (indicators.volume.trend === 'increasing') score += 1;
            if (indicators.macd?.macd > 0) score += 1;
            if (patterns?.all?.some(p => p.type === 'bullish')) score += 2;
        }

        if (score >= 8) return 'High';
        if (score >= 5) return 'Medium';
        return 'Low';
    }

    // ═══════════════════════════════════════════════════════════════
    // NARRATIVE GENERATION
    // ═══════════════════════════════════════════════════════════════

    generateNarrative(symbol, levels, indicators, scenarios, patterns, zones) {
        const { current, support, resistance, ma20, ma200 } = levels;
        const bias = this.determineBias(indicators);
        const patternName = patterns.latest !== 'none' ? patterns.latest : 'indecisive';
        const patternType = patterns.all.length > 0 ? patterns.all[0].type : 'neutral';

        // Enhanced summary with specific price action
        const pricePosition = current > ma20 ? 'above' : 'below';
        const ma20Distance = Math.abs((current - ma20) / ma20 * 100).toFixed(1);
        const supportDistance = Math.abs((current - support) / support * 100).toFixed(1);
        
        const summary = `${symbol} (NASDAQ:${symbol}) is ${bias === 'bearish' ? 'clinging to' : 'testing'} the $${current.toFixed(2)} mark on the daily chart, with a fierce tug-of-war at the $${support.toFixed(2)}–$${resistance.toFixed(2)} support zone—lose this level, and the next stop could be a sharp acceleration of the ${bias}trend. The bias remains ${bias}, but a ${patternName} candlestick at ${pricePosition === 'below' ? 'support' : 'current levels'} hints that ${patternType === 'bullish' ? 'bulls are lurking' : patternType === 'bearish' ? 'bears are in control' : 'traders are waiting'}, waiting for a spark of momentum.`;

        // Bulls vs. Bears - Enhanced with more detail
        const fib618Pct = ((indicators.fibonacci.level618 / current - 1) * 100).toFixed(1);
        const bullsVsBears = {
            title: 'Bulls vs. Bears: Support on the Brink',
            keyBattleground: [
                {
                    level: `$${support.toFixed(2)}–$${resistance.toFixed(2)} zone`,
                    significance: `The $${support.toFixed(2)}–$${resistance.toFixed(2)} area is loaded with technical significance—combining the 61.8% Fibonacci retracement ($${indicators.fibonacci.level618.toFixed(2)}), VPVR Point of Control ($${indicators.vpvr.poc.toFixed(2)}), and the ${indicators.ichimoku?.position === 'below' ? 'bottom of the Ichimoku Cloud' : 'key moving averages'}.`
                },
                {
                    level: `200-day MA ($${ma200?.toFixed(2) || 'N/A'})`,
                    significance: `Price is ${current > ma200 ? 'holding above' : 'now testing'} the 200-day moving average ($${ma200?.toFixed(2) || 'N/A'}), a classic "last stand" for long-term ${current > ma200 ? 'bulls' : 'support'}.`
                },
                {
                    level: `${patternName} candlestick pattern`,
                    significance: `The ${patternName} candlestick on ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} signals ${patternType === 'bullish' ? 'buyers are defending this zone' : patternType === 'bearish' ? 'sellers are in control' : 'indecision'}, but without follow-through, it can quickly become a ${patternType === 'bullish' ? 'bull' : 'bear'} trap.`
                }
            ]
        };

        // Bearish/Bullish Control
        const bearishControl = this.generateBearishControl(indicators, levels);
        const bullishControl = this.generateBullishControl(indicators, levels);

        // Big Picture
        const bigPicture = {
            currentBias: `${bias.charAt(0).toUpperCase() + bias.slice(1)} bias rules for now`,
            bearishConfirmation: `Watch for a daily close below $${support.toFixed(2)} to confirm further downside.`,
            bullishReversal: `Not until price closes above $${resistance.toFixed(2)} with volume and momentum indicators flipping green.`,
            keyLesson: `In choppy ranges between major support and resistance, patience is a position—let the market confirm its next move before committing.`
        };

        return {
            summary,
            bullsVsBears,
            bearishControl,
            bullishControl,
            bigPicture
        };
    }

    determineBias(indicators) {
        let bearishSignals = 0;
        let bullishSignals = 0;

        if (indicators.currentPrice < indicators.ma20) bearishSignals++;
        else bullishSignals++;

        if (indicators.rsi > 50) bullishSignals++;
        else bearishSignals++;

        if (indicators.superTrend?.trend === 'bearish') bearishSignals++;
        else bullishSignals++;

        if (indicators.ichimoku?.bias === 'bearish') bearishSignals++;
        else bullishSignals++;

        return bearishSignals > bullishSignals ? 'bearish' : 'bullish';
    }

    detectCandlestickPatterns(candles) {
        if (candles.length < 3) return { latest: 'none', all: [] };

        const patterns = [];
        const lastCandle = candles[candles.length - 1];
        const prevCandle = candles[candles.length - 2];
        const prev2Candle = candles[candles.length - 3];

        const body = Math.abs(lastCandle.close - lastCandle.open);
        const range = lastCandle.high - lastCandle.low;
        const upperShadow = lastCandle.high - Math.max(lastCandle.open, lastCandle.close);
        const lowerShadow = Math.min(lastCandle.open, lastCandle.close) - lastCandle.low;

        // Hammer (bullish reversal)
        if (lowerShadow > body * 2 && upperShadow < body * 0.3 && body < range * 0.3) {
            patterns.push({ name: 'hammer', type: 'bullish', strength: 'medium' });
        }

        // Shooting Star (bearish reversal)
        if (upperShadow > body * 2 && lowerShadow < body * 0.3 && body < range * 0.3) {
            patterns.push({ name: 'shooting star', type: 'bearish', strength: 'medium' });
        }

        // Doji (indecision)
        if (body < range * 0.1) {
            patterns.push({ name: 'doji', type: 'neutral', strength: 'low' });
        }

        // Bullish Engulfing
        if (prevCandle.close < prevCandle.open && // Previous red
            lastCandle.close > lastCandle.open && // Current green
            lastCandle.open < prevCandle.close &&
            lastCandle.close > prevCandle.open) {
            patterns.push({ name: 'bullish engulfing', type: 'bullish', strength: 'strong' });
        }

        // Bearish Engulfing
        if (prevCandle.close > prevCandle.open && // Previous green
            lastCandle.close < lastCandle.open && // Current red
            lastCandle.open > prevCandle.close &&
            lastCandle.close < prevCandle.open) {
            patterns.push({ name: 'bearish engulfing', type: 'bearish', strength: 'strong' });
        }

        // Morning Star (bullish reversal)
        if (prev2Candle.close < prev2Candle.open && // First red
            Math.abs(prevCandle.close - prevCandle.open) < body * 0.3 && // Small middle
            lastCandle.close > lastCandle.open && // Last green
            lastCandle.close > (prev2Candle.open + prev2Candle.close) / 2) {
            patterns.push({ name: 'morning star', type: 'bullish', strength: 'strong' });
        }

        // Evening Star (bearish reversal)
        if (prev2Candle.close > prev2Candle.open && // First green
            Math.abs(prevCandle.close - prevCandle.open) < body * 0.3 && // Small middle
            lastCandle.close < lastCandle.open && // Last red
            lastCandle.close < (prev2Candle.open + prev2Candle.close) / 2) {
            patterns.push({ name: 'evening star', type: 'bearish', strength: 'strong' });
        }

        return {
            latest: patterns.length > 0 ? patterns[0].name : 'none',
            all: patterns,
            hasPattern: patterns.length > 0
        };
    }

    identifySupportResistanceZones(candles) {
        const zones = { support: [], resistance: [] };
        const currentPrice = candles[candles.length - 1].close;
        const recentCandles = candles.slice(-60);

        // Find pivot points
        for (let i = 2; i < recentCandles.length - 2; i++) {
            const candle = recentCandles[i];
            
            // Resistance (local high)
            if (candle.high > recentCandles[i-1].high &&
                candle.high > recentCandles[i-2].high &&
                candle.high > recentCandles[i+1].high &&
                candle.high > recentCandles[i+2].high) {
                if (candle.high > currentPrice) {
                    zones.resistance.push(candle.high);
                }
            }

            // Support (local low)
            if (candle.low < recentCandles[i-1].low &&
                candle.low < recentCandles[i-2].low &&
                candle.low < recentCandles[i+1].low &&
                candle.low < recentCandles[i+2].low) {
                if (candle.low < currentPrice) {
                    zones.support.push(candle.low);
                }
            }
        }

        // Cluster nearby levels
        const clusterZones = (levels) => {
            if (levels.length === 0) return [];
            levels.sort((a, b) => a - b);
            const clustered = [];
            let current = [levels[0]];

            for (let i = 1; i < levels.length; i++) {
                if (Math.abs(levels[i] - current[current.length - 1]) / current[0] < 0.02) {
                    current.push(levels[i]);
                } else {
                    clustered.push(current.reduce((a, b) => a + b) / current.length);
                    current = [levels[i]];
                }
            }
            clustered.push(current.reduce((a, b) => a + b) / current.length);
            return clustered;
        };

        return {
            support: clusterZones(zones.support).slice(-3),
            resistance: clusterZones(zones.resistance).slice(0, 3),
            nearestSupport: zones.support.length > 0 ? Math.max(...zones.support.filter(s => s < currentPrice)) : currentPrice * 0.95,
            nearestResistance: zones.resistance.length > 0 ? Math.min(...zones.resistance.filter(r => r > currentPrice)) : currentPrice * 1.05
        };
    }

    generateBearishControl(indicators, levels) {
        const items = [];

        if (indicators.currentPrice < indicators.ma20) {
            items.push({
                factor: `Price below 20-day MA ($${indicators.ma20?.toFixed(2)})`,
                detail: `Price remains below both the 20-day moving average ($${indicators.ma20?.toFixed(2)}) and the VWAP, indicating bearish control.`
            });
        }

        if (indicators.superTrend?.trend === 'bearish') {
            items.push({
                factor: `SuperTrend flashing red at $${indicators.superTrend.signal}`,
                detail: `SuperTrend indicator is flashing red at $${indicators.superTrend.signal}, and the Ichimoku Cloud overhead is acting as resistance.`
            });
        }

        if (indicators.volume.trend === 'declining') {
            items.push({
                factor: 'Declining volume',
                detail: 'Declining volume on the latest slide suggests sellers are running out of steam, but no clear reversal yet.'
            });
        }

        return {
            title: 'Bearish Control',
            items: items.length > 0 ? items : [{
                factor: 'Market conditions',
                detail: 'General market volatility warrants monitoring.'
            }]
        };
    }

    generateBullishControl(indicators, levels) {
        const items = [];

        if (indicators.currentPrice > indicators.ma20) {
            items.push({
                factor: `Price above 20-day MA ($${indicators.ma20?.toFixed(2)})`,
                detail: `Price is holding above the 20-day moving average, showing bullish momentum.`
            });
        }

        if (indicators.rsi < 30) {
            items.push({
                factor: `RSI oversold (${indicators.rsi?.toFixed(0)})`,
                detail: `RSI at ${indicators.rsi?.toFixed(0)} indicates oversold conditions—potential bounce opportunity.`
            });
        }

        if (indicators.volume.trend === 'increasing') {
            items.push({
                factor: 'Volume increasing',
                detail: 'Increasing volume supports the bullish case, showing accumulation.'
            });
        }

        return {
            title: 'Bullish Signals',
            items: items.length > 0 ? items : [{
                factor: 'Support holding',
                detail: 'Key support levels are holding, preventing further downside.'
            }]
        };
    }

    // ═══════════════════════════════════════════════════════════════
    // EDUCATIONAL CONTENT
    // ═══════════════════════════════════════════════════════════════

    generateEducationalContent(levels, indicators) {
        return {
            title: 'Educational Deep Dive: Why These Levels Matter',
            concepts: [
                {
                    term: 'Fibonacci retracement (61.8%)',
                    explanation: `The ${indicators.fibonacci.level618.toFixed(2)} level is where many trend reversals begin—think of it as the market's "golden mean" for bounce or breakdown.`,
                    currentLevel: `$${indicators.fibonacci.level618.toFixed(2)}`
                },
                {
                    term: `VPVR Point of Control ($${indicators.vpvr.poc.toFixed(2)})`,
                    explanation: 'High-volume price areas act like magnets—expect fights here.',
                    currentLevel: `$${indicators.vpvr.poc.toFixed(2)}`
                },
                {
                    term: `200-day MA ($${levels.ma200?.toFixed(2) || 'N/A'})`,
                    explanation: 'Long-term investors often defend this level; a break signals a change in trend psychology.',
                    currentLevel: `$${levels.ma200?.toFixed(2) || 'N/A'}`
                }
            ],
            riskLesson: 'This setup shows why trading into strong support is dangerous; the risk/reward for new shorts is best when price bounces into resistance, not when it\'s sitting on a floor.'
        };
    }
}

// ═══════════════════════════════════════════════════════════════
// EXPORT & INITIALIZATION
// ═══════════════════════════════════════════════════════════════

// Create global instance
window.TechnicalAnalysisEngine = new TechnicalAnalysisEngine();

console.log('✅ Technical Analysis Engine loaded');
console.log('💡 Usage: TechnicalAnalysisEngine.generateFullAnalysis("AAPL")');
