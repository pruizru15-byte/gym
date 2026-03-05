const express = require('express');
const router = express.Router();
const tiendaController = require('../controllers/tiendaController');
const auth = require('../middleware/auth');
const uploadProduct = require('../middleware/uploadProduct');

// All routes require authentication
router.use(auth);

// Get all products
router.get('/', tiendaController.getAll);

// Get low stock products
router.get('/stock-bajo', tiendaController.getLowStock);

// Get products expiring soon
router.get('/por-vencer', tiendaController.getExpiringSoon);

// Get product categories
router.get('/categorias', tiendaController.getCategories);

// Create product category
router.post('/categorias', tiendaController.createCategory);

// Get product by ID
router.get('/:id', tiendaController.getById);

// Get product by code (barcode)
router.get('/codigo/:codigo', tiendaController.getByCode);

// Create product
router.post('/', uploadProduct.single('imagen'), tiendaController.create);

// Update product
router.put('/:id', uploadProduct.single('imagen'), tiendaController.update);

// Update product stock
router.patch('/:id/stock', tiendaController.updateStock);

// Delete (deactivate) product
router.delete('/:id', tiendaController.remove);

module.exports = router;
