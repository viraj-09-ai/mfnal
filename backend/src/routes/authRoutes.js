// File path: src/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middleware/authMiddleware');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

router.post('/login', authController.login);

// Helper route to create staff users (Admin / Security / Employee) for testing.
// NOTE: this has no auth guard so the very first Admin account can be created;
// once you have an Admin, protect or remove this route in production.
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ error: 'name, email and password are required' });
        }
        const existing = await User.findOne({ email });
        if (existing) {
            return res.status(409).json({ error: 'A user with that email already exists' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({ name, email, password: hashedPassword, role });
        const safeUser = { _id: user._id, name: user.name, email: user.email, role: user.role };
        res.status(201).json({ message: 'User created successfully', user: safeUser });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Used by the frontend on load to validate a stored token and fetch the
// current user's name/role for the navbar and role-based routing.
router.get('/me', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('-password');
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
