const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const Joi = require('joi');
const axios = require('axios');
const client = require('prom-client');

const app = express();

// --- Database Connection ---
const MONGO_URI = process.env.MONGO_URI || 'mongodb://mongodb-ai:27017/symptom_db';
mongoose.connect(MONGO_URI)
    .then(() => console.log("✅ AI Service connected to MongoDB"))
    .catch(err => console.error("❌ MongoDB connection error:", err.message));

// --- SymptomLog Model ---
const SymptomLogSchema = new mongoose.Schema({
    clerkId: String,
    symptomsText: String,
    aiResponse: String,
    timestamp: { type: Date, default: Date.now }
});
const SymptomLog = mongoose.model('SymptomLog', SymptomLogSchema);

// --- Prometheus Metrics Setup ---
const register = new client.Registry();
client.collectDefaultMetrics({ register });

const aiRequestCounter = new client.Counter({
    name: 'medizen_ai_requests_total',
    help: 'Total number of AI symptom check requests',
    labelNames: ['status']
});
register.registerMetric(aiRequestCounter);

// --- Validation Schema ---
const symptomSchema = Joi.object({
    symptoms: Joi.string().min(10).max(500).required().messages({
        'string.min': 'Please provide more detail about your symptoms (min 10 characters).',
        'string.max': 'Symptom description is too long (max 500 characters).',
        'any.required': 'Symptoms text is required.'
    }),
    clerkId: Joi.string().optional()
});

/**
 * Helper to generate AI response from Gemini
 */
const generateAIResponse = async (prompt) => {
    console.log("Checking GEMINI_API_KEY...");
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey === "your_actual_google_gemini_api_key_here") {
        console.error("❌ GEMINI_API_KEY is missing or invalid");
        throw new Error("GEMINI_API_KEY not configured");
    }
    
    console.log("✅ API Key found. Using model: gemini-flash-latest");
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
    
    console.log("Calling Gemini API...");
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
};

// --- Middleware ---
app.use(cors());
app.use(express.json());

// --- Metrics Endpoint ---
app.get('/metrics', async (req, res) => {
    res.setHeader('Content-Type', register.contentType);
    res.send(await register.metrics());
});

// --- MAIN API ---
app.post('/api/symptom-check', async (req, res) => {
    try {
        const { error, value } = symptomSchema.validate(req.body);

        if (error) {
            aiRequestCounter.inc({ status: 'validation_error' });
            return res.status(400).json({
                status: "error",
                message: error.details[0].message
            });
        }

        const { symptoms, clerkId } = value;
        let personalizationContext = "";

        // Fetch patient personalization data if clerkId is provided
        if (clerkId && process.env.PATIENT_SERVICE_URL) {
            try {
                const response = await axios.get(`${process.env.PATIENT_SERVICE_URL}/api/patient/internal/${clerkId}`);
                const patientData = response.data;
                personalizationContext = `The patient (${patientData.firstName || 'Anonymous'}) has the following known medical context:
- Blood Group: ${patientData.bloodGroup || 'Unknown'}
- Allergies: ${patientData.allergies || 'None reported'}
Please take this context into account for safer and more personalized advice.`;
            } catch (err) {
                console.warn("Could not fetch patient personalization data:", err.message);
            }
        }

        const promptText = `
You are a medical AI assistant for a telemedicine platform named MediZen. 
${personalizationContext}
A patient reports these symptoms: "${symptoms}". 

Tasks:
1. Start with a disclaimer that this is not a diagnosis.
2. Suggest 3 self-care tips.
3. Recommend one doctor specialty.
Keep it concise and professional.`;

        // CALLING THE HELPER
        const aiText = await generateAIResponse(promptText);

        const newLog = new SymptomLog({
            clerkId,
            symptomsText: symptoms,
            aiResponse: aiText
        });
        await newLog.save();

        aiRequestCounter.inc({ status: 'success' });

        return res.status(200).json({
            status: "success",
            ai_suggestion: aiText,
            timestamp: new Date()
        });

    } catch (error) {
        console.error("Critical AI Service Error:", error.message);
        aiRequestCounter.inc({ status: 'error' });

        if (error.message.includes("429") || error.message.includes("Quota")) {
            return res.status(429).json({
                status: "error",
                message: "All AI model quotas have been exhausted. Please try again later.",
                details: "Rate limit exceeded."
            });
        }

        return res.status(500).json({
            status: "error",
            message: "The AI service encountered an error.",
            details: error.message
        });
    }
});

// --- Health Check ---
app.get('/health', (req, res) => {
    res.status(200).json({
        status: "UP",
        db: mongoose.connection.readyState === 1 ? "Connected" : "Disconnected",
        ai_configured: !!process.env.GEMINI_API_KEY
    });
});

// --- Start Server ---
if (process.env.NODE_ENV !== 'test') {
    const PORT = process.env.PORT || 5005;
    app.listen(PORT, () => {
        console.log(`🚀 AI Symptom Checker running on port ${PORT}`);
    });
}

module.exports = app;