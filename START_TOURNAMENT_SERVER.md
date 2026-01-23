# 🏆 Start Tournament Server Locally

## Quick Start

### 1. Install Dependencies (First Time Only)

```bash
npm install
```

### 2. Start the Tournament Server

```bash
npm run tournament
```

You should see:

```
🏆 ═══════════════════════════════════════════════════════════
🏆  AI TOURNAMENT SERVER
🏆 ═══════════════════════════════════════════════════════════

📡 Server running at http://localhost:3002

📋 Available endpoints:
   POST   /api/tournament/start
   GET    /api/tournament/status/:id
   GET    /api/tournament/results
   ...

✅ Ready to run AI trading tournaments!
```

### 3. Open the Frontend

Open `src/index_ultimate.html` in your browser or use:

```bash
# Option 1: Simple HTTP server
npx http-server src -p 8080

# Option 2: Python
cd src
python -m http.server 8080

# Then open: http://localhost:8080/index_ultimate.html
```

### 4. Test the Tournament

1. Click the **"AI Tournament"** tab
2. Configure your settings:
   - Select teams (1-4)
   - Set duration (e.g., 10 days for quick test)
   - Add stocks to watchlist
3. Click **"Start Tournament"**
4. Watch it run in real-time!

---

## Troubleshooting

### "Cannot find module 'express'"
```bash
npm install
```

### "Port 3002 already in use"
Kill the existing process:

**Windows:**
```bash
netstat -ano | findstr :3002
taskkill /PID <PID> /F
```

**Mac/Linux:**
```bash
lsof -i :3002
kill -9 <PID>
```

### "CORS error" in browser
- Make sure the backend server is running on port 3002
- Make sure you're accessing the frontend via http://localhost (not file://)

---

## Next Steps

Once everything works locally:
1. Follow `DEPLOYMENT_GUIDE_RENDER.md` to deploy online
2. Your tournaments will run 24/7 in the cloud
3. Access from anywhere!
