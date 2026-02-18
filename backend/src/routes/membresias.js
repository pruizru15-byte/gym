const express = require('express');
const router = express.Router();
const membresiasController = require('../controllers/membresiasController');
const auth = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// Get all membership plans
router.get('/', membresiasController.getAll);

// Get expiring memberships
router.get('/por-vencer', membresiasController.getExpiring);

// Get expired memberships
router.get('/vencidas', membresiasController.getExpired);

// Get membership by ID
router.get('/:id', membresiasController.getById);

// Get client memberships
router.get('/cliente/:cliente_id', membresiasController.getClientMemberships);

// Create membership plan
router.post('/', membresiasController.create);

// Assign membership to client
router.post('/asignar', membresiasController.assignToClient);

// Update membership plan
router.put('/:id', membresiasController.update);

// Delete (deactivate) membership plan
router.delete('/:id', membresiasController.remove);

module.exports = router;
