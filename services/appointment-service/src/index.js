const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const { connectRabbitMQ } = require('./config/rabbitMQ');
const appointmentRoutes = require('./routes/appointmentRoutes');

const app = express();

// Standard Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Routes
app.use('/api/appointments', appointmentRoutes);

const PORT = process.env.PORT || 5004;
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI)
    .then(async () => {
        console.log('✅ Connected to MongoDB Atlas');
        await connectRabbitMQ();
        app.listen(PORT, () => console.log(`🚀 Appointment Service running on port ${PORT}`));
    })
    .catch(err => console.error('❌ Connection Error:', err.message));