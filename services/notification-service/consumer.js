const amqp = require("amqplib");
const { sendEmail } = require("./services/emailService");

async function consumeMessages() {
  const connection = await amqp.connect(process.env.RABBITMQ_URL);
  const channel = await connection.createChannel();

  const queue = "notifications";

  await channel.assertQueue(queue, { durable: true });

  console.log(" Waiting for messages...");

  channel.consume(queue, async (msg) => {
    if (!msg) return;

    try {
      const data = JSON.parse(msg.content.toString());
      console.log(" Received:", data);

      if (data.type === "PAYMENT_SUCCESS") {
        await sendEmail({
          to: data.email,
          subject: "Payment Confirmation",
          text: `Your payment of LKR ${data.amount} was successful.`,
          html: `
            <h2>Payment Successful</h2>
            <p>Your payment of <strong>LKR ${data.amount}</strong> was successful.</p>
          `,
        });
      }

      channel.ack(msg);
    } catch (error) {
      console.error("❌ Consumer error:", error.message);
      channel.nack(msg, false, false);
    }
  });
}

module.exports = { consumeMessages };