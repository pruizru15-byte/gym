const express = require('express');
const router = express.Router();
const configuracionController = require('../controllers/configuracionController');
const auth = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// Get all configuration settings
router.get('/', configuracionController.getAll);

// Get gym info
router.get('/gimnasio', configuracionController.getGymInfo);

// Get system settings
router.get('/sistema', configuracionController.getSystemSettings);

// Get configuration by key
router.get('/:clave', configuracionController.getByKey);

// Initialize default configuration
router.post('/inicializar', configuracionController.initializeDefaults);

// Set or update configuration
router.post('/', configuracionController.set);

// Update gym info
router.put('/gimnasio', configuracionController.updateGymInfo);

// Update multiple configurations
router.put('/multiple', configuracionController.updateMultiple);

// Delete configuration
router.delete('/:clave', configuracionController.remove);

module.exports = router;
