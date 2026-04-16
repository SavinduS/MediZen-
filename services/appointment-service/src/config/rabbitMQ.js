/**
 * RabbitMQ Utility for publishing messages to other services.
 * Part of the event-driven architecture of MediZen.
 */

const amqp = require('amqplib');

let channel;

// Function to connect to the RabbitMQ server
const connectRabbitMQ = async () => {
    try {
        const connection = await amqp.connect(process.env.RABBITMQ_URL);
        channel = await connection.createChannel();
        
        // Assert the queue exists before sending (Durable ensures it survives server restarts)
        await channel.assertQueue('notification-queue', { durable: true });
        console.log('✅ Connected to RabbitMQ Broker');
    } catch (error) {
        console.error('❌ RabbitMQ Connection Error:', error.message);
    }
};

// Function to send a message to the 'notification-queue'
const publishNotification = (message) => {
    if (!channel) {
        console.error('RabbitMQ channel not initialized!');
        return;
    }
    
    // Convert object to string buffer and send to queue
    const buffer = Buffer.from(JSON.stringify(message));
    channel.sendToQueue('notification-queue', buffer);
    console.log('📬 Event published to notification-queue:', message.type);
};

module.exports = { connectRabbitMQ, publishNotification };