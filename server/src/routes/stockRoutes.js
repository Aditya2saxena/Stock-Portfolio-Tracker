const express = require('express');
const router = express.Router();
const { getStock, getStockHistory, searchStocks } = require('../controllers/stockController');

// Static routes must come before parametric routes
router.get('/search', searchStocks);
router.get('/:symbol/history', getStockHistory);
router.get('/:symbol', getStock);

module.exports = router;