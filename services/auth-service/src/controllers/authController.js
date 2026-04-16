const { createClerkClient } = require("@clerk/clerk-sdk-node");
const User = require("../models/User");

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});

const syncUser = async (req, res) => {
  const { userId } = req.auth;

  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  try {
    // 1. Get Clerk user
    const clerkUser = await clerkClient.users.getUser(userId);

    // 2. Check role in metadata
    let role = clerkUser.publicMetadata?.role;

    // ✅ 3. If no role → set DEFAULT role immediately
    if (!role) {
      role = "patient";

      await clerkClient.users.updateUserMetadata(userId, {
        publicMetadata: {
          ...clerkUser.publicMetadata, // keep existing metadata
          role: "patient",
        },
      });
    }

    // 4. Check user in MongoDB
    let user = await User.findOne({ clerkId: userId });

    // 5. Create user if not exists
    if (!user) {
      user = new User({
        clerkId: userId,
        email: req.body.email,
      });

      await user.save();
    }

    // 6. Return response
    res.status(200).json({
      clerkId: user.clerkId,
      email: user.email,
      createdAt: user.createdAt,
      role: role, // from Clerk metadata
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getAdminData = async (req, res) => {
  try {
    const clerkUser = await clerkClient.users.getUser(req.auth.userId);
    const role = clerkUser.publicMetadata?.role;

    if (role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }

    res.json({ message: "Welcome Admin" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  syncUser,
  getAdminData,
  getAllUsers,
};