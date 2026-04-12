require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./config/db');
const { connectRabbitMQ } = require('./config/rabbitmq');
const paymentRoutes = require('./routes/paymentRoutes');

/**
 * Main Entry File for Payment Service
 */

const app = express();

// 1. Define Port
const PORT = process.env.PORT || 5007;

// 2. Load Middlewares
app.use(express.json());
app.use(cors());
app.use(morgan('dev'));

// 3. Mount Routes
app.use('/api/payments', paymentRoutes);

// 4. Default Root Route
app.get('/', (req, res) => {
    res.status(200).json({
        service: 'MediZen Payment Service',
        status: 'Operational',
        timestamp: new Date()
    });
});

// 5. Not Found Middleware
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found`
    });
});

// 6. Global Error Handling Middleware
app.use((err, req, res, next) => {
    console.error(`[Server Error] ${err.stack}`);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || "Internal Server Error"
    });
});

// 7. Start Server
const startServer = async () => {
    console.log(`◇ injecting env (PORT, MONGODB_URI, RABBITMQ_URL) from .env`);
    
    await connectDB();
    await connectRabbitMQ();

    // Gateway Check
    if (process.env.STRIPE_SECRET_KEY) {
        console.log(`💳 Payment gateway configured`);
    } else {
        console.log(`⚠️ Stripe credentials missing - Gateway will be mocked`);
    }

    app.listen(PORT, () => {
        console.log(`🚀 Payment Service running on port ${PORT}`);
    });
};

startServer();
