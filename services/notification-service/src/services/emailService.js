const nodemailer = require("nodemailer");

/**
 * Service: Nodemailer email sender with PDF attachment support
 */
const sendEmail = async (to, subject, htmlContent, attachmentUrl, receiptNo) => {
  
  // 1. Fallback: Check if SMTP credentials exist in .env
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn(`[SKIP] Real email skipped for ${to} (Missing SMTP credentials)`);
    return { success: true };
  }

  try {
    // 2. Create the Transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false, // Use false for 587
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // 3. Prepare Attachments
    const attachments = [];

    // Nodemailer supports URL paths natively. No need for 'fetch'.
    if (attachmentUrl && attachmentUrl.startsWith('http') && !attachmentUrl.includes('undefined')) {
      console.log(`📎 [Email Service] Attaching PDF from: ${attachmentUrl}`);
      attachments.push({
        filename: `MediZen-Receipt-${receiptNo || 'Final'}.pdf`,
        path: attachmentUrl // Nodemailer will fetch the file automatically
      });
    } else {
      console.warn(`⚠️ [Email Service] Attachment skipped. Invalid URL: "${attachmentUrl}"`);
    }

    // 4. Send the Mail
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject: subject || "MediZen Healthcare Notification",
      html: htmlContent || "<p>Your appointment is confirmed.</p>",
      attachments: attachments,
    });

    console.log(`✅ [Email Success] Sent to: ${to}`);
    return { success: true };

  } catch (err) {
    console.error(`❌ [Email Failure] ${err.message}`);
    throw err;
  }
};

module.exports = { sendEmail };