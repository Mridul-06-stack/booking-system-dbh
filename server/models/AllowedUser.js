const mongoose = require('mongoose');

const allowedUserSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            lowercase: true,
            trim: true,
        },
        rollNumber: {
            type: String,
            uppercase: true,
            trim: true,
        },
        name: {
            type: String,
            trim: true,
        },
        hostel: {
            type: String,
            trim: true,
        },
        addedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Student',
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('AllowedUser', allowedUserSchema);
