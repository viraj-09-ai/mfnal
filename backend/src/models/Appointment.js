// File path: src/models/Appointment.js
const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
    visitorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Visitor', required: true },
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    appointmentDate: { type: Date, required: true },
    status: { type: String, enum: ['Pending', 'Checked-In', 'Checked-Out'], default: 'Pending' },
    checkInTime: { type: Date },
    checkOutTime: { type: Date },
    qrCodeUrl: { type: String }
});

module.exports = mongoose.model('Appointment', appointmentSchema);