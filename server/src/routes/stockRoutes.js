const express = require('express');
const router = express.Router();
const { getStock, searchStocks } = require('../controllers/stockController');

// Search route must be defined before symbol param route
router.get('/search', searchStocks);
router.get('/:symbol', getStock);

module.exports = router;