const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Primary connection (admin_db) - Default to localhost:27017
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/admin_db';
    
    // Establishing the primary connection
    await mongoose.connect(mongoUri);
    const conn = mongoose.connection;
    
    console.log(`Admin DB Connected: ${conn.host}:${conn.port}`);
    
    // Switching to target databases on the same MongoDB instance using useDb()
    const authConn = conn.useDb('users', { useCache: true });
    const patientConn = conn.useDb('patients', { useCache: true });
    const doctorConn = conn.useDb('doctor_db', { useCache: true });
    const appointmentConn = conn.useDb('appointment_db', { useCache: true });
    const paymentConn = conn.useDb('payment_db', { useCache: true });

    console.log(' [Admin Service] Service databases successfully mapped using useDb()');

    return { 
        adminConn: conn, 
        doctorConn, 
        paymentConn, 
        patientConn, 
        appointmentConn, 
        authConn 
    };
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
