const express = require('express');
const router = express.Router();
const tiendaController = require('../controllers/tiendaController');
const auth = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// Get all products
router.get('/', tiendaController.getAll);

// Get low stock products
router.get('/stock-bajo', tiendaController.getLowStock);

// Get product categories
router.get('/categorias', tiendaController.getCategories);

// Get product by ID
router.get('/:id', tiendaController.getById);

// Get product by code (barcode)
router.get('/codigo/:codigo', tiendaController.getByCode);

// Create product
router.post('/', tiendaController.create);

// Update product
router.put('/:id', tiendaController.update);

// Update product stock
router.patch('/:id/stock', tiendaController.updateStock);

// Delete (deactivate) product
router.delete('/:id', tiendaController.remove);

module.exports = router;
