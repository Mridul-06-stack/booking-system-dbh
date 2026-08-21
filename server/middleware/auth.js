const jwt = require('jsonwebtoken');
const Student = require('../models/Student');

// Protect routes — require valid JWT
exports.protect = async (req, res, next) => {
    try {
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({ success: false, message: 'Not authorized — no token' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const student = await Student.findById(decoded.id);

        if (!student) {
            return res.status(401).json({ success: false, message: 'User not found' });
        }

        if (student.isBlocked) {
            return res.status(403).json({ success: false, message: 'Account blocked' });
        }

        req.student = student;
        next();
    } catch (error) {
        res.status(401).json({ success: false, message: 'Not authorized — invalid token' });
    }
};

// Admin-only middleware
exports.adminOnly = (req, res, next) => {
    if (req.student.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Admin access required' });
    }
    next();
};
