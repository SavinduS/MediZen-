/**
 * Appointment Controller
 * Handles logic for booking, conflict detection, and status management.
 */

const Appointment = require('../models/Appointment');
const { v4: uuidv4 } = require('uuid'); // Install this: npm install uuid

// @desc    Book a new Appointment with Conflict Detection
// @route   POST /api/appointments
// @access  Private (Patient)
exports.bookAppointment = async (req, res) => {
    try {
        const { patientId, doctorId, slotTime } = req.body;

        // 1. Convert slotTime string to Date object for comparison
        const requestedTime = new Date(slotTime);

        // 2. CONFLICT DETECTION Logic: 
        // Search if any CONFIRMED or PENDING appointment already exists for this doctor at the exact same time
        const existingAppointment = await Appointment.findOne({
            doctorId: doctorId,
            slotTime: requestedTime,
            status: { $in: ['PENDING', 'CONFIRMED'] }
        });

        if (existingAppointment) {
            return res.status(409).json({ 
                message: 'This time slot is already booked for this doctor. Please choose another time.' 
            });
        }

        // 3. Create a unique Appointment ID
        const appointmentId = `APT-${uuidv4().slice(0, 8).toUpperCase()}`;

        // 4. Create new appointment record
        const newAppointment = new Appointment({
            appointmentId,
            patientId,
            doctorId,
            slotTime: requestedTime,
            status: 'PENDING' // Initially pending until payment is confirmed (Member 3 logic)
        });

        const savedAppointment = await newAppointment.save();

        res.status(201).json({
            message: 'Appointment requested successfully',
            data: savedAppointment
        });

    } catch (error) {
        console.error('Booking Error:', error.message);
        res.status(500).json({ message: 'Internal Server Error while booking' });
    }
};

// @desc    Update Appointment Status (Confirm/Cancel/Complete)
// @route   PUT /api/appointments/:id
// @access  Private (Doctor/Admin)
exports.updateAppointmentStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const { id } = req.params;

        const updatedAppointment = await Appointment.findByIdAndUpdate(
            id,
            { status },
            { new: true }
        );

        res.status(200).json({ message: 'Status updated', data: updatedAppointment });
    } catch (error) {
        res.status(500).json({ message: 'Error updating status' });
    }
};