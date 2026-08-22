const mongoose = require('mongoose');
const Portfolio = require('../models/Portfolio');
const { getStockPrice } = require('../services/stockService');
const PortfolioSnapshot = require('../models/PortfolioSnapshot');

// Add stock to portfolio
exports.addStock = async (req, res) => {
  try {
    const { stockSymbol, quantity, buyPrice } = req.body;
    const symbol = stockSymbol.toUpperCase().trim();

    // Check if stock already exists in user's portfolio
    const existing = await Portfolio.findOne({
      userId: req.user.id,
      stockSymbol: symbol,
    });

    if (existing) {
      // Calculate weighted average buy price
      const oldInvestment = existing.buyPrice * existing.quantity;
      const newInvestment = buyPrice * quantity;
      const totalQuantity = existing.quantity + Number(quantity);
      const avgBuyPrice = (oldInvestment + newInvestment) / totalQuantity;

      existing.quantity = totalQuantity;
      existing.buyPrice = parseFloat(avgBuyPrice.toFixed(2));
      await existing.save();

      return res.status(200).json({
        message: 'Existing holding updated (merged quantities)',
        portfolioItem: existing,
      });
    }

    // New holding creation
    const portfolioItem = await Portfolio.create({
      userId: req.user.id,
      stockSymbol: symbol,
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
    const portfolioItems = await Portfolio.find({
      userId: req.user.id,
    });

    const portfolioWithPL = await Promise.all(
      portfolioItems.map(async (item) => {
        try {
          const stockData = await getStockPrice(item.stockSymbol);
          const currentPrice = stockData.currentPrice;

          const investment = item.buyPrice * item.quantity;
          const currentValue = currentPrice * item.quantity;
          const profitLoss = currentValue - investment;

          const percentageReturn =
            investment > 0
              ? ((profitLoss / investment) * 100).toFixed(2)
              : '0.00';

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
            dataSource: stockData.dataSource || stockData.source || 'live',
          };
        } catch (error) {
          return {
            _id: item._id,
            stockSymbol: item.stockSymbol,
            quantity: item.quantity,
            buyPrice: item.buyPrice,
            currentPrice: null,
            investment: item.buyPrice * item.quantity,
            currentValue: 0,
            profitLoss: 0,
            percentageReturn: '0.00',
            dataSource: 'unavailable',
            error: 'Price data unavailable',
          };
        }
      })
    );

    res.json(portfolioWithPL);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// Update stock (quantity/buyPrice)
exports.updateStock = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid portfolio ID format' });
    }

    const { quantity, buyPrice } = req.body;

    const portfolioItem = await Portfolio.findOneAndUpdate(
      {
        _id: req.params.id,
        userId: req.user.id,
      },
      {
        quantity,
        buyPrice,
      },
      {
        new: true,
      }
    );

    if (!portfolioItem) {
      return res.status(404).json({
        message: 'Portfolio item not found',
      });
    }

    res.json(portfolioItem);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// Delete stock from portfolio
exports.deleteStock = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid portfolio ID format' });
    }

    const portfolioItem = await Portfolio.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!portfolioItem) {
      return res.status(404).json({
        message: 'Portfolio item not found',
      });
    }

    res.json({
      message: 'Stock removed from portfolio',
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// Snapshot save (throttled to 60s)
exports.saveSnapshot = async (req, res) => {
  try {
    const { totalInvestment, totalCurrentValue, totalProfitLoss } = req.body;

    const lastSnapshot = await PortfolioSnapshot.findOne({ userId: req.user.id }).sort({ createdAt: -1 });
    if (lastSnapshot) {
      const secondsSinceLastSnapshot = (Date.now() - lastSnapshot.createdAt.getTime()) / 1000;
      if (secondsSinceLastSnapshot < 60) {
        return res.status(200).json({ message: 'Skipped (too soon)', skipped: true });
      }
    }

    const snapshot = await PortfolioSnapshot.create({
      userId: req.user.id,
      totalInvestment,
      totalCurrentValue,
      totalProfitLoss,
    });

    res.status(201).json(snapshot);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Last 20 snapshots fetch
exports.getSnapshotHistory = async (req, res) => {
  try {
    const snapshots = await PortfolioSnapshot.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(20);

    const ordered = snapshots.reverse().map((s) => ({
      time: new Date(s.createdAt).toLocaleTimeString(),
      value: s.totalCurrentValue,
    }));

    res.json(ordered);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};