const amqp = require("amqplib");

let channel = null;
let connection = null;

const connectRabbitMQ = async () => {
  try {
    const rabbitURL = process.env.RABBITMQ_URL;
    if (!rabbitURL) {
      console.log("⚠️ RabbitMQ URL not provided. Running without queue.");
      return null;
    }

    connection = await amqp.connect(rabbitURL);
    channel = await connection.createChannel();

    console.log(`🐇 RabbitMQ connected`);
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
