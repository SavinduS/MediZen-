const amqp = require("amqplib");

let channel = null;
let connection = null;

/**
 * Establish connection with RabbitMQ
 */
const connectRabbitMQ = async () => {
  try {
    const rabbitURL = process.env.RABBITMQ_URL || "amqp://localhost";
    connection = await amqp.connect(rabbitURL);
    channel = await connection.createChannel();

    console.log(`🐇 RabbitMQ connected (Payment Service)`);
    return channel;
  } catch (err) {
    console.error(`❌ RabbitMQ connection failed: ${err.message}`);
    return null;
  }
};

const getChannel = () => channel;

module.exports = {
  connectRabbitMQ,
  getChannel,
};
