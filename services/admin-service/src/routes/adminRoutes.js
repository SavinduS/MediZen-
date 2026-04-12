const express = require('express');
const { query, param } = require('express-validator');
const router = express.Router();
const {
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
} = require('../controllers/adminController');
const { protect, admin } = require('../middleware/roleMiddleware');
const validate = require('../middleware/validatorMiddleware');

// All routes are protected and require admin role
router.use(protect);
router.use(admin);

router.get('/users', [
  query('role').optional().isString(),
  query('search').optional().isString(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  validate
], getAllUsers);

router.put('/users/:id/status', [
  param('id').isMongoId(),
  validate
], updateUserStatus);

router.get('/payments', [
  query('status').optional().isString(),
  query('from').optional().isISO8601(),
  query('to').optional().isISO8601(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  validate
], getAllPayments);

router.get('/doctors/pending', getPendingDoctors);

router.get('/doctors', [
  query('search').optional().isString(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  validate
], getDoctors);

router.post('/doctors', addDoctor);

router.put('/doctors/:id', [
  param('id').isMongoId(),
  validate
], updateDoctor);

router.get('/doctors/:id/availability', [
  param('id').isMongoId(),
  validate
], getDoctorAvailability);

router.delete('/doctors/:id', [
  param('id').isMongoId(),
  validate
], deleteDoctor);

router.put('/doctors/:id/verify', [
  param('id').isMongoId(),
  validate
], verifyDoctor);

router.get('/stats', getStats);

module.exports = router;