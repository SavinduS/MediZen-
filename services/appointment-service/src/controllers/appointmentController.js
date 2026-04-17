/**
 * Appointment Controller - Final Version
 */
const Appointment = require('../models/Appointment');
const { v4: uuidv4 } = require('uuid');
const { publishNotification } = require('../config/rabbitMQ');

// @desc    Book a new Appointment with Conflict Detection
// @route   POST /api/appointments
//test 
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

const axios = require('axios');

// @desc    Cancel an Appointment
// @route   DELETE /api/appointments/:id
exports.cancelAppointment = async (req, res) => {
    try {
        const { id } = req.params;

        // 1. Find and update the appointment status
        const appointment = await Appointment.findByIdAndUpdate(
            id,
            { status: 'CANCELLED' },
            { new: true }
        );

        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found' });
        }

        // 2. Publish cancellation event to RabbitMQ
        const eventData = {
            type: 'APPOINTMENT_CANCELLED',
            payload: {
                appointmentId: appointment.appointmentId,
                patientId: appointment.patientId,
                doctorId: appointment.doctorId,
                slotTime: appointment.slotTime
            }
        };
        publishNotification(eventData);

        res.status(200).json({
            message: 'Appointment cancelled successfully',
            data: appointment
        });
    } catch (error) {
        console.error('❌ Cancellation Error:', error.message);
        res.status(500).json({ message: 'Failed to cancel appointment' });
    }
};

// @desc    Get FREE time slots for a doctor on a specific date
// @route   GET /api/doctors/:id/slots?date=YYYY-MM-DD
exports.getAvailableSlots = async (req, res) => {
    try {
        const idParam = req.params.id;
        const { date } = req.query; // Format: YYYY-MM-DD

        if (!date) {
            return res.status(400).json({ message: 'Date query parameter is required' });
        }

        // 1. Get Doctor's ID (could be internal ID or custom doctorId)
        // We first try to fetch by the param provided. 
        // We need to know if we should call /api/doctors/:id/availability or /api/doctors/user/:userId/availability
        // The doctor-service has getDoctorById (params.id) and getDoctorByUserId (params.userId)
        
        let doctorInternalId = idParam;
        
        // If the ID looks like a custom DOC-XXXX ID, we might need to find the internal ID first
        // But the doctor-service availability route we implemented uses the internal MongoDB _id
        // Let's call a discovery endpoint or just try to get the profile.
        
        let doctorProfile;
        try {
            // Try as internal ID
            const profileRes = await axios.get(`http://localhost:5003/api/doctors/${idParam}`);
            doctorProfile = profileRes.data;
            doctorInternalId = doctorProfile._id;
        } catch (e) {
            // If failed, maybe it's the custom doctorId string?
            // We'll search for the doctor by their custom ID if needed, 
            // but for now let's assume the frontend passes the _id or we handle the mapping.
            console.error("Could not find doctor by ID:", idParam);
            return res.status(404).json({ message: 'Doctor not found' });
        }

        // 2. Get Weekly Availability
        const doctorServiceUrl = `http://localhost:5003/api/doctors/${doctorInternalId}/availability`;
        const response = await axios.get(doctorServiceUrl);
        const weeklyAvailability = response.data;

        // 3. Determine the day of the week
        const requestedDate = new Date(date);
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dayName = days[requestedDate.getDay()];

        // 4. Filter availability
        const daySlots = weeklyAvailability.filter(slot => slot.dayOfWeek === dayName);

        if (daySlots.length === 0) {
            return res.status(200).json([]); 
        }

        // 5. Fetch existing appointments
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const existingAppointments = await Appointment.find({
            doctorId: { $in: [doctorInternalId.toString(), doctorProfile.doctorId] },
            slotTime: { $gte: startOfDay, $lte: endOfDay },
            status: { $ne: 'CANCELLED' }
        });

        // 6. Generate slots
        let freeSlots = [];
        daySlots.forEach(avail => {
            let current = new Date(`${date}T${avail.startTime}:00`);
            const end = new Date(`${date}T${avail.endTime}:00`);

            while (current < end) {
                const isBooked = existingAppointments.some(app => 
                    new Date(app.slotTime).getTime() === current.getTime()
                );

                if (!isBooked) {
                    freeSlots.push(new Date(current).toISOString());
                }
                current.setHours(current.getHours() + 1);
            }
        });

        res.status(200).json(freeSlots);
    } catch (error) {
        console.error('❌ Slot Calculation Error:', error.message);
        res.status(500).json({ message: 'Error calculating free slots' });
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