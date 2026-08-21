const mongoose = require('mongoose');

const washingMachineSchema = new mongoose.Schema(
    {
        machineNumber: {
            type: Number,
            required: [true, 'Machine number is required'],
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

// Unique machine number per hostel
washingMachineSchema.index({ machineNumber: 1, hostel: 1 }, { unique: true });

module.exports = mongoose.model('WashingMachine', washingMachineSchema);
