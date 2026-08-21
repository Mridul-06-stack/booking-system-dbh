const Booking = require('../models/Booking');
const WashingMachine = require('../models/WashingMachine');
const SystemSettings = require('../models/SystemSettings');
const SlotWaitlist = require('../models/SlotWaitlist');
const { generateSlots, getWeekStart, getWeekEnd } = require('../utils/slotGenerator');
const { sendBookingEmail } = require('../utils/notifications');
const { getBookableDates, isBookableDate } = require('../utils/bookingDates');

// GET /api/bookings/slots?machineId=...&date=YYYY-MM-DD
exports.getAvailableSlots = async (req, res) => {
    try {
        const { machineId, date } = req.query;
        if (!machineId || !date) {
            return res.status(400).json({ success: false, message: 'machineId and date are required' });
        }
        if (!isBookableDate(date)) {
            return res.status(400).json({ success: false, message: 'Slots can only be viewed for today' });
        }

        const settings = await SystemSettings.getSettings();

        // Get all confirmed/completed bookings for this machine on this date with student info
        const existingBookings = await Booking.find({
            machineId,
            date,
            status: { $ne: 'cancelled' },
        }).populate('studentId', 'name rollNumber hostel roomNumber');

        // Fetch active waitlist entries for current student
        const userWaitlists = await SlotWaitlist.find({
            studentId: req.student._id,
            machineId,
            date,
            notified: false,
        });

        const allSlots = generateSlots(
            settings.operatingStartHour,
            settings.operatingEndHour,
            settings.slotDurationMinutes
        );

        const now = new Date();
        const { today: todayStr } = getBookableDates(now);
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const currentTotalMinutes = currentHour * 60 + currentMinute;

        const slots = allSlots.map((slot) => {
            const bookingObj = existingBookings.find(
                (b) => b.startTime === slot.startTime && b.endTime === slot.endTime
            );

            const isWaitlisted = userWaitlists.some(
                (w) => w.startTime === slot.startTime && w.endTime === slot.endTime
            );

            let isPast = false;
            if (date === todayStr) {
                const [slotH, slotM] = slot.startTime.split(':').map(Number);
                const slotTotalMinutes = slotH * 60 + slotM;
                if (slotTotalMinutes <= currentTotalMinutes) isPast = true;
            } else if (new Date(date + 'T00:00:00') < new Date(todayStr + 'T00:00:00')) {
                isPast = true;
            }

            return {
                ...slot,
                available: !bookingObj && !isPast,
                isBooked: !!bookingObj,
                isWaitlisted,
                bookedBy: bookingObj ? {
                    _id: bookingObj.studentId?._id,
                    name: bookingObj.studentId?.name,
                    rollNumber: bookingObj.studentId?.rollNumber,
                    roomNumber: bookingObj.studentId?.roomNumber,
                    hostel: bookingObj.studentId?.hostel,
                } : null,
                bookingId: bookingObj ? bookingObj._id : null,
                isPast,
            };
        });

        res.json({ success: true, slots, settings });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// POST /api/bookings — create a booking
exports.createBooking = async (req, res) => {
    try {
        const { machineId, date, startTime, endTime } = req.body;
        const studentId = req.student._id;

        if (!isBookableDate(date)) {
            return res.status(400).json({ success: false, message: 'Bookings can only be made for today' });
        }

        const settings = await SystemSettings.getSettings();

        // Validate operating hours
        const [startH, startM] = startTime.split(':').map(Number);
        const [endH, endM] = endTime.split(':').map(Number);

        if (startH < settings.operatingStartHour || (endH > settings.operatingEndHour || (endH === settings.operatingEndHour && endM > 0))) {
            return res.status(400).json({
                success: false,
                message: `Bookings are only allowed between ${String(settings.operatingStartHour).padStart(2, '0')}:00 and ${String(settings.operatingEndHour).padStart(2, '0')}:00`,
            });
        }

        // Cannot book a slot in the past
        const now = new Date();
        const slotDateTime = new Date(`${date}T${startTime}:00`);
        if (slotDateTime <= now) {
            return res.status(400).json({ success: false, message: 'Cannot book a slot that has already started' });
        }

        // Check daily booking restriction: student cannot book multiple machines on the same day
        const existingDailyBooking = await Booking.findOne({
            studentId,
            status: { $ne: 'cancelled' },
            date,
        }).populate('machineId', 'machineNumber');

        if (existingDailyBooking) {
            const bookedMachineNo = existingDailyBooking.machineId?.machineNumber || '';
            return res.status(400).json({
                success: false,
                message: `You already have a slot reserved on ${date} (Machine M${bookedMachineNo} at ${existingDailyBooking.startTime}–${existingDailyBooking.endTime}). You cannot book another machine on the same day.`,
            });
        }

        // Check weekly quota
        const weekStart = getWeekStart(date);
        const weekEnd = getWeekEnd(date);
        const weeklyCount = await Booking.countDocuments({
            studentId,
            status: { $ne: 'cancelled' },
            date: { $gte: weekStart, $lte: weekEnd },
        });
        if (weeklyCount >= settings.weeklyQuota) {
            return res.status(400).json({
                success: false,
                message: `You have reached the maximum of ${settings.weeklyQuota} bookings this week`,
            });
        }

        // Check double-booking on same machine at same time
        const overlap = await Booking.findOne({
            machineId,
            date,
            startTime,
            endTime,
            status: { $ne: 'cancelled' },
        });
        if (overlap) {
            return res.status(409).json({ success: false, message: 'This slot is already booked' });
        }

        // Check machine exists and is available
        const machine = await WashingMachine.findById(machineId);
        if (!machine) {
            return res.status(404).json({ success: false, message: 'Machine not found' });
        }
        if (machine.status === 'maintenance') {
            return res.status(400).json({ success: false, message: 'Machine is under maintenance' });
        }

        // Create booking
        const booking = await Booking.create({
            studentId,
            machineId,
            date,
            startTime,
            endTime,
        });

        const populated = await booking.populate([
            { path: 'machineId', select: 'machineNumber hostel location' },
            { path: 'studentId', select: 'name email rollNumber' },
        ]);

        // Remove from waitlist if this student was waitlisted for this slot
        await SlotWaitlist.deleteMany({ studentId, machineId, date, startTime });

        // Emit real-time event
        const io = req.app.get('io');
        if (io) io.emit('booking-created', populated);

        // Send notification email
        sendBookingEmail(req.student.email, 'created', {
            date,
            startTime,
            machineNumber: populated.machineId.machineNumber,
            hostel: populated.machineId.hostel,
        });

        res.status(201).json({ success: true, booking: populated });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// PUT /api/bookings/:id/cancel — cancel a booking & notify waitlisted students
exports.cancelBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }

        // Only the booking owner or admin can cancel
        if (booking.studentId.toString() !== req.student._id.toString() && req.student.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Not authorized to cancel this booking' });
        }

        if (booking.status !== 'confirmed') {
            return res.status(400).json({ success: false, message: 'Booking is not active' });
        }

        // 30-min cutoff: cannot cancel if slot starts within 30 minutes
        const slotStart = new Date(`${booking.date}T${booking.startTime}:00`);
        const now = new Date();
        const diffMs = slotStart - now;
        if (diffMs < 30 * 60 * 1000 && diffMs > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot cancel within 30 minutes of slot start',
            });
        }

        booking.status = 'cancelled';
        booking.cancelledAt = new Date();
        await booking.save();

        const populatedCancel = await booking.populate([
            { path: 'machineId', select: 'machineNumber hostel' },
            { path: 'studentId', select: 'email' }
        ]);

        // Check waitlist for this slot and trigger instant alerts!
        const waitlistedEntries = await SlotWaitlist.find({
            machineId: booking.machineId,
            date: booking.date,
            startTime: booking.startTime,
            notified: false,
        }).populate('studentId', 'name email');

        for (const entry of waitlistedEntries) {
            if (entry.studentId && entry.studentId.email) {
                console.log(`\n🔔 [WAITLIST NOTIFICATION to ${entry.studentId.email}]\nSubject: Slot Opened! Machine M${populatedCancel.machineId.machineNumber}\nBody: The slot on ${booking.date} at ${booking.startTime} for Machine M${populatedCancel.machineId.machineNumber} is now OPEN. Log in to reserve it now!\n`);
                entry.notified = true;
                await entry.save();
            }
        }

        // Emit real-time socket event for cancellation and waitlist alert
        const io = req.app.get('io');
        if (io) {
            io.emit('booking-cancelled', booking);
            if (waitlistedEntries.length > 0) {
                io.emit('waitlist-slot-opened', {
                    machineId: booking.machineId,
                    date: booking.date,
                    startTime: booking.startTime,
                });
            }
        }

        // Send email to booking owner
        sendBookingEmail(populatedCancel.studentId.email, 'cancelled', {
            date: booking.date,
            startTime: booking.startTime,
            machineNumber: populatedCancel.machineId.machineNumber,
            hostel: populatedCancel.machineId.hostel
        });

        res.json({ success: true, booking, notifiedWaitlistCount: waitlistedEntries.length });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// POST /api/bookings/waitlist — subscribe to slot cancellation alert
exports.subscribeWaitlist = async (req, res) => {
    try {
        const { machineId, date, startTime, endTime } = req.body;
        const studentId = req.student._id;

        if (!machineId || !date || !startTime || !endTime) {
            return res.status(400).json({ success: false, message: 'All slot details are required' });
        }

        const existing = await SlotWaitlist.findOne({ studentId, machineId, date, startTime });
        if (existing) {
            return res.status(400).json({ success: false, message: 'You are already on the notification alert list for this slot' });
        }

        const waitlistEntry = await SlotWaitlist.create({
            studentId,
            machineId,
            date,
            startTime,
            endTime,
        });

        res.status(201).json({
            success: true,
            waitlistEntry,
            message: `Waitlist active! You will be instantly notified if slot ${startTime} opens up.`,
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// DELETE /api/bookings/waitlist/:id — remove waitlist alert
exports.unsubscribeWaitlist = async (req, res) => {
    try {
        await SlotWaitlist.findOneAndDelete({ _id: req.params.id, studentId: req.student._id });
        res.json({ success: true, message: 'Removed from slot waitlist alert' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// GET /api/bookings — get student's bookings
exports.getMyBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({ studentId: req.student._id })
            .populate('machineId', 'machineNumber hostel location')
            .sort({ date: -1, startTime: -1 });
        res.json({ success: true, bookings });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// GET /api/bookings/all — admin: get all bookings with filters
exports.getAllBookings = async (req, res) => {
    try {
        const filter = {};
        if (req.query.date) filter.date = req.query.date;
        if (req.query.status) filter.status = req.query.status;
        if (req.query.machineId) filter.machineId = req.query.machineId;

        const bookings = await Booking.find(filter)
            .populate('machineId', 'machineNumber hostel location')
            .populate('studentId', 'name email rollNumber hostel')
            .sort({ date: -1, startTime: -1 });

        res.json({ success: true, bookings });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
