const mongoose = require('mongoose');

const washingMachineSchema = new mongoose.Schema(
    {
        machineNumber: {
            type: String,
            required: [true, 'Machine number is required'],
            trim: true,
        },
        hostel: {
            type: String,
            required: [true, 'Hostel is required'],
            trim: true,
        },
        status: {
            type: String,
            enum: ['available', 'in-use', 'maintenance'],
            default: 'available',
        },
        location: {
            type: String,
            trim: true,
            default: '',
        },
    },
    { timestamps: true }
);

// Unique machine label per hostel (for example, M1 or M2)
washingMachineSchema.index({ machineNumber: 1, hostel: 1 }, { unique: true });

module.exports = mongoose.model('WashingMachine', washingMachineSchema);
