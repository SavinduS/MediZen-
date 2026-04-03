const nodemailer = require("nodemailer");

let transporter = null;

if (
  process.env.SMTP_HOST &&
  process.env.SMTP_PORT &&
  process.env.SMTP_USER &&
  process.env.SMTP_PASS
) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

const sendEmail = async ({ to, subject, text, html }) => {
  if (!to) {
    throw new Error("Recipient email is required");
  }

  if (!transporter) {
    console.log(" Mock Email Sent");
    console.log("To:", to);
    console.log("Subject:", subject);
    console.log("Text:", text);
    console.log("HTML:", html);
    return { mocked: true };
  }

  const info = await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject,
    text,
    html,
  });

  return info;
};

module.exports = { sendEmail };