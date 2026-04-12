const mongoose = require("mongoose");

/**
 * Required DB Collection: prefs
 * Schema: userId, emailEnabled, smsEnabled, updatedAt
 */
const notificationPreferenceSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true
  },
  emailEnabled: {
    type: Boolean,
    default: true
  },
  smsEnabled: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: { createdAt: false, updatedAt: true },
  collection: "prefs"
});

module.exports = mongoose.model("NotificationPreference", notificationPreferenceSchema, "prefs");
