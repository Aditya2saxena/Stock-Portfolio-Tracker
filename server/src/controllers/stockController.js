const { getStockPrice, searchStocksService } = require('../services/stockService');

exports.getStock = async (req, res) => {
  try {
    const { symbol } = req.params;
    const stockData = await getStockPrice(symbol);

    if (stockData.currentPrice === 0) {
      return res.status(404).json({ message: 'Stock symbol not found' });
    }

    res.json(stockData);
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