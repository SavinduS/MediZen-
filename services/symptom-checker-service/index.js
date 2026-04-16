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
mongoose.connect(process.env.MONGO_URI || 'mongodb://mongodb-ai:27017/symptom_db')
    .then(() => console.log("✅ AI Service connected to MongoDB"))
    .catch(err => console.error("❌ MongoDB connection error:", err));

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

// --- AI Logic ---
async function generateAIResponse(prompt) {
    if (!process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY is not configured");
    }
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    return result.response.text();
}

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

        // --- Choice B: Personalized AI logic ---
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
                // Continue with generic response if personalization fails
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
const PORT = process.env.PORT || 5005;
app.listen(PORT, () => {
    console.log(`🚀 AI Symptom Checker running on port ${PORT}`);
});