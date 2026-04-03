const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const axios = require("axios");
const { v4: uuidv4 } = require("uuid");
const AuditLog = require("./models/AuditLog");

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 5009;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Admin DB Connected"))
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  });

app.get("/", (req, res) => {
  res.json({ message: "Admin Service Running" });
});

// GET /api/admin/stats
app.get("/api/admin/stats", async (req, res) => {
  try {
    const [
      userResult,
      doctorResult,
      paymentResult,
      appointmentResult,
    ] = await Promise.allSettled([
      axios.get(`${process.env.USER_SERVICE_URL}/api/users`),
      axios.get(`${process.env.DOCTOR_SERVICE_URL}/api/doctors`),
      axios.get(`${process.env.PAYMENT_SERVICE_URL}/api/payments`),
      process.env.APPOINTMENT_SERVICE_URL
        ? axios.get(`${process.env.APPOINTMENT_SERVICE_URL}/api/appointments`)
        : Promise.resolve({ data: [] }),
    ]);

    let totalUsers = 0;
    let totalDoctors = 0;
    let totalBookings = 0;
    let totalRevenue = 0;

    if (userResult.status === "fulfilled") {
      const data = userResult.value.data;
      if (Array.isArray(data)) totalUsers = data.length;
      else if (Array.isArray(data.users)) totalUsers = data.users.length;
      else if (typeof data.totalUsers === "number") totalUsers = data.totalUsers;
    }

    if (doctorResult.status === "fulfilled") {
      const data = doctorResult.value.data;
      if (Array.isArray(data)) totalDoctors = data.length;
      else if (Array.isArray(data.doctors)) totalDoctors = data.doctors.length;
      else if (typeof data.totalDoctors === "number") totalDoctors = data.totalDoctors;
    }

    if (appointmentResult.status === "fulfilled") {
      const data = appointmentResult.value.data;
      if (Array.isArray(data)) totalBookings = data.length;
      else if (Array.isArray(data.appointments)) totalBookings = data.appointments.length;
      else if (typeof data.totalBookings === "number") totalBookings = data.totalBookings;
    }

    if (paymentResult.status === "fulfilled") {
      const data = paymentResult.value.data;
      const payments = Array.isArray(data) ? data : Array.isArray(data.payments) ? data.payments : [];

      totalRevenue = payments
        .filter((p) => ["completed", "success", "paid"].includes(String(p.status).toLowerCase()))
        .reduce((sum, p) => sum + Number(p.amount || 0), 0);
    }

    return res.status(200).json({
      totalUsers,
      totalDoctors,
      totalBookings,
      totalRevenue,
    });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to fetch admin stats",
      message: error.message,
    });
  }
});

// GET /api/admin/doctors/pending
app.get("/api/admin/doctors/pending", async (req, res) => {
  try {
    const response = await axios.get(
      `${process.env.DOCTOR_SERVICE_URL}/api/doctors/pending`
    );

    return res.status(200).json(response.data);
  } catch (error) {
    return res.status(500).json({
      error: "Could not fetch pending doctors",
      message: error.response?.data?.message || error.message || "Unknown error",
    });
  }
});

// PUT /api/admin/doctors/:id/verify
app.put("/api/admin/doctors/:id/verify", async (req, res) => {
  try {
    const doctorId = req.params.id;
    const { adminId, status, reason } = req.body;

    if (!adminId) {
      return res.status(400).json({ error: "adminId is required" });
    }

    if (!status) {
      return res.status(400).json({ error: "status is required" });
    }

    const normalizedStatus = String(status).toLowerCase();
    if (!["approved", "rejected"].includes(normalizedStatus)) {
      return res.status(400).json({
        error: "status must be either 'approved' or 'rejected'",
      });
    }

    const doctorResponse = await axios.put(
      `${process.env.DOCTOR_SERVICE_URL}/api/doctors/${doctorId}/verify`,
      {
        status: normalizedStatus,
        reason: reason || "",
      }
    );

    const newLog = new AuditLog({
      logId: uuidv4(),
      adminId,
      action: normalizedStatus === "approved" ? "VERIFY_DOCTOR" : "REJECT_DOCTOR",
      targetId: doctorId,
      targetType: "DOCTOR",
    });

    await newLog.save();

    return res.status(200).json({
      message:
        normalizedStatus === "approved"
          ? "Doctor approved successfully"
          : "Doctor rejected successfully",
      logId: newLog.logId,
      doctorServiceResponse: doctorResponse.data,
    });
  } catch (error) {
    return res.status(500).json({
      error: "Could not update doctor verification",
      message: error.response?.data?.message || error.message || "Unknown error",
    });
  }
});

// GET /api/admin/payments
app.get("/api/admin/payments", async (req, res) => {
  try {
    const { status } = req.query;

    const url = status
      ? `${process.env.PAYMENT_SERVICE_URL}/api/payments?status=${encodeURIComponent(status)}`
      : `${process.env.PAYMENT_SERVICE_URL}/api/payments`;

    const response = await axios.get(url);

    return res.status(200).json(response.data);
  } catch (error) {
    return res.status(500).json({
      error: "Could not fetch payments from Payment Service",
      message: error.response?.data?.message || error.message || "Unknown error",
    });
  }
});

app.get("/api/admin/doctors/pending", async (req, res) => {
  try {
    const response = await axios.get(
      `${process.env.DOCTOR_SERVICE_URL}/api/doctors/pending`
    );

    return res.status(200).json(response.data);
  } catch (error) {
    console.error("Pending doctors error:", error.message);
    console.error("Status:", error.response?.status);
    console.error("Response:", error.response?.data);

    return res.status(500).json({
      error: "Could not fetch pending doctors",
      message: error.response?.data || error.message || "Unknown error",
    });
  }
});

app.put("/api/admin/doctors/:id/verify", async (req, res) => {
  try {
    const doctorId = req.params.id;
    const { adminId, status, reason } = req.body;

    if (!adminId) {
      return res.status(400).json({ error: "adminId is required" });
    }

    if (!status) {
      return res.status(400).json({ error: "status is required" });
    }

    const normalizedStatus = String(status).toLowerCase();

    const doctorResponse = await axios.put(
      `${process.env.DOCTOR_SERVICE_URL}/api/doctors/${doctorId}/verify`,
      {
        status: normalizedStatus,
        reason: reason || "",
      }
    );

    const newLog = new AuditLog({
      logId: uuidv4(),
      adminId,
      action: normalizedStatus === "approved" ? "VERIFY_DOCTOR" : "REJECT_DOCTOR",
      targetId: doctorId,
      targetType: "DOCTOR",
    });

    await newLog.save();

    return res.status(200).json({
      message:
        normalizedStatus === "approved"
          ? "Doctor approved successfully"
          : "Doctor rejected successfully",
      logId: newLog.logId,
      doctorServiceResponse: doctorResponse.data,
    });
  } catch (error) {
    console.error("Verify doctor error:", error.message);
    console.error("Status:", error.response?.status);
    console.error("Response:", error.response?.data);

    return res.status(500).json({
      error: "Could not update doctor verification",
      message: error.response?.data || error.message || "Unknown error",
    });
  }
});

app.get("/api/admin/payments", async (req, res) => {
  try {
    const { status } = req.query;

    const url = status
      ? `${process.env.PAYMENT_SERVICE_URL}/api/payments?status=${encodeURIComponent(status)}`
      : `${process.env.PAYMENT_SERVICE_URL}/api/payments`;

    const response = await axios.get(url);

    return res.status(200).json(response.data);
  } catch (error) {
    console.error("Payments error:", error.message);
    console.error("Status:", error.response?.status);
    console.error("Response:", error.response?.data);

    return res.status(500).json({
      error: "Could not fetch payments from Payment Service",
      message: error.response?.data || error.message || "Unknown error",
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Admin Service running on port ${PORT}`);
});