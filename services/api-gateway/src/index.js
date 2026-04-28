const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { createProxyMiddleware } = require('http-proxy-middleware');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5010;

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
// Note: http-proxy-middleware will append the path from the context to the target.
// e.g. /api/auth/sync -> http://auth-service:5001/api/auth/sync
// Since our microservices are also mounting at /api/auth, this is usually correct.
// However, we ensure the pathRewrite is explicitly handled for symptom-check which rewrites to /

const routes = [
    { context: '/api/auth', target: services.auth },
    { context: '/api/patient', target: services.patient },
    { context: '/api/doctors', target: services.doctor },
    { context: '/api/appointments', target: services.appointment },
    { 
        context: '/api/symptom-check', 
        target: services.symptom,
        pathRewrite: { '^/api/symptom-check': '/' } 
    },
    { context: '/api/sessions', target: services.telemedicine },
    { context: '/api/payments', target: services.payment },
    { context: '/api/notifications', target: services.notification },
    { context: '/api/admin', target: services.admin },
];

// Apply proxy routes
routes.forEach(route => {
    app.use(route.context, createProxyMiddleware({
        target: route.target,
        changeOrigin: true,
        pathRewrite: route.pathRewrite || {},
        onProxyReq: (proxyReq, req, res) => {
            // Optional: Log proxy requests for debugging
            // console.log(`Proxying ${req.method} ${req.url} to ${route.target}`);
        },
        onError: (err, req, res) => {
            console.error(`Proxy Error for ${route.context}:`, err.message);
            res.status(502).send('Bad Gateway: Service might be down.');
        }
    }));
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'API Gateway is running' });
});

app.listen(PORT, () => {
    console.log(`API Gateway running on port ${PORT}`);
    console.log('Routes mounted:');
    routes.forEach(r => console.log(` - ${r.context} -> ${r.target}`));
});
