const mongoose = require('mongoose');
const axios = require('axios');
const AuditLog = require('../models/AuditLog');
const { getPagination } = require('../utils/pagination');
const { getDateFilter } = require('../utils/dateFilter');
const { successResponse } = require('../utils/apiResponse');
const { AUDIT_ACTIONS, TARGET_TYPES, PAYMENT_STATUS, ROLES } = require('../config/constants');

// Generic schemas for cross-db access
const userSchema = new mongoose.Schema({
    clerkId: { type: String, required: true },
    name: { type: String, default: 'Unknown User' },
    email: { type: String, required: true },
    role: { type: String, default: 'patient' },
    status: { type: String, default: 'active' },
    createdAt: { type: Date, default: Date.now }
});

const paymentSchema = new mongoose.Schema({
    amount: { type: Number, required: true },
    status: { type: String, default: 'pending' },
    patientName: String,
    email: String,
    createdAt: { type: Date, default: Date.now }
});

const patientSchema = new mongoose.Schema({
    name: String,
    email: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const appointmentSchema = new mongoose.Schema({
    patientId: String,
    doctorId: String,
    status: { type: String, default: 'pending' },
    createdAt: { type: Date, default: Date.now }
});

let Payment, Patient, User, Appointment;

// Internal Service URL Handling
let DOCTOR_SERVICE_URL = process.env.DOCTOR_SERVICE_URL || 'http://localhost:5003';
// Remove trailing slash if exists to prevent double slashes in paths
DOCTOR_SERVICE_URL = DOCTOR_SERVICE_URL.replace(/\/$/, '');

/**
 * Robust initialization of models using established cross-db connections
 */
const initModels = (connections) => {
  try {
    Payment = connections.paymentConn.models.Payment || connections.paymentConn.model('Payment', paymentSchema);
    Patient = connections.patientConn.models.Patient || connections.patientConn.model('Patient', patientSchema);
    Appointment = connections.appointmentConn.models.Appointment || connections.appointmentConn.model('Appointment', appointmentSchema);
    User = connections.authConn.models.User || connections.authConn.model('User', userSchema);
    
    console.log(' [Admin Service] Cross-service models initialized');
  } catch (err) {
    console.error(' [Admin Service] Model Initialization Error:', err);
  }
};

/**
 * @swagger
 * /api/admin/doctors:
 *   get:
 *     summary: List all doctors via HTTP from Doctor Service
 */
const getDoctors = async (req, res, next) => {
    console.log('[Controller] getDoctors called');
    try {
        const { search, page, limit } = req.query;
        const targetUrl = `${DOCTOR_SERVICE_URL}/api/doctors`;
        
        console.log(`[Admin] Fetching doctors from: ${targetUrl}`);
        
        const response = await axios.get(targetUrl).catch(err => {
            console.error(' [Admin] Axios Error fetching doctors:', err.message);
            if (err.response) {
                console.error('Response Data:', err.response.data);
                console.error('Response Status:', err.response.status);
            }
            throw new Error(`Connection to Doctor Service failed at ${targetUrl}`);
        });

        // Ensure data is an array
        let doctors = [];
        if (response && response.data) {
            doctors = Array.isArray(response.data) ? response.data : (response.data.data && Array.isArray(response.data.data) ? response.data.data : []);
        }

        console.log(`[Admin] Received ${doctors.length} doctors from service`);

        if (search && search.trim() !== '') {
            const safeSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(safeSearch, 'i');
            doctors = doctors.filter(d =>
                (d && d.name && regex.test(d.name)) ||
                (d && d.specialization && regex.test(d.specialization))
            );
        }

        const total = doctors.length;
        const { skip, limit: l, page: p } = getPagination(page, limit);
        const paginatedDoctors = doctors.slice(skip, skip + l);

        const formattedDoctors = paginatedDoctors.map(d => ({
            ...d,
            role: 'doctor',
            status: d.verified ? 'active' : 'pending'
        }));

        return successResponse(res, {
            users: formattedDoctors,
            pagination: { total, page: p, pages: Math.ceil(total / l) }
        });
    } catch (error) {
        console.error(' [Admin Service] getDoctors Exception:', error);
        return res.status(500).json({ status: 'error', message: error.message });
    }
};

/**
 * @swagger
 * /api/admin/doctors:
 *   post:
 *     summary: Register a new doctor profile (Proxy to Doctor Service)
 */
const addDoctor = async (req, res, next) => {
    try {
        console.log('[Admin] Proxying Create Doctor request to Doctor Service');
        const response = await axios.post(`${DOCTOR_SERVICE_URL}/api/doctors`, req.body);
        
        AuditLog.create({
            adminId: req.user.id,
            action: 'CREATE_DOCTOR',
            targetId: response.data.data?._id,
            targetType: TARGET_TYPES.DOCTOR,
        }).catch(e => console.error(' Audit Log Error:', e.message));

        return res.status(201).json(response.data);
    } catch (error) {
        console.error(' [Admin Service] addDoctor Exception:', error.response?.data || error.message);
        return res.status(error.response?.status || 500).json(error.response?.data || { message: error.message });
    }
};

/**
 * @swagger
 * /api/admin/doctors/:id:
 *   put:
 *     summary: Update doctor details (Proxy to Doctor Service)
 */
const updateDoctor = async (req, res, next) => {
    try {
        const { id } = req.params;
        console.log(`[Admin] Proxying Update Doctor ${id} to Doctor Service`);
        const response = await axios.put(`${DOCTOR_SERVICE_URL}/api/doctors/${id}`, req.body);
        
        AuditLog.create({
            adminId: req.user.id,
            action: 'UPDATE_DOCTOR',
            targetId: id,
            targetType: TARGET_TYPES.DOCTOR,
        }).catch(e => console.error(' Audit Log Error:', e.message));

        return res.status(200).json(response.data);
    } catch (error) {
        console.error(' [Admin Service] updateDoctor Exception:', error.response?.data || error.message);
        return res.status(error.response?.status || 500).json(error.response?.data || { message: error.message });
    }
};

/**
 * @swagger
 * /api/admin/doctors/:id:
 *   delete:
 *     summary: Delete doctor profile (Proxy to Doctor Service)
 */
const deleteDoctor = async (req, res, next) => {
    try {
        const { id } = req.params;
        console.log(`[Admin] Proxying Delete Doctor ${id} to Doctor Service`);
        const response = await axios.delete(`${DOCTOR_SERVICE_URL}/api/doctors/${id}`);
        
        AuditLog.create({
            adminId: req.user.id,
            action: 'DELETE_DOCTOR',
            targetId: id,
            targetType: TARGET_TYPES.DOCTOR,
        }).catch(e => console.error(' Audit Log Error:', e.message));

        return res.status(200).json(response.data);
    } catch (error) {
        console.error(' [Admin Service] deleteDoctor Exception:', error.response?.data || error.message);
        return res.status(error.response?.status || 500).json(error.response?.data || { message: error.message });
    }
};

/**
 * @swagger
 * /api/admin/doctors/:id/availability:
 *   get:
 *     summary: Fetch doctor availability (Proxy to Doctor Service)
 */
const getDoctorAvailability = async (req, res, next) => {
    try {
        const { id } = req.params;
        console.log(`[Admin] Proxying Get Availability for Doctor ${id} to Doctor Service`);
        const response = await axios.get(`${DOCTOR_SERVICE_URL}/api/doctors/${id}/availability`);
        return res.status(200).json(response.data);
    } catch (error) {
        console.error(' [Admin Service] getDoctorAvailability Exception:', error.response?.data || error.message);
        return res.status(error.response?.status || 500).json(error.response?.data || { message: error.message });
    }
};

/**
 * @swagger
 * /api/admin/users:
 */
const getAllUsers = async (req, res, next) => {
  try {
    const { role, search, page, limit } = req.query;
    
    if (role === 'doctor') {
        return getDoctors(req, res, next);
    }

    if (!User) {
        console.warn(' [Admin Service] User model not available for getAllUsers');
        return successResponse(res, { users: [], pagination: { total: 0, page: 1, pages: 0 } });
    }

    const filter = {};
    if (role && role !== 'all') {
        filter.role = { $regex: new RegExp(`^${role}$`, 'i') };
    }
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const { skip, limit: l, page: p } = getPagination(page, limit);
    
    console.log(`[Admin] Querying users with filter: ${JSON.stringify(filter)}`);

    const [users, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(l).lean().catch(e => {
          console.error('[Admin] MongoDB User.find Error:', e.message);
          return [];
      }),
      User.countDocuments(filter).catch(e => {
          console.error('[Admin] MongoDB User.count Error:', e.message);
          return 0;
      })
    ]);

    return successResponse(res, {
      users: users || [],
      pagination: { total: total || 0, page: p, pages: Math.ceil((total || 0) / l) }
    });
  } catch (error) {
    console.error(' [Admin Service] getAllUsers Exception:', error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

/**
 * @swagger
 * /api/admin/users/:id/status:
 */
const updateUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!User) throw new Error('User model not ready');

    const user = await User.findByIdAndUpdate(id, { status }, { new: true });
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    AuditLog.create({
        adminId: req.user.id,
        action: 'UPDATE_USER_STATUS',
        targetId: id,
        targetType: TARGET_TYPES.USER,
    }).catch(e => console.error(' Audit Log Error:', e.message));

    return successResponse(res, user, 'User status updated successfully');
  } catch (error) {
    console.error(' [Admin Service] updateUserStatus Exception:', error);
    next(error);
  }
};

/**
 * @swagger
 * /api/admin/payments:
 */
const getAllPayments = async (req, res, next) => {
  try {
    if (!Payment) return successResponse(res, { payments: [], pagination: { total: 0, page: 1, pages: 0 } });

    const { status, from, to, page, limit } = req.query;
    const filter = {};
    if (status) filter.status = status;
    
    const dateRange = getDateFilter(from, to);
    if (dateRange) filter.createdAt = dateRange;

    const { skip, limit: l, page: p } = getPagination(page, limit);
    
    const [payments, total] = await Promise.all([
      Payment.find(filter).sort({ createdAt: -1 }).skip(skip).limit(l).lean().catch(() => []),
      Payment.countDocuments(filter).catch(() => 0)
    ]);

    return successResponse(res, {
      payments: payments || [],
      pagination: { total: total || 0, page: p, pages: Math.ceil((total || 0) / l) }
    });
  } catch (error) {
    console.error(' [Admin Service] getAllPayments Exception:', error);
    next(error);
  }
};

/**
 * @swagger
 * /api/admin/doctors/pending:
 */
const getPendingDoctors = async (req, res, next) => {
  try {
    const response = await axios.get(`${DOCTOR_SERVICE_URL}/api/doctors`);
    const doctors = Array.isArray(response.data) ? response.data : [];
    const pending = doctors.filter(d => d.verified === false);
    return successResponse(res, pending);
  } catch (error) {
    console.error(' [Admin Service] getPendingDoctors Exception:', error);
    next(error);
  }
};

/**
 * @swagger
 * /api/admin/doctors/:id/verify:
 */
const verifyDoctor = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const response = await axios.put(`${DOCTOR_SERVICE_URL}/api/doctors/${id}/verify`, req.body);
    const doctor = response.data;

    // Sync with Auth Service
    const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:5001';
    try {
        await axios.put(`${AUTH_SERVICE_URL}/api/users/${doctor.userId}/role`, {
            role: ROLES.DOCTOR
        });
    } catch (authError) {
        console.error(` [Admin] Role sync failed:`, authError.message);
    }

    AuditLog.create({
        adminId: req.user.id,
        action: AUDIT_ACTIONS.VERIFY_DOCTOR,
        targetId: id,
        targetType: TARGET_TYPES.DOCTOR,
    }).catch(e => console.error(' Audit Log Error:', e.message));

    return successResponse(res, doctor, 'Doctor verified successfully');
  } catch (error) {
    console.error(' [Admin Service] verifyDoctor Exception:', error);
    next(error);
  }
};

/**
 * @swagger
 * /api/admin/stats:
 */
const getStats = async (req, res, next) => {
  try {
    const stats = {
        totalDoctors: 0,
        pendingDoctors: 0,
        totalPatients: 0,
        totalAppointments: 0,
        totalPayments: 0,
        totalRevenue: 0
    };

    const promises = [];

    // Orchestrate Doctor stats via HTTP
    promises.push(axios.get(`${DOCTOR_SERVICE_URL}/api/doctors`).then(res => {
        const doctors = Array.isArray(res.data) ? res.data : [];
        stats.totalDoctors = doctors.length;
        stats.pendingDoctors = doctors.filter(d => !d.verified).length;
    }).catch(e => console.warn('[Admin] Stats: Doctor Service unreachable', e.message)));
    
    if (Patient) promises.push(Patient.countDocuments().then(c => stats.totalPatients = c).catch(() => 0));
    if (Appointment) promises.push(Appointment.countDocuments().then(c => stats.totalAppointments = c).catch(() => 0));
    if (Payment) {
        promises.push(Payment.countDocuments().then(c => stats.totalPayments = c).catch(() => 0));
        promises.push(Payment.aggregate([
            { $match: { status: 'completed' } },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]).then(result => {
            stats.totalRevenue = result.length > 0 ? result[0].total : 0;
        }).catch(() => 0));
    }

    await Promise.all(promises);
    return successResponse(res, stats);
  } catch (error) {
    console.error(' [Admin Service] getStats Exception:', error);
    next(error);
  }
};

module.exports = {
  initModels,
  getAllPayments,
  getPendingDoctors,
  getDoctors,
  addDoctor,
  updateDoctor,
  deleteDoctor,
  verifyDoctor,
  getDoctorAvailability,
  getStats,
  getAllUsers,
  updateUserStatus
};
