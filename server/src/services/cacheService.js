class CacheService {
  constructor() {
    this.quoteCache = new Map();
    this.historyCache = new Map();
    this.searchCache = new Map();

    // Default TTLs in milliseconds
    this.QUOTE_TTL = 60 * 1000;         // 60 seconds
    this.HISTORY_TTL = 15 * 60 * 1000;  // 15 minutes
    this.SEARCH_TTL = 60 * 60 * 1000;   // 1 hour
  }

  // Quote Cache Methods
  getQuote(symbol) {
    const entry = this.quoteCache.get(symbol);
    if (!entry) return null;

    const isFresh = (Date.now() - entry.timestamp) < this.QUOTE_TTL;
    return {
      data: entry.data,
      timestamp: entry.timestamp,
      isFresh,
    };
  }

  setQuote(symbol, data) {
    this.quoteCache.set(symbol, {
      data,
      timestamp: Date.now(),
    });
  }

  // History Cache Methods
  getHistory(symbol, range) {
    const key = `${symbol}:${range}`;
    const entry = this.historyCache.get(key);
    if (!entry) return null;

    const isFresh = (Date.now() - entry.timestamp) < this.HISTORY_TTL;
    return {
      data: entry.data,
      timestamp: entry.timestamp,
      isFresh,
    };
  }

  setHistory(symbol, range, data) {
    const key = `${symbol}:${range}`;
    this.historyCache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  // Search Cache Methods
  getSearch(query) {
    const entry = this.searchCache.get(query.toLowerCase());
    if (!entry) return null;

    const isFresh = (Date.now() - entry.timestamp) < this.SEARCH_TTL;
    return isFresh ? entry.data : null;
  }

  setSearch(query, data) {
    this.searchCache.set(query.toLowerCase(), {
      data,
      timestamp: Date.now(),
    });
  }

  clear() {
    this.quoteCache.clear();
    this.historyCache.clear();
    this.searchCache.clear();
  }
}

module.exports = new CacheService();
