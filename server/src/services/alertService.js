const PriceAlert = require('../models/PriceAlert');
const Notification = require('../models/Notification');
const { normalizeSymbol } = require('../utils/symbolNormalizer');

exports.checkPriceAlerts = async (stockData, io = null) => {
  if (!stockData || !stockData.symbol || !stockData.currentPrice || stockData.dataSource === 'demo') return;

  try {
    const normalizedInfo = normalizeSymbol(stockData.fullSymbol || stockData.symbol);
    const symbol = normalizedInfo.normalizedSymbol;
    const currentPrice = Number(stockData.currentPrice);

    // Find all active alerts for this symbol
    const activeAlerts = await PriceAlert.find({
      stockSymbol: { $in: [symbol, normalizedInfo.displaySymbol] },
      isActive: true,
    });

    if (activeAlerts.length === 0) return;

    for (const alert of activeAlerts) {
      let isTriggered = false;

      if (alert.condition === 'ABOVE' && currentPrice >= alert.targetPrice) {
        isTriggered = true;
      } else if (alert.condition === 'BELOW' && currentPrice <= alert.targetPrice) {
        isTriggered = true;
      }

      if (isTriggered) {
        alert.isActive = false;
        alert.triggeredAt = new Date();
        await alert.save();

        const title = `🔔 Price Alert Triggered: ${alert.stockSymbol}`;
        const currencySymbol = stockData.currency === 'INR' ? '₹' : '$';
        const message = `${alert.stockSymbol} is now ${currencySymbol}${currentPrice.toFixed(2)} (${alert.condition.toLowerCase()} target ${currencySymbol}${alert.targetPrice.toFixed(2)})`;

        // Create Notification Record
        const notification = await Notification.create({
          userId: alert.userId,
          type: 'PRICE_ALERT',
          title,
          message,
          metadata: {
            alertId: alert._id,
            stockSymbol: alert.stockSymbol,
            targetPrice: alert.targetPrice,
            currentPrice,
            condition: alert.condition,
            triggeredAt: alert.triggeredAt,
          },
        });

        // Broadcast Socket.io event if io instance provided
        if (io) {
          const payload = {
            notificationId: notification._id,
            userId: alert.userId,
            stockSymbol: alert.stockSymbol,
            targetPrice: alert.targetPrice,
            currentPrice,
            condition: alert.condition,
            triggeredAt: alert.triggeredAt,
            title,
            message,
          };
          io.to(`user:${alert.userId}`).emit('priceAlertTriggered', payload);
        }
      }
    }
  } catch (error) {
    console.error('Error checking price alerts:', error);
  }
};
