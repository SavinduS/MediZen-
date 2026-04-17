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

  issuePrescription: async (req, res) => {
    try {
        const { appointmentId, doctorId, patientId, patientName, patientEmail, diagnosis, medicines } = req.body;
        const filename = `prescription-${appointmentId}.pdf`;
        const uploadsDir = path.join(__dirname, '../../public/prescriptions');
        if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
        const filePath = path.join(uploadsDir, filename);
        
        const doc = new PDFDocument({ margin: 50, size: 'A4', compress: true });
        const writeStream = fs.createWriteStream(filePath);
        doc.pipe(writeStream);
        
        // --- HEADER ---
        doc.rect(0, 0, 600, 120).fill('#0f172a');
        doc.fillColor('#3b82f6').fontSize(25).font('Helvetica-Bold').text('MEDIZEN', 50, 40);
        doc.fillColor('#ffffff').fontSize(10).font('Helvetica').text('SMART HEALTHCARE PLATFORM', 50, 70);
        doc.fillColor('#ffffff').fontSize(10).text('ISO 9001:2026 CERTIFIED CLINIC', 50, 85);
        
        // --- CLINICAL DETAILS ---
        doc.fillColor('#000000').fontSize(20).font('Helvetica-Bold').text('MEDICAL PRESCRIPTION', 50, 150, { align: 'center' });
        doc.rect(50, 180, 500, 2).fill('#3b82f6');
        
        doc.fillColor('#64748b').fontSize(10).font('Helvetica-Bold').text('DATE:', 50, 200);
        doc.fillColor('#000000').text(new Date().toLocaleDateString(), 100, 200);
        
        doc.fillColor('#64748b').text('APPOINTMENT ID:', 350, 200);
        doc.fillColor('#000000').text(appointmentId, 460, 200);

        doc.rect(50, 230, 500, 80).fill('#f8fafc');
        doc.fillColor('#0f172a').fontSize(12).font('Helvetica-Bold').text('PATIENT INFORMATION', 70, 245);
        doc.fontSize(10).font('Helvetica').text(`Name: ${patientName}`, 70, 265);
        doc.text(`Email: ${patientEmail || 'N/A'}`, 70, 280);

        // --- DIAGNOSIS ---
        doc.fillColor('#0f172a').fontSize(14).font('Helvetica-Bold').text('Clinical Diagnosis', 50, 340);
        doc.fontSize(11).font('Helvetica').text(diagnosis, 50, 360, { width: 500 });

        // --- MEDICINES TABLE ---
        doc.rect(50, 410, 500, 30).fill('#3b82f6');
        doc.fillColor('#ffffff').fontSize(11).font('Helvetica-Bold').text('Medication', 70, 420);
        doc.text('Dosage', 300, 420);
        doc.text('Frequency', 450, 420);

        let y = 455;
        medicines.forEach((med, index) => {
            if (index % 2 === 0) doc.rect(50, y-10, 500, 30).fill('#f1f5f9');
            doc.fillColor('#0f172a').fontSize(10).font('Helvetica').text(med.name, 70, y);
            doc.text(med.dosage, 300, y);
            doc.text(med.frequency, 450, y);
            y += 35;
        });

        // --- FOOTER ---
        doc.rect(50, 700, 500, 1).fill('#cbd5e1');
        doc.fillColor('#64748b').fontSize(8).text('This is a digitally generated document. Valid without physical signature.', 50, 715, { align: 'center' });
        doc.fillColor('#3b82f6').fontSize(10).font('Helvetica-Bold').text('www.medizen.com', 50, 735, { align: 'center' });

        doc.end();

        writeStream.on('finish', async () => {
            const pdfUrl = `http://localhost:5003/prescriptions/${filename}`;
            const newPrescription = new Prescription({ 
                appointmentId, doctorId, patientId, patientName, diagnosis, medicines, pdfPath: filePath 
            });
            await newPrescription.save();

            // Optimization: PDF generation is now compressed (compress: true).
            // Requirement: "doctor prescription ekk daddi mail ekak ynna one n patiant ta nikn prescriptipton eke pennuwahama athi mail ekk one naha"
            // Implementation: Send notification to the DOCTOR (doctorId in this case is the doctor's email from frontend).
            // The patient only sees it in their dashboard (already implemented in MyPrescriptions).
            
            const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:5008';
            
            if (doctorId && doctorId.includes('@')) {
                try {
                    console.log(`[Admin] Triggering doctor notification for ${doctorId}`);
                    await axios.post(`${NOTIFICATION_SERVICE_URL}/api/notifications/send`, {
                        userId: doctorId,
                        type: 'email',
                        recipient: doctorId,
                        subject: `Prescription Issued: ${appointmentId}`,
                        message: `<h3>Medical Prescription Issued</h3><p>You have successfully issued a prescription for ${patientName}.</p><p>Appointment ID: <strong>${appointmentId}</strong></p>`
                    });
                } catch (notifyErr) {
                    console.error(' [Doctor Service] Notification sync failed:', notifyErr.message);
                }
            }

            console.log(`✅ [Member 2] Prescription Generated & Doctor Notified: ${filename}`);

            res.status(201).json({ 
                message: 'Prescription generated', 
                pdfUrl: pdfUrl, 
                data: newPrescription 
            });
        });
    } catch (error) { 
        console.error('Error issuing prescription:', error);
        res.status(500).json({ message: 'Failed to issue prescription' }); 
    }
  },

  updateDoctorProfile: async (req, res) => {
    try {
        const doctorId = req.params.id;
        const { specialization, fee, bio } = req.body;
        const updatedDoctor = await Doctor.findByIdAndUpdate(
            doctorId,
            { specialization, fee, bio },
            { new: true, runValidators: true }
        );
        if (!updatedDoctor) return res.status(404).json({ message: 'Doctor profile not found' });
        res.status(200).json({ message: 'Profile updated successfully', data: updatedDoctor });
    } catch (error) { res.status(400).json({ message: 'Error updating profile: ' + error.message }); }
  },

  deleteDoctorProfile: async (req, res) => {
    try {
        const doctorId = req.params.id;
        await Availability.deleteMany({ doctorId });
        const deletedDoctor = await Doctor.findByIdAndDelete(doctorId);
        if (!deletedDoctor) return res.status(404).json({ message: 'Doctor profile not found' });
        res.status(200).json({ message: 'Doctor profile and availability deleted successfully' });
    } catch (error) { res.status(500).json({ message: 'Server error while deleting profile' }); }
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

  getPrescriptionsByPatientId: async (req, res) => {
    try {
        const prescriptions = await Prescription.find({ patientId: req.params.patientId }).sort({ issuedAt: -1 });
        res.status(200).json(prescriptions);
    } catch (error) { res.status(500).json({ message: error.message }); }
  },

  deleteDoctorAdmin: async (req, res) => {
    try {
        const doctor = await Doctor.findByIdAndDelete(req.params.id);
        if (!doctor) return res.status(404).json({ success: false, message: "Doctor not found" });
        res.status(200).json({ success: true, message: "Doctor deleted successfully" });
    } catch (error) { res.status(500).json({ success: false, error: error.message }); }
  }
};