/**
 * Appointment Service Routes
 */

const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');

// POST /api/appointments - Book a slot
router.post('/', appointmentController.bookAppointment);

// PUT /api/appointments/:id - Update status (Confirm/Cancel)
router.put('/:id', appointmentController.updateAppointmentStatus);

module.exports = router;