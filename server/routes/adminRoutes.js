const express = require('express');
const router = express.Router();
const {
    getAnalytics,
    getStudents,
    toggleStudentBlock,
    getSettings,
    updateSettings,
    getAllowedUsers,
    addAllowedUser,
    importAllowedUsers,
    deleteAllowedUser,
} = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/analytics', protect, adminOnly, getAnalytics);
router.get('/students', protect, adminOnly, getStudents);
router.patch('/students/:id/block', protect, adminOnly, toggleStudentBlock);

// Settings routes
router.get('/settings', protect, adminOnly, getSettings);
router.put('/settings', protect, adminOnly, updateSettings);

// Allowed Users routes
router.get('/allowed-users', protect, adminOnly, getAllowedUsers);
router.post('/allowed-users', protect, adminOnly, addAllowedUser);
router.post('/allowed-users/import', protect, adminOnly, importAllowedUsers);
router.delete('/allowed-users/:id', protect, adminOnly, deleteAllowedUser);

module.exports = router;
