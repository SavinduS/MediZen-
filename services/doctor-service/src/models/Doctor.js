/**
 * Doctor Model Schema
 * Stores comprehensive information about registered medical professionals.
 */

const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
    // Link to the User ID from the Auth Service
    userId: {
        type: String,
        required: [true, 'User ID is required'],
        unique: true
    },
    // Unique ID for doctor profile within this service
    doctorId: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: [true, 'Doctor name is required']
    },
    specialization: {
        type: String,
        required: [true, 'Specialization is required'],
        trim: true
    },
    qualifications: {
        type: [String], // Array of strings (e.g., MBBS, MD)
        required: true
    },
    fee: {
        type: Number,
        required: [true, 'Consultation fee is required'],
        min: 0
    },
    // Verification status (Admin must approve before they appear in search)
    verified: {
        type: Boolean,
        default: false
    },
    bio: {
        type: String,
        maxlength: 500
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Doctor', doctorSchema);