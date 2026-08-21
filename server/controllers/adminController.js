const Booking = require('../models/Booking');
const Student = require('../models/Student');
const WashingMachine = require('../models/WashingMachine');

exports.getAnalytics = async (req, res) => {
    try {
        const totalStudents = await Student.countDocuments({ role: 'student' });
        const totalMachines = await WashingMachine.countDocuments();
        const totalBookings = await Booking.countDocuments();

        // Machine utilization grouped by status
        const machineStats = await WashingMachine.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        // Bookings by status
        const bookingStats = await Booking.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        // Peak hours (bookings grouped by start time)
        const peakHours = await Booking.aggregate([
            { $group: { _id: '$startTime', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);

        // Recent 5 bookings
        const recentBookings = await Booking.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('studentId', 'name rollNumber')
            .populate('machineId', 'machineNumber hostel');

        res.json({
            success: true,
            data: {
                totals: {
                    students: totalStudents,
                    machines: totalMachines,
                    bookings: totalBookings
                },
                machineStats,
                bookingStats,
                peakHours,
                recentBookings
            }
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getStudents = async (req, res) => {
    try {
        const students = await Student.find({ role: 'student' }).select('-passwordHash');
        res.json({ success: true, students });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.toggleStudentBlock = async (req, res) => {
    try {
        const student = await Student.findById(req.params.id);
        if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

        student.isBlocked = !student.isBlocked;
        await student.save();

        res.json({ success: true, student });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
