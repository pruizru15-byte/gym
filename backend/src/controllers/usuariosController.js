const db = require('../config/database');
const bcrypt = require('bcryptjs');

/**
 * Get all users
 */
const getAllUsuarios = (req, res) => {
    try {
        const usuarios = db.prepare(
            'SELECT id, username, nombre, email, rol, activo, fecha_creacion FROM usuarios ORDER BY id DESC'
        ).all();
        
        res.json(usuarios);
    } catch (error) {
        console.error('Get usuarios error:', error);
        res.status(500).json({ error: 'Error fetching users' });
    }
};

/**
 * Get user by ID
 */
const getUsuarioById = (req, res) => {
    try {
        const { id } = req.params;
        
        const usuario = db.prepare(
            'SELECT id, username, nombre, email, rol, activo, fecha_creacion FROM usuarios WHERE id = ?'
        ).get(id);
        
        if (!usuario) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json(usuario);
    } catch (error) {
        console.error('Get usuario error:', error);
        res.status(500).json({ error: 'Error fetching user' });
    }
};

/**
 * Create new user
 */
const createUsuario = (req, res) => {
    try {
        const { username, password, nombre, email, rol } = req.body;
        
        // Validate required fields
        if (!username || !password || !nombre || !rol) {
            return res.status(400).json({ error: 'Username, password, nombre and rol are required' });
        }
        
        // Validate rol
        const validRoles = ['admin', 'recepcion', 'cajero'];
        if (!validRoles.includes(rol)) {
            return res.status(400).json({ error: 'Invalid rol. Must be: admin, recepcion, or cajero' });
        }
        
        // Validate password length
        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }
        
        // Hash password
        const hashedPassword = bcrypt.hashSync(password, 10);
        
        // Insert user
        const result = db.prepare(`
            INSERT INTO usuarios (username, password_hash, nombre, email, rol, activo)
            VALUES (?, ?, ?, ?, ?, 1)
        `).run(username, hashedPassword, nombre, email || null, rol);
        
        // Get created user
        const newUsuario = db.prepare(
            'SELECT id, username, nombre, email, rol, activo, fecha_creacion FROM usuarios WHERE id = ?'
        ).get(result.lastInsertRowid);
        
        res.status(201).json(newUsuario);
    } catch (error) {
        console.error('Create usuario error:', error);
        if (error.message.includes('UNIQUE')) {
            return res.status(400).json({ error: 'Username already exists' });
        }
        res.status(500).json({ error: 'Error creating user' });
    }
};

/**
 * Update user
 */
const updateUsuario = (req, res) => {
    try {
        const { id } = req.params;
        const { username, nombre, email, rol, activo } = req.body;
        
        // Check if user exists
        const usuario = db.prepare('SELECT * FROM usuarios WHERE id = ?').get(id);
        if (!usuario) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Validate rol if provided
        if (rol) {
            const validRoles = ['admin', 'recepcion', 'cajero'];
            if (!validRoles.includes(rol)) {
                return res.status(400).json({ error: 'Invalid rol. Must be: admin, recepcion, or cajero' });
            }
        }
        
        // Update user
        db.prepare(`
            UPDATE usuarios 
            SET username = COALESCE(?, username),
                nombre = COALESCE(?, nombre),
                email = COALESCE(?, email),
                rol = COALESCE(?, rol),
                activo = COALESCE(?, activo)
            WHERE id = ?
        `).run(username, nombre, email, rol, activo, id);
        
        // Get updated user
        const updatedUsuario = db.prepare(
            'SELECT id, username, nombre, email, rol, activo, fecha_creacion FROM usuarios WHERE id = ?'
        ).get(id);
        
        res.json(updatedUsuario);
    } catch (error) {
        console.error('Update usuario error:', error);
        if (error.message.includes('UNIQUE')) {
            return res.status(400).json({ error: 'Username already exists' });
        }
        res.status(500).json({ error: 'Error updating user' });
    }
};

/**
 * Reset user password (admin only)
 */
const resetPassword = (req, res) => {
    try {
        const { id } = req.params;
        const { newPassword } = req.body;
        
        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ error: 'New password must be at least 6 characters' });
        }
        
        // Check if user exists
        const usuario = db.prepare('SELECT * FROM usuarios WHERE id = ?').get(id);
        if (!usuario) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Hash new password
        const hashedPassword = bcrypt.hashSync(newPassword, 10);
        
        // Update password
        db.prepare('UPDATE usuarios SET password_hash = ? WHERE id = ?').run(hashedPassword, id);
        
        res.json({ message: 'Password reset successfully' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ error: 'Error resetting password' });
    }
};

/**
 * Delete user (soft delete - set activo to 0)
 */
const deleteUsuario = (req, res) => {
    try {
        const { id } = req.params;
        
        // Check if user exists
        const usuario = db.prepare('SELECT * FROM usuarios WHERE id = ?').get(id);
        if (!usuario) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Don't allow deleting yourself
        if (parseInt(id) === req.user.id) {
            return res.status(400).json({ error: 'Cannot delete your own account' });
        }
        
        // Soft delete
        db.prepare('UPDATE usuarios SET activo = 0 WHERE id = ?').run(id);
        
        res.json({ message: 'User deactivated successfully' });
    } catch (error) {
        console.error('Delete usuario error:', error);
        res.status(500).json({ error: 'Error deleting user' });
    }
};

module.exports = {
    getAllUsuarios,
    getUsuarioById,
    createUsuario,
    updateUsuario,
    resetPassword,
    deleteUsuario
};
