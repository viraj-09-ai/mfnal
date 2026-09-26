const express = require('express');
const router = express.Router();
const {
    registerVisitor,
    scanPass,
    getLogs,
    listVisitors,
    getBadge
} = require('../controllers/visitorController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');

// Register a visitor + generate their QR pass and PDF badge (photo optional)
router.post('/register', verifyToken, checkRole(['Admin', 'Employee']), upload.single('photo'), registerVisitor);

// Scan a pass's QR code -> toggles Check-In / Check-Out
router.post('/scan', verifyToken, checkRole(['Admin', 'Security']), scanPass);

// Check-in / check-out history, with search + filter support for the dashboard
router.get('/logs', verifyToken, checkRole(['Admin', 'Security']), getLogs);

// List all registered visitors with their current pass, with search + status filter
router.get('/', verifyToken, checkRole(['Admin', 'Security']), listVisitors);

// Download the generated PDF badge for a pass (kept public so a visitor can
// grab their badge right after registration without a staff login)
router.get('/badge/:passId', getBadge);

module.exports = router;
