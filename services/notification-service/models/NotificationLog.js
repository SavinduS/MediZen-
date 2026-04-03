const mongoose = require("mongoose");

const notificationLogSchema = new mongoose.Schema({
  logId: {
    type: String,
    unique: true,
    required: true,
  },
  userId: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ["email", "sms"],
    required: true,
  },
  recipient: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
    trim: true,
  },
  status: {
    type: String,
    enum: ["sent", "failed"],
    default: "sent",
  },
  errorMessage: {
    type: String,
    default: null,
  },
  sentAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("NotificationLog", notificationLogSchema);