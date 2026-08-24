const Booking = require('../models/Booking');

/**
 * Auto-complete expired bookings.
 * Finds all 'confirmed' bookings where date+endTime is in the past,
 * and transitions them to 'completed'.
 */
async function completeExpiredBookings() {
    try {
        const now = new Date();
        const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

        // Find confirmed bookings that have expired:
        // 1. Date is before today (any time), OR
        // 2. Date is today AND endTime <= current time
        const result = await Booking.updateMany(
            {
                status: 'confirmed',
                $or: [
                    { date: { $lt: todayStr } },
                    { date: todayStr, endTime: { $lte: currentTime } },
                ],
            },
            { $set: { status: 'completed' } }
        );

        if (result.modifiedCount > 0) {
            console.log(`✅ Slot completer: ${result.modifiedCount} booking(s) auto-completed`);
        }
    } catch (error) {
        console.error('❌ Slot completer error:', error.message);
    }
}

module.exports = { completeExpiredBookings };
