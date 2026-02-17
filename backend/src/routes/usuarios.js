const express = require('express');
const router = express.Router();
const usuariosController = require('../controllers/usuariosController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// All routes require authentication and admin role
router.use(auth);
router.use(roleCheck('admin'));

router.get('/', usuariosController.getAllUsuarios);
router.get('/:id', usuariosController.getUsuarioById);
router.post('/', usuariosController.createUsuario);
router.put('/:id', usuariosController.updateUsuario);
router.post('/:id/reset-password', usuariosController.resetPassword);
router.delete('/:id', usuariosController.deleteUsuario);

module.exports = router;
