const express = require('express');
const router = express.Router();
const {
    initiatePayment,
    webhookHandler,
    getPaymentById,
    getReceipt,
    completePayment
} = require('../controllers/paymentController');

/**
 * Payment Routes Setup
 */

// Route: Initiate payment record
router.post('/initiate', initiatePayment);

// Route: Webhook status updates from gateway
router.post('/webhook', webhookHandler);

// Route: Manual complete for mock flow
router.post('/:id/complete', completePayment);

// Route: Fetch receipt for a completed payment
router.get('/:id/receipt', getReceipt);

// Route: Get payment details by ID
router.get('/:id', getPaymentById);

module.exports = router;
