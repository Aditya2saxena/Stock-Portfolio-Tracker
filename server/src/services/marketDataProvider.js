const YahooFinance = require('yahoo-finance2').default;
const axios = require('axios');

const yf = new YahooFinance({
  suppressNotices: ['yahooSurvey'],
});

/*
|--------------------------------------------------------------------------
| Yahoo Chart API
|--------------------------------------------------------------------------
| Direct Chart API fallback avoids yahoo-finance2 crumb/429 issues.
|--------------------------------------------------------------------------
*/

const YAHOO_CHART_URL =
  'https://query1.finance.yahoo.com/v8/finance/chart';

const YAHOO_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131.0.0.0 Safari/537.36',
  Accept: 'application/json',
};

/*
|--------------------------------------------------------------------------
| Historical Range Configuration
|--------------------------------------------------------------------------
*/

function getStartDateForRange(range) {
  const now = new Date();

  switch (range.toUpperCase()) {
    case '1D':
      now.setDate(now.getDate() - 2);
      return {
        period1: now,
        interval: '5m',
      };

    case '1W':
      now.setDate(now.getDate() - 7);
      return {
        period1: now,
        interval: '15m',
      };

    case '1M':
      now.setMonth(now.getMonth() - 1);
      return {
        period1: now,
        interval: '1d',
      };

    case '3M':
      now.setMonth(now.getMonth() - 3);
      return {
        period1: now,
        interval: '1d',
      };

    case '6M':
      now.setMonth(now.getMonth() - 6);
      return {
        period1: now,
        interval: '1d',
      };

    case '1Y':
      now.setFullYear(now.getFullYear() - 1);
      return {
        period1: now,
        interval: '1d',
      };

    default:
      now.setMonth(now.getMonth() - 1);

      return {
        period1: now,
        interval: '1d',
      };
  }
}

/*
|--------------------------------------------------------------------------
| Number Helpers
|--------------------------------------------------------------------------
*/

function toNumber(value, fallback = null) {
  const number = Number(value);

  return Number.isFinite(number) ? number : fallback;
}

function round(value, decimals = 2) {
  const number = toNumber(value);

  if (number === null) {
    return 0;
  }

  return Number(number.toFixed(decimals));
}

/*
|--------------------------------------------------------------------------
| Determine Market Type
|--------------------------------------------------------------------------
*/

function isIndianMarket(normalizedInfo) {
  const {
    normalizedSymbol,
    exchange,
  } = normalizedInfo;

  const symbol = String(normalizedSymbol || '').toUpperCase();
  const market = String(exchange || '').toUpperCase();

  return (
    symbol.endsWith('.NS') ||
    symbol.endsWith('.BO') ||
    symbol.endsWith('.BSE') ||
    market === 'NSE' ||
    market === 'BSE' ||
    market === 'NSI'
  );
}

/*
|--------------------------------------------------------------------------
| Indian Market Status
|--------------------------------------------------------------------------
|
| NSE/BSE:
|
| Pre-open     09:00 - 09:15
| Regular      09:15 - 15:30
| Post-market  after 15:30
|
| For the application we expose:
|
| OPEN   = 09:15 - 15:30
| CLOSED = otherwise
|
|--------------------------------------------------------------------------
*/

function getIndianMarketStatus() {
  const now = new Date();

  const formatter = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(now);

  const values = {};

  parts.forEach(({ type, value }) => {
    values[type] = value;
  });

  const weekday = values.weekday;

  const hour = Number(values.hour);
  const minute = Number(values.minute);

  const totalMinutes =
    hour * 60 + minute;

  /*
   * Weekend
   */
  if (
    weekday === 'Sat' ||
    weekday === 'Sun'
  ) {
    return 'CLOSED';
  }

  /*
   * NSE/BSE regular market
   *
   * 09:15 <= time < 15:30
   */
  if (
    totalMinutes >= 9 * 60 + 15 &&
    totalMinutes < 15 * 60 + 30
  ) {
    return 'OPEN';
  }

  return 'CLOSED';
}

/*
|--------------------------------------------------------------------------
| US Market Status
|--------------------------------------------------------------------------
|
| Uses Yahoo market state when available.
| Additionally handles common Yahoo values.
|
|--------------------------------------------------------------------------
*/

function getUSMarketStatus(yahooMarketState) {
  const state = String(
    yahooMarketState || ''
  ).toUpperCase();

  if (
    state.includes('REGULAR') ||
    state === 'OPEN'
  ) {
    return 'OPEN';
  }

  if (
    state.includes('PRE') ||
    state.includes('PREMARKET')
  ) {
    return 'PRE';
  }

  if (
    state.includes('POST') ||
    state.includes('POSTMARKET')
  ) {
    return 'POST';
  }

  return 'CLOSED';
}

/*
|--------------------------------------------------------------------------
| Final Market Status
|--------------------------------------------------------------------------
*/

function getMarketStatus(
  normalizedInfo,
  yahooMarketState
) {
  if (isIndianMarket(normalizedInfo)) {
    /*
     * IMPORTANT:
     *
     * Do NOT trust Yahoo's marketState for NSE/BSE.
     * Hosted/server environments can receive stale CLOSED state.
     *
     * Instead calculate NSE/BSE status ourselves using IST.
     */
    return getIndianMarketStatus();
  }

  return getUSMarketStatus(
    yahooMarketState
  );
}

/*
|--------------------------------------------------------------------------
| Extract Latest Chart Price
|--------------------------------------------------------------------------
|
| Uses the newest valid close from Yahoo's chart data.
|
| This is important because meta.regularMarketPrice can sometimes
| be slightly stale compared with the newest 5-minute candle.
|
|--------------------------------------------------------------------------
*/

function getLatestChartValues(result) {
  const output = {
    currentPrice: null,
    open: null,
    high: null,
    low: null,
    volume: 0,
    timestamp: null,
  };

  if (
    !result ||
    !Array.isArray(result.timestamp) ||
    !result.indicators ||
    !Array.isArray(result.indicators.quote) ||
    !result.indicators.quote[0]
  ) {
    return output;
  }

  const timestamps =
    result.timestamp;

  const quoteData =
    result.indicators.quote[0];

  /*
   * Find latest valid close.
   */
  for (
    let i = timestamps.length - 1;
    i >= 0;
    i -= 1
  ) {
    const close =
      toNumber(
        quoteData.close?.[i]
      );

    if (close !== null) {
      output.currentPrice = close;

      output.timestamp =
        new Date(
          timestamps[i] * 1000
        ).toISOString();

      break;
    }
  }

  /*
   * Aggregate today's chart candles.
   *
   * This gives us a proper day's:
   *
   * Open
   * High
   * Low
   * Volume
   *
   * rather than taking the latest 5-minute candle's OHLC.
   */
  const today = new Date();

  const todayYear =
    today.getUTCFullYear();

  const todayMonth =
    today.getUTCMonth();

  const todayDate =
    today.getUTCDate();

  let firstOpen = null;
  let dayHigh = null;
  let dayLow = null;
  let totalVolume = 0;

  for (
    let i = 0;
    i < timestamps.length;
    i += 1
  ) {
    const timestamp =
      timestamps[i];

    const candleDate =
      new Date(timestamp * 1000);

    /*
     * We intentionally use UTC here because Yahoo timestamps
     * are returned as epoch timestamps and converted consistently.
     */
    if (
      candleDate.getUTCFullYear() !==
        todayYear ||
      candleDate.getUTCMonth() !==
        todayMonth ||
      candleDate.getUTCDate() !==
        todayDate
    ) {
      continue;
    }

    const open =
      toNumber(
        quoteData.open?.[i]
      );

    const high =
      toNumber(
        quoteData.high?.[i]
      );

    const low =
      toNumber(
        quoteData.low?.[i]
      );

    const volume =
      toNumber(
        quoteData.volume?.[i],
        0
      );

    if (
      firstOpen === null &&
      open !== null
    ) {
      firstOpen = open;
    }

    if (high !== null) {
      dayHigh =
        dayHigh === null
          ? high
          : Math.max(
              dayHigh,
              high
            );
    }

    if (low !== null) {
      dayLow =
        dayLow === null
          ? low
          : Math.min(
              dayLow,
              low
            );
    }

    totalVolume += volume;
  }

  /*
   * If today's aggregation isn't available,
   * fall back to latest candle.
   */
  if (
    firstOpen === null ||
    dayHigh === null ||
    dayLow === null
  ) {
    for (
      let i = timestamps.length - 1;
      i >= 0;
      i -= 1
    ) {
      const open =
        toNumber(
          quoteData.open?.[i]
        );

      const high =
        toNumber(
          quoteData.high?.[i]
        );

      const low =
        toNumber(
          quoteData.low?.[i]
        );

      if (
        firstOpen === null &&
        open !== null
      ) {
        firstOpen = open;
      }

      if (
        dayHigh === null &&
        high !== null
      ) {
        dayHigh = high;
      }

      if (
        dayLow === null &&
        low !== null
      ) {
        dayLow = low;
      }

      if (
        firstOpen !== null &&
        dayHigh !== null &&
        dayLow !== null
      ) {
        break;
      }
    }
  }

  output.open = firstOpen;
  output.high = dayHigh;
  output.low = dayLow;
  output.volume = totalVolume;

  return output;
}

/*
|--------------------------------------------------------------------------
| Build Quote From Yahoo Chart API
|--------------------------------------------------------------------------
*/

function buildQuoteFromChartResponse(
  result,
  normalizedInfo
) {
  const {
    normalizedSymbol,
    displaySymbol,
    currency,
    exchange,
  } = normalizedInfo;

  if (
    !result ||
    !result.meta
  ) {
    throw new Error(
      `Invalid Yahoo chart response for ${normalizedSymbol}`
    );
  }

  const meta =
    result.meta;

  const chartValues =
    getLatestChartValues(result);

  /*
   * IMPORTANT:
   *
   * Prefer latest chart close.
   *
   * Then fall back to Yahoo meta price.
   */
  const currentPrice =
    chartValues.currentPrice ??
    toNumber(
      meta.regularMarketPrice
    ) ??
    toNumber(
      meta.postMarketPrice
    ) ??
    toNumber(
      meta.preMarketPrice
    ) ??
    toNumber(
      meta.previousClose
    );

  if (
    currentPrice === null
  ) {
    throw new Error(
      `No valid price returned for ${normalizedSymbol}`
    );
  }

  const previousClose =
    toNumber(
      meta.previousClose
    ) ??
    toNumber(
      meta.chartPreviousClose
    ) ??
    currentPrice;

  const change =
    currentPrice -
    previousClose;

  const percentChange =
    previousClose > 0
      ? (change / previousClose) *
        100
      : 0;

  /*
   * Use chart values first.
   * Fall back to Yahoo metadata.
   */
  const open =
    chartValues.open ??
    toNumber(
      meta.regularMarketOpen
    ) ??
    currentPrice;

  const high =
    chartValues.high ??
    toNumber(
      meta.regularMarketDayHigh
    ) ??
    currentPrice;

  const low =
    chartValues.low ??
    toNumber(
      meta.regularMarketDayLow
    ) ??
    currentPrice;

  const volume =
    chartValues.volume > 0
      ? chartValues.volume
      : toNumber(
          meta.regularMarketVolume,
          0
        );

  const exchangeName =
    meta.exchangeName ||
    meta.fullExchangeName ||
    exchange;

  const yahooMarketState =
    String(
      meta.marketState ||
        ''
    ).toUpperCase();

  const marketStatus =
    getMarketStatus(
      normalizedInfo,
      yahooMarketState
    );

  return {
    symbol: displaySymbol,

    fullSymbol:
      normalizedSymbol,

    name:
      meta.longName ||
      meta.shortName ||
      displaySymbol,

    currentPrice:
      round(currentPrice),

    change:
      round(change),

    percentChange:
      round(percentChange),

    high:
      round(high),

    low:
      round(low),

    open:
      round(open),

    previousClose:
      round(previousClose),

    volume:
      Number.isFinite(volume)
        ? Math.trunc(volume)
        : 0,

    currency:
      meta.currency ||
      currency ||
      (
        normalizedSymbol.endsWith('.NS')
          ? 'INR'
          : 'USD'
      ),

    exchange:
      exchangeName,

    dataSource:
      'live',

    /*
     * Use chart timestamp if available.
     * Otherwise use server timestamp.
     */
    timestamp:
      chartValues.timestamp ||
      new Date().toISOString(),

    marketStatus,
  };
}

/*
|--------------------------------------------------------------------------
| Direct Yahoo Chart API
|--------------------------------------------------------------------------
*/

async function fetchQuoteFromYahooChart(
  normalizedInfo
) {
  const {
    normalizedSymbol,
  } = normalizedInfo;

  const url =
    `${YAHOO_CHART_URL}/` +
    encodeURIComponent(
      normalizedSymbol
    );

  const response =
    await axios.get(
      url,
      {
        headers:
          YAHOO_HEADERS,

        params: {
          range: '1d',
          interval: '5m',
          events: 'div,splits',
          includePrePost: true,
        },

        timeout: 10000,
      }
    );

  const chartResponse =
    response.data &&
    response.data.chart &&
    response.data.chart.result &&
    response.data.chart.result[0];

  if (!chartResponse) {
    throw new Error(
      `Yahoo Chart API returned no result for ${normalizedSymbol}`
    );
  }

  return buildQuoteFromChartResponse(
    chartResponse,
    normalizedInfo
  );
}

/*
|--------------------------------------------------------------------------
| Market Data Provider
|--------------------------------------------------------------------------
*/

class MarketDataProvider {
  /*
   * -----------------------------------------------------------------------
   * Fetch Live Quote
   * -----------------------------------------------------------------------
   *
   * Strategy:
   *
   * 1. yahoo-finance2 quote()
   * 2. Direct Yahoo Chart API
   * 3. stockService handles cache/demo
   *
   * -----------------------------------------------------------------------
   */

  async fetchQuote(
    normalizedInfo
  ) {
    const {
      normalizedSymbol,
      displaySymbol,
      currency,
      exchange,
    } = normalizedInfo;

    /*
     * ============================================================
     * METHOD 1
     * yahoo-finance2 quote()
     * ============================================================
     */

    try {
      const quote =
        await yf.quote(
          normalizedSymbol
        );

      if (
        !quote ||
        quote.regularMarketPrice ===
          undefined ||
        quote.regularMarketPrice ===
          null
      ) {
        throw new Error(
          `Invalid quote response for ${normalizedSymbol}`
        );
      }

      const currentPrice =
        toNumber(
          quote.regularMarketPrice
        );

      const previousClose =
        toNumber(
          quote.regularMarketPreviousClose,
          currentPrice
        );

      const change =
        toNumber(
          quote.regularMarketChange,
          currentPrice -
            previousClose
        );

      const percentChange =
        toNumber(
          quote.regularMarketChangePercent,
          previousClose > 0
            ? (
                change /
                previousClose
              ) * 100
            : 0
        );

      const open =
        toNumber(
          quote.regularMarketOpen,
          currentPrice
        );

      const high =
        toNumber(
          quote.regularMarketDayHigh,
          currentPrice
        );

      const low =
        toNumber(
          quote.regularMarketDayLow,
          currentPrice
        );

      const volume =
        parseInt(
          quote.regularMarketVolume ||
            0,
          10
        );

      const name =
        quote.longName ||
        quote.shortName ||
        displaySymbol;

      const exchangeName =
        quote.exchange ||
        exchange;

      const marketState =
        String(
          quote.marketState ||
            ''
        ).toUpperCase();

      /*
       * IMPORTANT:
       *
       * For Indian stocks we calculate status ourselves.
       */
      const marketStatus =
        getMarketStatus(
          normalizedInfo,
          marketState
        );

      return {
        symbol:
          displaySymbol,

        fullSymbol:
          normalizedSymbol,

        name,

        currentPrice:
          round(currentPrice),

        change:
          round(change),

        percentChange:
          round(percentChange),

        high:
          round(high),

        low:
          round(low),

        open:
          round(open),

        previousClose:
          round(previousClose),

        volume,

        currency:
          quote.currency ||
          currency ||
          (
            normalizedSymbol.endsWith(
              '.NS'
            )
              ? 'INR'
              : 'USD'
          ),

        exchange:
          exchangeName,

        dataSource:
          'live',

        timestamp:
          new Date().toISOString(),

        marketStatus,
      };
    } catch (quoteError) {
      console.warn(
        `⚠️ yahoo-finance2 quote failed for ${normalizedSymbol}: ${quoteError.message}`
      );
    }

    /*
     * ============================================================
     * METHOD 2
     * Direct Yahoo Chart API
     * ============================================================
     */

    try {
      console.log(
        `🔄 Trying Yahoo Chart API fallback for ${normalizedSymbol}...`
      );

      const chartQuote =
        await fetchQuoteFromYahooChart(
          normalizedInfo
        );

      console.log(
        `✅ Yahoo Chart API returned live data for ${normalizedSymbol}: ${chartQuote.currentPrice}`
      );

      return chartQuote;
    } catch (chartError) {
      console.warn(
        `⚠️ Yahoo Chart API fallback failed for ${normalizedSymbol}: ${chartError.message}`
      );
    }

    /*
     * ============================================================
     * METHOD 3
     * stockService handles cache/demo/error
     * ============================================================
     */

    throw new Error(
      `All live Yahoo providers failed for ${normalizedSymbol}`
    );
  }

  /*
   * -----------------------------------------------------------------------
   * Historical OHLC
   * -----------------------------------------------------------------------
   */

  async fetchHistoricalData(
    normalizedInfo,
    range = '1M'
  ) {
    const {
      normalizedSymbol,
    } = normalizedInfo;

    const {
      period1,
      interval,
    } =
      getStartDateForRange(
        range
      );

    try {
      const result =
        await yf.chart(
          normalizedSymbol,
          {
            period1,
            interval,
          }
        );

      if (
        !result ||
        !result.quotes ||
        result.quotes.length ===
          0
      ) {
        return [];
      }

      return result.quotes
        .filter(
          (q) =>
            q.close !==
              null &&
            q.close !==
              undefined
        )
        .map((q) => {
          const dateObj =
            new Date(
              q.date
            );

          const timeStr =
            range === '1D' ||
            range === '1W'
              ? dateObj.toLocaleTimeString(
                  [],
                  {
                    hour:
                      '2-digit',
                    minute:
                      '2-digit',
                  }
                )
              : dateObj.toLocaleDateString(
                  [],
                  {
                    month:
                      'short',
                    day:
                      'numeric',
                  }
                );

          const close =
            round(
              q.close
            );

          return {
            time:
              timeStr,

            date:
              dateObj.toISOString(),

            price:
              close,

            open:
              q.open !==
                  null &&
              q.open !==
                  undefined
                ? round(
                    q.open
                  )
                : close,

            high:
              q.high !==
                  null &&
              q.high !==
                  undefined
                ? round(
                    q.high
                  )
                : close,

            low:
              q.low !==
                  null &&
              q.low !==
                  undefined
                ? round(
                    q.low
                  )
                : close,

            close,

            volume:
              q.volume || 0,
          };
        });
    } catch (error) {
      console.warn(
        `⚠️ Historical data fetch failed for ${normalizedSymbol} (${range}): ${error.message}`
      );

      return [];
    }
  }

  /*
   * -----------------------------------------------------------------------
   * Symbol Search
   * -----------------------------------------------------------------------
   */

  async searchSymbols(
    query
  ) {
    if (
      !query ||
      query.trim() === ''
    ) {
      return [];
    }

    try {
      const searchRes =
        await yf.search(
          query.trim()
        );

      if (
        !searchRes ||
        !searchRes.quotes
      ) {
        return [];
      }

      return searchRes.quotes
        .filter(
          (q) =>
            q.symbol &&
            (
              q.quoteType ===
                'EQUITY' ||
              q.isYahooFinance
            )
        )
        .slice(0, 10)
        .map((q) => {
          let displaySym =
            q.symbol;

          let market =
            'US';

          let currency =
            'USD';

          if (
            q.symbol.endsWith(
              '.NS'
            )
          ) {
            displaySym =
              q.symbol.replace(
                '.NS',
                ''
              );

            market =
              'NSE';

            currency =
              'INR';
          } else if (
            q.symbol.endsWith(
              '.BSE'
            ) ||
            q.symbol.endsWith(
              '.BO'
            )
          ) {
            displaySym =
              q.symbol
                .replace(
                  '.BSE',
                  ''
                )
                .replace(
                  '.BO',
                  ''
                );

            market =
              'BSE';

            currency =
              'INR';
          }

          return {
            symbol:
              displaySym,

            fullSymbol:
              q.symbol,

            name:
              q.shortname ||
              q.longname ||
              displaySym,

            exchange:
              q.exchDisp ||
              q.exchange ||
              market,

            region:
              market === 'US'
                ? 'United States'
                : 'India',

            currency,
          };
        });
    } catch (error) {
      console.warn(
        `⚠️ Symbol search failed for '${query}': ${error.message}`
      );

      return [];
    }
  }
}

module.exports =
  new MarketDataProvider();
