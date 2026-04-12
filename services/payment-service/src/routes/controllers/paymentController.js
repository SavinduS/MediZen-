const Payment = require('../../models/Payment');
const Receipt = require('../../models/Receipt');
const mongoose = require('mongoose');
const { getChannel } = require('../../config/rabbitmq');
// const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY); // Stripe SDK Placeholder

/**
 * Controller logic for handling payment operations
 * Implementation follows standard microservice patterns for assignments.
 */

// Helper: Publish Event to RabbitMQ
const publishEvent = async (queue, data) => {
    const channel = getChannel();
    if (!channel) {
        console.warn(`⚠️ Could not publish event to ${queue}: RabbitMQ channel not available`);
        return;
    }

    try {
        await channel.assertQueue(queue, { durable: true });
        channel.sendToQueue(queue, Buffer.from(JSON.stringify(data)), { persistent: true });
        console.log(`📡 Event published to ${queue}: ${data.type}`);
    } catch (err) {
        console.error(`❌ Failed to publish event to ${queue}: ${err.message}`);
    }
};

/**
 * Helper: Generate custom Payment ID like PAY001
 * Uses the latest record to increment the sequence
 */
const generatePaymentId = async () => {
    try {
        const payments = await Payment.find(
            { paymentId: { $regex: /^PAY\d+$/ } },
            { paymentId: 1, _id: 0 }
        );

        if (!payments.length) {
            return 'PAY001';
        }

        let maxNumber = 0;

        payments.forEach((item) => {
            const num = parseInt(item.paymentId.replace('PAY', ''), 10);
            if (!isNaN(num) && num > maxNumber) {
                maxNumber = num;
            }
        });

        const nextNumber = maxNumber + 1;
        return `PAY${String(nextNumber).padStart(3, '0')}`;
    } catch (err) {
        console.error(`[Helper Error] generatePaymentId: ${err.message}`);
        throw new Error('Could not generate unique Payment ID');
    }
};

// Helper: Simulated Cloud Storage PDF Link Generator
const mockGenerateReceipt = async (payment) => {
    return {
        url: `https://medizen-storage.s3.amazonaws.com/receipts/REC-${payment.paymentId}.pdf`,
        at: new Date()
    };
};

/**
 * @desc    Initiate a new payment session (Stripe-ready)
 * @route   POST /payments/initiate
 */
const initiatePayment = async (req, res) => {
    try {
        const { appointmentId, patientId, amount, currency = 'LKR', gateway = 'mock', email, phone } = req.body;

        // Validation
        if (!appointmentId || !patientId || !amount) {
            return res.status(400).json({ 
                success: false, 
                message: "Missing required fields: appointmentId, patientId, and amount are required" 
            });
        }

        // Generate unique paymentId
        const newPaymentId = await generatePaymentId();

        // 1. Create a pending payment log in MongoDB
        const payment = new Payment({
            paymentId: newPaymentId,
            appointmentId,
            patientId,
            email,
            phone,
            amount,
            currency,
            gateway,
            status: 'pending'
        });

        await payment.save();

        /**
         * Real Logic Placeholder:
         * const session = await stripe.checkout.sessions.create({ ... });
         * const checkoutUrl = session.url;
         */
        const checkoutUrl = `https://medizen-gateway.com/pay/${payment.paymentId}`;

        // Return clean JSON response as requested
        res.status(201).json({
            success: true,
            message: "Payment session created",
            payment: {
                _id: payment._id,
                paymentId: payment.paymentId,
                appointmentId: payment.appointmentId,
                patientId: payment.patientId,
                amount: payment.amount,
                currency: payment.currency,
                status: payment.status
            },
            checkoutUrl
        });
    } catch (err) {
        console.error(`[Error] Initiate: ${err.message}`);
        
        // Return actual error message for debugging during development
        res.status(500).json({ 
            success: false, 
            message: "Failed to initiate payment",
            error: err.message 
        });
    }
};

/**
 * @desc    Verify and process webhook/callback from gateway
 * @route   POST /payments/webhook
 */

const webhookHandler = async (req, res) => {
    try {
        const { id, paymentId, status, txnId } = req.body;

        let payment;

        // 1. Mongo _id check
        if (id && mongoose.Types.ObjectId.isValid(id)) {
            payment = await Payment.findById(id);
        }

        // 2. paymentId fallback
        if (!payment && paymentId) {
            payment = await Payment.findOne({ paymentId });
        }

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: "Payment record not found"
            });
        }

        if (payment.txnId === txnId) {
            return res.status(200).json({
                success: true,
                message: "Webhook already processed"
            });
        }

        payment.status = status;
        payment.txnId = txnId;
        await payment.save();

        // 3. Publish Event to RabbitMQ if status is completed
        if (status === 'completed') {
            console.log(`💳 Payment ${payment.paymentId} completed. Publishing PAYMENT_SUCCESS event...`);
            const queue = process.env.RABBITMQ_QUEUE || 'notifications_queue';
            await publishEvent(queue, {
                type: 'PAYMENT_SUCCESS',
                userId: payment.patientId,
                amount: payment.amount,
                currency: payment.currency,
                txnId: payment.txnId,
                email: payment.email,
                phone: payment.phone,
                appointmentId: payment.appointmentId,
                paymentId: payment.paymentId,
                recipient: payment.email || payment.phone || payment.patientId,
                message: `Payment of ${payment.amount} ${payment.currency} was successful. Txn: ${payment.txnId}`,
                subject: 'Payment Confirmation'
            });
        }

        res.status(200).json({
            success: true,
            message: "Webhook processed",
            payment: {
                _id: payment._id,
                paymentId: payment.paymentId,
                status: payment.status,
                txnId: payment.txnId
            }
        });

    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

/**
 * @desc    Manual completion for demo/mock purposes
 * @route   POST /payments/:id/complete
 */
const completePayment = async (req, res) => {
    try {
        const { id } = req.params;
        let payment;

        if (mongoose.Types.ObjectId.isValid(id)) {
            payment = await Payment.findById(id);
        } else {
            payment = await Payment.findOne({ paymentId: id });
        }

        if (!payment) {
            return res.status(404).json({ success: false, message: "Payment not found" });
        }

        if (payment.status === 'completed') {
            return res.status(200).json({ success: true, message: "Already completed", payment });
        }

        payment.status = 'completed';
        payment.txnId = `TXN-${Date.now()}`;
        await payment.save();

        // Publish event for notifications etc.
        const queue = process.env.RABBITMQ_QUEUE || 'notifications_queue';
        await publishEvent(queue, {
            type: 'PAYMENT_SUCCESS',
            userId: payment.patientId,
            amount: payment.amount,
            currency: payment.currency,
            txnId: payment.txnId,
            email: payment.email,
            phone: payment.phone,
            appointmentId: payment.appointmentId,
            paymentId: payment.paymentId,
            recipient: payment.email || payment.phone || payment.patientId,
            message: `Payment of ${payment.amount} ${payment.currency} was successful. Txn: ${payment.txnId}`,
            subject: 'Payment Confirmation'
        });

        res.status(200).json({ success: true, payment });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

/**
 * @desc    Fetch specific payment details
 * @route   GET /payments/:id
 */
const getPaymentById = async (req, res) => {
    try {
        const { id } = req.params;
        let payment;

        // Check if id is a valid MongoDB ObjectId
        if (mongoose.Types.ObjectId.isValid(id)) {
            payment = await Payment.findById(id);
        } else {
            payment = await Payment.findOne({ paymentId: id });
        }

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: "Payment record not found"
            });
        }

        res.status(200).json({
            success: true,
            data: {
                _id: payment._id,
                paymentId: payment.paymentId,
                appointmentId: payment.appointmentId,
                patientId: payment.patientId,
                amount: payment.amount,
                currency: payment.currency,
                status: payment.status,
                txnId: payment.txnId,
                gateway: payment.gateway,
                createdAt: payment.createdAt,
                updatedAt: payment.updatedAt
            }
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

/**
 * @desc    Get/Download PDF receipt for a payment
 * @route   GET /payments/:id/receipt
 */
const getReceipt = async (req, res) => {
    try {
        const { id } = req.params;
        let payment;

        // Support both _id and paymentId
        if (mongoose.Types.ObjectId.isValid(id)) {
            payment = await Payment.findById(id);
        } else {
            payment = await Payment.findOne({ paymentId: id });
        }
        
        if (!payment || payment.status !== 'completed') {
            return res.status(400).json({ success: false, message: "Completed payment required for receipt" });
        }

        // Check for existing receipt or generate new one
        // Note: Receipt.paymentId is an ObjectId (ref)
        let receipt = await Receipt.findOne({ paymentId: payment._id });

        if (!receipt) {
            const mock = await mockGenerateReceipt(payment);
            receipt = new Receipt({
                receiptId: `REC-${Date.now()}`,
                paymentId: payment._id,
                pdfUrl: mock.url,
                generatedAt: mock.at
            });
            await receipt.save();
        }

        res.status(200).json({
            success: true,
            message: "Receipt retrieved successfully",
            data: receipt
        });
    } catch (err) {
        res.status(500).json({ success: false, message: "Receipt retrieval failed", error: err.message });
    }
};

module.exports = {
    initiatePayment,
    webhookHandler,
    getPaymentById,
    getReceipt
};
