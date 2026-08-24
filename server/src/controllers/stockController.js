const { getStockPrice, getHistoricalData, searchStocksService } = require('../services/stockService');

exports.getStock = async (req, res) => {
  try {
    const { symbol } = req.params;
    const stockData = await getStockPrice(symbol);

    if (stockData.dataSource === 'error' && stockData.currentPrice === 0) {
      return res.status(404).json({ message: stockData.error || `Stock symbol '${symbol}' not found` });
    }

    res.json(stockData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getStockHistory = async (req, res) => {
  try {
    const { symbol } = req.params;
    const { range = '1M' } = req.query;
    const history = await getHistoricalData(symbol, range);
    res.json(history);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.searchStocks = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.json([]);
    }
    const results = await searchStocksService(query);
    res.json(results);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};