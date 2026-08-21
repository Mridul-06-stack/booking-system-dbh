const Booking = require('../models/Booking');
const Student = require('../models/Student');
const WashingMachine = require('../models/WashingMachine');
const SystemSettings = require('../models/SystemSettings');
const AllowedUser = require('../models/AllowedUser');

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

// GET /api/admin/settings
exports.getSettings = async (req, res) => {
    try {
        const settings = await SystemSettings.getSettings();
        res.json({ success: true, settings });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// PUT /api/admin/settings
exports.updateSettings = async (req, res) => {
    try {
        const {
            weeklyQuota,
            slotDurationMinutes,
            operatingStartHour,
            operatingEndHour,
            maxDailyBookingsPerStudent,
            requireAllowedList,
        } = req.body;

        let settings = await SystemSettings.getSettings();

        if (weeklyQuota !== undefined) settings.weeklyQuota = Number(weeklyQuota);
        if (slotDurationMinutes !== undefined) settings.slotDurationMinutes = Number(slotDurationMinutes);
        if (operatingStartHour !== undefined) settings.operatingStartHour = Number(operatingStartHour);
        if (operatingEndHour !== undefined) settings.operatingEndHour = Number(operatingEndHour);
        if (maxDailyBookingsPerStudent !== undefined) settings.maxDailyBookingsPerStudent = Number(maxDailyBookingsPerStudent);
        if (requireAllowedList !== undefined) settings.requireAllowedList = Boolean(requireAllowedList);

        await settings.save();
        res.json({ success: true, settings, message: 'System settings updated successfully' });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// GET /api/admin/allowed-users
exports.getAllowedUsers = async (req, res) => {
    try {
        const allowedUsers = await AllowedUser.find().sort({ createdAt: -1 });
        res.json({ success: true, count: allowedUsers.length, allowedUsers });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// POST /api/admin/allowed-users — single add
exports.addAllowedUser = async (req, res) => {
    try {
        const { email, rollNumber, name, hostel } = req.body;

        if (!email) {
            return res.status(400).json({ success: false, message: 'Email is required' });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const existing = await AllowedUser.findOne({ email: normalizedEmail });
        if (existing) {
            return res.status(400).json({ success: false, message: 'User email is already in the allowed list' });
        }

        const allowedUser = await AllowedUser.create({
            email: normalizedEmail,
            rollNumber: rollNumber ? rollNumber.toUpperCase().trim() : undefined,
            name: name ? name.trim() : undefined,
            hostel: hostel ? hostel.trim() : undefined,
            addedBy: req.student._id,
        });

        res.status(201).json({ success: true, allowedUser, message: 'Allowed user added successfully' });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// POST /api/admin/allowed-users/import — bulk CSV / JSON import
exports.importAllowedUsers = async (req, res) => {
    try {
        const { users } = req.body; // Expect array of { email, rollNumber, name, hostel }

        if (!Array.isArray(users) || users.length === 0) {
            return res.status(400).json({ success: false, message: 'Please provide a non-empty array of users' });
        }

        let addedCount = 0;
        let skippedCount = 0;
        const errors = [];

        for (const item of users) {
            if (!item.email || typeof item.email !== 'string') {
                skippedCount++;
                continue;
            }

            const email = item.email.toLowerCase().trim();
            const rollNumber = item.rollNumber ? String(item.rollNumber).toUpperCase().trim() : undefined;
            const name = item.name ? String(item.name).trim() : undefined;
            const hostel = item.hostel ? String(item.hostel).trim() : undefined;

            try {
                await AllowedUser.updateOne(
                    { email },
                    {
                        $setOnInsert: {
                            email,
                            rollNumber,
                            name,
                            hostel,
                            addedBy: req.student._id,
                        },
                    },
                    { upsert: true }
                );
                addedCount++;
            } catch (err) {
                skippedCount++;
                errors.push(`${email}: ${err.message}`);
            }
        }

        res.json({
            success: true,
            message: `Import processed: ${addedCount} added/updated, ${skippedCount} skipped.`,
            addedCount,
            skippedCount,
            errors,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// DELETE /api/admin/allowed-users/:id
exports.deleteAllowedUser = async (req, res) => {
    try {
        const allowedUser = await AllowedUser.findByIdAndDelete(req.params.id);
        if (!allowedUser) {
            return res.status(404).json({ success: false, message: 'Allowed user entry not found' });
        }
        res.json({ success: true, message: 'User removed from allowed list' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
