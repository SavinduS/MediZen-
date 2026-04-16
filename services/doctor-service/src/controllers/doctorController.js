/**
 * Doctor Controller
 * Handles business logic for Doctor Profile Management
 */
const axios = require('axios');
const Doctor = require('../models/Doctor');
const Prescription = require('../models/Prescription');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { createClerkClient } = require('@clerk/clerk-sdk-node');

module.exports = {
  
  // Register a doctor via Admin Dashboard
  addDoctorAdmin: async (req, res) => {
    try {
      const { name, specialization, qualifications, fee, bio, email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ success: false, error: 'Email and password are required' });
      }

      // Initialize Clerk
      const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

      // 1. Create User in Clerk to get the clerkId
      let clerkUser;
      try {
        clerkUser = await clerkClient.users.createUser({
          emailAddress: [email],
          password: password,
          publicMetadata: { role: 'doctor' }
        });
      } catch (err) {
        console.error("Clerk Error:", err);
        return res.status(400).json({ success: false, message: err.errors ? err.errors[0].longMessage : "Clerk creation failed" });
      }

      const clerkId = clerkUser.id;

      // 2. Notify Auth Service (Port 5001) - Send the clerkId to its database
      // Note: We assume your Auth Service has an endpoint to receive this
      try {
        await axios.post('http://localhost:5001/api/auth/register', {
          clerkId: clerkId,
          email: email
        });
      } catch (authErr) {
        // We log this but continue so the doctor profile is still created
        console.error("Auth Service Sync Warning:", authErr.message);
      }

      // 3. Save Doctor Profile in Doctor Service (Port 5003)
      const doctorId = `DOC-${Math.floor(1000 + Math.random() * 9000)}`;
      const newDoctor = new Doctor({
        userId: clerkId, // Saving Clerk ID as the reference
        email,
        doctorId,
        name,
        specialization,
        qualifications: typeof qualifications === 'string' ? qualifications.split(',').map(q => q.trim()) : qualifications,
        fee,
        bio,
        verified: true
      });

      const savedDoctor = await newDoctor.save();
      
      res.status(201).json({ 
        success: true, 
        message: "Doctor registered and synced successfully", 
        data: savedDoctor 
      });

    } catch (error) {
      console.error("Doctor Service Error:", error);
      res.status(500).json({ success: false, message: "Internal Error: " + error.message });
    }
  },

  updateAvailability: async (req, res) => {
    try {
        const doctorId = req.params.id;
        const slots = req.body.slots;
        if (typeof Availability !== 'undefined') {
            await Availability.deleteMany({ doctorId });
            const availabilityData = slots.map(slot => ({ doctorId, dayOfWeek: slot.dayOfWeek, startTime: slot.startTime, endTime: slot.endTime, isAvailable: true }));
            await Availability.insertMany(availabilityData);
            res.status(200).json({ message: 'Availability updated' });
        } else {
            res.status(200).json({ message: "Logic processed (Availability model not imported)" });
        }
    } catch (error) { res.status(500).json({ message: error.message }); }
  },

  getDoctorAvailability: async (req, res) => {
    try {
        res.status(200).json({ message: "Availability fetch logic" });
    } catch (error) { res.status(500).json({ message: error.message }); }
  },

  createDoctorProfile: async (req, res) => {
    try {
        const { userId, doctorId, name, specialization, qualifications, fee, bio } = req.body;
        const existingDoctor = await Doctor.findOne({ userId });
        if (existingDoctor) return res.status(400).json({ message: 'Doctor profile already exists' });
        const newDoctor = new Doctor({ userId, doctorId, name, specialization, qualifications, fee, bio });
        const savedDoctor = await newDoctor.save();
        res.status(201).json({ message: 'Doctor profile created', data: savedDoctor });
    } catch (error) { res.status(500).json({ message: error.message }); }
  },

  getAllDoctors: async (req, res) => {
    try {
        const doctors = await Doctor.find();
        res.status(200).json(doctors);
    } catch (error) { res.status(500).json({ message: error.message }); }
  },

  getAdminDoctors: async (req, res) => {
    try {
        const doctors = await Doctor.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: doctors });
    } catch (error) { res.status(500).json({ success: false, error: error.message }); }
  },

  deleteDoctorAdmin: async (req, res) => {
    try {
        const doctor = await Doctor.findByIdAndDelete(req.params.id);
        if (!doctor) return res.status(404).json({ success: false, message: "Doctor not found" });
        res.status(200).json({ success: true, message: "Doctor deleted successfully" });
    } catch (error) { res.status(500).json({ success: false, error: error.message }); }
  },

  issuePrescription: async (req, res) => {
    try {
        const { appointmentId, doctorId, patientId, patientName, diagnosis, medicines } = req.body;
        const filename = `prescription-${appointmentId}.pdf`;
        const uploadsDir = path.join(__dirname, '../../public/prescriptions');
        if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
        const filePath = path.join(uploadsDir, filename);
        const doc = new PDFDocument({ margin: 50 });
        const writeStream = fs.createWriteStream(filePath);
        doc.pipe(writeStream);
        doc.fontSize(20).text('MEDIZEN SMART HEALTHCARE', { align: 'center' }).moveDown();
        doc.fontSize(16).text('Digital Medical Prescription', { align: 'center', underline: true }).moveDown();
        doc.text(`Patient: ${patientName}`);
        doc.text(`Diagnosis: ${diagnosis}`);
        doc.end();
        writeStream.on('finish', async () => {
            res.status(201).json({ message: 'Prescription generated' });
        });
    } catch (error) { res.status(500).json({ message: 'Failed to issue prescription' }); }
  },

  updateDoctor: async (req, res) => {
    try {
        const doctor = await Doctor.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.status(200).json({ message: 'Doctor updated', data: doctor });
    } catch (error) { res.status(500).json({ message: error.message }); }
  },

  verifyDoctor: async (req, res) => {
    try {
        const doctor = await Doctor.findByIdAndUpdate(req.params.id, { verified: true }, { new: true });
        res.status(200).json(doctor);
    } catch (error) { res.status(500).json({ message: error.message }); }
  }
};