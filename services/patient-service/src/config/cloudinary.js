const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");
require("dotenv").config();

const path = require("path");

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

    const ext = path.extname(file.originalname).toLowerCase();
    const isPDF = ext === ".pdf" || file.mimetype === "application/pdf";

    if (isPDF) {
      return {
        folder: `medical_reports/${patientName}`,
        resource_type: "raw",
        // Keep the full filename with extension for raw files
        public_id: `${Date.now()}-${file.originalname}`,
      };
    }

    return {
      folder: `medical_reports/${patientName}`,
      resource_type: "auto",
      public_id: `${Date.now()}-${path.basename(file.originalname, ext)}`,
    };
  },
});

const upload = multer({ storage: storage });

module.exports = {
  cloudinary,
  upload,
};
