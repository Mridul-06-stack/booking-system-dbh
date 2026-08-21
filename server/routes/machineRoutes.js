const express = require('express');
const router = express.Router();
const {
    getMachines,
    createMachine,
    updateMachine,
    deleteMachine,
    toggleStatus,
} = require('../controllers/machineController');
const { protect, adminOnly } = require('../middleware/auth');

// Public: list machines
router.get('/', protect, getMachines);

// Admin only
router.post('/', protect, adminOnly, createMachine);
router.put('/:id', protect, adminOnly, updateMachine);
router.delete('/:id', protect, adminOnly, deleteMachine);
router.patch('/:id/status', protect, adminOnly, toggleStatus);

module.exports = router;
