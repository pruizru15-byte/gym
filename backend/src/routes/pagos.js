const express = require('express');
const router = express.Router();
const pagosController = require('../controllers/pagosController');
const auth = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// Get paginated payment history
router.get('/', pagosController.getHistorialPagos);

// Cash Register State (Caja)
router.get('/caja/estado', pagosController.getEstadoCaja);
router.post('/caja/abrir', pagosController.abrirCaja);
router.get('/caja/historial', pagosController.getHistorialCaja);
router.post('/corte-caja', pagosController.registrarCorteCaja); // Cerrar caja

// Pending Payments (Deudas)
router.get('/pendientes', pagosController.getPagosPendientes);
router.post('/pendientes/:id/pagar', pagosController.registrarPagoPendiente);
router.post('/pendientes/cuota/:cuota_id/recordatorio', pagosController.enviarRecordatorioCuota);

// Get receipt data by payment ID
router.get('/:id/recibo', pagosController.getRecibo);
router.post('/:id/enviar-recibo', pagosController.enviarReciboCorreo);

// Inactive Clients (Win-Back Campaigns)
router.get('/inactivos', pagosController.getInactivos);
router.post('/inactivos/:id/send-email', pagosController.sendWinBackEmail);

module.exports = router;
