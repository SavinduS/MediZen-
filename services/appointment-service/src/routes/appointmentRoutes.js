const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');

// POST /api/appointments
router.post('/', appointmentController.bookAppointment);

// GET /api/appointments/patient/:patientId
router.get('/patient/:patientId', appointmentController.getPatientAppointments);

// Get ALL appointments (For Doctor dashboard usage)
router.get('/', appointmentController.getAllAppointments);

// PUT /api/appointments/:id
router.put('/:id', appointmentController.updateAppointmentStatus);

module.exports = router;