const mongoose = require("mongoose");

const ReportSchema = new mongoose.Schema({
  patientClerkId: String,
  fileName: String,
  fileUrl: String,
  publicId: String,
  resourceType: { type: String, default: "image" }, // To support delete correctly
  uploadedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Report", ReportSchema);
