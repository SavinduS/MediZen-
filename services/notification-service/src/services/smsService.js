/**
 * Service: Vonage SMS sender with detailed status inspection
 */
const { Vonage } = require("@vonage/server-sdk");

const vonage = new Vonage({
  apiKey: process.env.VONAGE_API_KEY,
  apiSecret: process.env.VONAGE_API_SECRET,
});

/**
 * Handle individual message status from Vonage
 * Extracts status and error text to throw a clear message if not success
 */
const handleVonageStatus = (message, to) => {
  const status = String(message.status);
  const errorText = message["error-text"] || message.errorText || "Unknown error";
  const msgId = message["message-id"] || message.messageId;
  const price = message["message-price"] || "?";
  const balance = message["remaining-balance"] || "?";
  // Log full message for diagnostics
  console.log('[Vonage SMS API Message]', JSON.stringify(message, null, 2));

  if (status === "0") {
    // ACCEPTED (not delivered!)
    console.log(`[SMS] Accepted by Vonage: ${to}. MessageID: ${msgId}, Price: ${price}, Balance: ${balance}`);
    // Explicitly return status 'accepted' as it hasn't reached the handset yet.
    return { success: true, accepted: true, messageId: msgId, price, balance, status: 'accepted' };
  } else {
    // FAILURE - Inspect specific Vonage error codes
    console.error(`[SMS Failure] Vonage Error: ${errorText} (Status: ${status})`);
    let errorMessage = `Vonage SMS Error: ${errorText} (Status: ${status})`;
    
    if (status === "29") {
      errorMessage = "Vonage Trial Account Restriction: Recipient number not verified in Vonage dashboard.";
    }
    
    // Throw an error so the calling service knows it failed
    const error = new Error(errorMessage);
    error.status = status;
    throw error;
  }
};

const sendSMS = async (to, body) => {
  // 1. Fallback: Check credentials
  if (!process.env.VONAGE_API_KEY || !process.env.VONAGE_API_SECRET) {
    console.warn(`[SKIP] Real SMS skipped for ${to} (Missing Vonage credentials)`);
    return { success: true, mock: true, status: 'sent' };
  }

  // 2. Ensure E.164 format (prepend + if missing)
  let formattedTo = to.startsWith('+') ? to : `+${to}`;

  try {
    const response = await vonage.sms.send({
      to: formattedTo,
      from: process.env.VONAGE_FROM || "MediZen",
      text: body,
    });

    // Log full API response for diagnostics
    console.log('[Vonage SMS API Response]', JSON.stringify(response, null, 2));

    /**
     * VONAGE LOGIC:
     * Even if the API request succeeds, individual message deliveries can fail.
     * Status '0' means accepted, not delivered!
     */
    return handleVonageStatus(response.messages[0], formattedTo);

  } catch (err) {
    /**
     * Handle SDK throw behavior:
     * In @vonage/server-sdk v3+, it throws "Some SMS messages failed to send"
     * The response details are in err.response.messages
     */
    const vonageMessages = err.response?.messages || err.messages;
    
    if (vonageMessages && vonageMessages[0]) {
      return handleVonageStatus(vonageMessages[0], to);
    }

    // Log the actual underlying error for the developer terminal if it's not a status error
    console.error(`[SMS Service Exception] ${err.message}`);
    
    // Rethrow so the notificationService can log it to MongoDB as 'failed'
    throw err;
  }
};

module.exports = { sendSMS };
