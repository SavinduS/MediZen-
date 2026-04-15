const nodemailer = require('nodemailer');
const { Vonage } = require('@vonage/server-sdk');

/**
 * Service: Combined Email (Nodemailer) and SMS (Vonage) Notification logic
 */

// 1. Email Configuration (Nodemailer)
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

// 2. SMS Configuration (Vonage)
let vonage = null;
if (process.env.VONAGE_API_KEY && process.env.VONAGE_API_SECRET) {
    vonage = new Vonage({
        apiKey: process.env.VONAGE_API_KEY,
        apiSecret: process.env.VONAGE_API_SECRET
    });
}

/**
 * @desc Sends a professional appointment confirmation email
 */
const sendAppointmentEmail = async (data) => {
    const { email, patientId, appointmentId, amount, currency, paymentId } = data;
    
    if (!email || !process.env.SMTP_USER) {
        console.warn(`[Notification] Skipping Email: Missing recipient or credentials.`);
        return;
    }

    const mailOptions = {
        from: `"MediZen Healthcare" <${process.env.SMTP_USER}>`,
        to: email,
        subject: 'Appointment Confirmed - MediZen',
        html: `
            <div style="font-family: sans-serif; padding: 20px; color: #333;">
                <h2 style="color: #2563eb;">Payment Successful!</h2>
                <p>Hello, <strong>${patientId}</strong>,</p>
                <p>Your appointment has been successfully confirmed. Below are your transaction details:</p>
                <div style="background: #f8fafc; padding: 15px; border-radius: 10px; border: 1px solid #e2e8f0;">
                    <p><strong>Appointment ID:</strong> ${appointmentId}</p>
                    <p><strong>Amount Paid:</strong> ${amount} ${currency.toUpperCase()}</p>
                    <p><strong>Status:</strong> Completed</p>
                </div>
                <p style="margin-top: 20px;">Thank you for choosing MediZen Healthcare.</p>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`✅ Email sent for Payment: ${paymentId}`);
    } catch (err) {
        console.error(`❌ Email Error: ${err.message}`);
    }
};

/**
 * @desc Sends an SMS via Vonage
 */
const sendAppointmentSMS = async (data) => {
    const { phone, appointmentId, paymentId } = data;

    if (!phone || !vonage) {
        console.warn(`[Notification] Skipping SMS: Missing phone or Vonage credentials.`);
        return;
    }

    const from = process.env.VONAGE_BRAND_NAME || "MediZen";
    const text = `MediZen: Payment successful for Apt ${appointmentId}. Ref: ${paymentId}. Thank you!`;

    try {
        await vonage.sms.send({ to: phone, from, text });
        console.log(`✅ SMS sent for Payment: ${paymentId}`);
    } catch (err) {
        console.error(`❌ Vonage SMS Failure: ${err.message}`);
    }
};

module.exports = {
    sendAppointmentEmail,
    sendAppointmentSMS
};
