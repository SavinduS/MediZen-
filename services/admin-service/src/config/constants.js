module.exports = {
  ROLES: {
    ADMIN: 'admin',
    DOCTOR: 'doctor',
    PATIENT: 'patient'
  },
  PAYMENT_STATUS: {
    PENDING: 'pending',
    COMPLETED: 'completed',
    FAILED: 'failed',
    REFUNDED: 'refunded'
  },
  TARGET_TYPES: {
    DOCTOR: 'Doctor',
    PAYMENT: 'Payment',
    PATIENT: 'Patient',
    APPOINTMENT: 'Appointment',
    USER: 'User'
  },
  AUDIT_ACTIONS: {
    VERIFY_DOCTOR: 'VERIFY_DOCTOR',
    REJECT_DOCTOR: 'REJECT_DOCTOR',
    UPDATE_PAYMENT: 'UPDATE_PAYMENT',
    DELETE_USER: 'DELETE_USER'
  }
};
