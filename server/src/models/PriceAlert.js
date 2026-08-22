const mongoose = require('mongoose');

const priceAlertSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    stockSymbol: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    targetPrice: {
      type: Number,
      required: true,
      min: [0.01, 'Target price must be greater than 0'],
    },
    condition: {
      type: String,
      enum: ['ABOVE', 'BELOW'],
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    triggeredAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

priceAlertSchema.index({ userId: 1, isActive: 1 });
priceAlertSchema.index({ stockSymbol: 1, isActive: 1 });

module.exports = mongoose.model('PriceAlert', priceAlertSchema);
