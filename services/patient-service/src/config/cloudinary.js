const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");
require("dotenv").config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    const patientName = req.body.patientName
      ? req.body.patientName.replace(/\s+/g, "_").toLowerCase()
      : req.auth?.userId || "unknown_patient";

    // Detect if the file is a PDF
    const isPDF = file.mimetype === "application/pdf" || file.originalname.toLowerCase().endsWith(".pdf");

    return {
      folder: `medical_reports/${patientName}`,
      // Use 'raw' for PDFs to preserve document type, 'auto' for others
      resource_type: isPDF ? "raw" : "auto",
      // For raw files, Cloudinary needs the extension in the public_id to serve it correctly
      public_id: isPDF 
        ? `${Date.now()}-${file.originalname}`
        : `${Date.now()}-${file.originalname.split(".")[0]}`,
    };
  },
});

const upload = multer({ storage: storage });

module.exports = {
  cloudinary,
  upload,
};
