const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const Joi = require('joi');

const app = express();

// Validation Schema
const symptomSchema = Joi.object({
    symptoms: Joi.string().min(10).max(500).required().messages({
        'string.min': 'Please provide more detail about your symptoms (min 10 characters).',
        'string.max': 'Symptom description is too long (max 500 characters).',
        'any.required': 'Symptoms text is required.'
    })
});

// Middleware
app.use(cors());
app.use(express.json());

// --- 1. MongoDB Configuration ---
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/symptom_db';

mongoose.connect(MONGO_URI)
    .then(() => console.log('✅ MongoDB Connected (Symptom Service)'))
    .catch(err => console.error('❌ MongoDB Connection Error:', err));

// Database Schema
const symptomCheckSchema = new mongoose.Schema({
    symptomsText: { type: String, required: true },
    aiResponse: { type: String, required: true },
    checkedAt: { type: Date, default: Date.now }
});

const SymptomLog = mongoose.model('SymptomLog', symptomCheckSchema);

// --- 2. Google Gemini Setup with Precise Model Mapping ---
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Resilient helper using the EXACT models confirmed by your diagnostic (check_raw.js).
 */
async function generateAIResponse(prompt) {
    /**
     * We use the exact names from your available list.
     * Order: Prioritizing 2.5 and 'latest' aliases to bypass the 404s you experienced.
     */
    const modelsToTry = [
        "gemini-2.5-flash", 
        "gemini-flash-latest", 
        "gemini-2.0-flash-lite", 
        "gemini-pro-latest", 
        "gemini-2.0-flash" 
    ];
    let lastError = null;

    for (const modelName of modelsToTry) {
        try {
            console.log(`(AI Service) Attempting to use model: ${modelName}...`);
            
            const model = genAI.getGenerativeModel(
                { model: modelName },
                { apiVersion: "v1beta" }
            );
            
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();
            
            console.log(`✅ AI Success using: ${modelName}`);
            return text;
        } catch (error) {
            lastError = error;
            const errorMsg = error.message;

            // Handle 429 (Too Many Requests / Quota Exceeded)
            if (errorMsg.includes("429") || errorMsg.includes("Quota")) {
                console.warn(`🛑 Quota exceeded for ${modelName}. Trying fallback...`);
                continue;
            }

            // Handle 404 (Model Not Found)
            if (errorMsg.includes("404") || errorMsg.includes("not found")) {
                console.warn(`⚠️ Model ${modelName} not found or unsupported for this version. Trying fallback...`);
                continue;
            }

            // If it's a critical error (403 invalid key), stop immediately
            throw error;
        }
    }
    throw lastError;
}

// --- 3. API Endpoints ---

app.post('/api/symptom-check', async (req, res) => {
    try {
        const { error, value } = symptomSchema.validate(req.body);

        if (error) {
            return res.status(400).json({ status: "error", message: error.details[0].message });
        }

        const { symptoms } = value;

        const promptText = `
        You are a medical AI assistant for a telemedicine platform named MediZen. 
        A patient reports these symptoms: "${symptoms}". 
        
        Tasks:
        1. Start with a disclaimer.
        2. Suggest 3 self-care tips.
        3. Recommend one doctor specialty.
        Keep it concise and professional.`;

        const aiText = await generateAIResponse(promptText);

        const newLog = new SymptomLog({
            symptomsText: symptoms,
            aiResponse: aiText
        });
        await newLog.save();

        res.status(200).json({
            status: "success",
            ai_suggestion: aiText,
            timestamp: new Date()
        });

    } catch (error) {
        console.error("Critical AI Service Error:", error.message);
        
        // Handle Quota failures at the top level
        if (error.message.includes("429") || error.message.includes("Quota")) {
            return res.status(429).json({
                status: "error",
                message: "All AI model quotas have been exhausted. Please wait a few minutes or try again tomorrow.",
                details: "Rate limit exceeded across all available models."
            });
        }

        res.status(500).json({ 
            status: "error",
            message: "The AI service encountered an error.",
            details: error.message 
        });
    }
});

app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: "UP", 
        db: mongoose.connection.readyState === 1 ? "Connected" : "Disconnected",
        ai_configured: !!process.env.GEMINI_API_KEY
    });
});

const PORT = process.env.PORT || 5005;
app.listen(PORT, () => {
    console.log(`🚀 AI Symptom Checker running on port ${PORT}`);
});
