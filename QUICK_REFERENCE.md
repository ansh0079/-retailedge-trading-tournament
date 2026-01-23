# 🎯 Quick Reference - AI Tournament

## 🏃 Quick Start (Local Testing)

```bash
# 1. Install dependencies (first time only)
npm install

# 2. Start tournament server
npm run tournament

# 3. In another terminal, serve frontend
npx http-server src -p 8080

# 4. Open browser
# http://localhost:8080/index_ultimate.html
```

---

## 🚀 Quick Deploy (5 min)

```bash
# 1. Push to GitHub
git init
git add .
git commit -m "Ready for deployment"
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main

# 2. Deploy backend to Render
# → Go to https://render.com
# → New Web Service → Connect GitHub
# → Start command: npm start
# → Copy the backend URL

# 3. Update frontend API URL
# Edit src/index_ultimate.html line ~630
# Replace: https://your-backend.onrender.com
# With: https://YOUR-ACTUAL-BACKEND-URL.onrender.com

# 4. Deploy frontend to Netlify
# → Go to https://netlify.com
# → New site → Connect GitHub
# → Publish directory: src
```

---

## 📝 Common Commands

### Local Development
```bash
npm run tournament      # Start tournament server
npm run proxy          # Start proxy server (separate feature)
npm install            # Install dependencies
```

### Testing
```bash
# Test backend health
curl http://localhost:3002/health

# Start a tournament
curl -X POST http://localhost:3002/api/tournament/start \
  -H "Content-Type: application/json" \
  -d '{"days":10,"teams":[1,2],"watchlist":["AAPL","MSFT"]}'

# Get tournament status
curl http://localhost:3002/api/tournament/status/{experimentId}
```

---

## 🔧 Troubleshooting

| Problem | Solution |
|---------|----------|
| Port 3002 in use | `netstat -ano \| findstr :3002` then `taskkill /PID <PID> /F` |
| Tournament won't start | Check backend is running: http://localhost:3002/health |
| CORS error | Use http://localhost (not file://) for frontend |
| Module not found | Run `npm install` |

---

## 📚 Full Documentation

- **DEPLOYMENT_READY.md** - What's been done
- **DEPLOYMENT_GUIDE_RENDER.md** - Complete deployment guide
- **START_TOURNAMENT_SERVER.md** - Local testing guide

---

## 🎯 What You Built

✅ **Backend Server** - Runs tournaments independently
✅ **Tournament Engine** - AI team simulation
✅ **Frontend Integration** - Real-time monitoring
✅ **Cloud Ready** - Deploy to Render/Netlify for free
✅ **Production Features** - Pause/Resume, Checkpoints, Auto-save

---

**Need help? Check the full guides!** 📖
