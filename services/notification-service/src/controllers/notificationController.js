const { processNotification } = require("../services/notificationService");
const NotificationLog = require("../models/NotificationLog");
const NotificationPreference = require("../models/NotificationPreference");

/**
 * REST CONTROLLER: Handle API requests
 */

// 1. POST /api/notifications/send
const sendManualNotification = async (req, res) => {
  try {
    const { userId, type, message, subject, recipient, phoneNumber } = req.body;

    // Strict Input Validation
    if (!userId || !type || !message) {
      return res.status(400).json({ success: false, message: "userId, type, and message are required" });
    }

    // Improved mapping: Use recipient first, fallback to phoneNumber
    const contact = recipient || phoneNumber;
    if (!contact) {
      return res.status(400).json({ success: false, message: "Recipient (email or phone) is required" });
    }

    const result = await processNotification({ 
      userId, 
      type, 
      message, 
      subject: subject || "MediZen Manual Notification", 
      recipient: contact 
    });

    if (result.success) {
      res.status(201).json({ success: true, message: "Notification processed" });
    } else {
      res.status(400).json({ success: false, message: result.error });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: "Server Error", error: err.message });
  }
};

// 2. GET /api/notifications/:userId
const getHistoryByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    const logs = await NotificationLog.find({ userId }).sort({ sentAt: -1 });

    res.status(200).json({
      success: true,
      count: logs.length,
      data: logs
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server Error", error: err.message });
  }
};

// 3. PUT /api/notifications/prefs
const updatePreferences = async (req, res) => {
  try {
    const { userId, emailEnabled, smsEnabled } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, message: "userId is required" });
    }

    const prefs = await NotificationPreference.findOneAndUpdate(
      { userId },
      { $set: { emailEnabled, smsEnabled } },
      { new: true, upsert: true }
    );

    res.status(200).json({
      success: true,
      message: "Preferences updated",
      data: prefs
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server Error", error: err.message });
  }
};

// 4. GET /api/notifications/prefs/:userId
const getPreferencesByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    let prefs = await NotificationPreference.findOne({ userId });
    
    // Fallback if no prefs exist yet
    if (!prefs) {
      prefs = { userId, emailEnabled: true, smsEnabled: true };
    }

    res.status(200).json({
      success: true,
      data: prefs
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server Error", error: err.message });
  }
};

const getAllLogs = async (req, res) => {
  try {
    const logs = await NotificationLog.find().sort({ sentAt: -1 });
    res.status(200).json({ success: true, data: logs });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server Error", error: err.message });
  }
};

module.exports = {
  sendManualNotification,
  getHistoryByUserId,
  updatePreferences,
  getPreferencesByUserId,
  getAllLogs
};
