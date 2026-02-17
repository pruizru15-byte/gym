const express = require('express');
const router = express.Router();
const clientesController = require('../controllers/clientesController');
const auth = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// Get all clients
router.get('/', clientesController.getAll);

// Get client by ID
router.get('/:id', clientesController.getById);

// Get client by code (QR)
router.get('/codigo/:codigo', clientesController.getByCode);

// Get client attendance history
router.get('/:id/asistencias', clientesController.getAttendance);

// Get client membership history
router.get('/:id/membresias', clientesController.getMemberships);

// Create client
router.post('/', clientesController.create);

// Update client
router.put('/:id', clientesController.update);

// Delete (deactivate) client
router.delete('/:id', clientesController.remove);

// Regenerate QR code
router.post('/:id/regenerar-qr', clientesController.regenerateQR);

module.exports = router;
