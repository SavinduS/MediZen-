/**
 * Availability Model Schema
 * Manages doctor's weekly consultation time slots.
 */

const mongoose = require('mongoose');

const availabilitySchema = new mongoose.Schema({
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Doctor',
        required: true
    },
    // Day of the week (Monday, Tuesday, etc.)
    dayOfWeek: {
        type: String,
        required: true,
        enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    },
    // Time format: HH:mm (e.g., "09:00")
    startTime: {
        type: String,
        required: true
    },
    endTime: {
        type: String,
        required: true
    },
    // Toggle to enable/disable specific slots temporarily
    isAvailable: {
        type: Boolean,
        default: true
    }
});

module.exports = mongoose.model('Availability', availabilitySchema);