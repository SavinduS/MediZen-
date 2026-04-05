const User = require("../models/User");

const syncUser = async (req, res) => {
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
};

const getAdminData = async (req, res) => {
  try {
    const user = await User.findOne({ clerkId: req.auth.userId });
    if (!user || user.role !== "admin")
      return res.status(403).json({ message: "Forbidden" });
    res.json({ message: "Welcome Admin" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  syncUser,
  getAdminData,
};
