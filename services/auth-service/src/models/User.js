const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    clerkId: { type: String, required: true, unique: true },
    email: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { strict: true },
);

module.exports = mongoose.model("User", userSchema);
