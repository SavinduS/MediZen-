/**
 * Service: Twilio SMS sender with detailed status inspection
 */
const twilio = require("twilio");

// Initialize Twilio client
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

/**
 * Handle individual message status from Twilio
 * Extracts status and error text to return a clear message
 */
const handleTwilioStatus = (message, to) => {
  if (!message) {
    throw new Error("No response message received from Twilio");
  }

  // Twilio message statuses: queued, failed, sent, delivered, undelivered
  const status = message.status;
  const msgId = message.sid;
  const errorText = message.errorMessage || "None";
  const errorCode = message.errorCode || "None";

  // Log full message for diagnostics
  console.log('[Twilio SMS API Message Detail]', JSON.stringify(message, null, 2));

  if (status !== "failed" && status !== "undelivered") {
    // ACCEPTED/SENT (not necessarily delivered!)
    console.log(`✅ [SMS] Accepted/Sent by Twilio: ${to}. MessageSID: ${msgId}, Status: ${status}`);
    return { success: true, accepted: true, messageId: msgId, status: status };
  } else {
    // FAILURE - Inspect specific Twilio error codes
    console.error(`❌ [SMS Failure] Twilio Error: ${errorText} (Code: ${errorCode}, Status: ${status}) to ${to}`);
    let errorMessage = `Twilio SMS Error: ${errorText} (Code: ${errorCode}, Status: ${status})`;
    
    // Twilio Status Code 21608: Unverified trial number
    if (errorCode === 21608) {
      errorMessage = `[Trial Account Restriction] The number ${to} is not verified in your Twilio dashboard. Trial accounts can only send to verified numbers.`;
    } else if (errorCode === 21408) {
      errorMessage = `[Geo-Permission Restriction] Sending SMS to ${to} is restricted. Check your Twilio Geo-Permissions.`;
    }
    
    const error = new Error(errorMessage);
    error.status = status;
    error.code = errorCode;
    throw error;
  }
};

const sendSMS = async (to, body) => {
  // 1. Check credentials
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER) {
    console.warn(`[SKIP] Real SMS skipped for ${to} (Missing Twilio credentials in .env)`);
    return { success: true, mock: true, status: 'sent' };
  }

  /**
   * 2. Format phone number to E.164 with +
   * Twilio documentation specifies E.164 WITH the '+' sign.
   * Example: +94702312666
   */
  let digitsOnly = String(to).replace(/\D/g, '');
  let formattedTo = `+${digitsOnly}`; 
  console.log(`[SMS] Attempting to send via Twilio to: ${formattedTo}`);

  try {
    const message = await client.messages.create({
      body: body,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: formattedTo,
    });

    // Log full API response for diagnostics
    console.log('[Twilio SMS API Response]', JSON.stringify(message, null, 2));

    return handleTwilioStatus(message, formattedTo);

  } catch (err) {
    /**
     * Handle Twilio throw behavior:
     * Twilio SDK throws a RestException on API-level errors
     */
    console.error(`[SMS Service Exception] Full Error:`, err);
    console.error(`[SMS Service Exception] Message: ${err.message}`);
    
    // Rethrow with more context if it's a known error type
    if (err.code === 21608) {
        throw new Error(`[Twilio Trial Account] Number ${formattedTo} is unverified.`);
    }

    throw err;
  }
};

module.exports = { sendSMS };
