const NotificationLog = require("../models/NotificationLog");
const NotificationPreference = require("../models/NotificationPreference");
const { sendEmail } = require("./emailService");
const { sendSMS } = require("./smsService");

/**
 * CORE SERVICE: Handle all notification logic
 * Used by both Controllers (REST) and Consumer (RabbitMQ)
 */

const processNotification = async ({ userId, type, message, subject, recipient }) => {
  if (!userId || !type || !message) {
    throw new Error("userId, type, and message are required");
  }

  // 1. Fetch user preferences
  const prefs = await NotificationPreference.findOne({ userId });
  
  // 2. Default logic: enable if no prefs record, but check enabled flags
  const isEmailEnabled = prefs ? prefs.emailEnabled : true;
  const isSMSEnabled = prefs ? prefs.smsEnabled : true;

  // 3. Status tracking
  let status = "sent";
  let errorMessage = null;

  try {
    if (type === "email") {
      if (!isEmailEnabled) throw new Error(`User ${userId} has disabled email`);
      if (!recipient) throw new Error(`Recipient required for email`);
      await sendEmail(recipient, subject, message);
    } else if (type === "sms") {
      if (!isSMSEnabled) throw new Error(`User ${userId} has disabled SMS`);
      if (!recipient) throw new Error(`Recipient required for SMS`);
      await sendSMS(recipient, message);
    } else {
      throw new Error(`Invalid type: ${type}`);
    }
  } catch (err) {
    status = "failed";
    errorMessage = err.message;
    console.error(`[Service Execution Failure] ${err.message}`);
    // Don't rethrow yet, we want to log the failure
  }

  // 4. Save to LOGS
  console.log(`💾 Attempting to save notification log for user ${userId}...`);
  try {
    const log = await NotificationLog.create({
      logId: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      userId,
      type,
      message,
      status,
      sentAt: new Date()
    });
    console.log(`✅ Notification log saved: ${log.logId} in collection 'logs'`);
  } catch (err) {
    console.error(`❌ Failed to save notification log: ${err.message}`);
    // We don't throw here to avoid failing the whole request if only logging fails
    // but in a production app, we might want to handle this more strictly
  }

  return { success: status === "sent", error: errorMessage };
};

module.exports = { processNotification };
