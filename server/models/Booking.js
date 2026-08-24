const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
    {
        studentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Student',
            required: true,
        },
        machineId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'WashingMachine',
            required: true,
        },
        date: {
            type: String, // YYYY-MM-DD format
            required: true,
        },
        startTime: {
            type: String, // HH:mm format (24h)
            required: true,
        },
        endTime: {
            type: String, // HH:mm format (24h)
            required: true,
        },
        status: {
            type: String,
            enum: ['confirmed', 'cancelled', 'completed', 'no-show'],
            default: 'confirmed',
        },
        cancelledAt: {
            type: Date,
            default: null,
        },
    },
    { timestamps: true }
);

// Index for fast lookups: machine + date + time overlap checks (non-unique)
bookingSchema.index({ machineId: 1, date: 1, status: 1 });
// Index for student weekly booking count
bookingSchema.index({ studentId: 1, date: 1, status: 1 });
// Unique index to guarantee a slot is only booked once (confirmed bookings)
bookingSchema.index(
    { machineId: 1, date: 1, startTime: 1, endTime: 1, status: 1 },
    { unique: true, partialFilterExpression: { status: 'confirmed' } }
);

module.exports = mongoose.model('Booking', bookingSchema);
