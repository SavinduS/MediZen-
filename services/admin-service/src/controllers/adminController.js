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

const doctorSchema = new mongoose.Schema({
    name: { type: String, required: true },
    specialization: { type: String, required: true },
    verified: { type: Boolean, default: false },
    fee: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
});

const paymentSchema = new mongoose.Schema({
    amount: { type: Number, required: true },
    status: { type: String, default: 'pending' },
    patientId: String,
    paymentId: String,
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

let Payment, Patient, User, Appointment, Doctor;

// Internal Service URL Handling
let DOCTOR_SERVICE_URL = process.env.DOCTOR_SERVICE_URL || 'http://localhost:5003';
// Remove trailing slash if exists to prevent double slashes in paths
DOCTOR_SERVICE_URL = DOCTOR_SERVICE_URL.replace(/\/$/, '');

/**
 * Robust initialization of models using established cross-db connections
 */
const initModels = (connections) => {
  try {
    Payment = connections.paymentConn.model('Payment', paymentSchema);
    Patient = connections.patientConn.model('Patient', patientSchema);
    Appointment = connections.appointmentConn.model('Appointment', appointmentSchema);
    User = connections.authConn.model('User', userSchema);
    Doctor = connections.doctorConn.model('Doctor', doctorSchema);
    
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

    // 1. Try to fetch from Auth Service via HTTP first (Microservices approach)
    // This solves issues when databases are on different MongoDB instances
    const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:5001';
    // Ensure we don't have double slashes and point to the correct endpoint
    const baseUrl = AUTH_SERVICE_URL.replace(/\/$/, '');
    const targetUrl = baseUrl.includes('/api/auth') ? `${baseUrl}/users` : `${baseUrl}/api/auth/users`;
    
    console.log(`[Admin] Fetching users from Auth Service: ${targetUrl}`);
    
    try {
        const response = await axios.get(targetUrl);
        if (response.data && (response.data.success || response.data.status === 'success')) {
            let users = response.data.data;
            if (users && users.users) users = users.users; // Handle nested users object if present

            console.log(`[Admin] Received ${users?.length || 0} users from Auth Service`);

            if (Array.isArray(users)) {
                // Apply local filtering for name and email search
                if (search) {
                    const regex = new RegExp(search, 'i');
                    users = users.filter(u => 
                        (u.name && regex.test(u.name)) || 
                        (u.email && regex.test(u.email))
                    );
                }

                const total = users.length;
                const { skip, limit: l, page: p } = getPagination(page, limit);
                const paginatedUsers = users.slice(skip, skip + l);

                return successResponse(res, {
                    users: paginatedUsers.map(u => ({
                        ...u,
                        role: u.role || 'patient',
                        status: u.status || 'active'
                    })),
                    pagination: { total, page: p, pages: Math.ceil(total / l) }
                });
            }
        }
    } catch (httpError) {
        console.warn(` [Admin Service] Auth Service HTTP call failed, falling back to direct DB: ${httpError.message}`);
    }

    // 2. Fallback to direct DB access if HTTP fails or returns unexpected format
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
    
    console.log(`[Admin] Querying users from DB with filter: ${JSON.stringify(filter)}`);

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
    if (!Payment) {
        console.warn(' [Admin Service] Payment model not available for getAllPayments');
        return successResponse(res, { payments: [], pagination: { total: 0, page: 1, pages: 0 } });
    }

    const { status, from, to, page, limit, search } = req.query;
    const filter = {};
    
    if (status && status !== 'all' && status !== 'All') {
        filter.status = status.toLowerCase();
    }
    
    if (search) {
      filter.$or = [
        { paymentId: { $regex: search, $options: 'i' } },
        { patientId: { $regex: search, $options: 'i' } },
        { txnId: { $regex: search, $options: 'i' } }
      ];
    }

    const dateRange = getDateFilter(from, to);
    if (dateRange) filter.createdAt = dateRange;

    const { skip, limit: l, page: p } = getPagination(page, limit);
    
    console.log(`[Admin] Querying payments with filter: ${JSON.stringify(filter)}`);

    const [payments, total] = await Promise.all([
      Payment.find(filter).sort({ createdAt: -1 }).skip(skip).limit(l).lean().catch(e => {
          console.error('[Admin] MongoDB Payment.find Error:', e.message);
          return [];
      }),
      Payment.countDocuments(filter).catch(e => {
          console.error('[Admin] MongoDB Payment.count Error:', e.message);
          return 0;
      })
    ]);

    return successResponse(res, {
      payments: payments || [],
      pagination: { total: total || 0, page: p, pages: Math.ceil((total || 0) / l) }
    });
  } catch (error) {
    console.error(' [Admin Service] getAllPayments Exception:', error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

/**
 * @swagger
 * /api/admin/doctors/pending:
 */
const getPendingDoctors = async (req, res, next) => {
  try {
    const response = await axios.get(`${DOCTOR_SERVICE_URL}/api/doctors`);
    // Doctor service may return array directly OR wrapped in { data: [...] }
    let doctors = [];
    if (Array.isArray(response.data)) {
        doctors = response.data;
    } else if (response.data?.data && Array.isArray(response.data.data)) {
        doctors = response.data.data;
    } else if (response.data?.users && Array.isArray(response.data.users)) {
        doctors = response.data.users;
    }
    const pending = doctors.filter(d => d.verified === false);
    console.log(`[Admin] Pending doctors found: ${pending.length}`);
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
        pendingDoctorsCount: 0,
        totalPatients: 0,
        totalAppointments: 0,
        totalPayments: 0,
        totalRevenue: 0,
        recentActivity: [],
        recentAppointments: [],
        pendingDoctors: [],
        recentUsers: []
    };

    console.log('------------------------------------------------');
    console.log('[Admin Stats] Aggregating data across microservice databases...');
    
    // Check main connection status
    const connectionState = mongoose.connection.readyState;
    console.log(`[Connection] Mongoose state: ${connectionState} (1=Connected)`);
    
    if (connectionState !== 1) {
        throw new Error('Database connection not ready');
    }

    const conn = mongoose.connection;
    
    // Switch to target databases
    // Note: auth-service uses 'users' as dbName
    // Note: patient-service uses 'patients' in its index.js
    const authDb = conn.useDb('users', { useCache: true });
    const patientDb = conn.useDb('patients', { useCache: true }); 
    const doctorDb = conn.useDb('doctor_db', { useCache: true });
    const appointmentDb = conn.useDb('appointment_db', { useCache: true });
    const paymentDb = conn.useDb('payment_db', { useCache: true });


    // Debugging: List collections to verify visibility
    const listCollections = async (db, name) => {
        try {
            const collections = await db.db.listCollections().toArray();
            const names = collections.map(c => c.name);
            console.log(`[Debug] Collections in DB [${name}]:`, names);
            return names;
        } catch (e) {
            console.warn(`[Debug] Could not list collections in DB [${name}]:`, e.message);
            return [];
        }
    };

    await Promise.all([
        listCollections(authDb, 'users'),
        listCollections(patientDb, 'patients'),
        listCollections(doctorDb, 'doctor_db'),
        listCollections(appointmentDb, 'appointment_db'),
        listCollections(paymentDb, 'payment_db')
    ]);

    // Define models with EXPLICIT collection names confirmed from services
    const UserM = authDb.model('User', userSchema, 'users');
    const PatientM = patientDb.model('Patient', patientSchema, 'patients');
    const DoctorM = doctorDb.model('Doctor', doctorSchema, 'doctors');
    const AppointmentM = appointmentDb.model('Appointment', appointmentSchema, 'appointments');
    const PaymentM = paymentDb.model('Payment', paymentSchema, 'payments');

    const promises = [
      // 1. Doctor Stats
      DoctorM.countDocuments().then(c => {
          stats.totalDoctors = c;
          console.log(`[Stats Check] Doctors Found: ${c}`);
      }).catch(e => console.error('Error [doctor_db]:', e.message)),
      
      DoctorM.countDocuments({ verified: false }).then(c => {
          stats.pendingDoctorsCount = c;
          console.log(`[Stats Check] Pending Doctors: ${c}`);
      }).catch(() => 0),
      
      DoctorM.find({ verified: false }).sort({ createdAt: -1 }).limit(5).lean().then(docs => stats.pendingDoctors = docs).catch(() => []),

      // 2. Patient Stats
      PatientM.countDocuments().then(c => {
          stats.totalPatients = c;
          console.log(`[Stats Check] Patients Found: ${c}`);
      }).catch(e => console.error('Error [patients]:', e.message)),

      // 3. Appointment Stats
      AppointmentM.countDocuments().then(c => {
          stats.totalAppointments = c;
          console.log(`[Stats Check] Appointments Found: ${c}`);
      }).catch(e => console.error('Error [appointment_db]:', e.message)),
      
      AppointmentM.find().sort({ createdAt: -1 }).limit(10).lean().then(async (apts) => {
          // Enrich appointments with patient and doctor names
          // patientId / doctorId may be a MongoDB ObjectId OR a Clerk ID string
          const enriched = await Promise.all(apts.map(async (apt) => {
              const patientId = apt.patientId;
              const doctorId  = apt.doctorId;

              // Try finding patient by _id (ObjectId) first, then by clerkId (string)
              const patient = await PatientM.findOne({ _id: patientId }).lean()
                  .catch(() => PatientM.findOne({ clerkId: patientId }).lean().catch(() => null));

              // Try finding doctor by _id (ObjectId) first, then by userId / clerkId (string)
              const doctor = await DoctorM.findOne({ _id: doctorId }).lean()
                  .catch(() => DoctorM.findOne({ userId: doctorId }).lean().catch(() => null));

              return {
                  ...apt,
                  patientName: patient?.name || patient?.email?.split('@')[0] || `Patient ${String(patientId).slice(-4)}`,
                  doctorName:  doctor?.name  || `Doctor ${String(doctorId).slice(-4)}`,
                  specialty:   doctor?.specialization || 'General'
              };
          }));
          stats.recentAppointments = enriched;
      }).catch((e) => { console.error('[Stats] recentAppointments enrichment error:', e.message); }),

      // 4. Payment Stats
      PaymentM.countDocuments().then(c => {
          stats.totalPayments = c;
          console.log(`[Stats Check] Payments Found: ${c}`);
      }).catch(() => 0),
      
      PaymentM.aggregate([
          { $match: { status: 'completed' } },
          { $group: { _id: null, total: { $sum: "$amount" } } }
      ]).then(result => {
          stats.totalRevenue = result.length > 0 ? result[0].total : 0;
          console.log(`[Stats Check] Revenue Calculated: ${stats.totalRevenue}`);
      }).catch(() => 0),

      // 5. User Stats
      UserM.find().sort({ createdAt: -1 }).limit(5).lean().then(users => {
          stats.recentUsers = users;
          console.log(`[Stats Check] Recent Users Found: ${users.length}`);
      }).catch(e => console.error('Error [users]:', e.message)),

      // 6. Audit Activity (Current Connection)
      AuditLog.find().sort({ createdAt: -1 }).limit(5).then(logs => {
          stats.recentActivity = logs.map(l => ({
              action: l.action.replace(/_/g, ' '),
              timestamp: l.createdAt,
              targetId: l.targetId
          }));
      }).catch(() => [])
    ];

    await Promise.all(promises);
    console.log('[Admin Stats] Aggregation successful. Results ready.');
    console.log('------------------------------------------------');
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
