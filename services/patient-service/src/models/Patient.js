const mongoose = require("mongoose");

const PatientSchema = new mongoose.Schema({
  clerkId: { type: String, required: true, unique: true },
  firstName: String,
  lastName: String,
  dob: String,
  bloodGroup: String,
  allergies: String,
  contact: String,
  medicalHistory: [{ type: mongoose.Schema.Types.ObjectId, ref: "Report" }],
});

module.exports = mongoose.model("Patient", PatientSchema);
