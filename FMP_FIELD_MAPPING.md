# 📊 FMP Data Field Mapping for Stock Screener Columns

## ✅ Data is Available

Based on the FMP API responses, all the data needed for the columns is available. Here's the exact field mapping:

---

## 🗺️ Column to FMP Field Mapping

### Stock Screener Columns

| Column Name | FMP API Field | Endpoint | Example Value |
|-------------|---------------|----------|---------------|
| **Symbol** | `symbol` | `/quote` | "AAPL" |
| **Price** | `price` | `/quote` | 175.50 |
| **Change** | `changesPercentage` | `/quote` | 1.44 |
| **P/E Ratio** | `peRatioTTM` | `/ratios-ttm` | 28.837 |
| **ROE** | `returnOnEquityTTM` | `/ratios-ttm` | 147.2 |
| **Revenue Growth** | `revenueGrowth` | `/financial-growth` | 15.3% |
| **Dividend Yield** | `dividendYieldTTM` | `/ratios-ttm` | 0.463% |
| **Market Cap** | `marketCap` | `/quote` | 2,750,000,000,000 |
| **Volume** | `volume` | `/quote` | 52,000,000 |
| **FMP Rating** | `rating` | `/rating` | "A+" |
| **Gross Margin** | `grossProfitMarginTTM` | `/ratios-ttm` | 0.463 (46.3%) |
| **Net Margin** | `netProfitMarginTTM` | `/ratios-ttm` | 0.269 (26.9%) |
| **Debt/Equity** | `debtEquityRatioTTM` | `/ratios-ttm` | 1.524 |

---

## 📋 Exact FMP Field Names

### From `/api/v3/quote/{symbol}`

```json
{
  "symbol": "AAPL",
  "price": 175.50,
  "changesPercentage": 1.44,
  "change": 2.50,
  "dayLow": 173.20,
  "dayHigh": 176.80,
  "yearLow": 124.17,
  "yearHigh": 199.62,
  "marketCap": 2750000000000,
  "volume": 52000000,
  "avgVolume": 58000000,
  "open": 174.00,
  "previousClose": 173.00,
  "eps": 6.15,
  "pe": 28.5
}
```

### From `/api/v3/key-metrics-ttm/{symbol}`

```json
{
  "revenuePerShareTTM": 24.32,
  "netIncomePerShareTTM": 6.15,
  "operatingCashFlowPerShareTTM": 7.68,
  "freeCashFlowPerShareTTM": 6.81,
  "cashPerShareTTM": 3.51,
  "bookValuePerShareTTM": 4.20,
  "tangibleBookValuePerShareTTM": 4.20,
  "shareholdersEquityPerShareTTM": 4.20,
  "interestDebtPerShareTTM": 6.48,
  "marketCapTTM": 2750000000000,
  "enterpriseValueTTM": 2820000000000,
  "peRatioTTM": 28.837,
  "priceToSalesRatioTTM": 7.21,
  "pocfratioTTM": 22.85,
  "pfcfRatioTTM": 25.79,
  "pbRatioTTM": 41.76,
  "ptbRatioTTM": 41.76,
  "evToSalesTTM": 7.37,
  "enterpriseValueOverEBITDATTM": 23.56,
  "evToOperatingCashFlowTTM": 23.36,
  "evToFreeCashFlowTTM": 26.40,
  "earningsYieldTTM": 0.0347,
  "freeCashFlowYieldTTM": 0.0388,
  "debtToEquityTTM": 1.524,
  "debtToAssetsTTM": 0.312,
  "netDebtToEBITDATTM": 0.584,
  "currentRatioTTM": 0.943,
  "interestCoverageTTM": 7.49,
  "incomeQualityTTM": 0.995,
  "dividendYieldTTM": 0.00463,
  "payoutRatioTTM": 0.163,
  "salesGeneralAndAdministrativeToRevenueTTM": 0.063,
  "researchAndDevelopmentToRevenueTTM": 0.088,
  "intangiblesToTotalAssetsTTM": 0.0,
  "capexToOperatingCashFlowTTM": 0.113,
  "capexToRevenueTTM": 0.032,
  "capexToDepreciationTTM": 1.163,
  "stockBasedCompensationToRevenueTTM": 0.026,
  "grahamNumberTTM": 86.18,
  "roicTTM": 0.554,
  "returnOnTangibleAssetsTTM": 0.678,
  "grahamNetNetTTM": -17.55,
  "workingCapitalTTM": -1760000000,
  "tangibleAssetValueTTM": 65790000000,
  "netCurrentAssetValueTTM": -176000000000,
  "investedCapitalTTM": 61830000000,
  "averageReceivablesTTM": 30500000000,
  "averagePayablesTTM": 65100000000,
  "averageInventoryTTM": 6520000000,
  "daysSalesOutstandingTTM": 63.01,
  "daysPayablesOutstandingTTM": 71.41,
  "daysOfInventoryOnHandTTM": 9.44,
  "receivablesTurnoverTTM": 5.79,
  "payablesTurnoverTTM": 5.11,
  "inventoryTurnoverTTM": 38.64,
  "roeTTM": 1.47,
  "capexPerShareTTM": -0.87
}
```

### From `/api/v3/ratios-ttm/{symbol}`

```json
{
  "dividendYielTTM": 0.00463,
  "dividendYielPercentageTTM": 0.463,
  "peRatioTTM": 28.837,
  "pegRatioTTM": 1.56,
  "payoutRatioTTM": 0.163,
  "currentRatioTTM": 0.943,
  "quickRatioTTM": 0.838,
  "cashRatioTTM": 0.202,
  "daysOfSalesOutstandingTTM": 63.01,
  "daysOfInventoryOutstandingTTM": 9.44,
  "operatingCycleTTM": 72.45,
  "daysOfPayablesOutstandingTTM": 71.41,
  "cashConversionCycleTTM": 1.04,
  "grossProfitMarginTTM": 0.463,
  "operatingProfitMarginTTM": 0.315,
  "pretaxProfitMarginTTM": 0.307,
  "netProfitMarginTTM": 0.269,
  "effectiveTaxRateTTM": 0.124,
  "returnOnAssetsTTM": 0.267,
  "returnOnEquityTTM": 1.47,
  "returnOnCapitalEmployedTTM": 0.554,
  "netIncomePerEBTTTM": 0.876,
  "ebtPerEbitTTM": 0.975,
  "ebitPerRevenueTTM": 0.315,
  "debtRatioTTM": 0.312,
  "debtEquityRatioTTM": 1.524,
  "longTermDebtToCapitalizationTTM": 0.551,
  "totalDebtToCapitalizationTTM": 0.604,
  "interestCoverageTTM": 7.49,
  "cashFlowToDebtRatioTTM": 0.885,
  "companyEquityMultiplierTTM": 5.49,
  "receivablesTurnoverTTM": 5.79,
  "payablesTurnoverTTM": 5.11,
  "inventoryTurnoverTTM": 38.64,
  "fixedAssetTurnoverTTM": 9.67,
  "assetTurnoverTTM": 0.995,
  "operatingCashFlowPerShareTTM": 7.68,
  "freeCashFlowPerShareTTM": 6.81,
  "cashPerShareTTM": 3.51,
  "operatingCashFlowSalesRatioTTM": 0.316,
  "freeCashFlowOperatingCashFlowRatioTTM": 0.887,
  "cashFlowCoverageRatiosTTM": 0.885,
  "shortTermCoverageRatiosTTM": 6.48,
  "capitalExpenditureCoverageRatioTTM": 8.83,
  "dividendPaidAndCapexCoverageRatioTTM": 5.67,
  "priceBookValueRatioTTM": 41.76,
  "priceToBookRatioTTM": 41.76,
  "priceToSalesRatioTTM": 7.21,
  "priceEarningsRatioTTM": 28.837,
  "priceToFreeCashFlowsRatioTTM": 25.79,
  "priceToOperatingCashFlowsRatioTTM": 22.85,
  "priceCashFlowRatioTTM": 22.85,
  "priceEarningsToGrowthRatioTTM": 1.56,
  "priceSalesRatioTTM": 7.21,
  "dividendYieldTTM": 0.00463,
  "enterpriseValueMultipleTTM": 23.56,
  "priceFairValueTTM": 41.76
}
```

---

## 🔢 Data Type Conversions

### Percentages (need to multiply by 100)

- `dividendYieldTTM`: 0.00463 → **0.463%**
- `grossProfitMarginTTM`: 0.463 → **46.3%**
- `netProfitMarginTTM`: 0.269 → **26.9%**
- `returnOnEquityTTM`: 1.47 → **147%**

### Large Numbers (need formatting)

- `marketCap`: 2750000000000 → **$2.75T**
- `volume`: 52000000 → **52.0M**

---

## 🎯 Frontend Implementation

### Step 1: Fetch Enriched Data

```javascript
async function fetchEnrichedStockData(symbols) {
  const response = await fetch('http://localhost:3002/api/quotes/batch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ symbols })
  });
  
  const stocks = await response.json();
  
  // Enrich each stock with FMP data
  const enrichedStocks = await Promise.all(
    stocks.map(async (stock) => {
      const [metricsRes, ratiosRes] = await Promise.all([
        fetch(`https://financialmodelingprep.com/api/v3/key-metrics-ttm/${stock.symbol}?apikey=${FMP_API_KEY}`),
        fetch(`https://financialmodelingprep.com/api/v3/ratios-ttm/${stock.symbol}?apikey=${FMP_API_KEY}`)
      ]);
      
      const metrics = await metricsRes.json();
      const ratios = await ratiosRes.json();
      
      return {
        ...stock,
        // Add metrics
        peRatio: metrics[0]?.peRatioTTM || stock.pe,
        roe: ratios[0]?.returnOnEquityTTM * 100, // Convert to percentage
        dividendYield: ratios[0]?.dividendYieldTTM * 100,
        grossMargin: ratios[0]?.grossProfitMarginTTM * 100,
        netMargin: ratios[0]?.netProfitMarginTTM * 100,
        debtToEquity: ratios[0]?.debtEquityRatioTTM
      };
    })
  );
  
  return enrichedStocks;
}
```

### Step 2: Display in Table

```javascript
function renderStockRow(stock) {
  return `
    <tr class="table-row">
      <td>${stock.symbol}</td>
      <td>$${stock.price.toFixed(2)}</td>
      <td class="${stock.changesPercentage >= 0 ? 'text-green-500' : 'text-red-500'}">
        ${stock.changesPercentage >= 0 ? '+' : ''}${stock.changesPercentage.toFixed(2)}%
      </td>
      <td>${stock.peRatio?.toFixed(2) || 'N/A'}</td>
      <td>${stock.roe?.toFixed(2) || 'N/A'}%</td>
      <td>${stock.dividendYield?.toFixed(2) || 'N/A'}%</td>
      <td>${formatMarketCap(stock.marketCap)}</td>
      <td>${formatVolume(stock.volume)}</td>
    </tr>
  `;
}
```

---

## ✅ Summary

**All data is available from FMP!** The columns are empty because:

1. ❌ Frontend isn't fetching the enriched data
2. ❌ Frontend isn't calling `/key-metrics-ttm` and `/ratios-ttm` endpoints
3. ❌ Frontend is using basic quote data only

**Solution**: Update frontend to fetch and display the enriched data using the field mappings above.

---

## 🚀 Quick Fix

Use the comprehensive endpoint I created:

```javascript
// Fetch all data in one call
const response = await fetch(`http://localhost:3002/api/stock/AAPL/comprehensive`);
const data = await response.json();

// Access all fields:
console.log('P/E:', data.fundamentals.metrics.peRatioTTM);
console.log('ROE:', data.fundamentals.ratios.returnOnEquityTTM * 100);
console.log('Dividend Yield:', data.fundamentals.ratios.dividendYieldTTM * 100);
```

**The data is there - it just needs to be displayed!** 📊
