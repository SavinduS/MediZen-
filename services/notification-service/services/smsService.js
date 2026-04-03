let client = null;

if (
  process.env.TWILIO_ACCOUNT_SID &&
  process.env.TWILIO_AUTH_TOKEN &&
  process.env.TWILIO_ACCOUNT_SID.startsWith("AC")
) {
  const twilio = require("twilio");
  client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );
}

const sendSMS = async ({ to, body }) => {
  if (!to) {
    throw new Error("Recipient phone number is required");
  }

  if (!client || !process.env.TWILIO_PHONE_NUMBER) {
    console.log("📱 Mock SMS Sent");
    console.log("To:", to);
    console.log("Body:", body);
    return { mocked: true };
  }

  const message = await client.messages.create({
    body,
    from: process.env.TWILIO_PHONE_NUMBER,
    to,
  });

  return message;
};

module.exports = { sendSMS };