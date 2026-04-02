const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const { ClerkExpressWithAuth } = require("@clerk/clerk-sdk-node");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB User Schema
const userSchema = new mongoose.Schema({
  clerkId: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  role: {
    type: String,
    enum: ["patient", "doctor", "admin"],
    default: "patient",
  },
  createdAt: { type: Date, default: Date.now },
});

const User = mongoose.model("User", userSchema);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Auth DB Connected"))
  .catch((err) => console.log(err));

// SYNC ENDPOINT: Called by Frontend after Login/Signup
app.post("/api/auth/sync", ClerkExpressWithAuth(), async (req, res) => {
  const { userId } = req.auth;

  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  try {
    // 1. Check if user exists in our DB
    let user = await User.findOne({ clerkId: userId });

    // 2. If not, create them with DEFAULT role: "patient"
    if (!user) {
      // We get email from req.body (sent by frontend)
      user = new User({
        clerkId: userId,
        email: req.body.email,
        role: "patient", // Default Role
      });
      await user.save();
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin-only route example
app.get("/api/auth/admin-data", ClerkExpressWithAuth(), async (req, res) => {
  const user = await User.findOne({ clerkId: req.auth.userId });
  if (user.role !== "admin")
    return res.status(403).json({ message: "Forbidden" });
  res.json({ message: "Welcome Admin" });
});

app.listen(5001, () => console.log("Auth Service on 5001"));
