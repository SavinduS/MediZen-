/**
 * Global API Service Configuration
 * Centralizing all microservice calls for Member 2 tasks.
 */
import axios from 'axios';

// Creating separate instances for each dedicated microservice port
const authAPI = axios.create({ baseURL: 'http://localhost:5001/api/auth' });
const patientAPI = axios.create({ baseURL: 'http://localhost:5002/api/patient' });
const doctorAPI = axios.create({ baseURL: 'http://localhost:5003/api/doctors' });
const appointmentAPI = axios.create({ baseURL: 'http://localhost:5004/api/appointments' });
const videoAPI = axios.create({ baseURL: 'http://localhost:5006/api/sessions' });
const paymentAPI = axios.create({ baseURL: 'http://localhost:5007/api/payments' });
const adminAPI = axios.create({ baseURL: 'http://localhost:5009/api/admin' });

// --- AUTH SERVICE CALLS (PORT 5001) ---
export const syncUser = (email, token) =>
  authAPI.post('/sync', { email }, { headers: { Authorization: `Bearer ${token}` } });

// --- ADMIN SERVICE CALLS (PORT 5001) ---
export const fetchAdminStats = (token) => 
  adminAPI.get('/stats', { headers: { Authorization: `Bearer ${token}` } });

export const fetchAdminUsers = (params, token) => 
  adminAPI.get('/users', { params, headers: { Authorization: `Bearer ${token}` } });

export const updateAdminUserStatus = (id, status, token) => 
  adminAPI.put(`/users/${id}/status`, { status }, { headers: { Authorization: `Bearer ${token}` } });

export const fetchAdminPayments = (params, token) => 
  adminAPI.get('/payments', { params, headers: { Authorization: `Bearer ${token}` } });

export const fetchAdminDoctors = (params, token) => 
  adminAPI.get('/doctors', { params, headers: { Authorization: `Bearer ${token}` } });

export const fetchDoctorAvailability = (id, token) => 
  adminAPI.get(`/doctors/${id}/availability`, { headers: { Authorization: `Bearer ${token}` } });

export const addDoctor = (data, token) => 
  adminAPI.post('/doctors', data, { headers: { Authorization: `Bearer ${token}` } });

export const updateDoctor = (id, data, token) => 
  adminAPI.put(`/doctors/${id}`, data, { headers: { Authorization: `Bearer ${token}` } });

export const deleteDoctor = (id, token) => 
  adminAPI.delete(`/doctors/${id}`, { headers: { Authorization: `Bearer ${token}` } });

export const fetchPendingDoctors = (token) => 
  adminAPI.get('/doctors/pending', { headers: { Authorization: `Bearer ${token}` } });

export const verifyDoctor = (id, token) => 
  adminAPI.put(`/doctors/${id}/verify`, {}, { headers: { Authorization: `Bearer ${token}` } });

export const registerDoctor = (data, token) =>
  doctorAPI.post('/', data, { headers: { Authorization: `Bearer ${token}` } });

// --- NOTIFICATION CALLS (via Admin/Notification context) ---
export const fetchNotificationPrefs = (userId, token) => 
  adminAPI.get(`/notifications/${userId}`, { headers: { Authorization: `Bearer ${token}` } });

export const updateNotificationPrefs = (data, token) => 
  adminAPI.put('/notifications/prefs', data, { headers: { Authorization: `Bearer ${token}` } });

// --- PATIENT SERVICE CALLS (PORT 5002) ---
export const fetchPatientProfile = (token) =>
  patientAPI.get('/profile', { headers: { Authorization: `Bearer ${token}` } });

export const updatePatientProfile = (data, token) =>
  patientAPI.put('/profile', data, { headers: { Authorization: `Bearer ${token}` } });

export const uploadMedicalReport = (formData, token) =>
  patientAPI.post('/reports', formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'multipart/form-data'
    }
  });

export const fetchMedicalReports = (token) =>
  patientAPI.get('/reports', { headers: { Authorization: `Bearer ${token}` } });

const authAPI = axios.create({ baseURL: 'http://localhost:5001/api/auth' });
const patientAPI = axios.create({ baseURL: 'http://localhost:5002/api/patient' });

// --- AUTH SERVICE CALLS (PORT 5001) ---
export const syncUser = (email, token) => 
  authAPI.post('/sync', { email }, { headers: { Authorization: `Bearer ${token}` } });

// --- PATIENT SERVICE CALLS (PORT 5002) ---
export const fetchPatientProfile = (token) => 
  patientAPI.get('/profile', { headers: { Authorization: `Bearer ${token}` } });

export const updatePatientProfile = (data, token) => 
  patientAPI.put('/profile', data, { headers: { Authorization: `Bearer ${token}` } });

export const uploadMedicalReport = (formData, token) => 
  patientAPI.post('/reports', formData, { 
    headers: { 
      Authorization: `Bearer ${token}`,
      'Content-Type': 'multipart/form-data'
    } 
  });

export const fetchMedicalReports = (token) => 
  patientAPI.get('/reports', { headers: { Authorization: `Bearer ${token}` } });

// --- DOCTOR SERVICE CALLS (PORT 5003) ---
export const fetchDoctors = () => doctorAPI.get('/');

// --- APPOINTMENT SERVICE CALLS (PORT 5004) ---
export const bookAppointment = (data) => appointmentAPI.post('/', data);
export const fetchPatientAppointments = (id) => appointmentAPI.get(`/patient/${id}`);

// --- TELEMEDICINE SERVICE CALLS (PORT 5006) ---
// Fetches the secure video token generated by the Telemedicine backend
export const generateVideoToken = (aptId) => videoAPI.post('/token', { appointmentId: aptId });

// --- PAYMENT SERVICE CALLS (PORT 5007) ---
export const initiatePayment = (data) => paymentAPI.post('/initiate', data);

export const fetchPaymentById = (paymentId) => paymentAPI.get(`/${paymentId}`);

export const completePayment = (paymentId) => paymentAPI.post(`/${paymentId}/complete`);

export const fetchAllPayments = () => paymentAPI.get('/');

export const downloadReceipt = (paymentId) => paymentAPI.get(`/${paymentId}/receipt`);
