require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./config/db');
const { connectRabbitMQ } = require('./config/rabbitmq');
const paymentRoutes = require('./routes/paymentRoutes');

const app = express();

// Middleware
app.use(morgan('dev'));
app.use(cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true
}));
app.use(express.json());

// --- ROUTES ---
// Mount payment routes with the expected /api/payments prefix
app.use('/api/payments', paymentRoutes);

// Health Check
app.get('/health', (req, res) => res.status(200).json({ status: 'Healthy' }));

// Connect DB & RabbitMQ then Start Server
connectDB();
connectRabbitMQ();

const PORT = process.env.PORT || 5007;
app.listen(PORT, () => {
    console.log(`✅ Payment Service running on port ${PORT}`);
    console.log(`🚀 Routes mounted at http://localhost:${PORT}/api/payments`);
});
// CI/CD Deployment Trigger
