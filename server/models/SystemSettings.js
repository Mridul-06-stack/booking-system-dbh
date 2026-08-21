const mongoose = require('mongoose');

const systemSettingsSchema = new mongoose.Schema(
    {
        weeklyQuota: {
            type: Number,
            default: 2,
            min: [1, 'Weekly quota must be at least 1'],
            max: [20, 'Weekly quota cannot exceed 20'],
        },
        slotDurationMinutes: {
            type: Number,
            default: 60,
            enum: [15, 30, 45, 60, 90, 120],
        },
        operatingStartHour: {
            type: Number,
            default: 6,
            min: 0,
            max: 23,
        },
        operatingEndHour: {
            type: Number,
            default: 22,
            min: 1,
            max: 24,
        },
        maxDailyBookingsPerStudent: {
            type: Number,
            default: 1,
            min: 1,
            max: 10,
        },
        requireAllowedList: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

// Helper static method to get active settings (singleton)
systemSettingsSchema.statics.getSettings = async function () {
    let settings = await this.findOne();
    if (!settings) {
        settings = await this.create({});
    }
    return settings;
};

module.exports = mongoose.model('SystemSettings', systemSettingsSchema);
