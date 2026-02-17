const db = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

/**
 * Login user
 */
const login = (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }
        
        // Find user
        const user = db.prepare('SELECT * FROM usuarios WHERE username = ? AND activo = 1').get(username);
        
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        // Verify password
        const isValidPassword = bcrypt.compareSync(password, user.password_hash);
        
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        // Generate JWT token
        const token = jwt.sign(
            { 
                id: user.id, 
                username: user.username, 
                rol: user.rol,
                nombre: user.nombre
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );
        
        // Return user info and token
        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                nombre: user.nombre,
                email: user.email,
                rol: user.rol
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Error during login' });
    }
};

/**
 * Get current user info
 */
const getMe = (req, res) => {
    try {
        const user = db.prepare(
            'SELECT id, username, nombre, email, rol, activo, fecha_creacion FROM usuarios WHERE id = ?'
        ).get(req.user.id);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json(user);
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Error getting user info' });
    }
};

/**
 * Change password
 */
const changePassword = (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Current and new password are required' });
        }
        
        if (newPassword.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }
        
        // Get user
        const user = db.prepare('SELECT * FROM usuarios WHERE id = ?').get(req.user.id);
        
        // Verify current password
        const isValidPassword = bcrypt.compareSync(currentPassword, user.password_hash);
        
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Current password is incorrect' });
        }
        
        // Hash new password
        const hashedPassword = bcrypt.hashSync(newPassword, 10);
        
        // Update password
        db.prepare('UPDATE usuarios SET password_hash = ? WHERE id = ?').run(hashedPassword, req.user.id);
        
        res.json({ message: 'Password changed successfully' });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ error: 'Error changing password' });
    }
};

module.exports = {
    login,
    getMe,
    changePassword
};
