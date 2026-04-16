const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const Joi = require('joi');
const axios = require('axios');
const client = require('prom-client');

const app = express();

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
    })
});

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

        // Save to DB (make sure SymptomLog model exists)
        const newLog = new SymptomLog({
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

        // Handle quota / rate limit
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