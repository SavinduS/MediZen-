const Patient = require("../models/Patient");
const Report = require("../models/Report");
const { cloudinary } = require("../config/cloudinary");

const getProfile = async (req, res) => {
  try {
    // 1. Check DB
    let profile = await Patient.findOne({ clerkId: req.auth.userId });

    // 2. If it exists but firstName is missing OR if it doesn't exist,
    // we take name from the request (sent by frontend) or just update it
    if (req.query.firstName && req.query.lastName) {
      profile = await Patient.findOneAndUpdate(
        { clerkId: req.auth.userId },
        {
          clerkId: req.auth.userId,
          firstName: req.query.firstName,
          lastName: req.query.lastName,
        },
        { upsert: true, new: true },
      );
    }

    res.json(profile || { message: "No profile found" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const updated = await Patient.findOneAndUpdate(
      { clerkId: req.auth.userId },
      { ...req.body, clerkId: req.auth.userId },
      { upsert: true, new: true },
    );
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const uploadReport = async (req, res) => {
  try {
    // Determine resource type based on file extension or mimetype
    const isPDF = req.file.mimetype === "application/pdf" || req.file.originalname.toLowerCase().endsWith(".pdf");
    
    // Cloudinary result may provide resource_type, but we can also infer it
    const resourceType = isPDF ? "raw" : (req.file.resource_type || "image");

    const newReport = new Report({
      patientClerkId: req.auth.userId,
      fileName: req.body.fileName || "Medical Report",
      fileUrl: req.file.path, // Cloudinary URL
      publicId: req.file.filename, // Cloudinary public_id (includes folder)
      resourceType: resourceType,
    });
    await newReport.save();
    res.json({ message: "Upload successful", report: newReport });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getReports = async (req, res) => {
  try {
    const reports = await Report.find({ patientClerkId: req.auth.userId }).sort({
      uploadedAt: -1,
    });
    res.json(reports);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteReport = async (req, res) => {
  try {
    const report = await Report.findOne({
      _id: req.params.id,
      patientClerkId: req.auth.userId,
    });

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    // Delete from Cloudinary
    if (report.publicId) {
      await cloudinary.uploader.destroy(report.publicId, {
        resource_type: report.resourceType || "image",
      });
    }

    // Delete from MongoDB
    await Report.findByIdAndDelete(req.params.id);

    res.json({ message: "Report deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  uploadReport,
  getReports,
  deleteReport,
};
