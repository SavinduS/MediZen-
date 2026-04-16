/**
 * Doctor Controller
 * Handles business logic for Doctor Profile Management
 */
const axios = require('axios');
const Doctor = require('../models/Doctor');
const Availability = require('../models/Availability');
const Prescription = require('../models/Prescription');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { createClerkClient } = require('@clerk/clerk-sdk-node');

module.exports = {
  
  // Register a doctor via Admin Dashboard (Integrated with Clerk from payment-service)
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

      // 2. Notify Auth Service (Port 5001) - Syncing
      try {
        await axios.post('http://localhost:5001/api/auth/register', {
          clerkId: clerkId,
          email: email
        });
      } catch (authErr) {
        console.error("Auth Service Sync Warning:", authErr.message);
      }

      // 3. Save Doctor Profile in Doctor Service
      const doctorId = `DOC-${Math.floor(1000 + Math.random() * 9000)}`;
      const newDoctor = new Doctor({
        userId: clerkId, 
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

  // Availability logic from main branch
  updateAvailability: async (req, res) => {
    try {
        const doctorId = req.params.id;
        const slots = req.body.slots;
        await Availability.deleteMany({ doctorId });
        const availabilityData = slots.map(slot => ({ 
            doctorId, 
            dayOfWeek: slot.dayOfWeek, 
            startTime: slot.startTime, 
            endTime: slot.endTime, 
            isAvailable: true 
        }));
        const savedAvailability = await Availability.insertMany(availabilityData);
        res.status(200).json({ message: 'Availability updated', data: savedAvailability });
    } catch (error) { res.status(500).json({ message: error.message }); }
  },

  getDoctorAvailability: async (req, res) => {
    try {
        const availability = await Availability.find({ doctorId: req.params.id });
        res.status(200).json(availability);
    } catch (error) { res.status(500).json({ message: error.message }); }
  },

  getDoctorByUserId: async (req, res) => {
    try {
        const userId = req.params.userId;
        const doctor = await Doctor.findOne({ userId });
        if (!doctor) return res.status(404).json({ message: 'Doctor profile not found' });

        const availability = await Availability.find({ doctorId: doctor._id });
        res.status(200).json({ ...doctor.toObject(), availability: availability || [] });
    } catch (error) { res.status(500).json({ message: 'Error fetching doctor profile' }); }
  },

  getDoctorById: async (req, res) => {
    try {
        const doctor = await Doctor.findById(req.params.id);
        if (!doctor) return res.status(404).json({ message: 'Doctor profile not found' });

        const availability = await Availability.find({ doctorId: req.params.id });
        res.status(200).json({ ...doctor.toObject(), availability: availability || [] });
    } catch (error) { res.status(500).json({ message: 'Server error while fetching doctor profile' }); }
  },

  getAllDoctors: async (req, res) => {
    try {
        const { specialty } = req.query;
        let query = {};
        if (specialty) query.specialization = specialty;
        const doctors = await Doctor.find(query);
        res.status(200).json(doctors);
    } catch (error) { res.status(500).json({ message: error.message }); }
  },

  // Prescription logic using PDF and Database saving from main branch
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
        doc.fontSize(12).text(`Date: ${new Date().toLocaleDateString()}`);
        doc.text(`Patient: ${patientName}`);
        doc.text(`Diagnosis: ${diagnosis}`).moveDown();
        
        doc.fontSize(14).text('Medicines:', { underline: true }).moveDown(0.5);
        medicines.forEach((med, index) => { 
            doc.fontSize(12).text(`${index + 1}. ${med.name} - ${med.dosage} (${med.frequency})`); 
        });
        
        doc.end();

        writeStream.on('finish', async () => {
            const newPrescription = new Prescription({ 
                appointmentId, doctorId, patientId, patientName, diagnosis, medicines, pdfPath: filePath 
            });
            await newPrescription.save();
            res.status(201).json({ 
                message: 'Prescription generated', 
                pdfUrl: `http://localhost:5003/prescriptions/${filename}`, 
                data: newPrescription 
            });
        });
    } catch (error) { 
        console.error('Error issuing prescription:', error);
        res.status(500).json({ message: 'Failed to issue prescription' }); 
    }
  },

  updateDoctor: async (req, res) => {
    try {
        const doctor = await Doctor.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        res.status(200).json({ message: 'Doctor updated', data: doctor });
    } catch (error) { res.status(500).json({ message: error.message }); }
  },

  verifyDoctor: async (req, res) => {
    try {
        const doctor = await Doctor.findByIdAndUpdate(req.params.id, { verified: true }, { new: true });
        res.status(200).json(doctor);
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
  }
};