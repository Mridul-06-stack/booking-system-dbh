const Booking = require('../models/Booking');
const WashingMachine = require('../models/WashingMachine');
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
            return res.status(400).json({ success: false, message: 'Slots can only be viewed for today or tomorrow' });
        }

        // Get all confirmed bookings for this machine on this date
        const existingBookings = await Booking.find({
            machineId,
            date,
            status: 'confirmed',
        });

        const allSlots = generateSlots();
        const now = new Date();
        const { today: todayStr } = getBookableDates(now);
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();

        const slots = allSlots.map((slot) => {
            // Check if slot is already booked
            const isBooked = existingBookings.some(
                (b) => b.startTime === slot.startTime && b.endTime === slot.endTime
            );

            // Check if slot is in the past (for today)
            let isPast = false;
            if (date === todayStr) {
                const slotHour = parseInt(slot.startTime.split(':')[0], 10);
                if (slotHour <= currentHour) isPast = true;
            } else if (new Date(date + 'T00:00:00') < new Date(todayStr + 'T00:00:00')) {
                isPast = true;
            }

            return {
                ...slot,
                available: !isBooked && !isPast,
                isBooked,
                isPast,
            };
        });

        res.json({ success: true, slots });
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
            return res.status(400).json({ success: false, message: 'Bookings can only be made for today or tomorrow' });
        }

        // Rule 1: Email @nith.ac.in — already enforced at registration

        // Rule 4: Booking hours 06:00 – 22:00
        const startHour = parseInt(startTime.split(':')[0], 10);
        const endHour = parseInt(endTime.split(':')[0], 10);
        if (startHour < 6 || endHour > 22) {
            return res.status(400).json({ success: false, message: 'Bookings only allowed between 06:00 and 22:00' });
        }

        // Rule 5: Cannot book a slot that has already started
        const now = new Date();
        const slotDateTime = new Date(`${date}T${startTime}:00`);
        if (slotDateTime <= now) {
            return res.status(400).json({ success: false, message: 'Cannot book a slot that has already started' });
        }

        // Rule 2: Max 2 active bookings per week
        const weekStart = getWeekStart(date);
        const weekEnd = getWeekEnd(date);
        const weeklyCount = await Booking.countDocuments({
            studentId,
            status: 'confirmed',
            date: { $gte: weekStart, $lte: weekEnd },
        });
        if (weeklyCount >= 2) {
            return res.status(400).json({
                success: false,
                message: 'You have reached the maximum of 2 bookings this week',
            });
        }

        // Rule 3: No double-booking on same machine at same time
        const overlap = await Booking.findOne({
            machineId,
            date,
            startTime,
            endTime,
            status: 'confirmed',
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

        // Emit real-time event
        const io = req.app.get('io');
        if (io) io.emit('booking-created', populated);

        // Send mock email
        sendBookingEmail(req.student.email, 'created', {
            date,
            startTime,
            machineNumber: populated.machineId.machineNumber,
            hostel: populated.machineId.hostel
        });

        res.status(201).json({ success: true, booking: populated });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// PUT /api/bookings/:id/cancel — cancel a booking
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

        // Emit real-time event
        const io = req.app.get('io');
        if (io) io.emit('booking-cancelled', booking);

        // Send mock email
        const populatedCancel = await booking.populate([
            { path: 'machineId', select: 'machineNumber hostel' },
            { path: 'studentId', select: 'email' }
        ]);
        sendBookingEmail(populatedCancel.studentId.email, 'cancelled', {
            date: booking.date,
            startTime: booking.startTime,
            machineNumber: populatedCancel.machineId.machineNumber,
            hostel: populatedCancel.machineId.hostel
        });

        res.json({ success: true, booking });
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

// POST /api/bookings/:id/checkin — simulate scanning QR at machine
exports.checkIn = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
        if (booking.status !== 'confirmed') return res.status(400).json({ success: false, message: `Cannot check in. Status is ${booking.status}` });

        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];
        if (booking.date !== todayStr) return res.status(400).json({ success: false, message: 'You can only check in on the day of your booking' });

        booking.status = 'completed';
        booking.checkInTime = now;
        await booking.save();

        res.json({ success: true, message: 'Check-in successful!', booking });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
