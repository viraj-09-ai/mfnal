const mongoose = require('mongoose');

const passSchema = new mongoose.Schema({
    visitorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Visitor', required: true },
    purpose: { type: String, required: true },
    qrCodeUrl: { type: String },
    badgeUrl: { type: String },
    status: { type: String, enum: ['Active', 'Expired'], default: 'Active' },
    validUntil: { type: Date, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Pass', passSchema);