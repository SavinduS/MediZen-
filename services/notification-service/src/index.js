require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const connectDB = require("./config/db");
const { connectRabbitMQ, getChannel } = require("./config/rabbitmq");
const { processNotification } = require("./services/notificationService");
const notificationRoutes = require("./routes/notificationRoutes");

/**
 * MICROSERVICE: Notification Service
 */

const app = express();

// 1. Load Middlewares
app.use(express.json());
app.use(cors());
app.use(morgan("dev"));

// 2. API Routes
app.use("/api/notifications", notificationRoutes);

// 3. Root Endpoint
app.get("/", (req, res) => {
  res.status(200).json({ service: "MediZen Notification", status: "Running" });
});

/**
 * RABBITMQ CONSUMER: Production-friendly implementation
 */
const startConsumer = async () => {
  const channel = getChannel();
  if (!channel) return;

  const queue = process.env.RABBITMQ_QUEUE || "notifications_queue";
  await channel.assertQueue(queue, { durable: true });

  channel.consume(queue, async (msg) => {
    if (!msg) return;

    try {
      const content = msg.content.toString();
      const event = JSON.parse(content);

      console.log(`[RabbitMQ] Received Event: ${event.type} for user ${event.userId}`);

      let message = event.message || "New update from MediZen";
      let subject = event.subject || "MediZen Update";

      // Improved Type detection: If recipient looks like a phone number, force SMS
      const contact = event.recipient || event.email || event.phone;
      let type = event.preferredType || (event.type.includes("SMS") ? "sms" : "email");
      
      const phoneRegex = /^\+?[1-9]\d{1,14}$/;
      if (type === "email" && contact && phoneRegex.test(contact.replace(/\s/g, ''))) {
        type = "sms";
      }

      switch (event.type) {
        case "APPOINTMENT_BOOKED":
          subject = "Appointment Confirmation";
          message = `Hello, your appointment with Dr. ${event.doctorName} is confirmed for ${event.date}.`;
          break;
        case "APPOINTMENT_CANCELLED":
          subject = "Appointment Cancelled";
          message = `Your appointment for ${event.date} has been cancelled.`;
          break;
        case "PAYMENT_SUCCESS":
          subject = event.subject || "Payment Received";
          message = event.message || `Payment of ${event.amount} ${event.currency} was successful. Transaction ID: ${event.txnId}`;
          break;
        case "DOCTOR_VERIFIED":
          subject = "Profile Verified";
          message = `Your medical profile has been verified. You can now start accepting appointments.`;
          break;
      }

      const result = await processNotification({
        userId: event.userId,
        type,
        message,
        subject,
        recipient: contact
      });

      if (result.success) {
        console.log(`✅ [RabbitMQ] Notification processed for ${event.type}`);
        channel.ack(msg);
      } else {
        console.warn(`⚠️ [RabbitMQ] Known Failure: ${result.error}`);
        channel.ack(msg); // ack if handled to avoid infinite loops
      }
    } catch (error) {
      console.error(`❌ [RabbitMQ Consumer Error] ${error.message}`);
      channel.nack(msg, false, false);
    }
  });

  console.log(`👂 RabbitMQ consumer listening on ${queue}`);
};

// 4. Not Found Middleware
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// 5. Global Error Handler
app.use((err, req, res, next) => {
  console.error(`❌ Fatal Server Error: ${err.stack}`);
  res.status(500).json({ success: false, message: "Internal server error" });
});

// 6. Define Port and Start Server
const PORT = process.env.PORT || 5008;

const startServer = async () => {
  console.log(`◇ Initializing environment from .env`);
  
  await connectDB();
  await connectRabbitMQ();
  await startConsumer();

  // TRANSPORT LOGS (Fixed: Removed Twilio check)
  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    console.log(`📩 SMTP Email service configured`);
  } else {
    console.log(`⚠️ SMTP credentials missing - Email will be skipped/mocked`);
  }

  if (process.env.VONAGE_API_KEY && process.env.VONAGE_API_SECRET) {
    console.log(`📱 Vonage SMS service configured`);
  } else {
    console.log(`⚠️ Vonage credentials missing - SMS will be skipped/mocked`);
  }

  app.listen(PORT, () => {
    console.log(`🚀 Notification Service running on port ${PORT}`);
  });
};

startServer();
