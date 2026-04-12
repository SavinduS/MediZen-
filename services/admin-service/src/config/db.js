const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Primary connection (admin_db)
    const adminConn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`Admin DB Connected: ${adminConn.connection.host}`);
    
    // Additional connections for cross-db queries
    // Usually these would be from their own env vars, but I'll use placeholders 
    // reflecting the requirements or the same host with different DB names.
    const doctorConn = mongoose.createConnection(process.env.DOCTOR_DB_URI || 'mongodb://localhost:27017/doctor_db');
    const paymentConn = mongoose.createConnection(process.env.PAYMENT_DB_URI || 'mongodb://localhost:27017/payment_db');
    const patientConn = mongoose.createConnection(process.env.PATIENT_DB_URI || 'mongodb://localhost:27017/patient_db');
    const appointmentConn = mongoose.createConnection(process.env.APPOINTMENT_DB_URI || 'mongodb://localhost:27017/appointment_db');
    const authConn = mongoose.createConnection(process.env.AUTH_DB_URI || 'mongodb://localhost:27017/users');

    return { adminConn, doctorConn, paymentConn, patientConn, appointmentConn, authConn };
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
