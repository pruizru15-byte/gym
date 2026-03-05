const express = require('express');
const router = express.Router();
const metricasController = require('../controllers/metricasController');
const auth = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// Get dashboard metrics
router.get('/dashboard', metricasController.getDashboard);

// Get revenue statistics
router.get('/ingresos', metricasController.getRevenue);

// Get expenses statistics
router.get('/egresos', metricasController.getExpenses);

// Get attendance statistics
router.get('/asistencias', metricasController.getAttendance);

// Get membership statistics
router.get('/membresias', metricasController.getMemberships);

// Get products statistics
router.get('/productos', metricasController.getProducts);

// Get machines statistics
router.get('/maquinas', metricasController.getMachines);

// Get comparative statistics
router.get('/comparativa', metricasController.getComparative);

// Get recent activity feed
router.get('/actividad-reciente', metricasController.getRecentActivity);

// Get top selling products
router.get('/productos-top', metricasController.getTopProducts);

// Get client statistics
router.get('/clientes-stats', metricasController.getClientStats);

module.exports = router;
