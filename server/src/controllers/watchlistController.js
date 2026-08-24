const Watchlist = require('../models/Watchlist');
const { getStockPrice } = require('../services/stockService');

// Add stock to watchlist
exports.addToWatchlist = async (req, res) => {
  try {
    const { stockSymbol } = req.body;

    const exists = await Watchlist.findOne({
      userId: req.user.id,
      stockSymbol: stockSymbol.toUpperCase(),
    });

    if (exists) {
      return res.status(400).json({ message: 'Stock already in watchlist' });
    }

    const watchlistItem = await Watchlist.create({
      userId: req.user.id,
      stockSymbol: stockSymbol.toUpperCase(),
    });

    res.status(201).json(watchlistItem);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get watchlist with live prices
exports.getWatchlist = async (req, res) => {
  try {
    const watchlistItems = await Watchlist.find({ userId: req.user.id });

    const watchlistWithPrices = await Promise.all(
      watchlistItems.map(async (item) => {
        try {
          const stockData = await getStockPrice(item.stockSymbol);
          return {
            _id: item._id,
            stockSymbol: item.stockSymbol,
            name: stockData.name || item.stockSymbol,
            currentPrice: stockData.currentPrice,
            change: stockData.change,
            percentChange: stockData.percentChange,
            currency: stockData.currency || 'USD',
            exchange: stockData.exchange || 'US',
            dataSource: stockData.dataSource,
            marketStatus: stockData.marketStatus || 'CLOSED',
          };
        } catch (error) {
          return {
            _id: item._id,
            stockSymbol: item.stockSymbol,
            name: item.stockSymbol,
            currentPrice: null,
            change: null,
            percentChange: null,
            currency: 'USD',
            dataSource: 'unavailable',
            error: 'Price data unavailable',
          };
        }
      })
    );

    res.json(watchlistWithPrices);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Remove stock from watchlist
exports.removeFromWatchlist = async (req, res) => {
  try {
    const watchlistItem = await Watchlist.findOneAndDelete({
      userId: req.user.id,
      stockSymbol: req.params.symbol.toUpperCase(),
    });

    if (!watchlistItem) {
      return res.status(404).json({ message: 'Stock not found in watchlist' });
    }

    res.json({ message: 'Stock removed from watchlist' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};