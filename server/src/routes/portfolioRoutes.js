const express = require('express');
const router = express.Router();
const {
  addStock,
  getPortfolio,
  updateStock,
  deleteStock,
} = require('../controllers/portfolioController');
const protect = require('../middleware/authMiddleware');

// Saare portfolio routes protected hain (login zaroori hai)
router.post('/', protect, addStock);
router.get('/', protect, getPortfolio);
router.put('/:id', protect, updateStock);
router.delete('/:id', protect, deleteStock);

module.exports = router;