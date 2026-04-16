const express = require("express");
const { ClerkExpressWithAuth } = require("@clerk/clerk-sdk-node");
const { syncUser, getAdminData } = require("../controllers/authController");

const router = express.Router();

router.post("/sync", ClerkExpressWithAuth(), syncUser);
router.get("/admin-data", ClerkExpressWithAuth(), getAdminData);

module.exports = router;
