const YahooFinance = require('yahoo-finance2').default;

const yf = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

/**
 * Calculates start date string/object based on history range option.
 */
function getStartDateForRange(range) {
  const now = new Date();
  switch (range.toUpperCase()) {
    case '1D':
      now.setDate(now.getDate() - 2);
      return { period1: now, interval: '5m' };
    case '1W':
      now.setDate(now.getDate() - 7);
      return { period1: now, interval: '15m' };
    case '1M':
      now.setMonth(now.getMonth() - 1);
      return { period1: now, interval: '1d' };
    case '3M':
      now.setMonth(now.getMonth() - 3);
      return { period1: now, interval: '1d' };
    case '6M':
      now.setMonth(now.getMonth() - 6);
      return { period1: now, interval: '1d' };
    case '1Y':
      now.setFullYear(now.getFullYear() - 1);
      return { period1: now, interval: '1d' };
    default:
      now.setMonth(now.getMonth() - 1);
      return { period1: now, interval: '1d' };
  }
}

/**
 * Main Market Data Provider Abstraction Layer
 */
class MarketDataProvider {
  /**
   * Fetches real live quote for a normalized symbol
   */
  async fetchQuote(normalizedInfo) {
    const { normalizedSymbol, displaySymbol, currency, exchange } = normalizedInfo;

    try {
      const quote = await yf.quote(normalizedSymbol);
      if (!quote || quote.regularMarketPrice === undefined) {
        throw new Error(`Invalid quote response for ${normalizedSymbol}`);
      }

      const currentPrice = parseFloat(quote.regularMarketPrice || 0);
      const previousClose = parseFloat(quote.regularMarketPreviousClose || currentPrice);
      const change = parseFloat(quote.regularMarketChange ?? (currentPrice - previousClose));
      const percentChange = parseFloat(quote.regularMarketChangePercent ?? (previousClose > 0 ? (change / previousClose) * 100 : 0));
      const open = parseFloat(quote.regularMarketOpen ?? currentPrice);
      const high = parseFloat(quote.regularMarketDayHigh ?? currentPrice);
      const low = parseFloat(quote.regularMarketDayLow ?? currentPrice);
      const volume = parseInt(quote.regularMarketVolume || 0, 10);
      const name = quote.longName || quote.shortName || displaySymbol;
      const marketState = (quote.marketState || 'CLOSED').toUpperCase();

      return {
        symbol: displaySymbol,
        fullSymbol: normalizedSymbol,
        name,
        currentPrice: Number(currentPrice.toFixed(2)),
        change: Number(change.toFixed(2)),
        percentChange: Number(percentChange.toFixed(2)),
        high: Number(high.toFixed(2)),
        low: Number(low.toFixed(2)),
        open: Number(open.toFixed(2)),
        previousClose: Number(previousClose.toFixed(2)),
        volume,
        currency: quote.currency || currency || (normalizedSymbol.endsWith('.NS') ? 'INR' : 'USD'),
        exchange: quote.exchange || exchange,
        dataSource: 'live',
        timestamp: new Date().toISOString(),
        marketStatus: marketState.includes('REGULAR') ? 'OPEN' : marketState,
      };
    } catch (error) {
      console.warn(`⚠️ External provider fetch failed for ${normalizedSymbol}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Fetches historical OHLC time series data for charts
   */
  async fetchHistoricalData(normalizedInfo, range = '1M') {
    const { normalizedSymbol, displaySymbol } = normalizedInfo;
    const { period1, interval } = getStartDateForRange(range);

    try {
      const result = await yf.chart(normalizedSymbol, { period1, interval });
      if (!result || !result.quotes || result.quotes.length === 0) {
        return [];
      }

      return result.quotes
        .filter((q) => q.close !== null && q.close !== undefined)
        .map((q) => {
          const dateObj = new Date(q.date);
          const timeStr = range === '1D' || range === '1W'
            ? dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : dateObj.toLocaleDateString([], { month: 'short', day: 'numeric' });

          return {
            time: timeStr,
            date: dateObj.toISOString(),
            price: Number(parseFloat(q.close).toFixed(2)),
            open: q.open ? Number(parseFloat(q.open).toFixed(2)) : Number(parseFloat(q.close).toFixed(2)),
            high: q.high ? Number(parseFloat(q.high).toFixed(2)) : Number(parseFloat(q.close).toFixed(2)),
            low: q.low ? Number(parseFloat(q.low).toFixed(2)) : Number(parseFloat(q.close).toFixed(2)),
            close: Number(parseFloat(q.close).toFixed(2)),
            volume: q.volume || 0,
          };
        });
    } catch (error) {
      console.warn(`⚠️ Historical data fetch failed for ${normalizedSymbol} (${range}): ${error.message}`);
      return [];
    }
  }

  /**
   * Symbol Search
   */
  async searchSymbols(query) {
    if (!query || query.trim() === '') return [];

    try {
      const searchRes = await yf.search(query.trim());
      if (!searchRes || !searchRes.quotes) return [];

      return searchRes.quotes
        .filter((q) => q.symbol && (q.quoteType === 'EQUITY' || q.isYahooFinance))
        .slice(0, 10)
        .map((q) => {
          let displaySym = q.symbol;
          let market = 'US';
          let currency = 'USD';

          if (q.symbol.endsWith('.NS')) {
            displaySym = q.symbol.replace('.NS', '');
            market = 'NSE';
            currency = 'INR';
          } else if (q.symbol.endsWith('.BSE') || q.symbol.endsWith('.BO')) {
            displaySym = q.symbol.replace('.BSE', '').replace('.BO', '');
            market = 'BSE';
            currency = 'INR';
          }

          return {
            symbol: displaySym,
            fullSymbol: q.symbol,
            name: q.shortname || q.longname || displaySym,
            exchange: q.exchDisp || q.exchange || market,
            region: market === 'US' ? 'United States' : 'India',
            currency,
          };
        });
    } catch (error) {
      console.warn(`⚠️ Symbol search failed for '${query}': ${error.message}`);
      return [];
    }
  }
}

module.exports = new MarketDataProvider();
