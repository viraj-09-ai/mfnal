const path = require('path');
const fs = require('fs');
const Visitor = require('../models/Visitor');
const Pass = require('../models/Pass');
const CheckLog = require('../models/CheckLog');
const sendPassNotification = require('../utils/mailer');
const generateBadge = require('../utils/badgeGenerator');
const QRCode = require('qrcode');

// POST /api/visitors/register  (Admin, Employee)
exports.registerVisitor = async (req, res) => {
    try {
        const { name, email, phone, purpose, validUntil } = req.body;

        if (!name || !phone || !purpose || !validUntil) {
            return res.status(400).json({ error: 'name, phone, purpose and validUntil are required' });
        }

        const photoUrl = req.file ? `/uploads/${req.file.filename}` : undefined;

        // 1. Create the visitor record (with photo, if uploaded)
        const visitor = await Visitor.create({
            name,
            email,
            phone,
            photoUrl,
            registeredBy: req.user ? req.user.userId : undefined
        });

        // 2. Create the pass linked to the real visitor
        const pass = await Pass.create({
            visitorId: visitor._id,
            purpose,
            validUntil
        });

        // 3. Generate QR Code containing the Pass ID
        const qrCodeUrl = await QRCode.toDataURL(String(pass._id));
        pass.qrCodeUrl = qrCodeUrl;

        // 4. Generate the printable PDF badge (photo + details + QR)
        const badgeUrl = await generateBadge({ visitor, pass });
        pass.badgeUrl = badgeUrl;
        await pass.save();

        // 5. Email notification (never blocks the response; fails silently if unconfigured)
        if (email) {
            sendPassNotification(
                email,
                `Your visitor pass has been generated. Purpose: ${purpose}. Valid until: ${new Date(validUntil).toLocaleString()}.`
            ).catch(() => {});
        }

        res.status(201).json({
            message: 'Visitor registered and pass generated',
            visitor,
            pass,
            badgeDownloadUrl: `/api/visitors/badge/${pass._id}`
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message || 'Failed to register visitor' });
    }
};

// POST /api/visitors/scan  (Admin, Security)
// Toggles Check-In / Check-Out based on the visitor's last log for this pass.
exports.scanPass = async (req, res) => {
    try {
        const { qrData } = req.body;
        if (!qrData) {
            return res.status(400).json({ error: 'qrData is required' });
        }

        const pass = await Pass.findById(qrData).populate('visitorId');
        if (!pass) {
            return res.status(404).json({ error: 'Pass not found' });
        }

        const lastLog = await CheckLog.findOne({ passId: pass._id }).sort({ timestamp: -1 });
        const isCheckingIn = !lastLog || lastLog.action === 'Check-Out';

        if (isCheckingIn && (pass.status === 'Expired' || new Date() > new Date(pass.validUntil))) {
            return res.status(400).json({ error: 'Pass is invalid or expired. Check-in denied.' });
        }

        const action = isCheckingIn ? 'Check-In' : 'Check-Out';
        const log = await CheckLog.create({ passId: pass._id, action });

        res.status(200).json({
            message: `${action} recorded successfully`,
            action,
            visitor: pass.visitorId,
            log
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Scan failed' });
    }
};

// GET /api/visitors/logs?search=&action=&from=&to=  (Admin, Security)
exports.getLogs = async (req, res) => {
    try {
        const { search, action, from, to } = req.query;
        const filter = {};
        if (action) filter.action = action;
        if (from || to) {
            filter.timestamp = {};
            if (from) filter.timestamp.$gte = new Date(from);
            if (to) {
                const toDate = new Date(to);
                toDate.setHours(23, 59, 59, 999);
                filter.timestamp.$lte = toDate;
            }
        }

        let logs = await CheckLog.find(filter)
            .sort({ timestamp: -1 })
            .populate({ path: 'passId', populate: { path: 'visitorId' } });

        if (search) {
            const s = search.toLowerCase();
            logs = logs.filter((log) => {
                const visitor = log.passId && log.passId.visitorId;
                if (!visitor) return false;
                return (
                    (visitor.name && visitor.name.toLowerCase().includes(s)) ||
                    (visitor.phone && visitor.phone.includes(s)) ||
                    (visitor.email && visitor.email.toLowerCase().includes(s))
                );
            });
        }

        res.status(200).json(logs);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch logs' });
    }
};

// GET /api/visitors?search=&status=  (Admin, Security)
exports.listVisitors = async (req, res) => {
    try {
        const { search, status } = req.query;
        const filter = {};
        if (search) {
            const re = new RegExp(search, 'i');
            filter.$or = [{ name: re }, { email: re }, { phone: re }];
        }

        const visitors = await Visitor.find(filter).sort({ createdAt: -1 }).lean();
        const passes = await Pass.find({ visitorId: { $in: visitors.map((v) => v._id) } }).lean();
        const passByVisitor = {};
        passes.forEach((p) => { passByVisitor[String(p.visitorId)] = p; });

        let result = visitors.map((v) => ({ ...v, pass: passByVisitor[String(v._id)] || null }));

        if (status) {
            result = result.filter((v) => v.pass && v.pass.status === status);
        }

        res.status(200).json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch visitors' });
    }
};

// GET /api/visitors/badge/:passId  (downloads the generated PDF badge)
exports.getBadge = async (req, res) => {
    try {
        const pass = await Pass.findById(req.params.passId);
        if (!pass || !pass.badgeUrl) {
            return res.status(404).json({ error: 'Badge not found' });
        }
        const filePath = path.join(__dirname, '..', '..', pass.badgeUrl.replace(/^\//, ''));
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'Badge file missing on server' });
        }
        res.download(filePath, `visitor-pass-${pass._id}.pdf`);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch badge' });
    }
};
