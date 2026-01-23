# 📊 Watchlist Configuration

## ✅ Watchlist-Only Mode Confirmed

The tournament is **already configured** to **ONLY evaluate stocks in the watchlist**. No additional stock screening is performed beyond the watchlist.

## 📋 Current Watchlist (60 stocks)

The tournament uses the default watchlist with 60 stocks across multiple sectors:

### Technology (20 stocks)
- AAPL, MSFT, GOOGL, AMZN, META, NVDA, TSLA, AMD, INTC, AVGO
- ORCL, CRM, ADBE, CSCO, ACN, IBM, TXN, QCOM, AMAT, ADI

### Financial Services (10 stocks)
- JPM, BAC, WFC, GS, MS, C, USB, PNC, TFC, COF

### Healthcare (10 stocks)
- UNH, JNJ, PFE, ABT, TMO, MRK, LLY, ABBV, BMY, AMGN

### Consumer (10 stocks)
- WMT, HD, NKE, MCD, SBUX, DIS, NFLX, CMCSA, COST, TGT

### Industrial (10 stocks)
- BA, CAT, GE, MMM, HON, UNP, UPS, RTX, LMT, DE

## 🔍 How It Works

1. **Tier 1 Screening**: The tournament runs technical analysis **only on watchlist stocks**
   - Line 2173: `screened = self.filter.tier1_technical_screen(self.cfg.WATCHLIST)`
   - This function filters the watchlist stocks based on technical indicators
   - Only stocks that pass the technical screen are analyzed by AI teams

2. **No External Screening**: The tournament does NOT:
   - Search for new stocks outside the watchlist
   - Screen the entire market
   - Add stocks dynamically

3. **Watchlist-Only Analysis**: All AI teams only receive stocks from the watchlist that pass technical screening

## ⚙️ Custom Watchlist

You can provide a custom watchlist file:

```powershell
python deepseek_python_20260119_ac400a.py --watchlist my_stocks.txt --days 1
```

Format for `my_stocks.txt`:
```
AAPL
MSFT
GOOGL
NVDA
TSLA
```

One stock symbol per line.

## 📈 Tournament Flow

```
Watchlist (60 stocks)
    ↓
Technical Screening (filters watchlist)
    ↓
AI Analysis (only on screened watchlist stocks)
    ↓
Review & Execution
```

## ✅ Confirmation

The tournament will **ONLY** evaluate stocks in your watchlist. This is the default behavior and requires no additional configuration.
