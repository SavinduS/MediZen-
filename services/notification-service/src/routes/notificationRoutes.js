const express = require("express");
const router = express.Router();
const {
  sendManualNotification,
  getHistoryByUserId,
  updatePreferences,
  getPreferencesByUserId,
  getAllLogs
} = require("../controllers/notificationController");

/**
 * Route: GET /logs
 */
router.get("/logs", getAllLogs);

/**
 * Route: GET /prefs/:userId
 */
router.get("/prefs/:userId", getPreferencesByUserId);

/**
 * Route: POST /send
 */
router.post("/send", sendManualNotification);

/**
 * Route: GET /:userId
 */
router.get("/:userId", getHistoryByUserId);

/**
 * Route: PUT /prefs
 */
router.put("/prefs", updatePreferences);

module.exports = router;
