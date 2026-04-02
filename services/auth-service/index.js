const express = require("express");
const cors = require("cors");
require("dotenv").config();
const {
  StrictAuthProp,
  ClerkExpressWithAuth,
} = require("@clerk/clerk-sdk-node");
const mongoose = require("mongoose");

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection (Store additional user metadata/roles)
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Auth Service: Connected to MongoDB"))
  .catch((err) => console.error("MongoDB Connection Error:", err));

// Protected Route Example: Sync User / Get Role
// This endpoint is called after a user signs up on the frontend
app.post("/api/auth/sync", ClerkExpressWithAuth(), async (req, res) => {
  const { userId } = req.auth;
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    // Here you would typically check if user exists in your DB
    // And return their role (Patient/Doctor/Admin)
    // For Member 01, we ensure the 'Patient' role is default
    res.status(200).json({
      message: "User synced successfully",
      userId: userId,
      role: "Patient", // Logic for role assignment goes here
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Auth Service running on port ${PORT}`);
});
