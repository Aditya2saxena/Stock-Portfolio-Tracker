const express = require('express');
const router = express.Router();
const {
  getAlerts,
  createAlert,
  toggleAlert,
  updateAlert,
  deleteAlert,
} = require('../controllers/alertController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/', getAlerts);
router.post('/', createAlert);
router.patch('/:id/toggle', toggleAlert);
router.patch('/:id', updateAlert);
router.delete('/:id', deleteAlert);

module.exports = router;
