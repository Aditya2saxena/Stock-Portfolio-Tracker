const axios = require('axios');

const BASE_URL = 'https://finnhub.io/api/v1';

exports.getStockPrice = async (symbol) => {
  try {
    const response = await axios.get(`${BASE_URL}/quote`, {
      params: {
        symbol: symbol.toUpperCase(),
        token: process.env.STOCK_API_KEY,
      },
    });

    const data = response.data;

    // Finnhub response: c = current price, d = change, dp = percent change
    return {
      symbol: symbol.toUpperCase(),
      currentPrice: data.c,
      change: data.d,
      percentChange: data.dp,
      high: data.h,
      low: data.l,
      open: data.o,
      previousClose: data.pc,
    };
  } catch (error) {
    throw new Error(`Failed to fetch stock data for ${symbol}: ${error.message}`);
  }
};