/**
 * Appointment Management Service - Main Entry Point
 * Port: 5004 (Official Port Map)
 * Database: medizen_appointment_db
 */

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();
const appointmentRoutes = require('./routes/appointmentRoutes');

const app = express();

// --- MIDDLEWARE CONFIGURATION ---
app.use(helmet()); 
app.use(cors());   
app.use(morgan('dev')); 
app.use(express.json()); 
app.use('/api/appointments', appointmentRoutes);


// --- HEALTH CHECK ---
app.get('/health', (req, res) => {
    res.status(200).json({ 
        service: 'Appointment Management Service', 
        status: 'Online',
        port: process.env.PORT || 5004,
        timestamp: new Date()
    });
});

// --- SERVER & DATABASE INITIALIZATION ---
const PORT = process.env.PORT || 5004;
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI)
    .then(() => {
        console.log('✅ Connected to Appointment Database (medizen_appointment_db)');
        app.listen(PORT, () => {
            console.log(`🚀 Appointment Service running on port ${PORT}`);
        });
    })
    .catch(err => {
        console.error('❌ Database connection failed:', err.message);
        app.listen(PORT, () => console.warn(`⚠️ Running on port ${PORT} (DB Offline)`));
    });