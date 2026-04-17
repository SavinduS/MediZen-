/**
 * Doctor Management Service - Main Entry Point
 * Port: 5003 (As per the official Port Map)
 * Database: medizen_doctor_db
 */
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

// --- ROUTE IMPORTS ---
// Importing routes for doctor profile and availability management
const doctorRoutes = require('./routes/doctorRoutes');

const app = express();

// --- MIDDLEWARE CONFIGURATION ---

// Helmet: Adds security headers to prevent common vulnerabilities
app.use(helmet()); 

// CORS: Allows communication with the React frontend and other services
app.use(cors());   

// Morgan: Logs HTTP requests to the console for development tracking
app.use(morgan('dev')); 

// Express JSON: Middleware to handle and parse incoming JSON data
app.use(express.json()); 

// --- SERVING STATIC FILES ---
// This allows anyone to access the PDFs via URL: http://localhost:5003/prescriptions/filename.pdf
app.use('/prescriptions', express.static(path.join(__dirname, '../public/prescriptions')));

// --- ROUTE REGISTRATION ---

/**
 * Service Health Check
 * Standard endpoint to verify if the service is operational.
 */
app.get('/health', (req, res) => {
    res.status(200).json({ 
        service: 'Doctor Management Service', 
        status: 'Online',
        port: process.env.PORT || 5003,
        timestamp: new Date()
    });
});

/**
 * Doctor API Routes
 * All endpoints related to doctors are under '/api/doctors'
 */
app.use('/api/doctors', doctorRoutes);


// --- DATABASE AND SERVER INITIALIZATION ---

/**
 * Server Configuration
 * Port 5003 is explicitly assigned to the Doctor Service in the project plan.
 */
const PORT = process.env.PORT || 5003;

/**
 * Database Configuration
 * Each microservice connects to its own dedicated MongoDB instance.
 */
const MONGO_URI = process.env.MONGO_URI;

// Connecting to MongoDB and starting the server
mongoose.connect(MONGO_URI)
    .then(() => {
        console.log('✅ Connected to Doctor Management Database (medizen_doctor_db)');
        
        // Start the server only if the database connection is successful
        app.listen(PORT, () => {
            console.log(`🚀 Doctor Service is running on official port ${PORT}`);
        });
    })
    .catch(err => {
        console.error('❌ Database connection error:', err.message);
        
        // During development, allow the server to run for testing even if the DB is down
        app.listen(PORT, () => {
            console.warn(`⚠️ Doctor Service running on port ${PORT} (Warning: Database Connection Failed)`);
        });
    });

/**
 * Global Error Handling for Unhandled Rejections
 * Ensures the process handles unexpected promise failures gracefully.
 */
process.on('unhandledRejection', (err) => {
    console.error(`Unhandled Rejection: ${err.message}`);
});// CI/CD Deployment Trigger
