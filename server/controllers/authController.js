const jwt = require('jsonwebtoken');
const Student = require('../models/Student');
const SystemSettings = require('../models/SystemSettings');
const AllowedUser = require('../models/AllowedUser');

// Generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });
};

// POST /api/auth/register
exports.register = async (req, res) => {
    try {
        const { name, email, rollNumber, hostel, roomNumber, phone, password } = req.body;

        // Validate email domain
        if (!email || !email.endsWith('@nith.ac.in')) {
            return res.status(400).json({ success: false, message: 'Email must end with @nith.ac.in' });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const normalizedRoll = rollNumber ? rollNumber.toUpperCase().trim() : '';

        // Check if allowed list restriction is enabled or populated
        const settings = await SystemSettings.getSettings();
        const allowedCount = await AllowedUser.countDocuments();

        if (settings.requireAllowedList || allowedCount > 0) {
            const isAllowed = await AllowedUser.findOne({
                $or: [
                    { email: normalizedEmail },
                    { rollNumber: normalizedRoll },
                ],
            });

            if (!isAllowed) {
                return res.status(403).json({
                    success: false,
                    message: 'Registration restricted: Your email/roll number is not in the pre-authorized allowed list. Please contact admin.',
                });
            }
        }

        // Check existing registration
        const existing = await Student.findOne({ $or: [{ email: normalizedEmail }, { rollNumber: normalizedRoll }] });
        if (existing) {
            return res.status(400).json({ success: false, message: 'Email or roll number already registered' });
        }

        const student = await Student.create({
            name,
            email: normalizedEmail,
            rollNumber: normalizedRoll,
            hostel,
            roomNumber,
            phone,
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

        const student = await Student.findOne({ email: email.toLowerCase().trim() }).select('+passwordHash');
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

// POST /api/auth/google
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

exports.googleAuth = async (req, res) => {
    try {
        const { credential, hostel, roomNumber, phone, rollNumber } = req.body;

        if (!credential) {
            return res.status(400).json({ success: false, message: 'Google credential missing' });
        }

        const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        const { email, name } = payload;

        if (!email.endsWith('@nith.ac.in')) {
            return res.status(403).json({ success: false, message: 'Only @nith.ac.in emails are permitted to log in via Google.' });
        }

        let student = await Student.findOne({ email });

        if (!student) {
            // New user via Google Auth requires extra registration fields if they don't have them
            if (!rollNumber || !roomNumber || !phone) {
                return res.status(202).json({
                    success: true,
                    requireExtraDetails: true,
                    email,
                    name,
                    message: 'New internal account setup required. Please provide hostel details.'
                });
            }

            // Check if allowed list restriction is enabled
            const settings = await SystemSettings.getSettings();
            const allowedCount = await AllowedUser.countDocuments();

            const normalizedEmail = email.toLowerCase().trim();
            const normalizedRoll = rollNumber.toUpperCase().trim();

            if (settings.requireAllowedList || allowedCount > 0) {
                const isAllowed = await AllowedUser.findOne({
                    $or: [
                        { email: normalizedEmail },
                        { rollNumber: normalizedRoll },
                    ],
                });

                if (!isAllowed) {
                    return res.status(403).json({
                        success: false,
                        message: 'Registration restricted: Your email/roll number is not in the pre-authorized allowed list.',
                    });
                }
            }

            student = await Student.create({
                name,
                email: normalizedEmail,
                rollNumber: normalizedRoll,
                hostel: hostel || 'Dhauladhar Boys Hostel',
                roomNumber,
                phone,
                authProvider: 'google'
            });
        }

        if (student.isBlocked) {
            return res.status(403).json({ success: false, message: 'Your account has been blocked. Contact admin.' });
        }

        const token = generateToken(student._id);

        res.json({
            success: true,
            token,
            student,
        });

    } catch (error) {
        console.error('Google Auth Error:', error);
        res.status(500).json({ success: false, message: 'Failed to authenticate with Google' });
    }
};
