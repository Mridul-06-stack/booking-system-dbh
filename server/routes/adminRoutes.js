const express = require('express');
const router = express.Router();
const { getAnalytics, getStudents, toggleStudentBlock } = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/analytics', protect, adminOnly, getAnalytics);
router.get('/students', protect, adminOnly, getStudents);
router.patch('/students/:id/block', protect, adminOnly, toggleStudentBlock);

module.exports = router;
