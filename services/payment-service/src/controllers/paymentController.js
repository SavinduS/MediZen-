const Payment = require('../models/Payment');
const mongoose = require('mongoose');
const { getChannel } = require('../config/rabbitmq');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const PDFDocument = require('pdfkit');

/**
 *  UTILITY: Generate Unique Receipt Reference
 * Format: MZN-YEAR-00001
 */
const generateReceiptNumber = async () => {
    const year = new Date().getFullYear();
    const prefix = `MZN-${year}-`;
    
    const lastPayment = await Payment.findOne({ receiptNumber: { $regex: new RegExp(`^${prefix}`) } }).sort({ createdAt: -1 });

    let nextCount = 1;
    if (lastPayment && lastPayment.receiptNumber) {
        const parts = lastPayment.receiptNumber.split('-');
        const lastCount = parseInt(parts[2], 10);
        if (!isNaN(lastCount)) nextCount = lastCount + 1;
    }

    return `${prefix}${String(nextCount).padStart(5, '0')}`;
};

const generateReferenceNumber = async () => {
    const year = new Date().getFullYear();
    const prefix = `REF-${year}-`;

    const lastPayment = await Payment.findOne({
        referenceNumber: { $regex: new RegExp(`^${prefix}`) }
    }).sort({ createdAt: -1 });

    let nextCount = 1;

    if (lastPayment && lastPayment.referenceNumber) {
        const parts = lastPayment.referenceNumber.split('-');
        const lastCount = parseInt(parts[2], 10);
        if (!isNaN(lastCount)) nextCount = lastCount + 1;
    }

    return `${prefix}${String(nextCount).padStart(5, '0')}`;
};

const generateTransactionDisplayId = async () => {
    const year = new Date().getFullYear();
    const prefix = `TXN-${year}-`;

    const lastPayment = await Payment.findOne({
        transactionDisplayId: { $regex: new RegExp(`^${prefix}`) }
    }).sort({ createdAt: -1 });

    let nextCount = 1;

    if (lastPayment && lastPayment.transactionDisplayId) {
        const parts = lastPayment.transactionDisplayId.split('-');
        const lastCount = parseInt(parts[2], 10);
        if (!isNaN(lastCount)) nextCount = lastCount + 1;
    }

    return `${prefix}${String(nextCount).padStart(5, '0')}`;
};

/**
 * Helper: Publish Event to RabbitMQ
 */
const publishEvent = async (queue, data) => {
    const channel = getChannel();
    if (!channel) return console.warn(`⚠️ RabbitMQ not available`);
    try {
        await channel.assertQueue(queue, { durable: true });
        channel.sendToQueue(queue, Buffer.from(JSON.stringify(data)), { persistent: true });
        console.log(`📡 Event published to ${queue}: ${data.type}`);
    } catch (err) { console.error(`❌ RabbitMQ Error: ${err.message}`); }
};

const generatePaymentId = async () => {
    const payments = await Payment.find({ paymentId: { $regex: /^PAY\d+$/ } }, { paymentId: 1, _id: 0 });
    if (!payments.length) return 'PAY001';
    let maxNumber = 0;
    payments.forEach((item) => {
        const num = parseInt(item.paymentId.replace('PAY', ''), 10);
        if (!isNaN(num) && num > maxNumber) maxNumber = num;
    });
    return `PAY${String(maxNumber + 1).padStart(3, '0')}`;
};

/**
 * @desc    Create Stripe Payment Intent
 */
const createPaymentIntent = async (req, res) => {
    try {
        const { amount, appointmentId, patientId, email, phone, patientName, doctorName } = req.body;
        if (!amount || !appointmentId || !patientId) return res.status(400).json({ error: "Missing required fields" });

        const intent = await stripe.paymentIntents.create({
            amount: Math.round(amount * 100),
            currency: 'lkr',
            metadata: { appointmentId, patientId }
        });

        const paymentId = await generatePaymentId();
        // Save the email and phone from req.body into the Payment record
        const payment = new Payment({
            paymentId, appointmentId, patientId, amount,
            email, phone, patientName, doctorName, status: 'pending', gateway: 'stripe', txnId: intent.id
        });
        await payment.save();

        res.status(200).json({ clientSecret: intent.client_secret, paymentId: payment.paymentId });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

/**
 * @desc    Finalize and Assign Receipt Number
 */
const completePayment = async (req, res) => {
    try {
        const { id } = req.params;
        const payment = await Payment.findOne({ $or: [{ _id: mongoose.Types.ObjectId.isValid(id) ? id : null }, { paymentId: id }] });

        if (!payment) return res.status(404).json({ message: "Not found" });
        if (payment.status === 'completed') return res.status(200).json({ message: "Already completed" });

        //  Assign Professional Receipt Number
        payment.receiptNumber = payment.receiptNumber || await generateReceiptNumber();
        payment.referenceNumber = payment.referenceNumber || await generateReferenceNumber();
        payment.transactionDisplayId = payment.transactionDisplayId || await generateTransactionDisplayId();
        payment.status = 'completed';
        await payment.save();

        const paymentServiceUrl = process.env.PAYMENT_SERVICE_URL || "";
        const receiptUrl = paymentServiceUrl
            ? `${paymentServiceUrl}/api/payments/receipt/${payment.paymentId}`
            : (payment.receiptUrl || "");

        // Better Phone Normalization for Sri Lanka
        let phoneInput = String(payment.phone || '').trim();
        if (phoneInput.startsWith('0')) {
            phoneInput = '94' + phoneInput.substring(1);
        }
        let normalizedPhone = phoneInput.replace(/\D/g, '');
        if (!normalizedPhone || normalizedPhone.length < 9) normalizedPhone = '94702312666';

        const payload = {
            type: 'PAYMENT_SUCCESS',
            userId: payment.patientId,
            email: payment.email || 'dulmikalupahana@gmail.com',
            phone: normalizedPhone,
            patientName: payment.patientName || 'Valued Patient',
            doctorName: payment.doctorName || 'Assigned Doctor',
            amount: payment.amount,
            receiptNumber: payment.receiptNumber,
            receiptUrl
        };

        console.log('[PaymentService] PAYMENT_SUCCESS payload:', payload);
        await publishEvent(process.env.RABBITMQ_QUEUE || 'notifications_queue', payload);
        res.status(200).json({ success: true, payment });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

/**
 * @desc    Professional Medical Receipt PDF
 */
const getReceipt = async (req, res) => {
    try {
        const { id } = req.params;
        const payment = await Payment.findOne({ $or: [{ _id: mongoose.Types.ObjectId.isValid(id) ? id : null }, { paymentId: id }] });

        if (!payment || payment.status !== 'completed') {
            return res.status(404).json({ error: "Receipt not available" });
        }

        const doc = new PDFDocument({ margin: 50 });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Receipt-${payment.receiptNumber}.pdf`);
        doc.pipe(res);

        // Header
        doc.fillColor('#2563eb').fontSize(20).text('MediZen Smart Healthcare', { align: 'left' });
        doc.fontSize(10).fillColor('#64748b').text('Smart Booking & Telemedicine Suite', { align: 'left' });
        doc.moveUp().fontSize(10).fillColor('#64748b').text('PAYMENT RECEIPT', { align: 'right' });
        doc.moveDown(1).moveTo(50, 100).lineTo(550, 100).stroke('#e2e8f0');

        // Reference Info
        doc.text(`Reference No:`, 50, 130).font('Helvetica-Bold').text(payment.referenceNumber || 'N/A', 150, 130).font('Helvetica');
        doc.text(`Payment Date:`, 50, 145).text(new Date(payment.createdAt).toLocaleDateString(), 150, 145);
        doc.text(`Transaction ID:`, 50, 160).text(payment.transactionDisplayId || 'N/A', 150, 160);
        doc.text(`Payment Status:`, 50, 175).fillColor('#10b981').font('Helvetica-Bold').text(payment.status.toUpperCase(), 150, 175).font('Helvetica');

        // Patient & Appointment Details
        doc.moveDown(3).fillColor('#1e293b').fontSize(12).font('Helvetica-Bold').text('Patient & Appointment Details', 50, 210);
        doc.moveTo(50, 225).lineTo(300, 225).stroke('#e2e8f0');
        
        doc.fontSize(10).font('Helvetica');
        doc.text(`Patient:`, 50, 240).text(payment.patientName || payment.patientId, 150, 240);
        doc.text(`Doctor:`, 50, 255).text(`Dr. ${payment.doctorName || 'Anuradha Jayathilaka'}`, 150, 255);
        doc.text(`Appointment:`, 50, 270).text(payment.appointmentId, 150, 270);

        // Financial Breakdown (Table-like structure)
        const tableTop = 320;
        doc.fillColor('#f8fafc').rect(50, tableTop, 500, 25).fill();
        doc.fillColor('#475569').fontSize(10).font('Helvetica-Bold');
        doc.text('DESCRIPTION', 60, tableTop + 8);
        doc.text('AMOUNT (LKR)', 450, tableTop + 8);

        const consultationFee = payment.amount - 500;
        const serviceFee = 500;

        doc.fillColor('#1e293b').font('Helvetica');
        doc.text('Medical Consultation Fee', 60, tableTop + 40);
        doc.text(consultationFee.toLocaleString(), 450, tableTop + 40, { align: 'right', width: 90 });
        
        doc.text('Service & Platform Charges', 60, tableTop + 60);
        doc.text(serviceFee.toLocaleString(), 450, tableTop + 60, { align: 'right', width: 90 });

        doc.moveTo(50, tableTop + 80).lineTo(550, tableTop + 80).stroke('#e2e8f0');
        
        doc.fontSize(14).font('Helvetica-Bold').text('TOTAL PAID', 60, tableTop + 100);
        doc.fillColor('#2563eb').text(`LKR ${payment.amount.toLocaleString()}`, 400, tableTop + 100, { align: 'right', width: 140 });

        // Footer
        doc.moveDown(10).fillColor('#94a3b8').fontSize(9).font('Helvetica-Oblique')
           .text('Thank you for choosing MediZen Smart Healthcare. This is a computer-generated receipt and does not require a physical signature.', { align: 'center' });
        doc.moveDown(1).fillColor('#2563eb').font('Helvetica-Bold').text('support@medizen.com | +94 11 234 5678', { align: 'center' });

        doc.end();
    } catch (err) { res.status(500).json({ error: err.message }); }
};

const getPaymentById = async (req, res) => {
    try {
        const { id } = req.params;
        const payment = await Payment.findOne({ $or: [{ _id: mongoose.Types.ObjectId.isValid(id) ? id : null }, { paymentId: id }] });
        if (!payment) return res.status(404).json({ success: false, message: "Not found" });
        res.status(200).json({ success: true, data: payment });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

const getAllPayments = async (req, res) => {
    try {
        const payments = await Payment.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: payments });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

const generateSummaryReport = async (req, res) => {
    try {
        const payments = await Payment.find().sort({ createdAt: -1 });
        const doc = new PDFDocument({ margin: 50 });
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=Financial_Report.pdf');
        doc.pipe(res);

        // Header
        doc.fontSize(20).text('MEDIZEN FINANCIAL AUDIT', { align: 'center' }).moveDown();
        doc.fontSize(10).text(`Generated on: ${new Date().toLocaleString()}`, { align: 'center' }).moveDown(2);

        // Summary Stats
        const totalRev = payments.reduce((sum, p) => sum + (p.status === 'completed' ? p.amount : 0), 0);
        const successCount = payments.filter(p => p.status === 'completed').length;
        const pendingCount = payments.filter(p => p.status === 'pending').length;

        doc.fontSize(14).text('Executive Summary', { underline: true }).moveDown(0.5);
        doc.fontSize(12).text(`Total Revenue: LKR ${totalRev.toLocaleString()}`);
        doc.text(`Successful Transactions: ${successCount}`);
        doc.text(`Pending Transactions: ${pendingCount}`);
        doc.text(`Total Records: ${payments.length}`).moveDown(2);

        // Table Header
        const startY = doc.y;
        doc.fontSize(10).font('Helvetica-Bold');
        doc.text('Ref ID', 50, startY);
        doc.text('Patient', 150, startY);
        doc.text('Amount', 300, startY);
        doc.text('Status', 400, startY);
        doc.text('Date', 480, startY);
        doc.moveTo(50, startY + 15).lineTo(550, startY + 15).stroke().moveDown(1);

        // Table Rows
        doc.font('Helvetica');
        let currentY = startY + 25;
        payments.forEach(p => {
            if (currentY > 700) { doc.addPage(); currentY = 50; }
            doc.text(p.paymentId || 'N/A', 50, currentY);
            doc.text(p.patientName || 'Patient', 150, currentY);
            doc.text(p.amount.toLocaleString(), 300, currentY);
            doc.text(p.status.toUpperCase(), 400, currentY);
            doc.text(new Date(p.createdAt).toLocaleDateString(), 480, currentY);
            currentY += 20;
        });

        doc.end();
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { createPaymentIntent, completePayment, getReceipt, getPaymentById, getAllPayments, generateSummaryReport };
