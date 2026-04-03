const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const NotificationLog = require("./models/NotificationLog");
const UserPrefs = require("./models/UserPrefs");
const { sendEmail } = require("./services/emailService");
const { sendSMS } = require("./services/smsService");
const { connectRabbitMQ, getChannel } = require("./services/rabbitmq");

const app = express();

app.use(express.json());
app.use(cors());

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Notification DB Connected"))
  .catch((err) => console.error("❌ DB Connection Error:", err.message));

const generateLogId = () => {
  return "LOG" + Date.now() + Math.floor(100 + Math.random() * 900);
};

const createLog = async ({
  userId,
  type,
  recipient,
  message,
  status,
  errorMessage = null,
}) => {
  return NotificationLog.create({
    logId: generateLogId(),
    userId,
    type,
    recipient,
    message,
    status,
    errorMessage,
    sentAt: new Date(),
  });
};

const processNotification = async ({ userId, type, message, subject }) => {
  if (!userId || !type || !message) {
    throw new Error("userId, type and message are required");
  }

  if (!["email", "sms"].includes(type)) {
    throw new Error("type must be 'email' or 'sms'");
  }

  const prefs = await UserPrefs.findOne({ userId });

  const emailEnabled = prefs ? prefs.emailEnabled : true;
  const smsEnabled = prefs ? prefs.smsEnabled : true;
  const emailAddress = prefs?.emailAddress || null;
  const phoneNumber = prefs?.phoneNumber || null;

  if (type === "email") {
    if (!emailEnabled) {
      throw new Error("Email notifications are disabled for this user");
    }

    if (!emailAddress) {
      throw new Error("No email address found for this user");
    }

    try {
      await sendEmail({
        to: emailAddress,
        subject: subject || "Notification from MediZen",
        text: message,
      });

      return await createLog({
        userId,
        type,
        recipient: emailAddress,
        message,
        status: "sent",
      });
    } catch (error) {
      await createLog({
        userId,
        type,
        recipient: emailAddress,
        message,
        status: "failed",
        errorMessage: error.message,
      });
      throw error;
    }
  }

  if (type === "sms") {
    if (!smsEnabled) {
      throw new Error("SMS notifications are disabled for this user");
    }

    if (!phoneNumber) {
      throw new Error("No phone number found for this user");
    }

    try {
      await sendSMS({
        to: phoneNumber,
        body: message,
      });

      return await createLog({
        userId,
        type,
        recipient: phoneNumber,
        message,
        status: "sent",
      });
    } catch (error) {
      await createLog({
        userId,
        type,
        recipient: phoneNumber,
        message,
        status: "failed",
        errorMessage: error.message,
      });
      throw error;
    }
  }
};

app.get("/", (req, res) => {
  res.send("Notification Service is running ✅");
});

// 1. POST /api/notifications/send
app.post("/api/notifications/send", async (req, res) => {
  try {
    const { userId, type, message, subject } = req.body;

    const log = await processNotification({ userId, type, message, subject });

    res.status(201).json({
      success: true,
      message: "Notification processed successfully",
      log,
    });
  } catch (error) {
    console.error("❌ Send Notification Error:", error.message);
    res.status(400).json({ error: error.message });
  }
});

// 2. GET /api/notifications/:userId
app.get("/api/notifications/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const logs = await NotificationLog.find({ userId }).sort({ sentAt: -1 });

    res.json({
      success: true,
      count: logs.length,
      notifications: logs,
    });
  } catch (error) {
    console.error("❌ Fetch Notifications Error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// 3. PUT /api/notifications/prefs
app.put("/api/notifications/prefs", async (req, res) => {
  try {
    const {
      userId,
      emailEnabled,
      smsEnabled,
      emailAddress,
      phoneNumber,
    } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    const updateData = {
      updatedAt: new Date(),
    };

    if (typeof emailEnabled === "boolean") {
      updateData.emailEnabled = emailEnabled;
    }

    if (typeof smsEnabled === "boolean") {
      updateData.smsEnabled = smsEnabled;
    }

    if (typeof emailAddress === "string") {
      updateData.emailAddress = emailAddress;
    }

    if (typeof phoneNumber === "string") {
      updateData.phoneNumber = phoneNumber;
    }

    const prefs = await UserPrefs.findOneAndUpdate(
      { userId },
      { $set: updateData },
      { new: true, upsert: true }
    );

    res.json({
      success: true,
      message: "Notification preferences updated successfully",
      preferences: prefs,
    });
  } catch (error) {
    console.error("❌ Update Prefs Error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// 4. GET /api/notifications/prefs/:userId
app.get("/api/notifications/prefs/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    let prefs = await UserPrefs.findOne({ userId });

    if (!prefs) {
      prefs = {
        userId,
        emailEnabled: true,
        smsEnabled: true,
        emailAddress: null,
        phoneNumber: null,
      };
    }

    res.json({
      success: true,
      preferences: prefs,
    });
  } catch (error) {
    console.error("❌ Fetch Prefs Error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// RabbitMQ consumer
const startConsumer = async () => {
  const channel = getChannel();
  if (!channel) return;

  const queueName = process.env.RABBITMQ_QUEUE || "notifications_queue";

  await channel.assertQueue(queueName, { durable: true });

  channel.consume(queueName, async (msg) => {
    if (!msg) return;

    try {
      const data = JSON.parse(msg.content.toString());

      await processNotification({
        userId: data.userId,
        type: data.type,
        message: data.message,
        subject: data.subject,
      });

      console.log("✅ Notification event processed from RabbitMQ");
      channel.ack(msg);
    } catch (error) {
      console.error("❌ RabbitMQ Notification Error:", error.message);
      channel.nack(msg, false, false);
    }
  });

  console.log(`📥 Listening to RabbitMQ queue: ${queueName}`);
};

const PORT = process.env.PORT || 5008;

const startServer = async () => {
  await connectRabbitMQ();
  await startConsumer();

  app.listen(PORT, () => {
    console.log(`🚀 Notification Service running on port ${PORT}`);
  });
};

startServer();