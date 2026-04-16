const mongoose = require('mongoose');

/**
 * Payment Model Schema definition
 * Tracks payment status, gateway information and transaction metadata
 */
const paymentSchema = new mongoose.Schema({
    paymentId: {
        type: String,
        required: [true, "Payment ID is required"],
        unique: true
    },
    receiptNumber: {
        type: String,
        unique: true,
        sparse: true // Only generated upon successful completion
    },
    referenceNumber: {
        type: String,
        unique: true,
        sparse: true
    },
    transactionDisplayId: {
        type: String,
        unique: true,
        sparse: true
    },
    appointmentId: {
        type: String,
        required: [true, "Appointment ID is required"]
    },
    patientId: {
        type: String,
        required: [true, "Patient ID is required"]
    },
    email: {
        type: String,
        required: false
    },
    phone: {
        type: String,
        required: false
    },
    patientName: {
        type: String,
        required: false
    },
    doctorName: {
        type: String,
        required: false
    },
    amount: {
        type: Number,
        required: [true, "Payment amount is required"]
    },
    currency: {
        type: String,
        default: 'LKR'
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'refunded'],
        default: 'pending'
    },
    txnId: {
        type: String,
        sparse: true
    },
    gateway: {
        type: String,
        enum: ['stripe', 'paypal', 'mock'],
        default: 'mock'
    }
}, {
    timestamps: true,
    collection: 'payments'
});

module.exports = mongoose.model('Payment', paymentSchema);