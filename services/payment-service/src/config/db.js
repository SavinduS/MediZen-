const mongoose = require('mongoose');

/**
 * Establish connection with MongoDB using Mongoose
 */
const connectDB = async () => {
    try {
        const dbURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/payment_db';
        const conn = await mongoose.connect(dbURI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log(`✅ Payment DB Connected`);
    } catch (err) {
        console.error(`❌ Payment DB connection failed: ${err.message}`);
        process.exit(1); // Exit process with failure
    }
};

module.exports = connectDB;
