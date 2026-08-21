const mongoose = require('mongoose');

const slotWaitlistSchema = new mongoose.Schema(
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
            type: String,
            required: true,
        },
        startTime: {
            type: String,
            required: true,
        },
        endTime: {
            type: String,
            required: true,
        },
        notified: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

// Prevent duplicate waitlist requests for same student & slot
slotWaitlistSchema.index({ studentId: 1, machineId: 1, date: 1, startTime: 1 }, { unique: true });

module.exports = mongoose.model('SlotWaitlist', slotWaitlistSchema);
