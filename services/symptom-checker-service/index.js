const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

<<<<<<< Updated upstream
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
=======
const Joi = require('joi');

const axios = require('axios');
const client = require('prom-client');

const app = express();

// --- Prometheus Metrics Setup ---
const register = new client.Registry();
client.collectDefaultMetrics({ register });

// Custom metric for AI requests
const aiRequestCounter = new client.Counter({
    name: 'medizen_ai_requests_total',
    help: 'Total number of AI symptom check requests',
    labelNames: ['status']
});
register.registerMetric(aiRequestCounter);

const PATIENT_SERVICE_URL = process.env.PATIENT_SERVICE_URL || 'http://localhost:5002';
>>>>>>> Stashed changes

// ... (keep Joi schema and middleware)

app.get('/metrics', async (req, res) => {
    res.setHeader('Content-Type', register.contentType);
    res.send(await register.metrics());
});

app.post('/api/symptom-check', async (req, res) => {
    try {
<<<<<<< Updated upstream
        const { symptoms } = req.body;

        if (!symptoms) {
            return res.status(400).json({ status: "error", message: "Symptoms text is required." });
        }

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

=======
        const { error, value } = symptomSchema.validate(req.body);
        if (error) {
            aiRequestCounter.inc({ status: 'validation_error' });
            return res.status(400).json({ status: "error", message: error.details[0].message });
        }
        // ... rest of the code
        aiRequestCounter.inc({ status: 'success' });
>>>>>>> Stashed changes
        res.status(200).json({
            status: "success",
            ai_suggestion: aiText,
            timestamp: new Date()
        });

    } catch (error) {
        aiRequestCounter.inc({ status: 'error' });
        // ... rest of the catch block
    }
});
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
