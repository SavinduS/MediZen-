/**
 * Doctor Management Routes
 */

const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctorController');

// --- DOCTOR PROFILE ROUTES ---
router.post('/', doctorController.createDoctorProfile); // Create Profile
router.get('/', doctorController.getAllDoctors);       // Search Doctors
router.get('/user/:userId', doctorController.getDoctorByUserId); // Get Profile by User ID
router.get('/:id', doctorController.getDoctorById);    // Get Detailed Profile
router.put('/:id', doctorController.updateDoctorProfile); // Update Profile
router.delete('/:id', doctorController.deleteDoctorProfile); // Delete Profile

// --- AVAILABILITY ROUTES ---

// PUT /api/doctors/:id/availability - Set weekly slots
router.put('/:id/availability', doctorController.updateAvailability);

// GET /api/doctors/:id/availability - View specific doctor slots
router.get('/:id/availability', doctorController.getDoctorAvailability);

// POST /api/doctors/prescriptions - Doctor issues a prescription
router.post('/prescriptions', doctorController.issuePrescription);

module.exports = router;