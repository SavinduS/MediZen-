const nodemailer = require("nodemailer");

/**
 * Service: Nodemailer email sender with fallback
 */
const sendEmail = async (to, subject, text) => {
  // 1. Fallback: Check credentials
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn(`[SKIP] Real email skipped for ${to} (Missing SMTP credentials)`);
    return { success: true, mock: true };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject: subject || "MediZen Notification",
      text,
    });

    console.log(`[Email] Success: ${to}`);
    return { success: true };
  } catch (err) {
    console.error(`[Email Failure] ${err.message}`);
    throw err;
  }
};

module.exports = { sendEmail };
