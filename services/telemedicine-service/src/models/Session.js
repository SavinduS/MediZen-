/**
 * Video Session Model Schema
 * Tracks video consultation metadata and lifecycle.
 */

const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
    appointmentId: {
        type: String,
        required: true,
        unique: true
    },
    channelName: {
        type: String, // Unique room identifier for the call
        required: true
    },
    token: {
        type: String,
        required: true
    },
    startedAt: {
        type: Date,
        default: Date.now
    },
    endedAt: {
        type: Date
    },
    duration: {
        type: Number // In minutes
    }
});

module.exports = mongoose.model('Session', sessionSchema);