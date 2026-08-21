const Portfolio = require('../models/Portfolio');
const { getStockPrice } = require('../services/stockService');

// Add stock to portfolio
exports.addStock = async (req, res) => {
  try {
    const { stockSymbol, quantity, buyPrice } = req.body;

    const portfolioItem = await Portfolio.create({
      userId: req.user.id,
      stockSymbol,
      quantity,
      buyPrice,
    });

    res.status(201).json(portfolioItem);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get user's full portfolio (with live prices + P/L)
exports.getPortfolio = async (req, res) => {
  try {
    const portfolioItems = await Portfolio.find({ userId: req.user.id });

    // Har stock ke liye live price fetch karke P/L calculate karo
    const portfolioWithPL = await Promise.all(
      portfolioItems.map(async (item) => {
        const stockData = await getStockPrice(item.stockSymbol);
        const currentPrice = stockData.currentPrice;

        const investment = item.buyPrice * item.quantity;
        const currentValue = currentPrice * item.quantity;
        const profitLoss = currentValue - investment;
        const percentageReturn = ((profitLoss / investment) * 100).toFixed(2);

        return {
          _id: item._id,
          stockSymbol: item.stockSymbol,
          quantity: item.quantity,
          buyPrice: item.buyPrice,
          currentPrice,
          investment,
          currentValue,
          profitLoss,
          percentageReturn,
        };
      })
    );

    res.json(portfolioWithPL);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update stock (quantity/buyPrice)
exports.updateStock = async (req, res) => {
  try {
    const { quantity, buyPrice } = req.body;

    const portfolioItem = await Portfolio.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { quantity, buyPrice },
      { new: true }
    );

    if (!portfolioItem) {
      return res.status(404).json({ message: 'Portfolio item not found' });
    }

    res.json(portfolioItem);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete stock from portfolio
exports.deleteStock = async (req, res) => {
  try {
    const portfolioItem = await Portfolio.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!portfolioItem) {
      return res.status(404).json({ message: 'Portfolio item not found' });
    }

    res.json({ message: 'Stock removed from portfolio' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};