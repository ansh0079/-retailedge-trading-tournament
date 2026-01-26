# How to Start Retail Edge Pro

## 🚀 Option 1: Double-Click Start (EASIEST)

Just **double-click `start.bat`** in this folder!

This will:
1. ✅ Check if Node.js is installed
2. ✅ Install dependencies if needed
3. ✅ Start the proxy server automatically
4. ✅ Open the app in your browser at http://localhost:3002

The server will run in a background window. You can close the startup window after it opens the browser.

---

## 🖥️ Option 2: Command Line

### Windows:
```cmd
cd "C:\Users\ansh0\Downloads\working version"
start.bat
```

### Alternative (manual):
```cmd
cd "C:\Users\ansh0\Downloads\working version"
node proxy-server.js
```
Then open http://localhost:3002 in your browser

---

## 🛑 How to Stop the Server

### Method 1: From the Server Window
1. Find the window titled "Retail Edge Pro Server"
2. Press `Ctrl+C` twice
3. Close the window

### Method 2: From Task Manager
1. Press `Ctrl+Shift+Esc`
2. Find "Node.js: Server-side JavaScript"
3. Right-click → End Task

### Method 3: Kill All Node Processes (Nuclear Option)
```cmd
taskkill /F /IM node.exe
```
⚠️ This will stop ALL Node.js processes on your computer!

---

## 🔧 Troubleshooting

### "Node.js is not installed"
1. Download from https://nodejs.org (LTS version)
2. Install with default options
3. Restart your terminal
4. Try again

### "Port 3002 is already in use"
Another instance is running. Stop it first:
```cmd
netstat -ano | findstr :3002
taskkill /F /PID <PID_NUMBER>
```

### "Cannot find module"
Dependencies not installed. Run:
```cmd
npm install
```

### Browser shows "Cannot GET /"
Server not running. Make sure you see:
```
✅ CORS Proxy Server running on http://localhost:3002
```

### Tournament buttons not showing
1. Make sure server is running
2. Hard refresh: `Ctrl+Shift+R`
3. Check console (F12) for errors

---

## 📋 What Runs on Startup

When you start the app, the following processes launch:

1. **Proxy Server** (port 3002)
   - Serves the web application
   - Proxies API requests (StockTwits, Reddit, Claude)
   - Handles tournament endpoints

2. **Enhanced Analysis Backend** (port 5003)
   - Multi-source sentiment analysis
   - 10-factor scoring system
   - Auto-starts with proxy server

3. **Tournament Process** (when you start a tournament)
   - Independent Python process
   - Runs in background
   - Survives server restarts (saved to `.tournament_state.json`)

---

## 🎯 First Time Setup

### 1. Install Dependencies
```cmd
npm install
```

### 2. Set Up Environment Variables (Optional)
Create `.env` file in this folder:
```
ANTHROPIC_API_KEY=your_claude_api_key_here
```

### 3. Start the App
```cmd
start.bat
```

---

## 🌐 Default URLs

- **Main App**: http://localhost:3002
- **Health Check**: http://localhost:3002/health
- **Tournament Status**: http://localhost:3002/api/tournament/status/current
- **Market Status**: http://localhost:3002/api/market/status

---

## 💡 Pro Tips

1. **Bookmark the URL**: Add http://localhost:3002 to your browser bookmarks

2. **Keep Server Running**: Don't close the server window while using the app

3. **Check Server Logs**: Look at the server window to see what's happening

4. **Tournament Persistence**: Tournaments survive server restarts! Your tournament will continue even if you restart the server.

5. **Auto Pause/Resume**: Tournaments automatically pause when the market closes (4 PM ET) and resume when it opens (9:30 AM ET)

---

## 📱 Access from Other Devices (Same Network)

1. Find your computer's IP address:
```cmd
ipconfig
```
Look for "IPv4 Address" (e.g., 192.168.1.100)

2. On another device, open:
```
http://YOUR_IP:3002
```

3. Make sure Windows Firewall allows Node.js connections

---

## 🆘 Still Having Issues?

1. Check the server console for errors
2. Open browser console (F12) and check for errors
3. Make sure you're accessing via http://localhost:3002 (not file://)
4. Try in a different browser
5. Restart your computer and try again

