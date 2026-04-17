const express = require("express");
const { ClerkExpressWithAuth } = require("@clerk/clerk-sdk-node");
const { syncUser, getAdminData, getAllUsers, getUserByClerkId } = require("../controllers/authController");

const router = express.Router();

router.post("/sync", ClerkExpressWithAuth(), syncUser);
router.get("/admin-data", ClerkExpressWithAuth(), getAdminData);
router.get("/users", getAllUsers);
router.get("/users/:clerkId", getUserByClerkId);

module.exports = router;