const express = require('express');
const router = express.Router();
const { getStats, getUpcoming, getLiveSchedule, getHistory } = require('../controllers/dashboardController');
const { protect } = require('../middleware/auth');

router.get('/stats', protect, getStats);
router.get('/upcoming', protect, getUpcoming);
router.get('/live-schedule', protect, getLiveSchedule);

router.get('/history', protect, getHistory);

module.exports = router;
