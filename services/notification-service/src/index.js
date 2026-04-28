require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const amqp = require('amqplib');
const cors = require('cors');
const { handlePaymentSuccess } = require('./services/notificationService');
const notificationRoutes = require('./routes/notificationRoutes');

const app = express();
app.use(cors());
app.use(express.json());
const PORT = process.env.PORT || 5008;

/**
 * 1. RABBITMQ CONFIGURATION
 * Handles the connection string and provides local development overrides.
 */
let RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost';

console.log('------------------------------------------------');
console.log(`Checking Environment: RABBITMQ_URL is "${RABBITMQ_URL}"`);
console.log('------------------------------------------------');

/**
 * 2. DATABASE CONNECTION
 */
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/notification_db';
mongoose.connect(MONGO_URI)
  .then(() => console.log('Successfully connected to Notification MongoDB'))
  .catch(err => console.error('MongoDB Connection Error:', err));

/**
 * 3. UNIFIED RABBITMQ CONSUMER LOGIC
 * Connects to RabbitMQ and listens for incoming notification events.
 */
async function startConsumer() {
  try {
    console.log(`Attempting to connect to RabbitMQ...`);
    
    // Establishing connection and channel
    const connection = await amqp.connect(RABBITMQ_URL);
    const channel = await connection.createChannel();
    const queue = 'notifications_queue';

    // Ensure the queue exists before consuming
    await channel.assertQueue(queue, { durable: true });
    
    console.log(`Consumer is online. Listening on queue: [${queue}]`);
    
    channel.consume(queue, async (msg) => {
      if (msg !== null) {
        try {
          const data = JSON.parse(msg.content.toString());
          console.log(`Event Received: ${data.type}`);

          // Process specific event types
          if (data.type === 'PAYMENT_SUCCESS') {
            console.log(`Processing notifications for Receipt: ${data.receiptNumber || 'N/A'}`);
            
            // This service handles Email, SMS, and Audit Logging in one step
            await handlePaymentSuccess(data);
          }

          // Acknowledge the message once processed
          channel.ack(msg); 
        } catch (processErr) {
          console.error("Error processing message content:", processErr.message);
          // Acknowledge anyway to prevent infinite loop or handle re-queue logic here
          channel.ack(msg); 
        }
      }
    });

    // Handle connection closure or errors
    connection.on("error", (err) => {
        console.error("RabbitMQ Connection Error detected", err);
        setTimeout(startConsumer, 5000);
    });

  } catch (err) {
    console.error(`RabbitMQ Connection Failed: ${err.message}`);
    
    // Retry connection every 5 seconds if it fails initially
    console.log(`Retrying RabbitMQ connection in 5 seconds...`);
    setTimeout(startConsumer, 5000);
  }
}

// Initialize the RabbitMQ Consumer
startConsumer();

/**
 * 4. EXPRESS ROUTES
 */
app.use('/api/notifications', notificationRoutes);

app.get('/health', (req, res) => {
    res.json({ 
        service: 'Notification Service', 
        status: 'Healthy', 
        rabbitmq_connected_to: RABBITMQ_URL 
    });
});

app.listen(PORT, () => {
  console.log(`Notification Service server running on port ${PORT}`);
});