const express = require('express');
const router = express.Router();
const { 
    createPaymentIntent, 
    completePayment, 
    getReceipt, 
    getPaymentById,
    getAllPayments,
    generateSummaryReport
} = require('../controllers/paymentController');

/**
 * 🛠️ PAYMENT ROUTES
 * Port: 5007
 * Base URL: /api/payments
 */

// 0. Get All Payments (Admin)
router.get('/', getAllPayments);

// 0.1 Generate Summary Report (Admin)
router.get('/reports/all', generateSummaryReport);

// 1. Create Stripe Payment Intent
router.post('/create-intent', createPaymentIntent);

// 2. Finalize Payment (Update status to 'completed' and notify)
router.post('/:id/complete', completePayment);

// 3. Get Payment Receipt (PDF)
router.get('/receipt/:id', getReceipt);

// 4. Get Payment Details
router.get('/:id', getPaymentById);

module.exports = router;
