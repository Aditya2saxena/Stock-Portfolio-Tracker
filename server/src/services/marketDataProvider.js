const YahooFinance = require('yahoo-finance2').default;
const axios = require('axios');

const yf = new YahooFinance({
  suppressNotices: ['yahooSurvey'],
});

/**
 * Yahoo Finance chart API fallback.
 *
 * yahoo-finance2 quote() can sometimes fail on hosted/cloud IPs
 * because Yahoo requires a crumb and may return HTTP 429.
 *
 * Chart API does not use the same quote() flow, so we use it
 * as a live quote fallback.
 */
const YAHOO_CHART_URL = 'https://query1.finance.yahoo.com/v8/finance/chart';

const YAHOO_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131.0.0.0 Safari/537.36',
  Accept: 'application/json',
};

/**
 * Calculates start date and interval based on history range.
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

/**
 * Convert Yahoo chart metadata into our common quote format.
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

  if (!result || !result.meta) {
    throw new Error(`Invalid Yahoo chart response for ${normalizedSymbol}`);
  }

  const meta = result.meta;

  const currentPrice =
    Number(
      meta.regularMarketPrice ??
        meta.postMarketPrice ??
        meta.preMarketPrice ??
        meta.previousClose
    );

  if (!Number.isFinite(currentPrice)) {
    throw new Error(`No valid price returned for ${normalizedSymbol}`);
  }

  const previousClose = Number(
    meta.previousClose ??
      meta.chartPreviousClose ??
      currentPrice
  );

  const change =
    Number.isFinite(meta.regularMarketPrice) &&
    Number.isFinite(previousClose)
      ? meta.regularMarketPrice - previousClose
      : 0;

  const percentChange =
    previousClose > 0
      ? (change / previousClose) * 100
      : 0;

  /**
   * Try to get today's OHLC values from chart data.
   */
  let open = currentPrice;
  let high = currentPrice;
  let low = currentPrice;
  let volume = 0;

  const chartResult = result;

  if (
    chartResult &&
    chartResult.timestamp &&
    chartResult.indicators &&
    chartResult.indicators.quote &&
    chartResult.indicators.quote[0]
  ) {
    const quoteData =
      chartResult.indicators.quote[0];

    const lastIndex =
      chartResult.timestamp.length - 1;

    const findLatestValid = (array) => {
      if (!Array.isArray(array)) {
        return null;
      }

      for (let i = array.length - 1; i >= 0; i -= 1) {
        if (
          array[i] !== null &&
          array[i] !== undefined &&
          Number.isFinite(Number(array[i]))
        ) {
          return Number(array[i]);
        }
      }

      return null;
    };

    const latestOpen = findLatestValid(quoteData.open);
    const latestHigh = findLatestValid(quoteData.high);
    const latestLow = findLatestValid(quoteData.low);
    const latestVolume = findLatestValid(quoteData.volume);

    if (latestOpen !== null) {
      open = latestOpen;
    }

    if (latestHigh !== null) {
      high = latestHigh;
    }

    if (latestLow !== null) {
      low = latestLow;
    }

    if (latestVolume !== null) {
      volume = latestVolume;
    }

    // Avoid unused-index warnings while keeping chart structure explicit.
    void lastIndex;
  }

  const marketState = String(
    meta.marketState || 'CLOSED'
  ).toUpperCase();

  let marketStatus = marketState;

  if (marketState === 'REGULAR') {
    marketStatus = 'OPEN';
  }

  return {
    symbol: displaySymbol,
    fullSymbol: normalizedSymbol,
    name:
      meta.longName ||
      meta.shortName ||
      displaySymbol,

    currentPrice: Number(currentPrice.toFixed(2)),

    change: Number(change.toFixed(2)),

    percentChange: Number(
      percentChange.toFixed(2)
    ),

    high: Number(high.toFixed(2)),

    low: Number(low.toFixed(2)),

    open: Number(open.toFixed(2)),

    previousClose: Number(
      previousClose.toFixed(2)
    ),

    volume: Number.isFinite(volume)
      ? Math.trunc(volume)
      : 0,

    currency:
      meta.currency ||
      currency ||
      (normalizedSymbol.endsWith('.NS')
        ? 'INR'
        : 'USD'),

    exchange:
      meta.exchangeName ||
      meta.fullExchangeName ||
      exchange,

    dataSource: 'live',

    timestamp: new Date().toISOString(),

    marketStatus,
  };
}

/**
 * Direct Yahoo Finance Chart API quote fallback.
 *
 * This bypasses yahoo-finance2 quote()/crumb flow.
 */
async function fetchQuoteFromYahooChart(
  normalizedInfo
) {
  const {
    normalizedSymbol,
  } = normalizedInfo;

  const url =
    `${YAHOO_CHART_URL}/` +
    encodeURIComponent(normalizedSymbol);

  const response = await axios.get(url, {
    headers: YAHOO_HEADERS,

    params: {
      range: '1d',
      interval: '5m',
      events: 'div,splits',
      includePrePost: true,
    },

    timeout: 10000,
  });

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

/**
 * Main Market Data Provider Abstraction Layer.
 */
class MarketDataProvider {
  /**
   * Fetches real live quote.
   *
   * Strategy:
   *
   * 1. yahoo-finance2 quote()
   * 2. Direct Yahoo Chart API
   * 3. Throw error so stockService can use cache/demo fallback
   */
  async fetchQuote(normalizedInfo) {
    const {
      normalizedSymbol,
      displaySymbol,
      currency,
      exchange,
    } = normalizedInfo;

    /**
     * ---------------------------------------------------------
     * METHOD 1: yahoo-finance2 quote()
     * ---------------------------------------------------------
     */
    try {
      const quote =
        await yf.quote(normalizedSymbol);

      if (
        !quote ||
        quote.regularMarketPrice === undefined ||
        quote.regularMarketPrice === null
      ) {
        throw new Error(
          `Invalid quote response for ${normalizedSymbol}`
        );
      }

      const currentPrice = parseFloat(
        quote.regularMarketPrice || 0
      );

      const previousClose = parseFloat(
        quote.regularMarketPreviousClose ||
          currentPrice
      );

      const change = parseFloat(
        quote.regularMarketChange ??
          (currentPrice - previousClose)
      );

      const percentChange = parseFloat(
        quote.regularMarketChangePercent ??
          (previousClose > 0
            ? (change / previousClose) * 100
            : 0)
      );

      const open = parseFloat(
        quote.regularMarketOpen ??
          currentPrice
      );

      const high = parseFloat(
        quote.regularMarketDayHigh ??
          currentPrice
      );

      const low = parseFloat(
        quote.regularMarketDayLow ??
          currentPrice
      );

      const volume = parseInt(
        quote.regularMarketVolume || 0,
        10
      );

      const name =
        quote.longName ||
        quote.shortName ||
        displaySymbol;

      const marketState = String(
        quote.marketState || 'CLOSED'
      ).toUpperCase();

      const marketStatus =
        marketState.includes('REGULAR')
          ? 'OPEN'
          : marketState;

      return {
        symbol: displaySymbol,

        fullSymbol: normalizedSymbol,

        name,

        currentPrice: Number(
          currentPrice.toFixed(2)
        ),

        change: Number(
          change.toFixed(2)
        ),

        percentChange: Number(
          percentChange.toFixed(2)
        ),

        high: Number(
          high.toFixed(2)
        ),

        low: Number(
          low.toFixed(2)
        ),

        open: Number(
          open.toFixed(2)
        ),

        previousClose: Number(
          previousClose.toFixed(2)
        ),

        volume,

        currency:
          quote.currency ||
          currency ||
          (normalizedSymbol.endsWith('.NS')
            ? 'INR'
            : 'USD'),

        exchange:
          quote.exchange ||
          exchange,

        dataSource: 'live',

        timestamp:
          new Date().toISOString(),

        marketStatus,
      };
    } catch (quoteError) {
      console.warn(
        `⚠️ yahoo-finance2 quote failed for ${normalizedSymbol}: ${quoteError.message}`
      );
    }

    /**
     * ---------------------------------------------------------
     * METHOD 2: Direct Yahoo Chart API
     * ---------------------------------------------------------
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

    /**
     * ---------------------------------------------------------
     * METHOD 3: Let stockService handle cache/demo/error
     * ---------------------------------------------------------
     */
    throw new Error(
      `All live Yahoo providers failed for ${normalizedSymbol}`
    );
  }

  /**
   * Fetch historical OHLC time series.
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
    } = getStartDateForRange(range);

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
        result.quotes.length === 0
      ) {
        return [];
      }

      return result.quotes
        .filter(
          (q) =>
            q.close !== null &&
            q.close !== undefined
        )
        .map((q) => {
          const dateObj =
            new Date(q.date);

          const timeStr =
            range === '1D' ||
            range === '1W'
              ? dateObj.toLocaleTimeString(
                  [],
                  {
                    hour: '2-digit',
                    minute: '2-digit',
                  }
                )
              : dateObj.toLocaleDateString(
                  [],
                  {
                    month: 'short',
                    day: 'numeric',
                  }
                );

          const close =
            Number(
              parseFloat(q.close).toFixed(2)
            );

          return {
            time: timeStr,

            date:
              dateObj.toISOString(),

            price: close,

            open:
              q.open !== null &&
              q.open !== undefined
                ? Number(
                    parseFloat(
                      q.open
                    ).toFixed(2)
                  )
                : close,

            high:
              q.high !== null &&
              q.high !== undefined
                ? Number(
                    parseFloat(
                      q.high
                    ).toFixed(2)
                  )
                : close,

            low:
              q.low !== null &&
              q.low !== undefined
                ? Number(
                    parseFloat(
                      q.low
                    ).toFixed(2)
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

  /**
   * Symbol Search.
   */
  async searchSymbols(query) {
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
              q.quoteType === 'EQUITY' ||
              q.isYahooFinance
            )
        )
        .slice(0, 10)
        .map((q) => {
          let displaySym =
            q.symbol;

          let market = 'US';

          let currency = 'USD';

          if (
            q.symbol.endsWith('.NS')
          ) {
            displaySym =
              q.symbol.replace(
                '.NS',
                ''
              );

            market = 'NSE';

            currency = 'INR';
          } else if (
            q.symbol.endsWith('.BSE') ||
            q.symbol.endsWith('.BO')
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

            market = 'BSE';

            currency = 'INR';
          }

          return {
            symbol: displaySym,

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
