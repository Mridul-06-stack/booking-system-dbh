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
} = require('../controllers/bookingController');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/slots', protect, getAvailableSlots);
router.post('/', protect, createBooking);
router.put('/:id/cancel', protect, cancelBooking);
router.get('/', protect, getMyBookings);
router.get('/all', protect, adminOnly, getAllBookings);

// Waitlist routes
router.post('/waitlist', protect, subscribeWaitlist);
router.delete('/waitlist/:id', protect, unsubscribeWaitlist);

module.exports = router;
