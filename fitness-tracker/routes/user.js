const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Authentication required' });

    jwt.verify(token, 'your_jwt_secret', (err, user) => {
        if (err) return res.status(403).json({ message: 'Invalid or expired token' });
        req.user = user;
        next();
    });
};

router.get('/profile', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('-password');
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching user profile', error: error.message });
    }
});

router.post('/weight', authenticateToken, async (req, res) => {
    try {
        const { date, weight } = req.body;

        // Input validation
        if (!date || !weight) {
            return res.status(400).json({ message: 'Date and weight are required' });
        }

        const user = await User.findById(req.user.userId);
        user.weightHistory.push({ date, weight });
        await user.save();

        res.json({ message: 'Weight logged successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error logging weight', error: error.message });
    }
});

module.exports = router;