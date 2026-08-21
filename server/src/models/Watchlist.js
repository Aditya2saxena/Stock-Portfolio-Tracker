const mongoose = require('mongoose');

const watchlistSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  stockSymbol: {
    type: String,
    required: true,
    uppercase: true,
  },
}, { timestamps: true });

// Ek user same stock ko watchlist mein dobara add na kar sake
watchlistSchema.index({ userId: 1, stockSymbol: 1 }, { unique: true });

module.exports = mongoose.model('Watchlist', watchlistSchema);