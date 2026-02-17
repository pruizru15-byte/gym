const express = require('express');
const router = express.Router();
const notificacionesController = require('../controllers/notificacionesController');
const auth = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// Get all notifications
router.get('/', notificacionesController.getAll);

// Get unread count
router.get('/no-leidas/contador', notificacionesController.getUnreadCount);

// Generate automatic notifications
router.post('/generar-automaticas', notificacionesController.generateAutomatic);

// Get notification by ID
router.get('/:id', notificacionesController.getById);

// Create notification
router.post('/', notificacionesController.create);

// Mark notification as read
router.patch('/:id/marcar-leida', notificacionesController.markAsRead);

// Mark all notifications as read
router.patch('/marcar-todas-leidas', notificacionesController.markAllAsRead);

// Delete notification
router.delete('/:id', notificacionesController.remove);

// Delete all read notifications
router.delete('/leidas/todas', notificacionesController.deleteAllRead);

module.exports = router;
