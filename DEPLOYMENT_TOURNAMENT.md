# 🏆 AI Trading Tournament - Deployment Guide

This guide covers deploying the Ultimate AI Trading Tournament system.

## 📋 Prerequisites

1. **Python 3.10-3.13** (required, not 3.14+)
   - Download from: https://www.python.org/
   - Verify: `python --version`

2. **API Keys** (at least one required):
   - Anthropic API Key (for Claude/Team 1)
   - OpenAI API Key (for GPT-4o/Team 3)
   - DeepSeek API Key (for DeepSeek/Team 2)
   - Google API Key (for Gemini/Team 4)

## 🚀 Quick Start (Local)

### Option 1: Direct Python Execution

1. **Install dependencies:**
   ```bash
   pip install -r requirements-tournament.txt
   ```

2. **Set environment variables:**
   ```bash
   # Windows (PowerShell)
   $env:ANTHROPIC_API_KEY="your_key_here"
   $env:OPENAI_API_KEY="your_key_here"
   $env:DEEPSEEK_API_KEY="your_key_here"
   $env:GOOGLE_API_KEY="your_key_here"

   # Windows (CMD)
   set ANTHROPIC_API_KEY=your_key_here
   set OPENAI_API_KEY=your_key_here
   set DEEPSEEK_API_KEY=your_key_here
   set GOOGLE_API_KEY=your_key_here

   # Linux/Mac
   export ANTHROPIC_API_KEY=your_key_here
   export OPENAI_API_KEY=your_key_here
   export DEEPSEEK_API_KEY=your_key_here
   export GOOGLE_API_KEY=your_key_here
   ```

3. **Run the tournament:**
   ```bash
   python deepseek_python_20260119_ac400a.py
   ```

### Option 2: Using .env File

1. **Copy example environment file:**
   ```bash
   cp .env.example .env
   ```

2. **Edit .env with your API keys**

3. **Install python-dotenv and run:**
   ```bash
   pip install python-dotenv
   # Then modify the script to load .env or use:
   python -c "from dotenv import load_dotenv; load_dotenv(); exec(open('deepseek_python_20260119_ac400a.py').read())"
   ```

## 🐳 Docker Deployment

### Build and Run

1. **Build the image:**
   ```bash
   docker build -t ai-trading-tournament .
   ```

2. **Run with environment variables:**
   ```bash
   docker run -it --rm \
     -e ANTHROPIC_API_KEY=your_key \
     -e OPENAI_API_KEY=your_key \
     -e DEEPSEEK_API_KEY=your_key \
     -e GOOGLE_API_KEY=your_key \
     -v $(pwd)/data:/app/data \
     -v $(pwd)/logs:/app/logs \
     -v $(pwd)/vector_memory:/app/vector_memory \
     ai-trading-tournament
   ```

### Using Docker Compose

1. **Create .env file with your API keys**

2. **Start the tournament:**
   ```bash
   docker-compose up
   ```

3. **Run in background:**
   ```bash
   docker-compose up -d
   ```

4. **View logs:**
   ```bash
   docker-compose logs -f
   ```

## ⚙️ Configuration Options

### Command Line Arguments

```bash
python deepseek_python_20260119_ac400a.py \
  --days 90 \                    # Tournament duration
  --teams "1,2,3,4" \            # Active teams (1=Claude, 2=DeepSeek, 3=GPT-4o, 4=Gemini)
  --log-level INFO \             # Logging level (DEBUG, INFO, WARNING, ERROR)
  --watchlist stocks.txt         # Custom watchlist file
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `ANTHROPIC_API_KEY` | Claude API key | Required for Team 1 |
| `OPENAI_API_KEY` | OpenAI API key | Required for Team 3 |
| `DEEPSEEK_API_KEY` | DeepSeek API key | Required for Team 2 |
| `GOOGLE_API_KEY` | Google API key | Required for Team 4 |
| `DB_FILE` | SQLite database path | `ultimate_tournament.db` |
| `LOG_FILE` | Log file path | `ultimate_tournament.log` |
| `VECTOR_DB_PATH` | ChromaDB path | `./vector_memory` |

## 📊 Tournament Structure

The tournament runs in daily cycles:

1. **Market Regime Detection** - Analyzes current market conditions
2. **Portfolio Review** - Checks stop losses, targets, expiration
3. **Stock Screening** - Technical analysis filtering
4. **AI Analysis** - Each team generates recommendations
5. **Review Layer** - Risk assessment and approval
6. **Position Execution** - Opens/closes positions
7. **Performance Tracking** - Updates metrics and leaderboard

## 💾 Data Persistence

The tournament creates:

- **Database**: `ultimate_tournament.db` (SQLite)
  - Recommendations, positions, reviews, snapshots
- **Vector Memory**: `./vector_memory/` (ChromaDB)
  - Trade critiques and pattern memories
- **Logs**: `ultimate_tournament.log`
  - All tournament activity

## 🔧 Troubleshooting

### Missing Dependencies

```bash
pip install --upgrade pip
pip install -r requirements-tournament.txt
```

### ChromaDB Issues

If ChromaDB fails to initialize:
```bash
pip install --upgrade chromadb sentence-transformers
```

### API Key Errors

- Verify API keys are set correctly
- Check API key permissions and quotas
- Ensure at least one team's API key is configured

### Database Locked

If you see "database is locked" errors:
- Close any other processes accessing the database
- Use `--days 1` for a quick test run

### Memory Issues

For large tournaments:
- Reduce `MAX_DAILY_SCREENING` in the config
- Reduce `MAX_DAILY_ANALYSIS` in the config
- Use fewer active teams

## ☁️ Cloud Deployment

### AWS EC2

1. Launch EC2 instance (Ubuntu 22.04)
2. Install Docker:
   ```bash
   curl -fsSL https://get.docker.com -o get-docker.sh
   sh get-docker.sh
   ```
3. Clone repository and deploy:
   ```bash
   git clone <your-repo>
   cd <repo>
   docker-compose up -d
   ```

### Google Cloud Run

1. Build and push to Container Registry:
   ```bash
   gcloud builds submit --tag gcr.io/PROJECT_ID/ai-trading-tournament
   ```
2. Deploy:
   ```bash
   gcloud run deploy ai-trading-tournament \
     --image gcr.io/PROJECT_ID/ai-trading-tournament \
     --set-env-vars ANTHROPIC_API_KEY=xxx,OPENAI_API_KEY=xxx
   ```

### Azure Container Instances

```bash
az container create \
  --resource-group myResourceGroup \
  --name ai-trading-tournament \
  --image ai-trading-tournament:latest \
  --environment-variables \
    ANTHROPIC_API_KEY=xxx \
    OPENAI_API_KEY=xxx
```

## 📈 Monitoring

### View Leaderboard

The tournament displays a leaderboard after each day. Check:
- Total return percentage
- Win rate
- Risk-adjusted metrics (Sortino, Calmar)
- API costs

### Review Reports

Weekly reviewer accuracy reports are generated automatically.

### Database Queries

Query the SQLite database:
```bash
sqlite3 ultimate_tournament.db
```

Example queries:
```sql
-- View all positions
SELECT * FROM positions ORDER BY entry_timestamp DESC;

-- Team performance
SELECT team_id, AVG(realized_pnl) as avg_pnl 
FROM positions 
WHERE status = 'CLOSED' 
GROUP BY team_id;

-- Reviewer accuracy
SELECT AVG(reviewer_was_correct) as accuracy 
FROM review_decisions 
WHERE actual_outcome IS NOT NULL;
```

## 🔒 Security Best Practices

1. **Never commit API keys** - Use environment variables
2. **Use secrets management** - AWS Secrets Manager, Azure Key Vault, etc.
3. **Limit API key permissions** - Use read-only keys when possible
4. **Monitor API usage** - Set up alerts for unexpected costs
5. **Backup database regularly** - Tournament data is valuable

## 📝 Notes

- The tournament runs for 90 days by default
- Each day cycle takes several minutes (depends on API response times)
- API costs accumulate over time - monitor usage
- The system learns from past trades via vector memory
- Reviewer accuracy improves over time with calibration

## 🆘 Support

For issues:
1. Check logs: `tail -f ultimate_tournament.log`
2. Verify API keys are valid
3. Ensure Python version is 3.10-3.13
4. Check database file permissions
