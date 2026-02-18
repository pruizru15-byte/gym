const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');

// Public routes
router.post('/login', authController.login);

// Protected routes
router.get('/me', auth, authController.getMe);
router.post('/change-password', auth, authController.changePassword);

module.exports = router;
