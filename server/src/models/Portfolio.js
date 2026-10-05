const mongoose = require('mongoose');

const portfolioSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  stockSymbol: {
    type: String,
    required: true,
    uppercase: true,
    trim: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  buyPrice: {
    type: Number,
    required: true,
    min: 0,
  },
}, { timestamps: true });

portfolioSchema.index({ userId: 1, stockSymbol: 1 }, { unique: true });

module.exports = mongoose.model('Portfolio', portfolioSchema);
