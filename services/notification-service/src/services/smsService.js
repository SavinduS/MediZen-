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

  if (status === "0") {
    // SUCCESS
    console.log(`[SMS] Success: ${to}. MessageID: ${message["message-id"] || message.messageId}`);
    return { success: true };
  } else {
    // FAILURE - Inspect specific Vonage error codes
    console.error(`[SMS Failure] Vonage Error: ${errorText} (Status: ${status})`);

    // Handle Trial Account Restriction (Status 29)
    if (status === "29") {
      throw new Error(
        "Vonage Trial Account Restriction: Recipient number not verified in Vonage dashboard."
      );
    }

    // Handle other non-zero statuses
    throw new Error(`Vonage SMS Error: ${errorText} (Status: ${status})`);
  }
};

const sendSMS = async (to, body) => {
  // 1. Fallback: Check credentials
  if (!process.env.VONAGE_API_KEY || !process.env.VONAGE_API_SECRET) {
    console.warn(`[SKIP] Real SMS skipped for ${to} (Missing Vonage credentials)`);
    return { success: true, mock: true };
  }

  try {
    const response = await vonage.sms.send({
      to,
      from: process.env.VONAGE_FROM || "MediZen",
      text: body,
    });

    /**
     * VONAGE LOGIC:
     * Even if the API request succeeds, individual message deliveries can fail.
     */
    return handleVonageStatus(response.messages[0], to);

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
    // and pass the specific message to the controller.
    throw err;
  }
};

module.exports = { sendSMS };
