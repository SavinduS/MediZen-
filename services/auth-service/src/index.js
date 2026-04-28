require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const authRoutes = require("./routes/authRoutes");

const app = express();
app.use(cors());
app.use(express.json());

mongoose
  .connect(process.env.MONGO_URI, { dbName: "users" })
  .then(() => {
    console.log("✅ Auth DB Connected to 'users' database");
    const PORT = process.env.PORT || 5001;
    app.listen(PORT, () => console.log(`🚀 Auth Service is running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("❌ Auth DB connection error:", err.message);
    // Start server anyway to allow health checks, but with warning
    const PORT = process.env.PORT || 5001;
    app.listen(PORT, () => console.log(`⚠️ Auth Service running on port ${PORT} (Database Connection Failed)`));
  });

app.use("/api/auth", authRoutes);
