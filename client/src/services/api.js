/**
 * Global API Service Configuration
 * Centralizing all microservice calls.
 */
import axios from 'axios';

// Centralized API Gateway URL
const GATEWAY_URL = import.meta.env.VITE_GATEWAY_URL || 'http://localhost:5000';

// Creating separate instances for each dedicated microservice through the Gateway
const authAPI = axios.create({ baseURL: `${GATEWAY_URL}/api/auth` });
const patientAPI = axios.create({ baseURL: `${GATEWAY_URL}/api/patient` });
const doctorAPI = axios.create({ baseURL: `${GATEWAY_URL}/api/doctors` });
const appointmentAPI = axios.create({ baseURL: `${GATEWAY_URL}/api/appointments` });
const videoAPI = axios.create({ baseURL: `${GATEWAY_URL}/api/sessions` });
const paymentAPI = axios.create({ baseURL: `${GATEWAY_URL}/api/payments` });
const adminAPI = axios.create({ baseURL: `${GATEWAY_URL}/api/admin` });
const symptomAPI = axios.create({ baseURL: `${GATEWAY_URL}/api/symptom-check` });
const notificationAPI = axios.create({ baseURL: `${GATEWAY_URL}/api/notifications` });

// --- AUTH SERVICE CALLS (PORT 5001) ---
export const syncUser = (email, token) =>
  authAPI.post('/sync', { email }, { headers: { Authorization: `Bearer ${token}` } });

export const fetchAllAuthUsers = () =>
  authAPI.get('/users');

// --- PATIENT SERVICE CALLS (PORT 5002) ---
export const fetchPatientProfile = (token) =>
  patientAPI.get('/profile', { headers: { Authorization: `Bearer ${token}` } });

export const fetchPatientInternalProfile = (clerkId) =>
  patientAPI.get(`/internal/${clerkId}`);

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

export const fetchPatientReportsById = (patientId) => 
  patientAPI.get(`/reports/${patientId}`);

// --- DOCTOR SERVICE CALLS (PORT 5003) ---
export const fetchDoctors = () => doctorAPI.get('/');
export const fetchDoctorProfile = (id) => doctorAPI.get(`/${id}`);
export const fetchDoctorProfileByUserId = (userId) => doctorAPI.get(`/user/${userId}`);
export const updateDoctorProfile = (id, data) => doctorAPI.put(`/${id}`, data);
export const deleteDoctorProfile = (id) => doctorAPI.delete(`/${id}`);
export const getDoctorAvailability = (id) => doctorAPI.get(`/${id}/availability`);
export const updateDoctorAvailability = (id, slots) => doctorAPI.put(`/${id}/availability`, { slots });

const doctorSlotsAPI = axios.create({ baseURL: `${GATEWAY_URL}/api/doctors` });

export const registerDoctor = (data, token) =>
  doctorAPI.post('/', data, { headers: { Authorization: `Bearer ${token}` } });

// --- APPOINTMENT SERVICE CALLS (PORT 5004) ---
export const bookAppointment = (data) => appointmentAPI.post('/', data);
export const fetchPatientAppointments = (id) => appointmentAPI.get(`/patient/${id}`);
export const fetchAvailableSlots = (doctorId, date) => doctorSlotsAPI.get(`/${doctorId}/slots?date=${date}`);
export const cancelAppointment = (id) => appointmentAPI.delete(`/${id}`);

// --- TELEMEDICINE SERVICE CALLS (PORT 5006) ---
export const generateVideoToken = (aptId) => videoAPI.post('/token', { appointmentId: aptId });

// --- PAYMENT SERVICE CALLS (PORT 5007) ---
export const initiatePayment = (data) => paymentAPI.post('/initiate', data);
export const fetchPaymentById = (paymentId) => paymentAPI.get(`/${paymentId}`);
export const completePayment = (paymentId) => paymentAPI.post(`/${paymentId}/complete`);
export const fetchAllPayments = () => paymentAPI.get('/');
export const downloadReceipt = (paymentId) => paymentAPI.get(`/${paymentId}/receipt`);

// --- ADMIN SERVICE CALLS (PORT 5009) ---
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

// --- NOTIFICATION CALLS ---
export const fetchNotificationPrefs = (userId, token) => 
  notificationAPI.get(`/prefs/${userId}`, { headers: { Authorization: `Bearer ${token}` } });

export const updateNotificationPrefs = (data, token) => 
  notificationAPI.put('/prefs', data, { headers: { Authorization: `Bearer ${token}` } });

// --- SYMPTOM CHECKER CALLS (PORT 5005) ---
export const checkSymptoms = (data) => symptomAPI.post('/', data);
