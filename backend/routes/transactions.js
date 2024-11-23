
const express = require('express');
const router = express.Router();
const {
  initializeDatabase,
  getTransactions,
  getStatistics,
  getBarChartData,
  getPieChartData,
  getCombinedData
} = require('../controllers/transactionController');
const validateMonth = (req, res, next) => {
  const month = req.query.month;
  const validMonths = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  if (!month || !validMonths.includes(month)) {
    return res.status(400).json({ error: 'Invalid month. Please provide a valid month name.' });
  }
  next();
};

router.get('/initialize-database', initializeDatabase);
router.get('/transactions', validateMonth, getTransactions);
router.get('/statistics', validateMonth, getStatistics);
router.get('/bar-chart', validateMonth, getBarChartData);
router.get('/pie-chart', validateMonth, getPieChartData);
router.get('/combined-data', validateMonth, getCombinedData);

module.exports = router;