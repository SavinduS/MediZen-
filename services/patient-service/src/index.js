const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const patientRoutes = require("./routes/patientRoutes");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

mongoose
  .connect(process.env.MONGO_URI, { dbName: "patients" })
  .then(() => {
    console.log("✅ Patient DB Connected to 'patients' database");
    const PORT = process.env.PORT || 5002;
    app.listen(PORT, () => console.log(`🚀 Patient Service is running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("❌ Patient DB connection error:", err.message);
    const PORT = process.env.PORT || 5002;
    app.listen(PORT, () => console.log(`⚠️ Patient Service running on port ${PORT} (Database Connection Failed)`));
  });

app.use("/api/patient", patientRoutes);
