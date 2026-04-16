/**
 * Doctor Controller
 * Handles business logic for Doctor Profile Management
 */

const Doctor = require('../models/Doctor');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const Prescription = require('../models/Prescription');

// --- EXPORTS ---
module.exports = {
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

  updateAvailability: async (req, res) => {
    try {
        const doctorId = req.params.id;
        const slots = req.body.slots;
        await Availability.deleteMany({ doctorId });
        const availabilityData = slots.map(slot => ({ doctorId, dayOfWeek: slot.dayOfWeek, startTime: slot.startTime, endTime: slot.endTime, isAvailable: true }));
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

// @desc    Get doctor profile by Clerk User ID
// @route   GET /api/doctors/user/:userId
exports.getDoctorByUserId = async (req, res) => {
    try {
        const userId = req.params.userId;
        const doctor = await Doctor.findOne({ userId });
        
        if (!doctor) {
            return res.status(404).json({ message: 'Doctor profile not found for this user' });
        }

        const availability = await Availability.find({ doctorId: doctor._id });

        res.status(200).json({
            ...doctor.toObject(),
            availability: availability || []
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching doctor profile' });
    }
};

// @desc    Get detailed profile for a specific doctor (includes availability)
// @route   GET /api/doctors/:id
// @access  Public
exports.getDoctorById = async (req, res) => {
    try {
        const doctorId = req.params.id; // Internal MongoDB ID of the doctor
        
        // Find the doctor by MongoDB ID
        const doctor = await Doctor.findById(doctorId);
        if (!doctor) {
            return res.status(404).json({ message: 'Doctor profile not found' });
        }

        // Fetch the doctor's weekly availability
        const availability = await Availability.find({ doctorId });

        res.status(200).json({
            ...doctor.toObject(),
            availability: availability || []
        });
    } catch (error) {
        console.error('Error fetching doctor profile:', error.message);
        res.status(500).json({ message: 'Server error while fetching doctor profile' });
    }
};

// @desc    Update Doctor Profile Information
// @route   PUT /api/doctors/:id
// @access  Private (Doctor/Admin only)
exports.updateDoctorProfile = async (req, res) => {
    try {
        const doctorId = req.params.id;
        const { specialization, fee, bio, verified } = req.body;

        // Find and update the doctor profile
        const updatedDoctor = await Doctor.findByIdAndUpdate(
            doctorId,
            { specialization, fee, bio, verified },
            { new: true, runValidators: true }
        );

        if (!updatedDoctor) {
            return res.status(404).json({ message: 'Doctor profile not found' });
        }

        res.status(200).json({
            message: 'Profile updated successfully',
            data: updatedDoctor
        });
    } catch (error) {
        console.error('Error updating doctor profile:', error.message);
        res.status(400).json({ message: 'Error updating profile: ' + error.message });
    }
};

// @desc    Delete Doctor Profile
// @route   DELETE /api/doctors/:id
// @access  Private (Doctor/Admin only)
exports.deleteDoctorProfile = async (req, res) => {
    try {
        const doctorId = req.params.id;

        // 1. Delete doctor's availability slots first
        await Availability.deleteMany({ doctorId });

        // 2. Delete the doctor profile
        const deletedDoctor = await Doctor.findByIdAndDelete(doctorId);

        if (!deletedDoctor) {
            return res.status(404).json({ message: 'Doctor profile not found' });
        }

        res.status(200).json({
            message: 'Doctor profile and availability deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting doctor profile:', error.message);
        res.status(500).json({ message: 'Server error while deleting profile' });
    }
};

// @desc    Get all verified doctors (for patient search)
// @route   GET /api/doctors
// @access  Public
// @desc    Get all doctors (Verification check temporarily removed for testing)
exports.getAllDoctors = async (req, res) => {
  getAllDoctors: async (req, res) => {
    try {
        const { specialty } = req.query;
        let query = {};
        if (specialty) query.specialization = specialty;
        const doctors = await Doctor.find(query);
        res.status(200).json(doctors);
    } catch (error) { res.status(500).json({ message: error.message }); }
  },

  verifyDoctor: async (req, res) => {
    try {
        const doctor = await Doctor.findByIdAndUpdate(req.params.id, { verified: true }, { new: true });
        if (!doctor) return res.status(404).json({ message: 'Doctor not found' });
        res.status(200).json(doctor);
    } catch (error) { res.status(500).json({ message: error.message }); }
  },

  updateDoctor: async (req, res) => {
    try {
        const doctor = await Doctor.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!doctor) return res.status(404).json({ message: 'Doctor not found' });
        res.status(200).json({ message: 'Doctor updated', data: doctor });
    } catch (error) { res.status(500).json({ message: error.message }); }
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
        doc.fontSize(12).text(`Date: ${new Date().toLocaleDateString()}`);
        doc.text(`Patient: ${patientName}`);
        doc.text(`Appointment ID: ${appointmentId}`);
        doc.text(`Diagnosis: ${diagnosis}`).moveDown();
        doc.fontSize(14).text('Medicines:', { underline: true }).moveDown(0.5);
        medicines.forEach((med, index) => { doc.fontSize(12).text(`${index + 1}. ${med.name} - ${med.dosage} (${med.frequency})`); });
        doc.moveDown(2);
        doc.text('--------------------------', { align: 'right' });
        doc.text('Doctor Signature', { align: 'right' });
        doc.end();
        writeStream.on('finish', async () => {
            const newPrescription = new Prescription({ appointmentId, doctorId, patientId, patientName, diagnosis, medicines, pdfPath: filePath });
            await newPrescription.save();
            res.status(201).json({ message: 'Prescription generated', pdfUrl: `http://localhost:5003/prescriptions/${filename}`, data: newPrescription });
        });
    } catch (error) { res.status(500).json({ message: 'Failed to issue prescription' }); }
  },

  getAdminDoctors: async (req, res) => {
    try {
        const doctors = await Doctor.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: doctors });
    } catch (error) { res.status(500).json({ success: false, error: error.message }); }
  },

  addDoctorAdmin: async (req, res) => {
    try {
        const { name, specialization, qualifications, fee, bio } = req.body;
        const userId = `admin_gen_${Date.now()}`;
        const doctorId = `DOC-${Math.floor(1000 + Math.random() * 9000)}`;
        const newDoctor = new Doctor({
            userId, doctorId, name, specialization,
            qualifications: typeof qualifications === 'string' ? qualifications.split(',').map(q => q.trim()) : qualifications,
            fee, bio, verified: true
        });
        const savedDoctor = await newDoctor.save();
        res.status(201).json({ success: true, data: savedDoctor });
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