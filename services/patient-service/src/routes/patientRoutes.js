const express = require("express");
const { ClerkExpressWithAuth } = require("@clerk/clerk-sdk-node");
const { upload } = require("../config/cloudinary");
const {
  getProfile,
  updateProfile,
  uploadReport,
  getReports,
  deleteReport,
  getInternalProfile
} = require("../controllers/patientController");

const router = express.Router();

router.get("/profile", ClerkExpressWithAuth(), getProfile);
router.get("/internal/:clerkId", getInternalProfile);
router.put("/profile", ClerkExpressWithAuth(), updateProfile);
router.post(
  "/reports",
  ClerkExpressWithAuth(),
  upload.single("report"),
  uploadReport,
);
router.get("/reports", ClerkExpressWithAuth(), getReports);
router.get("/reports/:patientId", getReportsByPatientId);
router.delete("/reports/:id", ClerkExpressWithAuth(), deleteReport);

module.exports = router;
