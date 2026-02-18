const express = require('express');
const router = express.Router();
const asistenciasController = require('../controllers/asistenciasController');
const auth = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// Get all attendance records
router.get('/', asistenciasController.getAll);

// Get today's attendance
router.get('/hoy', asistenciasController.getToday);

// Get attendance statistics
router.get('/estadisticas', asistenciasController.getStats);

// Get client attendance history
router.get('/cliente/:cliente_id', asistenciasController.getClientHistory);

// Check-in client by ID
router.post('/checkin', asistenciasController.checkIn);

// Check-in client by QR code
router.post('/checkin-codigo', asistenciasController.checkInByCode);

module.exports = router;
