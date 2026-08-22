const mongoose = require('mongoose');
const PriceAlert = require('../models/PriceAlert');
const { getStockPrice } = require('../services/stockService');
const { checkPriceAlerts } = require('../services/alertService');

// Get all alerts for authenticated user
exports.getAlerts = async (req, res) => {
  try {
    const alerts = await PriceAlert.find({ userId: req.user.id }).sort({ createdAt: -1 });

    // Attach latest stock price for display
    const alertsWithPrice = await Promise.all(
      alerts.map(async (alert) => {
        let currentPrice = null;
        try {
          const stock = await getStockPrice(alert.stockSymbol);
          currentPrice = stock.currentPrice;
        } catch (e) {
          currentPrice = null;
        }
        return {
          ...alert.toObject(),
          currentPrice,
        };
      })
    );

    res.json(alertsWithPrice);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create new price alert
exports.createAlert = async (req, res) => {
  try {
    const { stockSymbol, targetPrice, condition } = req.body;

    if (!stockSymbol) {
      return res.status(400).json({ success: false, message: 'Stock symbol is required' });
    }

    const symbol = stockSymbol.toUpperCase().trim();
    const target = Number(targetPrice);
    const cond = condition ? condition.toUpperCase() : 'ABOVE';

    if (isNaN(target) || target <= 0) {
      return res.status(400).json({ success: false, message: 'Target price must be greater than 0' });
    }

    if (!['ABOVE', 'BELOW'].includes(cond)) {
      return res.status(400).json({ success: false, message: 'Condition must be ABOVE or BELOW' });
    }

    const alert = await PriceAlert.create({
      userId: req.user.id,
      stockSymbol: symbol,
      targetPrice: target,
      condition: cond,
      isActive: true,
    });

    // Check immediately against current stock price
    try {
      const stockData = await getStockPrice(symbol);
      if (req.app.get('io')) {
        await checkPriceAlerts(stockData, req.app.get('io'));
      }
    } catch (e) {
      // Ignore stock price fetch errors on alert creation
    }

    res.status(201).json({
      success: true,
      message: `Alert created for ${symbol} when price goes ${cond} ₹${target}`,
      alert,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Toggle alert active state
exports.toggleAlert = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid alert ID format' });
    }

    const alert = await PriceAlert.findOne({ _id: req.params.id, userId: req.user.id });

    if (!alert) {
      return res.status(404).json({ success: false, message: 'Price alert not found' });
    }

    alert.isActive = !alert.isActive;
    await alert.save();

    res.json({
      success: true,
      message: `Alert ${alert.isActive ? 'activated' : 'deactivated'}`,
      alert,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update alert
exports.updateAlert = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid alert ID format' });
    }

    const { targetPrice, condition } = req.body;
    const alert = await PriceAlert.findOne({ _id: req.params.id, userId: req.user.id });

    if (!alert) {
      return res.status(404).json({ success: false, message: 'Price alert not found' });
    }

    if (targetPrice) alert.targetPrice = Number(targetPrice);
    if (condition && ['ABOVE', 'BELOW'].includes(condition.toUpperCase())) {
      alert.condition = condition.toUpperCase();
    }
    alert.isActive = true;
    alert.triggeredAt = null;

    await alert.save();
    res.json({ success: true, message: 'Alert updated successfully', alert });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete price alert
exports.deleteAlert = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid alert ID format' });
    }

    const alert = await PriceAlert.findOneAndDelete({ _id: req.params.id, userId: req.user.id });

    if (!alert) {
      return res.status(404).json({ success: false, message: 'Price alert not found' });
    }

    res.json({ success: true, message: 'Price alert deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
