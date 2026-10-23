const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const Portfolio = require('../models/Portfolio');
const { normalizeSymbol } = require('../utils/symbolNormalizer');

// Create Transaction (BUY / SELL)
exports.createTransaction = async (req, res) => {
  try {
    const { stockSymbol, type, quantity, price } = req.body;

    if (!stockSymbol) {
      return res.status(400).json({ message: 'Stock symbol is required' });
    }

    const symbolInfo = normalizeSymbol(stockSymbol);
    const symbol = symbolInfo.normalizedSymbol;
    if (!symbol || symbol.length > 24) {
      return res.status(400).json({ message: 'Provide a valid stock symbol' });
    }
    const qty = Number(quantity);
    const prc = Number(price);
    const txType = type ? type.toUpperCase() : 'BUY';

    if (!['BUY', 'SELL'].includes(txType)) {
      return res.status(400).json({ message: 'Transaction type must be BUY or SELL' });
    }

    if (isNaN(qty) || qty <= 0) {
      return res.status(400).json({ message: 'Quantity must be greater than 0' });
    }

    if (isNaN(prc) || prc < 0) {
      return res.status(400).json({ message: 'Price cannot be negative' });
    }

    const totalAmount = parseFloat((qty * prc).toFixed(2));
    const userId = req.user.id;

    // Keep the holding and immutable ledger entry in one atomic DB transaction.
    const session = await mongoose.startSession();
    let transaction;
    try {
      await session.withTransaction(async () => {
        if (txType === 'BUY') {
          const symbolMatches = [symbol, symbolInfo.displaySymbol];
          const existing = await Portfolio.findOne({ userId, stockSymbol: { $in: symbolMatches } }).session(session);
          if (existing) {
            existing.stockSymbol = symbol;
            const oldInvestment = existing.buyPrice * existing.quantity;
            const totalQuantity = existing.quantity + qty;
            existing.quantity = totalQuantity;
            existing.buyPrice = Number(((oldInvestment + prc * qty) / totalQuantity).toFixed(2));
            await existing.save({ session });
          } else {
            await Portfolio.create([{
              userId,
              stockSymbol: symbol,
              quantity: qty,
              buyPrice: prc,
            }], { session });
          }
        } else {
          const holding = await Portfolio.findOne({ userId, stockSymbol: { $in: [symbol, symbolInfo.displaySymbol] } }).session(session);
          if (!holding) {
            const error = new Error(`Cannot sell ${symbol}: stock does not exist in your portfolio`);
            error.statusCode = 400;
            throw error;
          }
          if (holding.quantity < qty) {
            const error = new Error(`Insufficient shares: you own ${holding.quantity} shares of ${symbol}, but tried to sell ${qty}`);
            error.statusCode = 400;
            throw error;
          }
          if (holding.quantity === qty) {
            await Portfolio.deleteOne({ _id: holding._id }, { session });
          } else {
            holding.stockSymbol = symbol;
            holding.quantity -= qty;
            await holding.save({ session });
          }
        }

        const [created] = await Transaction.create([{
          userId,
          stockSymbol: symbol,
          currency: symbolInfo.currency,
          type: txType,
          quantity: qty,
          price: prc,
          totalAmount,
        }], { session });
        transaction = created;
      });
    } finally {
      await session.endSession();
    }

    res.status(201).json({
      message: `${txType} transaction successful for ${symbol}`,
      transaction,
    });
  } catch (error) {
    console.error('Transaction creation error:', error);
    res.status(error.statusCode || 500).json({ message: error.message || 'Transaction failed' });
  }
};

// Get User's Transactions History
exports.getTransactions = async (req, res) => {
  try {
    const { type, stockSymbol, limit } = req.query;
    const filter = { userId: req.user.id };

    if (type && ['BUY', 'SELL'].includes(type.toUpperCase())) {
      filter.type = type.toUpperCase();
    }

    if (stockSymbol) {
      const normalized = normalizeSymbol(stockSymbol);
      filter.stockSymbol = { $in: [normalized.normalizedSymbol, normalized.displaySymbol] };
    }

    const query = Transaction.find(filter).sort({ createdAt: -1 });

    if (limit && !isNaN(Number(limit))) {
      query.limit(Number(limit));
    }

    const transactions = await query.exec();
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get Single Transaction
exports.getTransactionById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid transaction ID format' });
    }

    const transaction = await Transaction.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    res.json(transaction);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Transaction records are immutable; corrections should be represented by a new transaction.
