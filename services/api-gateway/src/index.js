const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { createProxyMiddleware } = require('http-proxy-middleware');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(morgan('dev'));

// Service URLs from environment variables
const services = {
    auth: process.env.AUTH_SERVICE_URL || 'http://localhost:5001',
    patient: process.env.PATIENT_SERVICE_URL || 'http://localhost:5002',
    doctor: process.env.DOCTOR_SERVICE_URL || 'http://localhost:5003',
    appointment: process.env.APPOINTMENT_SERVICE_URL || 'http://localhost:5004',
    symptom: process.env.SYMPTOM_SERVICE_URL || 'http://localhost:5005',
    telemedicine: process.env.TELEMEDICINE_SERVICE_URL || 'http://localhost:5006',
    payment: process.env.PAYMENT_SERVICE_URL || 'http://localhost:5007',
    notification: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:5008',
    admin: process.env.ADMIN_SERVICE_URL || 'http://localhost:5009',
};

// Route configurations
const routes = [
    { context: '/api/auth', target: services.auth },
    { context: '/api/patient', target: services.patient },
    { context: '/api/doctors/:id/slots', target: services.appointment }, // Specific route first
    { context: '/api/doctors', target: services.doctor },
    { context: '/api/appointments', target: services.appointment },
    { context: '/api/symptom-check', target: services.symptom },
    { context: '/api/sessions', target: services.telemedicine },
    { context: '/api/payments', target: services.payment },
    { context: '/api/notifications', target: services.notification },
    { context: '/api/admin', target: services.admin },
];

// Special case: /api/doctors in appointment service (for slots)
// We might need to handle this carefully if /api/doctors is also in doctor-service
// Looking at api.js:
// const doctorAPI = axios.create({ baseURL: 'http://localhost:5003/api/doctors' });
// const doctorSlotsAPI = axios.create({ baseURL: 'http://localhost:5004/api/doctors' });
// This is a conflict if they share the same base path.
// Let's check how they are used.

routes.forEach(route => {
    app.use(route.context, createProxyMiddleware({
        target: route.target,
        changeOrigin: true,
        // pathRewrite: { [`^${route.context}`]: route.context }, // Keep the prefix
    }));
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'API Gateway is running' });
});

app.listen(PORT, () => {
    console.log(`API Gateway running on port ${PORT}`);
});
