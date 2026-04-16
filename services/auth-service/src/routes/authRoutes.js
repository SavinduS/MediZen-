const express = require("express");
const { ClerkExpressWithAuth } = require("@clerk/clerk-sdk-node");
const { syncUser, getAdminData, getAllUsers } = require("../controllers/authController");

const router = express.Router();

router.post("/sync", ClerkExpressWithAuth(), syncUser);
router.get("/admin-data", ClerkExpressWithAuth(), getAdminData);
router.get("/users", getAllUsers);

module.exports = router;