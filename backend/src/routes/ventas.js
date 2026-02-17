const express = require('express');
const router = express.Router();
const ventasController = require('../controllers/ventasController');
const auth = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// Get all sales
router.get('/', ventasController.getAll);

// Get today's sales
router.get('/hoy', ventasController.getToday);

// Get top selling products
router.get('/top-productos', ventasController.getTopProducts);

// Get sales by date range
router.get('/rango', ventasController.getByDateRange);

// Get sale by ID
router.get('/:id', ventasController.getById);

// Create new sale (Point of Sale)
router.post('/', ventasController.create);

module.exports = router;
