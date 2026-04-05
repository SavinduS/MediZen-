/**
 * Appointment Controller - Final Version
 */
const Appointment = require('../models/Appointment');
const { v4: uuidv4 } = require('uuid');
const { publishNotification } = require('../config/rabbitMQ');

// @desc    Book a new Appointment with Conflict Detection
// @route   POST /api/appointments
exports.bookAppointment = async (req, res) => {
    try {
        const { patientId, doctorId, slotTime } = req.body;
        const requestedTime = new Date(slotTime);

        // 1. CONFLICT DETECTION Logic
        const existingAppointment = await Appointment.findOne({
            doctorId,
            slotTime: requestedTime,
            status: { $in: ['PENDING', 'CONFIRMED'] }
        });

        if (existingAppointment) {
            console.log("❌ Slot Conflict Detected");
            return res.status(409).json({ message: 'This slot is already booked.' });
        }

        // 2. CREATE AND SAVE RECORD
        const appointmentId = `APT-${uuidv4().slice(0, 8).toUpperCase()}`;
        const newAppointment = new Appointment({
            appointmentId,
            patientId,
            doctorId,
            slotTime: requestedTime,
            status: 'PENDING'
        });

        const savedAppointment = await newAppointment.save();
        console.log(`✅ [DB] Saved Appointment: ${savedAppointment.appointmentId}`);

        // 3. PUBLISH TO RABBITMQ
        const eventData = {
            type: 'APPOINTMENT_BOOKED',
            payload: savedAppointment
        };
        publishNotification(eventData);

        // 4. RESPONSE
        return res.status(201).json({
            message: 'Appointment booked successfully!',
            data: savedAppointment
        });

    } catch (error) {
        console.error('❌ Controller Error:', error.message);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

// @desc    Update Appointment Status
exports.updateAppointmentStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const { id } = req.params;

        const updated = await Appointment.findByIdAndUpdate(id, { status }, { new: true });
        
        if (!updated) return res.status(404).json({ message: 'Not found' });
        
        console.log(`✅ [DB] Status Updated: ${status}`);
        res.status(200).json({ data: updated });
    } catch (error) {
        res.status(500).json({ message: 'Failed to update status' });
    }
};

/**
 * @desc    Get all appointments for a specific patient (History)
 * @route   GET /api/appointments/patient/:patientId
 */
exports.getPatientAppointments = async (req, res) => {
    try {
        const { patientId } = req.params; // Get ID from URL parameter

        // Find appointments and sort them by time (newest first)
        const appointments = await Appointment.find({ patientId }).sort({ slotTime: -1 });

        // If found, return the list
        res.status(200).json(appointments);
    } catch (error) {
        console.error('❌ Fetch History Error:', error.message);
        res.status(500).json({ message: 'Error fetching patient history' });
    }
};

/**
 * @desc    Get all appointments (Internal/Admin/Doctor Dashboard use)
 * @route   GET /api/appointments
 */
exports.getAllAppointments = async (req, res) => {
    try {
        const appointments = await Appointment.find().sort({ slotTime: 1 });
        res.status(200).json(appointments);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching appointments' });
    }
};