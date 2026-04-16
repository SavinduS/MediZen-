const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || "mongodb://localhost:27017/notification_db";
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`✅ Notification DB Connected`);
  } catch (err) {
    console.error(`❌ Notification DB connection failed: ${err.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
