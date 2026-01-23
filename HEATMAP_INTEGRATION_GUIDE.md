# Market Heatmap Feature - Integration Guide

## ✅ Status: SmartPoller Integrated!

The **SmartPoller** class has been successfully integrated into `index_ultimate.html` at line 3193.

## 🎯 What's Been Added

### 1. **SmartPoller Class** ✅ (Lines 3193-3256)

**Features**:
- Intelligent 60-minute polling for stock updates
- Customizable polling frequency per symbol
- Automatic cleanup on stop
- Global instance available as `window.smartPoller`

**Usage**:
```javascript
// Start polling a stock every 60 minutes
smartPoller.startPolling('AAPL', (data) => {
  console.log('Updated data:', data);
});

// Stop polling
smartPoller.stopPolling('AAPL');

// Stop all polling
smartPoller.stopAll();
```

---

## 📋 Next Step: Add React Heatmap Component

To complete the integration, you need to add the **RealtimeHeatmap** React component.

### Where to Add It

The component should be added in the React components section of `index_ultimate.html`. Since the file is 21K+ lines, here's how to find the right location:

1. Search for existing React components (look for `function` or `const` component definitions)
2. Add the heatmap component near other visualization components
3. Then use it in the main app render

### Component Code to Add

```javascript
// ═══════════════════════════════════════════════════════════════════════════
// REALTIME HEATMAP COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

function DataFreshnessIndicator({ timestamp, type }) {
  const [display, setDisplay] = useState('');
  
  const format = () => {
    if (!timestamp) return 'Never updated';
    
    const minutes = Math.floor((Date.now() - timestamp) / 60000);
    
    if (type === 'heatmap') {
      const nextUpdate = 60 - (minutes % 60);
      return `Next update: ${nextUpdate} min`;
    }
    
    if (minutes < 1) return 'Updated just now';
    if (minutes < 60) return `Updated ${minutes}m ago`;
    return `Updated ${Math.floor(minutes / 60)}h ago`;
  };
  
  useEffect(() => {
    setDisplay(format());
    const id = setInterval(() => setDisplay(format()), 60000);
    return () => clearInterval(id);
  }, [timestamp, type]);
  
  return (
    <div className={`text-xs flex items-center gap-2 ${
      timestamp && (Date.now() - timestamp) < 60000 ? 'text-green-400' : 'text-slate-400'
    }`}>
      <i className="fas fa-clock"></i>
      <span>{display}</span>
    </div>
  );
}

function RealtimeHeatmap({ stocks, onStockClick }) {
  const [heatmapData, setHeatmapData] = useState([]);
  const [lastManualRefresh, setLastManualRefresh] = useState(Date.now());
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const REFRESH_INTERVAL = 3600000; // 60 minutes

  // Initialize heatmap data
  useEffect(() => {
    const initialData = stocks.map(stock => ({
      symbol: stock.symbol,
      name: stock.name || stock.symbol,
      price: stock.price,
      changePct: stock.changePct,
      volume: stock.volume,
      marketCap: stock.marketCap,
      sector: stock.sector || 'Other',
      lastUpdate: Date.now(),
      isStale: false
    }));
    setHeatmapData(initialData);
  }, [stocks]);

  // Process update (called by poller)
  const processUpdate = (stockData) => {
    const { symbol, price, changesPercentage, volume } = stockData;
    
    setHeatmapData(prev => {
      const idx = prev.findIndex(s => s.symbol === symbol);
      if (idx === -1) return prev;
      
      const updated = [...prev];
      const stock = { ...updated[idx] };
      
      if (price) stock.price = price;
      if (changesPercentage !== undefined) stock.changePct = changesPercentage;
      if (volume) stock.volume = volume;
      
      stock.lastUpdate = Date.now();
      stock.isStale = false;
      
      updated[idx] = stock;
      return updated;
    });
  };

  // Subscribe with 60-minute frequency
  useEffect(() => {
    if (!stocks.length) return;
    
    stocks.forEach(stock => {
      smartPoller.startPolling(stock.symbol, processUpdate, REFRESH_INTERVAL);
    });
    
    return () => {
      stocks.forEach(stock => {
        smartPoller.stopPolling(stock.symbol);
      });
    };
  }, [stocks]);

  // Check for stale data (older than 65 minutes)
  useEffect(() => {
    const interval = setInterval(() => {
      const staleThreshold = Date.now() - (65 * 60 * 1000);
      setHeatmapData(prev => prev.map(stock => ({
        ...stock,
        isStale: stock.lastUpdate < staleThreshold
      })));
    }, 60000); // Check every minute
    
    return () => clearInterval(interval);
  }, []);

  // Manual refresh function
  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    setLastManualRefresh(Date.now());
    
    // Force refresh all stocks
    const refreshPromises = stocks.map(stock => 
      smartFetch('quote', stock.symbol)
        .then(result => {
          if (result?.data?.[0]) {
            processUpdate({
              symbol: stock.symbol,
              price: result.data[0].price,
              changesPercentage: result.data[0].changesPercentage,
              volume: result.data[0].volume
            });
          }
        })
        .catch(err => console.warn(`Refresh failed for ${stock.symbol}:`, err))
    );
    
    await Promise.allSettled(refreshPromises);
    setIsRefreshing(false);
  };

  // Get color based on performance
  const getHeatColor = (changePct) => {
    if (changePct > 5) return 'bg-green-600';
    if (changePct > 2) return 'bg-green-500';
    if (changePct > 0) return 'bg-green-400';
    if (changePct > -2) return 'bg-yellow-500';
    if (changePct > -5) return 'bg-orange-500';
    return 'bg-red-600';
  };

  // Get size based on market cap
  const getSizeClass = (marketCap) => {
    if (!marketCap) return 'w-24 h-16';
    if (marketCap > 100e9) return 'w-32 h-20';
    if (marketCap > 10e9) return 'w-28 h-18';
    if (marketCap > 2e9) return 'w-24 h-16';
    return 'w-20 h-14';
  };

  return (
    <div className="glass-card p-6 rounded-xl mb-6 border border-slate-700/50">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <i className="fas fa-fire text-orange-400"></i>
            Market Heatmap
          </h3>
          <span className="text-xs px-2 py-1 rounded-full bg-orange-500/20 text-orange-300">
            60-min Updates
          </span>
        </div>
        
        <div className="flex items-center gap-3">
          <DataFreshnessIndicator timestamp={lastManualRefresh} type="heatmap" />
          
          {/* Manual Refresh Button */}
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white rounded-lg text-sm flex items-center gap-2"
          >
            {isRefreshing ? (
              <><i className="fas fa-spinner animate-spin"></i> Refreshing...</>
            ) : (
              <><i className="fas fa-sync"></i> Refresh Now</>
            )}
          </button>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="grid grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-2 max-h-96 overflow-y-auto p-2">
        {heatmapData.map(stock => (
          <div
            key={stock.symbol}
            onClick={() => onStockClick(stock)}
            className={`${getHeatColor(stock.changePct)} ${getSizeClass(stock.marketCap)} 
              rounded-lg p-2 cursor-pointer transition transform hover:scale-105 
              flex flex-col justify-between relative group border border-transparent hover:border-white/20`}
          >
            {/* Real-time update indicator */}
            {!stock.isStale && (
              <div className="absolute top-1 right-1 w-2 h-2 bg-green-400 rounded-full"></div>
            )}
            
            {/* Stale indicator */}
            {stock.isStale && (
              <div className="absolute top-1 right-1 w-2 h-2 bg-yellow-400 rounded-full" title="Data may be stale"></div>
            )}
            
            <div>
              <div className="text-white font-bold text-xs">{stock.symbol}</div>
              <div className="text-white/90 text-xs font-mono">${stock.price?.toFixed(2)}</div>
            </div>
            
            <div>
              <div className={`text-xs font-bold ${stock.changePct > 0 ? 'text-white' : 'text-red-100'}`}>
                {stock.changePct > 0 ? '+' : ''}{stock.changePct?.toFixed(1)}%
              </div>
              {stock.volume && (
                <div className="text-white/70 text-[10px]">
                  {formatNumber(stock.volume)}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Footer Info */}
      <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
        <div>
          <span className="mr-4">Click stock for details</span>
          <span>Updates every 60 minutes</span>
        </div>
        <div>Last refresh: {new Date(lastManualRefresh).toLocaleTimeString()}</div>
      </div>
    </div>
  );
}
```

### How to Use in Main App

In your main App component, add:

```javascript
function App() {
  // ... existing state
  const [heatmapStocks, setHeatmapStocks] = useState([]);

  // Update heatmap stocks after loading
  useEffect(() => {
    // Use top 40 stocks by market cap for heatmap
    const topStocks = [...stocks]
      .sort((a, b) => (b.marketCap || 0) - (a.marketCap || 0))
      .slice(0, 40);
    setHeatmapStocks(topStocks);
  }, [stocks]);

  return (
    <div className="min-h-screen">
      <Header />
      
      {/* ADD HEATMAP HERE */}
      <div className="px-4 sm:px-6 lg:px-8 mb-6">
        <RealtimeHeatmap 
          stocks={heatmapStocks}
          onStockClick={(stock) => setSelectedStock(stock)}
        />
      </div>
      
      {/* Rest of your app */}
      <StockTable />
      <PortfolioSection />
      {/* ... modals */}
    </div>
  );
}
```

---

## 🎨 Visual Features

### Color Coding
- **Dark Green** (`bg-green-600`): +5% or more
- **Green** (`bg-green-500`): +2% to +5%
- **Light Green** (`bg-green-400`): 0% to +2%
- **Yellow** (`bg-yellow-500`): 0% to -2%
- **Orange** (`bg-orange-500`): -2% to -5%
- **Red** (`bg-red-600`): -5% or worse

### Size Based on Market Cap
- **Extra Large** (w-32 h-20): >$100B
- **Large** (w-28 h-18): $10B - $100B
- **Medium** (w-24 h-16): $2B - $10B
- **Small** (w-20 h-14): <$2B

### Indicators
- **Green Dot**: Fresh data (updated within last 60 min)
- **Yellow Dot**: Stale data (>65 min old)

---

## 🔧 Features

1. **60-Minute Auto-Updates**: Polls each stock every hour
2. **Manual Refresh**: Button to force immediate update
3. **Stale Detection**: Warns when data is >65 minutes old
4. **Click to Details**: Click any tile to open stock modal
5. **Responsive Grid**: Adapts to screen size (6-12 columns)
6. **Hover Effects**: Scale up on hover with border highlight
7. **Freshness Indicator**: Shows time until next update

---

## 📊 Performance Impact

- **Minimal**: Only polls visible stocks (top 40 by market cap)
- **Efficient**: Uses existing `smartFetch` with caching
- **Controlled**: 60-minute intervals prevent API overuse
- **Smart**: Stops polling when component unmounts

---

## 🚀 Benefits

1. **Visual Overview**: See market at a glance
2. **Color-Coded**: Instantly identify winners/losers
3. **Size-Weighted**: Bigger tiles = bigger companies
4. **Real-Time Feel**: Updates automatically every hour
5. **Interactive**: Click to drill down into details

---

## 📝 Implementation Checklist

- [x] SmartPoller class added
- [ ] DataFreshnessIndicator component added
- [ ] RealtimeHeatmap component added
- [ ] Component integrated into main App
- [ ] Tested with real stock data
- [ ] Verified polling works
- [ ] Checked manual refresh
- [ ] Confirmed stale detection

---

## 🎯 Next Steps

1. **Find React Components Section**: Search for existing component definitions
2. **Add Components**: Copy the DataFreshnessIndicator and RealtimeHeatmap code
3. **Integrate in App**: Add the heatmap to your main App component
4. **Test**: Load the app and verify the heatmap appears
5. **Customize**: Adjust colors, sizes, or polling frequency as needed

---

## 💡 Tips

- The heatmap works best with 30-50 stocks
- Adjust `REFRESH_INTERVAL` if you want faster/slower updates
- Use `formatNumber` utility for volume display
- The component automatically cleans up polling on unmount

---

**Status**: ⚠️ **Partially Integrated**  
**Next**: Add React components to complete integration  
**Estimated Time**: 10-15 minutes
