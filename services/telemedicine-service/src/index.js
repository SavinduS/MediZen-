/**
 * Telemedicine/Video Service - Main Entry Point
 * Port: 5006 (As per the official Port Map)
 * Database: session_db
 */

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

// --- ROUTE IMPORTS ---
const sessionRoutes = require('./routes/sessionRoutes');

const app = express();

// --- MIDDLEWARE CONFIGURATION ---
app.use(helmet()); 
app.use(cors());   
app.use(morgan('dev')); 
app.use(express.json()); 

// --- ROUTE REGISTRATION ---

/**
 * Health Check Endpoint
 */
app.get('/health', (req, res) => {
    res.status(200).json({ 
        service: 'Telemedicine Video Service', 
        status: 'Online',
        port: process.env.PORT || 5006
    });
});

/**
 * Session API Routes
 * All video session endpoints are under '/api/sessions'
 */
app.use('/api/sessions', sessionRoutes);


// --- DATABASE AND SERVER INITIALIZATION ---

const PORT = process.env.PORT || 5006;
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI)
    .then(() => {
        console.log('✅ Connected to Telemedicine Database (session_db)');
        app.listen(PORT, () => {
            console.log(`🚀 Telemedicine Service is running on official port ${PORT}`);
        });
    })
    .catch(err => {
        console.error('❌ Database connection error:', err.message);
        app.listen(PORT, () => {
            console.warn(`⚠️ Telemedicine Service running on port ${PORT} (DB Offline)`);
        });
    });

// Global unhandled rejection handler
process.on('unhandledRejection', (err) => {
    console.error(`Unhandled Rejection: ${err.message}`);
});