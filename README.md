# 🚀 RetailEdge Pro - AI Stock Screener & Portfolio Tracker

Advanced stock analysis platform with AI-powered insights, real-time data, and automated trading tournaments.

## ✨ Features

### 📊 Stock Analysis
- **AI-Powered Screening** - Multi-factor analysis with ML predictions
- **Real-Time Data** - Live quotes, charts, and market data
- **Incremental Loading** - Efficient batch loading with progress tracking
- **Advanced Caching** - IndexedDB + localStorage for fast access

### 🏆 AI Trading Tournament
- **Multi-AI Competition** - 4 AI teams (Claude, GPT-4, DeepSeek, Gemini)
- **Background Execution** - Tournament runs independently
- **Real-Time Updates** - SSE for live leaderboard and logs
- **All Stocks Analysis** - Uses entire stock universe
- **Persistent State** - Continue running when modal is closed

### 📈 Advanced Features
- **Chart Pattern Recognition** - Automated technical pattern detection
- **Social Sentiment Analysis** - Real-time social media sentiment
- **Fundamentals Tab** - Comprehensive financial metrics
- **Watchlist Management** - Track favorite stocks
- **Portfolio Tracking** - Monitor holdings and performance
- **Mobile Responsive** - Works on all devices

### 🎯 Main Page Tabs
- **Stock Screener** - Filter and analyze stocks
- **AI Tournament Leaderboard** - Track tournament results
- **Portfolio** - Manage your investments

## 🛠️ Technology Stack

### Frontend
- **React 18** - Modern UI framework
- **Tailwind CSS** - Utility-first styling
- **Lightweight Charts** - Fast charting library
- **IndexedDB** - Client-side database

### Backend
- **Node.js + Express** - API server
- **Python** - Tournament engine
- **SQLite** - Results storage
- **Server-Sent Events** - Real-time updates

## 🚀 Deployment

### Quick Deploy to Render

1. **Push to GitHub** (see GITHUB_SETUP.md)
2. **Create New Web Service** on Render
3. **Connect your repository**
4. **Settings:**
   - Build: `npm install && npm run build`
   - Start: `node proxy-server.js`
5. **Deploy!**

### Alternative Platforms

- **Vercel** - See `vercel.json`
- **Netlify** - See `netlify.toml`
- **Railway** - Auto-detect Node.js

See `DEPLOYMENT.md` and `QUICK_DEPLOY.md` for detailed instructions.

## 📦 Installation & Development

### Prerequisites
- Node.js 18+
- Python 3.8+ (for AI tournament)
- npm or yarn

### Setup

```bash
# Install dependencies
npm install

# Build the application
npm run build

# Start the server
npm run proxy
# or
node proxy-server.js
```

### Development Mode

```bash
# Watch mode for CSS
npm run build:css

# Start server with auto-reload
npm run dev
```

### Access
- Open http://localhost:3002
- The application will load with all features

## 📁 Project Structure

```
working version/
├── src/
│   └── index.source.html          # Main source file
├── dist/                           # Built files (auto-generated)
├── build/
│   ├── build.js                    # Build script
│   └── vendor.js                   # Vendor bundling
├── proxy-server.js                 # Backend API server
├── ultimate_trading_tournament.py  # AI tournament engine
├── package.json                    # Dependencies
├── vercel.json                     # Vercel config
├── render.yaml                     # Render config
└── netlify.toml                    # Netlify config
```

## 🎮 Usage

### Running a Tournament

1. Click **"AI Tournament"** button in the header
2. Configure settings (days, teams)
3. Click **"Start Tournament"**
4. Close modal - tournament continues in background
5. Watch the indicator in the top-right
6. Reopen modal to see live updates

### Stock Screening

1. Use filters or presets (Growth, Momentum, Value, Oversold)
2. Search for specific stocks by ticker or name
3. Click any stock to see detailed analysis
4. Add to watchlist with the star button

### Portfolio Management

1. Click **"Portfolio"** in header
2. Add holdings with buy/sell transactions
3. Track performance and allocation
4. View AI recommendations

## 🔑 API Keys (Optional)

Set in environment variables or `.env` file:

- `ANTHROPIC_API_KEY` - For Claude AI analysis
- `OPENAI_API_KEY` - For GPT-4 analysis (optional)
- `DEEPSEEK_API_KEY` - For DeepSeek analysis (optional)

## 🐛 Troubleshooting

### Build fails with SQLite error
- This is normal - the app uses pre-built dist files
- SQLite is only needed for tournament results storage

### Application doesn't load
- Check console for errors (F12)
- Verify all CDN resources loaded
- Clear browser cache

### Tournament doesn't start
- Check Python is installed: `python --version`
- Verify `ultimate_trading_tournament.py` exists
- Check server logs for errors

### Tournament stops when closing modal
- Already fixed! Tournament runs detached
- Check "TOURNAMENT RUNNING" indicator
- Reopen modal to reconnect

## 📚 Documentation

- `DEPLOYMENT.md` - Full deployment guide
- `QUICK_DEPLOY.md` - Quick deployment steps
- `GITHUB_SETUP.md` - Git and GitHub setup
- `DEPLOYMENT_STATUS.md` - Current deployment status
- `TROUBLESHOOTING.md` - Common issues and fixes

## 🌟 Features Highlights

### Tournament Persistence
- Runs independently of UI
- Survives modal close
- Auto-reconnects on reopen
- Background execution with detached process

### Performance Optimizations
- Incremental stock loading
- Request deduplication and batching
- Predictive prefetching
- Advanced caching with background refresh
- Performance monitoring

### Real-Time Features
- Live price updates
- Social sentiment tracking
- Pattern recognition
- Heatmap updates (60-min refresh)
- Tournament leaderboard updates

## 📄 License

This project is for educational and personal use.

## 🤝 Contributing

This is a personal project deployed on Render. For issues or suggestions, please open an issue.

## 🎯 Roadmap

- [ ] Add more AI models
- [ ] Enhanced backtesting
- [ ] Options trading analysis
- [ ] Cryptocurrency support
- [ ] Multi-portfolio management

---

**Built with ❤️ using React, Node.js, and Python**

**Deployed on:** Render  
**Version:** 2.0  
**Last Updated:** January 2026
