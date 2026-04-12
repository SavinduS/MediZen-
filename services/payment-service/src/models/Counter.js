const mongoose = require("mongoose");

const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // The name of the counter (e.g., "paymentId")
  seq: { type: Number, default: 0 }      // The current sequence number
});

module.exports = mongoose.model("Counter", counterSchema);
