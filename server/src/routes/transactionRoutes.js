const express = require('express');
const router = express.Router();
const {
  createTransaction,
  getTransactions,
  getTransactionById,
} = require('../controllers/transactionController');
const authMiddleware = require('../middleware/authMiddleware');

// Protect all transaction routes
router.use(authMiddleware);

router.get('/', getTransactions);
router.get('/:id', getTransactionById);
router.post('/', createTransaction);
router.delete('/:id', (req, res) => res.status(405).json({
  message: 'Transaction records are immutable. Create a correcting transaction instead.',
}));

module.exports = router;
