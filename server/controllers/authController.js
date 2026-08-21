const jwt = require('jsonwebtoken');
const Student = require('../models/Student');

// Generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });
};

// POST /api/auth/register
exports.register = async (req, res) => {
    try {
        const { name, email, rollNumber, hostel, roomNumber, password } = req.body;

        // Validate email domain
        if (!email || !email.endsWith('@nith.ac.in')) {
            return res.status(400).json({ success: false, message: 'Email must end with @nith.ac.in' });
        }

        // Check existing
        const existing = await Student.findOne({ $or: [{ email }, { rollNumber: rollNumber?.toUpperCase() }] });
        if (existing) {
            return res.status(400).json({ success: false, message: 'Email or roll number already registered' });
        }

        const student = await Student.create({
            name,
            email,
            rollNumber,
            hostel,
            roomNumber,
            passwordHash: password, // pre-save hook will hash it
        });

        const token = generateToken(student._id);

        res.status(201).json({
            success: true,
            token,
            student,
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// POST /api/auth/login
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password are required' });
        }

        const student = await Student.findOne({ email }).select('+passwordHash');
        if (!student) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }

        if (student.isBlocked) {
            return res.status(403).json({ success: false, message: 'Your account has been blocked. Contact admin.' });
        }

        const isMatch = await student.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }

        const token = generateToken(student._id);

        res.json({
            success: true,
            token,
            student,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// GET /api/auth/profile
exports.getProfile = async (req, res) => {
    try {
        const student = await Student.findById(req.student._id);
        res.json({ success: true, student });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
