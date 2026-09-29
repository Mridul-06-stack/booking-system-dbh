const express = require('express');
const router = express.Router();
const {
    getAvailableSlots,
    createBooking,
    cancelBooking,
    getMyBookings,
    getAllBookings,
    subscribeWaitlist,
    unsubscribeWaitlist,
    checkInBooking,
} = require('../controllers/bookingController');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/slots', protect, getAvailableSlots);
router.post('/', protect, createBooking);
router.put('/:id/cancel', protect, cancelBooking);
router.get('/', protect, getMyBookings);
router.get('/all', protect, adminOnly, getAllBookings);
router.post('/:id/checkin', protect, adminOnly, checkInBooking);

// Waitlist routes
router.post('/waitlist', protect, subscribeWaitlist);
router.delete('/waitlist/:id', protect, unsubscribeWaitlist);

module.exports = router;
