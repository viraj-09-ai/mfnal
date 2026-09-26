const mongoose = require('mongoose');

const checkLogSchema = new mongoose.Schema({
    passId: { type: mongoose.Schema.Types.ObjectId, ref: 'Pass', required: true },
    action: { type: String, enum: ['Check-In', 'Check-Out'], required: true },
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('CheckLog', checkLogSchema);