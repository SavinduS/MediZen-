const NotificationLog = require("../models/NotificationLog");
const NotificationPreference = require("../models/NotificationPreference");
const { sendEmail } = require("./emailService");
const { sendSMS } = require("./smsService");

/**
 * General process for various notifications (REST API usage)
 */
const processNotification = async ({ userId, type, message, subject, recipient }) => {
  if (!userId || !type || !message) {
    throw new Error("userId, type, and message are required");
  }

  const prefs = await NotificationPreference.findOne({ userId });
  const isEmailEnabled = prefs ? prefs.emailEnabled : true;
  const isSMSEnabled = prefs ? prefs.smsEnabled : true;

  let status = "sent";
  let errorMessage = null;

  try {
    if (type === "email") {
      if (!isEmailEnabled) throw new Error(`Email disabled for user`);
      await sendEmail(recipient, subject, message);
    } else if (type === "sms") {
      if (!isSMSEnabled) throw new Error(`SMS disabled for user`);
      const result = await sendSMS(recipient, message);
      status = result.status || "sent";
    } else {
      throw new Error(`Invalid type: ${type}`);
    }
  } catch (err) {
    status = "failed";
    errorMessage = err.message;
  }

  // Save to Database Logs
  try {
    await NotificationLog.create({
      logId: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      userId,
      type: type === 'BOTH' ? 'email' : type, // Fix Enum validation
      message,
      status,
      sentAt: new Date()
    });
  } catch (dbErr) {
    console.error(`❌ DB Logging Error: ${dbErr.message}`);
  }

  return { success: status === "sent", error: errorMessage };
};

/**
 * Specific handler for RabbitMQ 'PAYMENT_SUCCESS' event
 */
const handlePaymentSuccess = async (data) => {
  const { email, phone, patientName, doctorName, amount, receiptNumber, receiptUrl, userId } = data;

  console.log(`🚀 Processing notifications for ${receiptNumber}`);

  const smsBody = `Hi ${patientName}, your payment of LKR ${amount} for ${doctorName} is successful. Ref: ${receiptNumber}`;
  const emailHtml = `<h2>Payment Successful!</h2><p>Dear ${patientName}, your appointment with ${doctorName} is confirmed.</p><p>Receipt Number: <strong>${receiptNumber}</strong></p>`;

  let smsStatus = 'sent';
  let emailStatus = 'sent';

  // 1. Try SMS
  try {
    const result = await sendSMS(phone, smsBody);
    smsStatus = result.status || 'sent';
  } catch (smsErr) {
    smsStatus = 'failed';
    console.error(`[SMS Error]`, smsErr.message);
  }

  // 2. Try Email
  try {
    await sendEmail(email, 'MediZen Appointment Confirmation', emailHtml, receiptUrl, receiptNumber);
  } catch (emailErr) {
    emailStatus = 'failed';
    console.error(`[Email Error]`, emailErr.message);
  }

  // 3. Final Audit Log
  try {
    await NotificationLog.create({
      logId: `LOG-${Date.now()}`,
      userId: userId || "user_123",
      type: "sms", // Primary type for this log entry
      message: smsBody,
      status: (smsStatus === 'failed' || emailStatus === 'failed') ? 'failed' : smsStatus
    });
    console.log("📝 Notification logged to Database.");
  } catch (logErr) {
    console.error("❌ DB Audit Log Error:", logErr.message);
  }
};

module.exports = { processNotification, handlePaymentSuccess };