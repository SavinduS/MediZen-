/**
 * Appointment Model Schema
 * Tracks all doctor-patient booking sessions and statuses.
 */

const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
    appointmentId: {
        type: String,
        required: true,
        unique: true
    },
    patientId: {
        type: String, // From Patient Service
        required: true
    },
    doctorId: {
        type: String, // From Doctor Service
        required: true
    },
    slotTime: {
        type: Date, // Combined Date and Start Time
        required: true
    },
    status: {
        type: String,
        enum: ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'],
        default: 'PENDING'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Appointment', appointmentSchema);