const express = require('express');
const router = express.Router();
const {
    getAvailableSlots,
    createBooking,
    cancelBooking,
    getMyBookings,
    getAllBookings,
    checkIn
} = require('../controllers/bookingController');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/slots', protect, getAvailableSlots);
router.post('/', protect, createBooking);
router.post('/:id/checkin', protect, checkIn);
router.put('/:id/cancel', protect, cancelBooking);
router.get('/', protect, getMyBookings);
router.get('/all', protect, adminOnly, getAllBookings);

module.exports = router;
