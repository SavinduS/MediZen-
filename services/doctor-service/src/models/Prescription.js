/**
 * Prescription Model Schema
 * Stores medication details and linked PDF file reference.
 */
const mongoose = require('mongoose');

const prescriptionSchema = new mongoose.Schema({
    appointmentId: {
        type: String,
        required: true,
        unique: true
    },
    doctorId: {
        type: String,
        required: true
    },
    patientId: {
        type: String,
        required: true
    },
    patientName: String,
    diagnosis: String,
    medicines: [
        {
            name: String,
            dosage: String,   // e.g., "500mg"
            frequency: String // e.g., "1-0-1" (Morning-Night)
        }
    ],
    pdfPath: String, // Internal path to the generated PDF file
    issuedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Prescription', prescriptionSchema);