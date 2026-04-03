const mongoose = require("mongoose");

const userPrefsSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
  },
  emailEnabled: {
    type: Boolean,
    default: true,
  },
  smsEnabled: {
    type: Boolean,
    default: true,
  },
  emailAddress: {
    type: String,
    default: null,
  },
  phoneNumber: {
    type: String,
    default: null,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("UserPrefs", userPrefsSchema);