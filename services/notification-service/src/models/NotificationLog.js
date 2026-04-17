const mongoose = require("mongoose");

/**
 * Required DB Collection: logs
 * Schema: logId, userId, type(email/sms), message, sentAt, status
 */
const notificationLogSchema = new mongoose.Schema({
  logId: {
    type: String,
    required: true,
    unique: true
  },
  userId: {
    type: String,
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ["email", "sms"],
    required: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ["pending", "accepted", "queued", "sent", "delivered", "failed"],
    default: "pending"
  },
  sentAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  collection: "logs"
});

module.exports = mongoose.model("NotificationLog", notificationLogSchema, "logs");
