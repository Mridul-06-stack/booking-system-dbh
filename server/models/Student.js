const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const studentSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Name is required'],
            trim: true,
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            lowercase: true,
            trim: true,
            validate: {
                validator: (v) => v.endsWith('@nith.ac.in'),
                message: 'Email must end with @nith.ac.in',
            },
        },
        rollNumber: {
            type: String,
            required: [true, 'Roll number is required'],
            unique: true,
            uppercase: true,
            trim: true,
        },
        hostel: {
            type: String,
            required: [true, 'Hostel is required'],
            trim: true,
        },
        roomNumber: {
            type: String,
            required: [true, 'Room number is required'],
            trim: true,
        },
        phone: {
            type: String,
            required: [true, 'Phone number is required'],
            trim: true,
        },
        passwordHash: {
            type: String,
        },
        authProvider: {
            type: String,
            enum: ['local', 'google'],
            default: 'local',
        },
        role: {
            type: String,
            enum: ['student', 'admin'],
            default: 'student',
        },
        isBlocked: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

// Hash password before save
studentSchema.pre('save', async function () {
    if (!this.isModified('passwordHash')) return;
    this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
});

// Compare password method
studentSchema.methods.comparePassword = async function (password) {
    return bcrypt.compare(password, this.passwordHash);
};

// Remove password from JSON output
studentSchema.methods.toJSON = function () {
    const obj = this.toObject();
    delete obj.passwordHash;
    return obj;
};

module.exports = mongoose.model('Student', studentSchema);
