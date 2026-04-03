const amqp = require("amqplib");

let channel = null;
let connection = null;

const connectRabbitMQ = async () => {
  try {
    if (!process.env.RABBITMQ_URL) {
      console.log("⚠️ RabbitMQ URL not provided. Running without queue.");
      return null;
    }

    connection = await amqp.connect(process.env.RABBITMQ_URL);
    channel = await connection.createChannel();

    console.log("🐇 RabbitMQ connected");
    return channel;
  } catch (error) {
    console.error("❌ RabbitMQ connection failed:", error.message);
    return null;
  }
};

const getChannel = () => channel;

module.exports = {
  connectRabbitMQ,
  getChannel,
};