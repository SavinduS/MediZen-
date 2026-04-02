const mongoose = require("mongoose");

const AuditLogSchema = new mongoose.Schema({
  logId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  adminId: {
    type: String,
    required: true,
    trim: true,
  },
  action: {
    type: String,
    required: true,
    trim: true,
  },
  targetId: {
    type: String,
    default: null,
    trim: true,
  },
  targetType: {
    type: String,
    required: true,
    enum: ["DOCTOR", "PAYMENT", "USER"],
    trim: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("AuditLog", AuditLogSchema);