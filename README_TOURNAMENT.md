# 🏆 AI Trading Tournament - Quick Start

## What is this?

A competitive AI trading tournament where multiple AI models (Claude, DeepSeek, GPT-4o, Gemini) compete in virtual stock trading. Each AI manages a portfolio, makes recommendations, and learns from past trades.

## 🚀 Quick Deploy

### Windows
```bash
start-tournament.bat
```

### Linux/Mac
```bash
chmod +x start-tournament.sh
./start-tournament.sh
```

### Docker
```bash
docker-compose up
```

## 📋 Prerequisites

1. **Python 3.10-3.13** (not 3.14+)
2. **At least one API key:**
   - Anthropic (Claude)
   - OpenAI (GPT-4o)
   - DeepSeek
   - Google (Gemini)

## ⚙️ Setup

1. **Install dependencies:**
   ```bash
   pip install -r requirements-tournament.txt
   ```

2. **Set API keys:**
   ```bash
   # Windows PowerShell
   $env:ANTHROPIC_API_KEY="your_key"
   $env:OPENAI_API_KEY="your_key"
   
   # Linux/Mac
   export ANTHROPIC_API_KEY="your_key"
   export OPENAI_API_KEY="your_key"
   ```

3. **Run:**
   ```bash
   python deepseek_python_20260119_ac400a.py
   ```

## 📊 What Happens

The tournament runs daily cycles:
- **Day 1-90**: Each day, AIs analyze stocks, make trades, and learn
- **Leaderboard**: Updated after each day
- **Learning**: AIs improve from past trade critiques
- **Reviewer**: Risk assessment layer prevents bad trades

## 📁 Files Created

- `ultimate_tournament.db` - SQLite database
- `ultimate_tournament.log` - Log file
- `./vector_memory/` - ChromaDB vector store
- `tournament_report_*.json` - Final report

## 🔧 Options

```bash
python deepseek_python_20260119_ac400a.py \
  --days 30 \              # Shorter tournament
  --teams "1,2" \          # Only Claude and DeepSeek
  --log-level DEBUG        # More verbose logging
```

## 📖 Full Documentation

See [DEPLOYMENT_TOURNAMENT.md](DEPLOYMENT_TOURNAMENT.md) for:
- Cloud deployment (AWS, GCP, Azure)
- Docker details
- Troubleshooting
- Database queries
- Security best practices

## ⚠️ Important Notes

- **API Costs**: Monitor usage - each AI call costs money
- **Time**: Each day cycle takes several minutes
- **Data**: Tournament data persists in database
- **Learning**: System improves over time via vector memory

## 🆘 Need Help?

1. Check `ultimate_tournament.log` for errors
2. Verify API keys are set correctly
3. Ensure Python 3.10-3.13 (not 3.14+)
4. See DEPLOYMENT_TOURNAMENT.md for detailed troubleshooting
