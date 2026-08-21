const express = require('express');
const router = express.Router();
const {
  addToWatchlist,
  getWatchlist,
  removeFromWatchlist,
} = require('../controllers/watchlistController');
const protect = require('../middleware/authMiddleware');

router.post('/', protect, addToWatchlist);
router.get('/', protect, getWatchlist);
router.delete('/:symbol', protect, removeFromWatchlist);

module.exports = router;