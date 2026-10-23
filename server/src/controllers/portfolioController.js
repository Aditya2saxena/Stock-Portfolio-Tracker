const mongoose = require('mongoose');
const Portfolio = require('../models/Portfolio');
const { getStockPrice } = require('../services/stockService');
const PortfolioSnapshot = require('../models/PortfolioSnapshot');
const { normalizeSymbol } = require('../utils/symbolNormalizer');

const parseHoldingInput = ({ stockSymbol, quantity, buyPrice }) => {
  const symbol = typeof stockSymbol === 'string' ? stockSymbol.toUpperCase().trim() : '';
  const parsedQuantity = Number(quantity);
  const parsedBuyPrice = Number(buyPrice);

  if (!symbol || symbol.length > 20 || !/^[A-Z0-9.^-]+$/.test(symbol)) {
    return { error: 'Provide a valid stock symbol (up to 20 characters)' };
  }
  if (!Number.isFinite(parsedQuantity) || parsedQuantity <= 0) {
    return { error: 'Quantity must be greater than 0' };
  }
  if (!Number.isFinite(parsedBuyPrice) || parsedBuyPrice < 0) {
    return { error: 'Buy price must be zero or greater' };
  }
  const normalizedSymbol = normalizeSymbol(symbol).normalizedSymbol;
  if (!normalizedSymbol) return { error: 'Provide a valid stock symbol' };
  return { symbol: normalizedSymbol, quantity: parsedQuantity, buyPrice: parsedBuyPrice };
};

// Add stock to portfolio
exports.addStock = async (req, res) => {
  try {
    const input = parseHoldingInput(req.body);
    if (input.error) return res.status(400).json({ message: input.error });
    const { symbol, quantity, buyPrice } = input;

    // Check if stock already exists in user's portfolio
    const existing = await Portfolio.findOne({
      userId: req.user.id,
      stockSymbol: { $in: [symbol, normalizeSymbol(symbol).displaySymbol] },
    });

    if (existing) {
      existing.stockSymbol = symbol;
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
      quantity: Number(quantity),
      buyPrice: Number(buyPrice),
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
          const investment = item.buyPrice * item.quantity;
          const quoteUnavailable = ['error', 'demo'].includes(stockData.dataSource) || !Number(stockData.currentPrice);
          const currentPrice = quoteUnavailable ? null : Number(stockData.currentPrice);
          if (quoteUnavailable) {
            return {
              _id: item._id,
              stockSymbol: item.stockSymbol,
              name: stockData.name || item.stockSymbol,
              quantity: item.quantity,
              buyPrice: item.buyPrice,
              currentPrice: null,
              change: 0,
              percentChange: 0,
              investment,
              currentValue: null,
              profitLoss: null,
              percentageReturn: null,
              currency: stockData.currency || (item.stockSymbol.endsWith('.NS') ? 'INR' : 'USD'),
              exchange: stockData.exchange || 'US',
              dataSource: stockData.dataSource || 'unavailable',
              lastUpdated: stockData.lastUpdated || stockData.timestamp,
              marketStatus: stockData.marketStatus || 'CLOSED',
              error: stockData.error || 'Price data unavailable',
            };
          }
          const currentValue = currentPrice * item.quantity;
          const profitLoss = currentValue - investment;

          const percentageReturn =
            investment > 0
              ? ((profitLoss / investment) * 100).toFixed(2)
              : '0.00';

        return {
            _id: item._id,
            stockSymbol: item.stockSymbol,
            name: stockData.name || item.stockSymbol,
            quantity: item.quantity,
            buyPrice: item.buyPrice,
            currentPrice,
            change: stockData.change || 0,
            percentChange: stockData.percentChange || 0,
            investment,
            currentValue,
            profitLoss,
            percentageReturn,
            currency: stockData.currency || (item.stockSymbol.endsWith('.NS') ? 'INR' : 'USD'),
            exchange: stockData.exchange || 'US',
            dataSource: stockData.dataSource || 'live',
            lastUpdated: stockData.lastUpdated || stockData.timestamp,
            marketStatus: stockData.marketStatus || 'CLOSED',
          };
        } catch (error) {
          return {
            _id: item._id,
            stockSymbol: item.stockSymbol,
            name: item.stockSymbol,
            quantity: item.quantity,
            buyPrice: item.buyPrice,
            currentPrice: null,
            change: 0,
            percentChange: 0,
            investment: item.buyPrice * item.quantity,
            currentValue: null,
            profitLoss: null,
            percentageReturn: null,
            currency: item.stockSymbol.endsWith('.NS') ? 'INR' : 'USD',
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

    const quantity = Number(req.body.quantity);
    const buyPrice = Number(req.body.buyPrice);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      return res.status(400).json({ message: 'Quantity must be greater than 0' });
    }
    if (!Number.isFinite(buyPrice) || buyPrice < 0) {
      return res.status(400).json({ message: 'Buy price must be zero or greater' });
    }

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
        runValidators: true,
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
    const lastSnapshot = await PortfolioSnapshot.findOne({ userId: req.user.id }).sort({ createdAt: -1 });
    if (lastSnapshot) {
      const secondsSinceLastSnapshot = (Date.now() - lastSnapshot.createdAt.getTime()) / 1000;
      if (secondsSinceLastSnapshot < 60) {
        return res.status(200).json({ message: 'Skipped (too soon)', skipped: true });
      }
    }

    const holdings = await Portfolio.find({ userId: req.user.id });
    const totalsByCurrency = {};
    await Promise.all(holdings.map(async (holding) => {
      const stock = await getStockPrice(holding.stockSymbol);
      if (!stock || ['error', 'demo'].includes(stock.dataSource) || !Number(stock.currentPrice)) return;
      const currency = stock.currency || (holding.stockSymbol.endsWith('.NS') ? 'INR' : 'USD');
      const bucket = totalsByCurrency[currency] || { investment: 0, currentValue: 0, profitLoss: 0 };
      const investment = holding.buyPrice * holding.quantity;
      const currentValue = Number(stock.currentPrice) * holding.quantity;
      bucket.investment += investment;
      bucket.currentValue += currentValue;
      bucket.profitLoss += currentValue - investment;
      totalsByCurrency[currency] = bucket;
    }));

    if (!Object.keys(totalsByCurrency).length) {
      return res.status(200).json({ message: 'Skipped: no priced holdings', skipped: true });
    }
    const snapshot = await PortfolioSnapshot.create({ userId: req.user.id, totalsByCurrency });

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
      date: s.createdAt,
      totalsByCurrency: s.totalsByCurrency || null,
    }));

    res.json(ordered);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
