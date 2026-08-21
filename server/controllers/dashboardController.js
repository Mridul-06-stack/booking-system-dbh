const Booking = require('../models/Booking');
const { getWeekStart, getWeekEnd } = require('../utils/slotGenerator');

// GET /api/dashboard/stats — weekly usage for current student
exports.getStats = async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const weekStart = getWeekStart(today);
        const weekEnd = getWeekEnd(today);

        const weeklyBookings = await Booking.countDocuments({
            studentId: req.student._id,
            status: 'confirmed',
            date: { $gte: weekStart, $lte: weekEnd },
        });

        const totalBookings = await Booking.countDocuments({
            studentId: req.student._id,
        });

        const completedBookings = await Booking.countDocuments({
            studentId: req.student._id,
            status: 'completed',
        });

        const cancelledBookings = await Booking.countDocuments({
            studentId: req.student._id,
            status: 'cancelled',
        });

        res.json({
            success: true,
            stats: {
                weeklyUsed: weeklyBookings,
                weeklyRemaining: Math.max(0, 2 - weeklyBookings),
                totalBookings,
                completedBookings,
                cancelledBookings,
                weekStart,
                weekEnd,
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// GET /api/dashboard/upcoming — next upcoming bookings
exports.getUpcoming = async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const bookings = await Booking.find({
            studentId: req.student._id,
            status: 'confirmed',
            date: { $gte: today },
        })
            .populate('machineId', 'machineNumber hostel location')
            .sort({ date: 1, startTime: 1 })
            .limit(5);

        res.json({ success: true, bookings });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// GET /api/dashboard/history — past bookings
exports.getHistory = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const bookings = await Booking.find({ studentId: req.student._id })
            .populate('machineId', 'machineNumber hostel location')
            .sort({ date: -1, startTime: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Booking.countDocuments({ studentId: req.student._id });

        res.json({
            success: true,
            bookings,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
