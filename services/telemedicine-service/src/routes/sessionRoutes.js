/**
 * Telemedicine Session Routes
 * Maps endpoints for token generation and session lifecycle management.
 */

const express = require('express');
const router = express.Router();
const telemedicineController = require('../controllers/telemedicineController');

// POST /api/sessions/token - Generate Agora video token
router.post('/token', telemedicineController.generateToken);

// POST /api/sessions/:id/end - Mark a session as finished
router.post('/:id/end', telemedicineController.endSession);

module.exports = router;