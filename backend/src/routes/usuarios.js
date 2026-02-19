const express = require('express');
const router = express.Router();
const usuariosController = require('../controllers/usuariosController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// All routes require authentication and admin role
router.use(auth);
// Middleware to allow admin or self
const allowSelfOrAdmin = (req, res, next) => {
    if (req.user.rol === 'admin' || req.user.id === parseInt(req.params.id)) {
        next();
    } else {
        res.status(403).json({ error: 'Access denied' });
    }
};

const upload = require('../middleware/upload');

// Admin only routes
router.get('/', roleCheck('admin'), usuariosController.getAllUsuarios);
router.post('/', roleCheck('admin'), upload.single('foto'), usuariosController.createUsuario);
router.delete('/:id', roleCheck('admin'), usuariosController.deleteUsuario);

// Owner or Admin routes
router.get('/audit-logs', usuariosController.getAuditLogs); // Controller handles permission check
router.get('/:id', allowSelfOrAdmin, usuariosController.getUsuarioById);
router.put('/:id', allowSelfOrAdmin, upload.single('foto'), usuariosController.updateUsuario);
router.post('/:id/reset-password', allowSelfOrAdmin, usuariosController.resetPassword);

module.exports = router;
