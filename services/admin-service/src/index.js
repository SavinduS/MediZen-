require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./config/db');
const { initModels } = require('./controllers/adminController');
const adminRoutes = require('./routes/adminRoutes');
const { ClerkExpressWithAuth } = require('@clerk/clerk-sdk-node');
const notFound = require('./middleware/notFoundMiddleware');
const errorHandler = require('./middleware/errorMiddleware');

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Health Check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'success', 
    service: 'admin-service', 
    timestamp: new Date() 
  });
});

// Routes - Protected by Clerk Auth
app.use('/api/admin', ClerkExpressWithAuth(), adminRoutes);

// Error Handling
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5009;

// Connect to MongoDB and then start server
console.log('Starting ADMIN SERVICE...');
connectDB().then((connections) => {
  // Initialize models with the established connections
  initModels(connections);
  
  app.listen(PORT, () => {
    console.log('------------------------------------------------');
    console.log(`🚀 ADMIN SERVICE RUNNING ON PORT: ${PORT}`);
    console.log(`📡 Endpoints active: /api/admin/stats, /api/admin/users, /api/admin/doctors, /api/admin/payments`);
    console.log(`🔐 Clerk Authentication enabled`);
    console.log('------------------------------------------------');
  });
}).catch((err) => {
  console.error('❌ Critical Error: Failed to start server');
  console.error(err.message);
  process.exit(1);
});
// CI/CD Deployment Trigger
