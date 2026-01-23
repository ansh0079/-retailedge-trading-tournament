# 🚀 Quick Start Guide - AI Tournament

## ✅ **Current Status**

- ✅ Frontend component added to `index_ultimate.html`
- ✅ Backend `tournament.js` created
- ✅ API server `tournament-server.js` created
- ✅ **Main server running** on port 8080
- ✅ **Tournament server running** on port 3002

---

## 🎯 **Quick Test (3 Steps)**

### **Step 1: Open Browser Console**

Navigate to: http://localhost:8080

Open browser console (F12)

### **Step 2: Test Tournament Modal**

Paste this code in the console:

```javascript
// Create a test button
const btn = document.createElement('button');
btn.innerHTML = '🏆 Test Tournament';
btn.style.cssText = 'position:fixed;top:20px;right:20px;z-index:9999;padding:12px 24px;background:linear-gradient(135deg,#667eea,#764ba2);color:white;border:none;border-radius:8px;font-weight:bold;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,0.3)';
btn.onclick = () => {
  const modal = React.createElement(AITournamentModal, {
    onClose: () => document.body.removeChild(modalContainer),
    watchlist: ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'NFLX', 'AMD', 'COIN']
  });
  const modalContainer = document.createElement('div');
  document.body.appendChild(modalContainer);
  ReactDOM.render(modal, modalContainer);
};
document.body.appendChild(btn);
```

### **Step 3: Run Tournament**

1. Click the **"🏆 Test Tournament"** button (top-right)
2. Modal opens → Click **"Start Tournament"**
3. Watch real-time updates!

---

## 🎨 **Permanent Integration**

To add the tournament button permanently, find your main `App` component and add:

```javascript
function App() {
  const [showTournament, setShowTournament] = useState(false);
  const [watchlist, setWatchlist] = useState([]);

  // ... your existing code ...

  return (
    <div>
      {/* Add tournament button to your header/navbar */}
      <button
        onClick={() => setShowTournament(true)}
        className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-bold hover:shadow-lg hover:shadow-purple-500/50 transition flex items-center gap-2">
        <i className="fas fa-trophy"></i>
        AI Tournament
      </button>

      {/* Your existing app content */}
      
      {/* Tournament Modal */}
      {showTournament && (
        <AITournamentModal 
          onClose={() => setShowTournament(false)}
          watchlist={watchlist}
        />
      )}
    </div>
  );
}
```

---

## 📊 **What You'll See**

### **Overview Tab**
- Tournament status (IDLE → RUNNING → COMPLETED)
- Progress bar showing current day
- Quick stats (teams, duration, best return, total trades)

### **Leaderboard Tab**
- 🥇 Gold border for 1st place
- 🥈 Silver border for 2nd place
- 🥉 Bronze border for 3rd place
- Real-time portfolio values
- Mini performance charts

### **Logs Tab**
- Live streaming logs
- Color-coded messages
- Timestamps
- Tournament events

### **Settings Tab**
- Configure duration (1-30 days)
- Select teams (1-4)
- View watchlist

---

## ⚡ **Expected Timeline**

With default settings (7 days, 2 sec/day):
- **0:00** - Tournament starts
- **0:02** - Day 1 complete
- **0:04** - Day 2 complete
- **0:14** - Tournament complete
- **0:14** - Winner announced

---

## 🔍 **Verify Everything Works**

### **1. Check Main Server**
```bash
# Should show: Running at http://localhost:8080
```

### **2. Check Tournament Server**
```bash
# Should show: Server running at http://localhost:3002
```

### **3. Test API Health**

Open: http://localhost:3002/health

Should return:
```json
{
  "status": "ok",
  "service": "AI Tournament Server",
  "activeTournaments": 0
}
```

### **4. Test Frontend Component**

In browser console:
```javascript
console.log(typeof AITournamentModal); // Should be "function"
```

---

## 🎯 **Troubleshooting**

### **Modal doesn't open**
```javascript
// Check if component exists
console.log(window.AITournamentModal); // Should not be undefined
```

### **"Failed to start tournament"**
- Check tournament server is running
- Check console for errors
- Verify port 3002 is accessible

### **No real-time updates**
- Check browser console for SSE errors
- Verify CORS is enabled (already configured)
- Check tournament server logs

---

## 📝 **Next Steps**

1. ✅ Test with the quick console method above
2. ✅ Verify real-time updates work
3. ✅ Check leaderboard updates
4. ✅ Review logs streaming
5. ✅ Integrate button into your main app
6. ✅ Customize watchlist and settings

---

## 🎉 **You're Ready!**

Everything is set up and running. Just click the test button and watch the AI teams compete in real-time!

**Servers Running**:
- ✅ Main App: http://localhost:8080
- ✅ Tournament API: http://localhost:3002

**Components Ready**:
- ✅ AITournamentModal
- ✅ TournamentManager
- ✅ SSE Endpoints

**Status**: 🟢 **ALL SYSTEMS GO!**
