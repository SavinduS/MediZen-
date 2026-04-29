const Patient = require("../models/Patient");
const Report = require("../models/Report");
const { cloudinary } = require("../config/cloudinary");

const getAuthenticatedClerkId = (req) => {
  return (
    req.auth?.userId ||
    req.auth?.sessionClaims?.sub ||
    req.headers["x-clerk-user-id"] ||
    null
  );
};

const requireClerkId = (req, res) => {
  const clerkId = getAuthenticatedClerkId(req);
  if (!clerkId) {
    res.status(401).json({
      error: "Unauthorized: missing Clerk user context",
      hint: "Ensure Authorization header is forwarded by API Gateway/Ingress",
    });
    return null;
  }
  return clerkId;
};

const getProfile = async (req, res) => {
  const clerkId = requireClerkId(req, res);
  if (!clerkId) return;

  try {
    // 1. Check DB
    let profile = await Patient.findOne({ clerkId });

    // 2. If it exists but firstName is missing OR if it doesn't exist,
    // we take name from the request (sent by frontend) or just update it
    if (req.query.firstName && req.query.lastName) {
      profile = await Patient.findOneAndUpdate(
        { clerkId },
        {
          clerkId,
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
  const clerkId = requireClerkId(req, res);
  if (!clerkId) return;

  try {
    const updated = await Patient.findOneAndUpdate(
      { clerkId },
      { ...req.body, clerkId },
      { upsert: true, new: true },
    );
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const uploadReport = async (req, res) => {
  const clerkId = requireClerkId(req, res);
  if (!clerkId) return;

  try {
    // Cloudinary result fields are available in req.file
    // format, resource_type, original_filename, secure_url (path), etc.
    
    // Check if it's a PDF from multiple sources
    const isPDF = req.file.mimetype === "application/pdf" || 
                  req.file.originalname?.toLowerCase().endsWith(".pdf") ||
                  req.file.format === "pdf";
    
    // Use Cloudinary's returned resource_type if available, otherwise fallback
    const resourceType = req.file.resource_type || (isPDF ? "raw" : "image");

    const newReport = new Report({
      patientClerkId: clerkId,
      fileName: req.body.fileName || req.file.originalname || "Medical Report",
      fileUrl: req.file.path, // Cloudinary URL (should be secure_url)
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
  const clerkId = requireClerkId(req, res);
  if (!clerkId) return;

  try {
    const reports = await Report.find({ patientClerkId: clerkId }).sort({
      uploadedAt: -1,
    });
    res.json(reports);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteReport = async (req, res) => {
  const clerkId = requireClerkId(req, res);
  if (!clerkId) return;

  try {
    const report = await Report.findOne({
      _id: req.params.id,
      patientClerkId: clerkId,
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

const getInternalProfile = async (req, res) => {
  try {
    const profile = await Patient.findOne({ clerkId: req.params.clerkId });
    if (!profile) return res.status(404).json({ message: "Patient not found" });
    
    res.json({
      bloodGroup: profile.bloodGroup,
      allergies: profile.allergies,
      firstName: profile.firstName
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getReportsByPatientId = async (req, res) => {
  try {
    const reports = await Report.find({ patientClerkId: req.params.patientId }).sort({
      uploadedAt: -1,
    });
    res.json(reports);
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
  getInternalProfile,
  getReportsByPatientId
};
