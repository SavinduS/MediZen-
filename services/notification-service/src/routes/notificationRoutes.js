const express = require("express");
const router = express.Router();
const {
  sendManualNotification,
  getHistoryByUserId,
  updatePreferences
} = require("../controllers/notificationController");

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
