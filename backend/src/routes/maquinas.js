const express = require('express');
const router = express.Router();
const maquinasController = require('../controllers/maquinasController');
const auth = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// Get all machines
router.get('/', maquinasController.getAll);

// Get machines needing maintenance
router.get('/necesitan-mantenimiento', maquinasController.getNeedingMaintenance);

// Get machine categories
router.get('/categorias', maquinasController.getCategories);

// Get machine by ID
router.get('/:id', maquinasController.getById);

// Get maintenance history for a machine
router.get('/:maquina_id/mantenimientos', maquinasController.getMaintenanceHistory);

// Create machine
router.post('/', maquinasController.create);

// Add maintenance record
router.post('/:maquina_id/mantenimientos', maquinasController.addMaintenance);

// Update machine
router.put('/:id', maquinasController.update);

// Delete (deactivate) machine
router.delete('/:id', maquinasController.remove);

module.exports = router;
