# 🔍 AI Tournament Stock Filtering System

## ✅ YES - There IS a Pre-Filtering Mechanism!

The tournament uses a **3-tier smart filtering system** called `SmartFilter` that screens stocks BEFORE they reach the AI teams (Claude, DeepSeek, Kimi, Gemini).

---

## 📊 How It Works

### Architecture Flow

```
949 Stocks → SmartFilter (Tier 1) → Screened Stocks → AI Teams → Review Layer → Buy/Sell Decisions
```

---

## 🎯 Tier 1: Technical Screen (Pre-Filter)

### Filtering Criteria & Scoring System

The `tier1_technical_screen()` function evaluates each stock and assigns points based on these criteria:

### 1. **Price Movement** (25 points)
- **Threshold:** ±2.0% daily price change
- **Why:** Identifies stocks with momentum or volatility
- **Signal:** "Price +3.5%" or "Price -2.1%"

### 2. **Volume Spike** (20 points)
- **Threshold:** 1.5x average volume
- **Why:** Unusual volume indicates institutional interest or news
- **Signal:** "Volume 2.3x"

### 3. **RSI Extremes** (15 points)
- **Oversold:** RSI ≤ 30 (potential bounce)
- **Overbought:** RSI ≥ 70 (potential reversal or momentum)
- **Why:** Identifies stocks at technical extremes
- **Signal:** "RSI oversold (28)" or "RSI overbought (75)"

### 4. **Moving Averages** (10 points)
- **Condition:** Price above both 50-day AND 200-day MA
- **Why:** Confirms strong uptrend
- **Signal:** "Above MAs"

### 5. **52-Week High** (20 points)
- **Threshold:** Within 2% of 52-week high
- **Why:** Breakout potential or strong momentum
- **Signal:** "Near 52w high"

### **Minimum Score to Pass:** 40 points

---

## 📋 Example Filtering Results

### Stock A: NVDA
```
✅ PASSED (Score: 75)
- Price +3.2%       → 25 points
- Volume 2.1x       → 20 points
- Above MAs         → 10 points  
- Near 52w high     → 20 points
Total: 75 points → Priority 1 (High)
```

### Stock B: AAPL
```
❌ FAILED (Score: 25)
- Price +0.5%       → 0 points (below threshold)
- Volume 1.2x       → 0 points (below threshold)
- Above MAs         → 10 points
- RSI oversold (29) → 15 points
Total: 25 points → Does not reach AI teams
```

---

## 🔄 Complete Tournament Flow

### Step 1: Stock Universe
- **Input:** 949 stocks from watchlist + all portfolio positions
- **Source:** User-configured list or dynamically expanded

### Step 2: Technical Screen (SmartFilter)
- Calculates score for each stock
- Filters out stocks scoring < 40 points
- **Output:** Top-scoring stocks only

### Step 3: Market Regime Detection
- Tags stocks with market conditions:
  - High volatility
  - Trending up/down
  - Range-bound
  - Crisis mode

### Step 4: AI Team Analysis
- **Limited to:** Top 8 stocks per day (MAX_DAILY_ANALYSIS = 8)
- Each AI team (Claude, DeepSeek, Kimi, Gemini) analyzes the filtered stocks
- Creates buy/sell recommendations

### Step 5: Review Layer
- Each team's reviewer validates recommendations
- Can **Approve**, **Modify**, or **Reject**
- Provides reasoning

### Step 6: Execution
- Approved trades are executed
- Portfolio updated
- Trade logged for learning

---

## ⚙️ Configuration Parameters

Located in `TournamentConfig` class:

```python
# Filtering thresholds
FILTER_MIN_SCORE: float = 40.0           # Minimum score to pass
PRICE_MOVE_THRESHOLD: float = 2.0        # ±2% daily change
VOLUME_SPIKE_THRESHOLD: float = 1.5      # 1.5x average volume
RSI_OVERSOLD: float = 30.0               # RSI oversold level
RSI_OVERBOUGHT: float = 70.0             # RSI overbought level

# Analysis limits
MAX_DAILY_SCREENING: int = 100           # Max stocks to screen
MAX_DAILY_ANALYSIS: int = 8              # Max stocks for AI analysis
```

---

## 🎯 Why This Design?

### 1. **Efficiency**
- Reduces API costs (don't analyze every stock)
- Focuses AI on high-potential opportunities

### 2. **Quality**
- Pre-filter eliminates low-quality signals
- AI teams work on actionable stocks only

### 3. **Risk Management**
- Only stocks meeting technical criteria
- Reduces random/speculative picks

### 4. **Scalability**
- Can handle 949+ stocks efficiently
- Filters down to manageable 8-20 stocks per day

---

## 📈 Priority System

Stocks are ranked by priority based on score:

- **Priority 1 (High):** Score ≥ 70
- **Priority 2 (Medium):** Score ≥ 55
- **Priority 3 (Low):** Score ≥ 40

AI teams see highest-priority stocks first.

---

## 🔧 Customization Options

You can adjust the filtering by modifying:

### Make Filter More Strict:
```python
FILTER_MIN_SCORE: float = 50.0           # Require higher score
PRICE_MOVE_THRESHOLD: float = 3.0        # Larger price moves
VOLUME_SPIKE_THRESHOLD: float = 2.0      # Stronger volume signals
```

### Make Filter More Lenient:
```python
FILTER_MIN_SCORE: float = 30.0           # Lower minimum
PRICE_MOVE_THRESHOLD: float = 1.0        # Smaller moves accepted
MAX_DAILY_ANALYSIS: int = 15             # Analyze more stocks
```

---

## 📊 Current Setup

Based on your configuration:
- **Input:** 949 stocks
- **Pre-filter:** ~10-30 stocks pass daily (varies by market conditions)
- **AI Analysis:** Top 8 stocks analyzed per team
- **Final Trades:** 0-8 trades per team per day (depends on review layer)

---

## 💡 Key Insights

1. **DeepSeek (and all AI teams) see ONLY pre-filtered stocks**
2. **Filter criteria focus on technical signals** (momentum, volume, breakouts)
3. **AI teams then add fundamental analysis** on top of technical screen
4. **Review layer adds final validation** before execution

---

## 🎓 Summary

**Yes, there's a sophisticated pre-filtering mechanism!** 

The `SmartFilter` class screens all 949 stocks using technical analysis, scoring each on 5 criteria. Only stocks scoring ≥40 points reach the AI teams. This ensures AI models (Claude, DeepSeek, Kimi, Gemini) analyze high-quality opportunities rather than random stocks.

The filter acts as a **technical screener** while AI teams provide **strategic analysis and decision-making**.
