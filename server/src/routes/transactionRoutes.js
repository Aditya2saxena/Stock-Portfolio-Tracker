const express = require('express');
const router = express.Router();
const {
  createTransaction,
  getTransactions,
  getTransactionById,
  deleteTransaction,
} = require('../controllers/transactionController');
const authMiddleware = require('../middleware/authMiddleware');

// Protect all transaction routes
router.use(authMiddleware);

router.get('/', getTransactions);
router.get('/:id', getTransactionById);
router.post('/', createTransaction);
router.delete('/:id', deleteTransaction);

module.exports = router;
