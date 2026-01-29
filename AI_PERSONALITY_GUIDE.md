# 🎭 AI Team Personality Traits - Complete Guide

## Where Do The Personality Traits Come From?

The personality traits for each AI team are **manually configured** in the codebase, specifically in the `TEAM_CONFIGS` object in `proxy-server.js` (lines 1400-1430).

---

## 📋 The Configuration Source

### Location: `proxy-server.js` Lines 1400-1430

```javascript
const TEAM_CONFIGS = {
  1: {
    name: 'Claude (Sonnet)',
    model: 'Claude-3-Sonnet',
    strategy: 'balanced',
    personality: 'analytical and cautious',
    focuses: ['fundamentals', 'long-term value', 'risk management']
  },
  2: {
    name: 'Kimi',
    model: 'Kimi-K2',
    strategy: 'aggressive',
    personality: 'bold and trend-following',
    focuses: ['momentum', 'breakouts', 'market sentiment']
  },
  3: {
    name: 'DeepSeek V3',
    model: 'DeepSeek-V3',
    strategy: 'conservative',
    personality: 'conservative and dividend-focused',
    focuses: ['stability', 'dividends', 'blue chips']
  },
  4: {
    name: 'Gemini Pro',
    model: 'Gemini-Pro',
    strategy: 'momentum',
    personality: 'data-driven and adaptive',
    focuses: ['technical analysis', 'patterns', 'volume']
  }
};
```

---

## 🤔 How Were These Assignments Decided?

The personality traits were assigned based on a combination of:

### 1. **AI Model Characteristics** (Perceived Strengths)

Each AI model has different capabilities and tendencies:

- **Claude (Anthropic)**: Known for careful, analytical reasoning → "analytical and cautious"
- **Kimi (Moonshot)**: Chinese AI, newer/more aggressive → "bold and trend-following"  
- **DeepSeek**: Focused on reasoning and stability → "conservative and dividend-focused"
- **Gemini (Google)**: Data-driven, multimodal → "data-driven and adaptive"

### 2. **Trading Strategy Archetypes**

The four classic trading strategies needed representation:

- **Balanced** → Claude (middle-ground approach)
- **Aggressive** → Kimi (high-risk, high-reward)
- **Conservative** → DeepSeek (safety-first)
- **Momentum** → Gemini (technical/pattern-based)

### 3. **Competitive Diversity**

To make the tournament interesting, each team needed distinct:

- Risk tolerance levels
- Decision-making criteria
- Focus areas
- Reasoning styles

---

## 🎯 Personality Trait Breakdown

### Team 1: Claude (Sonnet) - "The Analyst"

**Strategy**: `balanced`  
**Personality**: `analytical and cautious`  
**Focuses**: `['fundamentals', 'long-term value', 'risk management']`

**Why This Fits:**

- Claude is known for detailed, thoughtful analysis
- Anthropic emphasizes safety and careful reasoning
- Balanced approach suits Claude's methodical nature

**Trading Behavior:**

- Analyzes fundamentals (P/E, ROE, earnings)
- Seeks long-term value plays
- Manages risk carefully
- Moderate position sizes

---

### Team 2: Kimi (K2) - "The Momentum Trader"

**Strategy**: `aggressive`  
**Personality**: `bold and trend-following`  
**Focuses**: `['momentum', 'breakouts', 'market sentiment']`

**Why This Fits:**

- Kimi is a newer, more experimental AI
- Moonshot AI (Chinese) → different approach
- Aggressive strategy creates contrast with Claude

**Trading Behavior:**

- Chases momentum and breakouts
- Follows market sentiment
- Larger position sizes
- Higher risk tolerance
- Quick to enter/exit trades

---

### Team 3: DeepSeek V3 - "The Value Investor"

**Strategy**: `conservative`  
**Personality**: `conservative and dividend-focused`  
**Focuses**: `['stability', 'dividends', 'blue chips']`

**Why This Fits:**

- DeepSeek emphasizes deep reasoning
- Conservative approach balances aggressive Kimi
- Dividend focus = income-oriented strategy

**Trading Behavior:**

- Prefers stable, established companies
- Focuses on dividend-paying stocks
- Blue-chip stocks only
- Smaller position sizes
- Long holding periods
- Only trades with high confidence (>70%)

---

### Team 4: Gemini Pro - "The Technical Analyst"

**Strategy**: `momentum`  
**Personality**: `data-driven and adaptive`  
**Focuses**: `['technical analysis', 'patterns', 'volume']`

**Why This Fits:**

- Google's Gemini is multimodal (can analyze charts/data)
- "Data-driven" suits Google's analytical strength
- Momentum strategy uses technical indicators

**Trading Behavior:**

- Analyzes technical indicators (RSI, MACD, volume)
- Identifies chart patterns
- Adapts to market conditions
- Volume-based decisions
- Pattern recognition focus

---

## 🔄 How Personalities Are Applied

### 1. **During Team Initialization** (Line 2834-2845)

When the tournament starts, each team is created with these traits:

```javascript
tournamentState.teams = [1, 2, 3, 4].map(id => ({
  id,
  ...TEAM_CONFIGS[id],  // ← Spreads personality traits here
  portfolioValue: 50000,
  cash: 50000,
  // ... other properties
}));
```

### 2. **In AI Prompts** (Lines 1872-1920)

The personality traits are included in the AI's decision-making prompt:

```javascript
const prompt = `You are ${team.name}, an AI trading agent with the following profile:
- Strategy: ${team.strategy}
- Personality: ${team.personality}
- Focus Areas: ${team.focuses.join(', ')}
...`;
```

### 3. **In Reasoning Generation** (Lines 1638-1663)

Different reasoning templates are used based on strategy:

```javascript
const templates = REASONING_TEMPLATES[action][team.strategy];
// Returns different reasoning for aggressive vs conservative
```

### 4. **In Position Sizing** (Lines 2603-2608)

Strategy affects trade sizes:

```javascript
if (competitivePos.isTrailing && (team.strategy === 'aggressive' || team.strategy === 'momentum')) {
  shares = Math.floor(shares * 1.3);  // 30% larger positions
}
if (competitivePos.isLeading && team.strategy === 'conservative') {
  shares = Math.floor(shares * 0.8);  // 20% smaller positions
}
```

---

## 🎨 Can You Change The Personalities?

**Yes!** You can modify `TEAM_CONFIGS` in `proxy-server.js` to:

### Example: Make Claude More Aggressive

```javascript
1: {
  name: 'Claude (Sonnet)',
  model: 'Claude-3-Sonnet',
  strategy: 'aggressive',  // Changed from 'balanced'
  personality: 'bold and analytical',  // Changed
  focuses: ['growth stocks', 'momentum', 'breakouts']  // Changed
}
```

### Example: Add a 5th Team

```javascript
5: {
  name: 'GPT-4',
  model: 'GPT-4-Turbo',
  strategy: 'balanced',
  personality: 'versatile and adaptive',
  focuses: ['diversification', 'sector rotation', 'macro trends']
}
```

Then update the team initialization to include team 5:

```javascript
tournamentState.teams = [1, 2, 3, 4, 5].map(id => ({ ... }));
```

---

## 📊 Personality Impact Summary

| Team | Strategy | Position Sizing | Confidence Threshold | Trading Frequency |
|------|----------|----------------|---------------------|-------------------|
| **Claude** | Balanced | Medium | 60% | Moderate |
| **Kimi** | Aggressive | Large | 50% | High |
| **DeepSeek** | Conservative | Small | 70% | Low |
| **Gemini** | Momentum | Medium-Large | 55% | High |

---

## 🧠 The Design Philosophy

The personality assignments follow these principles:

1. **Diversity**: Each team should have a distinct approach
2. **Realism**: Strategies should mirror real trading styles
3. **Balance**: No single strategy should dominate
4. **AI Alignment**: Traits should match AI model strengths
5. **Competition**: Differences create interesting tournament dynamics

---

## 🎯 Key Takeaways

1. **Personalities are manually configured** in `TEAM_CONFIGS` object
2. **Not based on AI model behavior** - they're assigned characteristics
3. **Designed for diversity** - each team represents a different trading archetype
4. **Fully customizable** - you can change any trait in the config
5. **Applied throughout** - affects prompts, reasoning, position sizing, and thresholds

---

## 📝 Where to Find This in Code

| Aspect | File | Line Numbers |
|--------|------|--------------|
| Team Configuration | `proxy-server.js` | 1400-1430 |
| Team Initialization | `proxy-server.js` | 2834-2845 |
| Reasoning Templates | `proxy-server.js` | 1433-1556 |
| Position Sizing Logic | `proxy-server.js` | 2603-2608 |
| AI Prompt Building | `proxy-server.js` | 1872-1920 |

---

**Bottom Line**: The personalities are **design choices** made to create diverse, interesting AI trading agents. They're not inherent to the AI models themselves, but rather roles assigned to make the tournament competitive and educational! 🎭📈
