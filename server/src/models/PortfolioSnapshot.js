const mongoose = require('mongoose');

const portfolioSnapshotSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  totalInvestment: {
    type: Number,
    required: true,
  },
  totalCurrentValue: {
    type: Number,
    required: true,
  },
  totalProfitLoss: {
    type: Number,
    required: true,
  },
}, { timestamps: true }); // createdAt automatically time-stamp ka kaam karega

module.exports = mongoose.model('PortfolioSnapshot', portfolioSnapshotSchema);