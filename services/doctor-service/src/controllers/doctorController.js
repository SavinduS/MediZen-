/**
 * Doctor Controller
 * Handles business logic for Doctor Profile Management
 */

const Doctor = require('../models/Doctor');

// @desc    Register or Create a new Doctor Profile
// @route   POST /api/doctors
// @access  Private (Typically called after Auth registration)
exports.createDoctorProfile = async (req, res) => {
    try {
        const { userId, doctorId, name, specialization, qualifications, fee, bio } = req.body;

        // Validation: Check if doctor profile already exists for this user
        const existingDoctor = await Doctor.findOne({ userId });
        if (existingDoctor) {
            return res.status(400).json({ message: 'Doctor profile already exists for this user' });
        }

        // Create a new doctor profile instance
        const newDoctor = new Doctor({
            userId,
            doctorId,
            name,
            specialization,
            qualifications,
            fee,
            bio
        });

        // Save to the doctor_db database
        const savedDoctor = await newDoctor.save();

        res.status(201).json({
            message: 'Doctor profile created successfully',
            data: savedDoctor
        });
    } catch (error) {
        console.error('Error creating doctor profile:', error.message);
        res.status(500).json({ message: 'Server error while creating doctor profile' });
    }
};
/**
 * Availability Management Logic
 */
const Availability = require('../models/Availability');

// @desc    Set or Update Doctor's Weekly Availability
// @route   PUT /api/doctors/:id/availability
// @access  Private (Doctor only)
exports.updateAvailability = async (req, res) => {
    try {
        const doctorId = req.params.id; // Internal MongoDB ID of the doctor
        const slots = req.body.slots; // Array of availability objects

        /*
          Sample slots format:
          [
            { dayOfWeek: 'Monday', startTime: '09:00', endTime: '12:00' },
            { dayOfWeek: 'Wednesday', startTime: '14:00', endTime: '17:00' }
          ]
        */

        // 1. Delete existing availability for this doctor before updating
        await Availability.deleteMany({ doctorId });

        // 2. Prepare new slots with the doctor ID attached
        const availabilityData = slots.map(slot => ({
            doctorId,
            dayOfWeek: slot.dayOfWeek,
            startTime: slot.startTime,
            endTime: slot.endTime,
            isAvailable: true
        }));

        // 3. Save all slots to the database
        const savedAvailability = await Availability.insertMany(availabilityData);

        res.status(200).json({
            message: 'Availability updated successfully',
            data: savedAvailability
        });
    } catch (error) {
        console.error('Error updating availability:', error.message);
        res.status(500).json({ message: 'Server error while updating availability' });
    }
};

// @desc    Get availability slots for a specific doctor
// @route   GET /api/doctors/:id/availability
// @access  Public
exports.getDoctorAvailability = async (req, res) => {
    try {
        const doctorId = req.params.id;
        const availability = await Availability.find({ doctorId });
        
        if (!availability) {
            return res.status(404).json({ message: 'No availability found for this doctor' });
        }

        res.status(200).json(availability);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching availability' });
    }
};

// @desc    Get all verified doctors (for patient search)
// @route   GET /api/doctors
// @access  Public
exports.getAllDoctors = async (req, res) => {
    try {
        const { specialty } = req.query;
        let query = { verified: true }; // Only show verified doctors to patients

        // Filter by specialty if provided in query params (?specialty=Cardiology)
        if (specialty) {
            query.specialization = specialty;
        }

        const doctors = await Doctor.find(query);
        res.status(200).json(doctors);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching doctors' });
    }
};