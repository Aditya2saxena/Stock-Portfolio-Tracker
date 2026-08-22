const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const Portfolio = require('../models/Portfolio');

// Create Transaction (BUY / SELL)
exports.createTransaction = async (req, res) => {
  try {
    const { stockSymbol, type, quantity, price } = req.body;

    if (!stockSymbol) {
      return res.status(400).json({ message: 'Stock symbol is required' });
    }

    const symbol = stockSymbol.toUpperCase().trim();
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

    // Handle Portfolio update based on transaction type
    if (txType === 'BUY') {
      const existing = await Portfolio.findOne({ userId, stockSymbol: symbol });

      if (existing) {
        const oldInvestment = existing.buyPrice * existing.quantity;
        const newInvestment = prc * qty;
        const totalQuantity = existing.quantity + qty;
        const avgBuyPrice = parseFloat(((oldInvestment + newInvestment) / totalQuantity).toFixed(2));

        existing.quantity = totalQuantity;
        existing.buyPrice = avgBuyPrice;
        await existing.save();
      } else {
        await Portfolio.create({
          userId,
          stockSymbol: symbol,
          quantity: qty,
          buyPrice: prc,
        });
      }
    } else if (txType === 'SELL') {
      const holding = await Portfolio.findOne({ userId, stockSymbol: symbol });

      if (!holding) {
        return res.status(400).json({
          message: `Cannot sell ${symbol}: Stock does not exist in your portfolio`,
        });
      }

      if (holding.quantity < qty) {
        return res.status(400).json({
          message: `Insufficient shares: You own ${holding.quantity} shares of ${symbol}, but tried to sell ${qty}`,
        });
      }

      if (holding.quantity === qty) {
        await Portfolio.deleteOne({ _id: holding._id });
      } else {
        holding.quantity = holding.quantity - qty;
        await holding.save();
      }
    }

    // Record Transaction in Database
    const transaction = await Transaction.create({
      userId,
      stockSymbol: symbol,
      type: txType,
      quantity: qty,
      price: prc,
      totalAmount,
    });

    res.status(201).json({
      message: `${txType} transaction successful for ${symbol}`,
      transaction,
    });
  } catch (error) {
    console.error('Transaction creation error:', error);
    res.status(500).json({ message: error.message || 'Transaction failed' });
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
      filter.stockSymbol = stockSymbol.toUpperCase().trim();
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

// Delete Transaction
exports.deleteTransaction = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid transaction ID format' });
    }

    const transaction = await Transaction.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    res.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
