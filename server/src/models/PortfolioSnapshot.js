const mongoose = require('mongoose');

const portfolioSnapshotSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  totalsByCurrency: {
    type: mongoose.Schema.Types.Mixed,
    required: false,
    default: {},
  },
}, { timestamps: true }); // createdAt automatically time-stamp ka kaam karega

module.exports = mongoose.model('PortfolioSnapshot', portfolioSnapshotSchema);
