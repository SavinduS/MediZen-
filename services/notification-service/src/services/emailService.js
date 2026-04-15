const nodemailer = require("nodemailer");

/**
 * Service: Nodemailer email sender with PDF attachment support
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} htmlContent - HTML formatted body
 * @param {string} attachmentUrl - URL of the PDF receipt
 * @param {string} receiptNo - Receipt reference number for filename
 */
const sendEmail = async (to, subject, htmlContent, attachmentUrl, receiptNo) => {
  
  // 1. Fallback: Check if SMTP credentials exist in .env
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn(`[SKIP] Real email skipped for ${to} (Missing SMTP credentials in .env)`);
    return { success: true, mock: true };
  }

  try {
    // 2. Create the Transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465, // Use true for 465, false for 587
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // 3. Prepare Attachments Logic
    const attachments = [];

    // Only attach if the URL is valid and starts with 'http' (Prevents ENOENT error)
    if (attachmentUrl && attachmentUrl.startsWith('http') && !attachmentUrl.includes('undefined')) {
      console.log(`📎 [Email Service] Attaching PDF: ${attachmentUrl}`);
      attachments.push({
        filename: `MediZen-Receipt-${receiptNo || 'Final'}.pdf`,
        path: attachmentUrl // Nodemailer will fetch the PDF from this URL
      });
    } else {
      console.warn(`⚠️ [Email Service] Attachment skipped. Invalid URL: "${attachmentUrl}"`);
    }

    // 4. Send the Mail
    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject: subject || "MediZen Healthcare Notification",
      html: htmlContent || "<p>Thank you for using MediZen Healthcare.</p>", // HTML content is required for professional look
      attachments: attachments,
    };

    const info = await transporter.sendMail(mailOptions);

    console.log(`✅ [Email Success] Sent to: ${to}. MessageId: ${info.messageId}`);
    return { success: true };

  } catch (err) {
    console.error(`❌ [Email Failure] Error sending to ${to}: ${err.message}`);
    // Rethrow error so the notificationService can handle it (log to DB as failed)
    throw err;
  }
};

module.exports = { sendEmail };