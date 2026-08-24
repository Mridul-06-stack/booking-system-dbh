const Booking = require('../models/Booking');
const SystemSettings = require('../models/SystemSettings');
const { getWeekStart, getWeekEnd } = require('../utils/slotGenerator');

// GET /api/dashboard/stats — weekly usage for current student
exports.getStats = async (req, res) => {
    try {
        const now = new Date();
        const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

        const weekStart = getWeekStart(today);
        const weekEnd = getWeekEnd(today);
        const settings = await SystemSettings.getSettings();

        // Count both 'confirmed' and 'completed' bookings towards weekly quota (exclude only 'cancelled')
        const weeklyBookings = await Booking.countDocuments({
            studentId: req.student._id,
            status: { $ne: 'cancelled' },
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
                weeklyQuota: settings.weeklyQuota,
                weeklyRemaining: Math.max(0, settings.weeklyQuota - weeklyBookings),
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

// GET /api/dashboard/upcoming — next upcoming bookings for logged-in student
exports.getUpcoming = async (req, res) => {
    try {
        const now = new Date();
        const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
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

// GET /api/dashboard/live-schedule — all student slot reservations in tabular format
exports.getLiveSchedule = async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];

        // Fetch non-cancelled bookings for today and onwards
        const schedule = await Booking.find({
            status: { $ne: 'cancelled' },
            date: { $gte: today },
        })
            .populate('studentId', 'name rollNumber hostel roomNumber email phone')
            .populate('machineId', 'machineNumber hostel location status')
            .sort({ date: 1, startTime: 1 });

        res.json({ success: true, count: schedule.length, schedule });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};



// GET /api/dashboard/history — past bookings for logged-in student
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
