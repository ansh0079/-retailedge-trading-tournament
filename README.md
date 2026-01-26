# 🚀 RetailEdge Pro - Stock Analysis Platform

A sophisticated stock analysis platform with AI-powered insights, real-time data, and social sentiment analysis.

## 🌐 Deployment

This project is configured for **Render.com** deployment via GitHub.

### Quick Deploy to Render

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Deploy to Render"
   git push origin main
   ```

2. **Connect to Render**:
   - Go to [render.com](https://render.com)
   - Create new Web Service
   - Connect your GitHub repository
   - Render will auto-detect `render.yaml`

3. **Set Environment Variables** in Render Dashboard:
   - `FMP_API_KEY` - Financial Modeling Prep API key
   - `ANTHROPIC_API_KEY` - Claude AI API key
   - `DEEPSEEK_API_KEY` - DeepSeek AI API key (optional)
   - `KIMI_API_KEY` - Kimi AI API key (optional)
   - `GOOGLE_API_KEY` - Google AI API key (optional)

---

## 🔑 Required API Keys

| Key | Purpose | Get it from |
|-----|---------|-------------|
| `FMP_API_KEY` | Real-time stock data | [financialmodelingprep.com](https://financialmodelingprep.com) |
| `ANTHROPIC_API_KEY` | AI analysis | [anthropic.com](https://www.anthropic.com) |

---

## 📁 Project Structure

```
├── index.html          # Main frontend application
├── proxy-server.js     # Express backend server
├── package.json        # Node.js dependencies
├── render.yaml         # Render deployment config
├── SP500_STOCKS.json   # S&P 500 stock list
└── .env.example        # Environment variables template
```

---

## 🛠️ Local Development

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment**:
   ```bash
   # Copy example to .env
   cp .env.example .env
   # Add your API keys to .env
   ```

3. **Start the server**:
   ```bash
   npm start
   ```

4. **Open in browser**: http://localhost:3002

---

## 🎯 Features

- 📊 **Real-time Stock Data** - Live quotes and charts
- 🤖 **AI Analysis** - Claude-powered stock insights
- 📱 **Social Sentiment** - Reddit & StockTwits integration
- 🏆 **Tournament Mode** - AI trading competition

---

## 📊 API Endpoints

- `GET /` - Main application
- `GET /api/health` - Health check
- `POST /api/claude` - AI analysis proxy
- `GET /api/stocktwits/:symbol` - StockTwits sentiment
- `GET /api/reddit/:subreddit/search` - Reddit search

---

## 🔒 Security

- Never commit `.env` file (it's in `.gitignore`)
- Use Render's environment variables for production
- API keys are only used server-side

---

## 📜 License

MIT License
