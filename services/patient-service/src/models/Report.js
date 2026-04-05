const mongoose = require("mongoose");

const ReportSchema = new mongoose.Schema({
  patientClerkId: String,
  fileName: String,
  fileUrl: String,
  publicId: String,
  resourceType: String, // Store 'raw' or 'image' from Cloudinary
  uploadedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Report", ReportSchema);
