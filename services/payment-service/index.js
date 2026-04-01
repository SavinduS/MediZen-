const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const PDFDocument = require("pdfkit");
require("dotenv").config();

const Payment = require("./models/Payment");
const Counter = require("./models/Counter");

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// MongoDB Connection
if (!process.env.MONGO_URI) {
  console.error("❌ Critical: MONGO_URI is missing in .env");
  process.exit(1);
}

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Payment DB Connected"))
  .catch((err) => console.error("❌ DB Connection Error:", err));


// Atomic Payment ID Generation (PAY001, PAY002...)
const getNextPaymentId = async () => {
  const counter = await Counter.findOneAndUpdate(
    { _id: "paymentId" },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return `PAY${String(counter.seq).padStart(3, "0")}`;
};


// 1. POST /api/payments/initiate
app.post("/api/payments/initiate", async (req, res) => {
  try {
    const { appointmentId, patientId, amount } = req.body;

    // Financial Validation: Ensure amount is positive and rounded to 2 decimals
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ message: "Amount must be a positive number" });
    }
    const finalAmount = Number(parsedAmount.toFixed(2));

    if (!appointmentId || !patientId) {
      return res.status(400).json({ message: "appointmentId and patientId are required" });
    }

    const paymentId = await getNextPaymentId();

    const newPayment = new Payment({
      paymentId,
      appointmentId,
      patientId,
      amount: finalAmount,
      currency: "LKR",
      status: "pending",
      txnId: null,
    });

    await newPayment.save();

    res.status(201).json({
      message: "Payment initiated successfully",
      payment: newPayment,
    });
  } catch (error) {
    console.error("❌ Initiation Error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// 2. POST /api/payments/webhook
// 2. POST /api/payments/webhook
app.post("/api/payments/webhook", async (req, res) => {
  try {
    // Webhook Security Check
    const secret = req.headers["x-webhook-secret"];
    if (secret !== process.env.WEBHOOK_SECRET) {
      return res.status(401).json({ message: "Unauthorized webhook request" });
    }

    const { id, status } = req.body;

    if (!id || !["completed", "failed"].includes(status)) {
      return res.status(400).json({ message: "Invalid id or status" });
    }

    const payment = await Payment.findById(id);
    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    // Status Guarding
    if (payment.status === "completed") {
      return res.status(200).json({
        message: "Payment already completed",
        payment
      });
    }

    payment.status = status;

    if (status === "completed" && !payment.txnId) {
      payment.txnId = "TXN" + Math.floor(100000 + Math.random() * 900000);
    }

    await payment.save();

    res.json({ message: "Webhook processed successfully", payment });
  } catch (error) {
    console.error("❌ Webhook Error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// 3. GET /api/payments/:id
app.get("/api/payments/:id", async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) return res.status(404).json({ message: "Payment not found" });
    res.json(payment);
  } catch (error) {
    if (error.kind === "ObjectId") return res.status(400).json({ message: "Invalid ID format" });
    res.status(500).json({ error: error.message });
  }
});


// 4. GET /api/payments/:id/receipt
app.get("/api/payments/:id/receipt", async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);

    if (!payment) return res.status(404).json({ message: "Payment not found" });
    if (payment.status !== "completed") {
      return res.status(400).json({ message: "Receipt only available for completed payments" });
    }

    const doc = new PDFDocument({ margin: 50 });

    // Set headers BEFORE piping to avoid "headers already sent" errors if doc generation fails
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=receipt_${payment.paymentId}.pdf`);

    doc.pipe(res);

    doc.fillColor("#2E86C1").fontSize(24).text("MediZen Healthcare", { align: "center" });
    doc.fontSize(10).fillColor("#555").text("Payment Receipt", { align: "center" }).moveDown(2);
    
    doc.moveTo(50, 110).lineTo(550, 110).strokeColor("#ccc").stroke().moveDown(2);

    doc.fontSize(12).fillColor("#000");
    doc.text(`Payment ID: ${payment.paymentId}`);
    doc.text(`Transaction ID: ${payment.txnId}`);
    doc.text(`Patient ID: ${payment.patientId}`);
    doc.text(`Appointment ID: ${payment.appointmentId}`);
    doc.text(`Date: ${new Date(payment.createdAt).toLocaleString()}`);
    doc.moveDown();
    
    doc.fontSize(16).fillColor("#27AE60").text(`Total Paid: ${payment.currency} ${payment.amount.toFixed(2)}`, { align: "right" });

    doc.end();
  } catch (error) {
    // If headers already sent, we cannot send a JSON error
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to generate receipt" });
    }
    console.error("❌ PDF Generation Error:", error.message);
  }
});

const PORT = process.env.PORT || 5007;
app.listen(PORT, () => console.log(`🚀 Payment Service running on port ${PORT}`));
