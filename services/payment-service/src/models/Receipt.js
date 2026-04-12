const mongoose = require('mongoose');

/**
 * Receipt Model Schema definition
 * Links a PDF URL to a specific payment record
 */
const receiptSchema = new mongoose.Schema({
    receiptId: {
        type: String,
        required: [true, "Receipt ID is required"],
        unique: true
    },
    paymentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Payment',
        required: [true, "Payment ID is required"],
        unique: true
    },
    pdfUrl: {
        type: String,
        required: [true, "PDF receipt URL is required"]
    },
    generatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    collection: 'receipts'
});

module.exports = mongoose.model('Receipt', receiptSchema);
