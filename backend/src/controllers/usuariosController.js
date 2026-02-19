const db = require('../config/database');
const bcrypt = require('bcryptjs');
const { logAction, ACTION_TYPES, ENTITY_TYPES, getSystemLogs } = require('../services/auditService');

/**
 * Get all users
 */
const getAllUsuarios = (req, res) => {
    try {
        console.log('Fetching all users...');
        const usuarios = db.prepare(
            'SELECT id, username, nombre, email, rol, activo, foto, fecha_creacion FROM usuarios ORDER BY id DESC'
        ).all();
        console.log(`Found ${usuarios.length} users`);

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
            'SELECT id, username, nombre, email, rol, activo, foto, fecha_creacion FROM usuarios WHERE id = ?'
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
        const { username, password, nombre, email, rol, foto } = req.body;

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
            INSERT INTO usuarios (username, password_hash, nombre, email, rol, foto, activo)
            VALUES (?, ?, ?, ?, ?, ?, 1)
        `).run(username, hashedPassword, nombre, email || null, rol, foto || null);

        const newUserId = result.lastInsertRowid;

        // Log action
        logAction(req.user.id, ACTION_TYPES.CREATE, ENTITY_TYPES.USUARIO, newUserId, { username, nombre, rol });

        // Get created user
        const newUsuario = db.prepare(
            'SELECT id, username, nombre, email, rol, foto, activo, fecha_creacion FROM usuarios WHERE id = ?'
        ).get(newUserId);

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
        let foto = req.body.foto; // Keep existing if not changed

        // Handle file upload
        if (req.file) {
            // Convert path to URL format (e.g., /media/usuarios/filename.jpg)
            foto = `/media/usuarios/${req.file.filename}`;
        }

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
                activo = COALESCE(?, activo),
                foto = COALESCE(?, foto)
            WHERE id = ?
        `).run(username, nombre, email, rol, activo, foto, id);

        // Log action
        logAction(req.user.id, ACTION_TYPES.UPDATE, ENTITY_TYPES.USUARIO, id, {
            username: username && username !== usuario.username ? username : undefined,
            nombre: nombre && nombre !== usuario.nombre ? nombre : undefined,
            rol: rol && rol !== usuario.rol ? rol : undefined,
            activo: activo !== undefined && activo !== usuario.activo ? activo : undefined
        });

        // Get updated user
        const updatedUsuario = db.prepare(
            'SELECT id, username, nombre, email, rol, foto, activo, fecha_creacion FROM usuarios WHERE id = ?'
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

        // Log action
        logAction(req.user.id, ACTION_TYPES.UPDATE, ENTITY_TYPES.USUARIO, id, { action: 'password_reset' });

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

        // Log action
        logAction(req.user.id, ACTION_TYPES.DELETE, ENTITY_TYPES.USUARIO, id, { nombre: usuario.nombre });

        res.json({ message: 'User deactivated successfully' });
    } catch (error) {
        console.error('Delete usuario error:', error);
        res.status(500).json({ error: 'Error deleting user' });
    }
};

/**
 * Get audit logs (Admin only)
 */
const getAuditLogs = (req, res) => {
    try {
        const { page = 1, limit = 50, userId, action, entityType, startDate, endDate } = req.query;

        // If not admin, force userId to be current user
        let effectiveUserId = userId;
        if (req.user.rol !== 'admin') {
            effectiveUserId = req.user.id;
        }

        const logs = getSystemLogs({
            userId: effectiveUserId,
            action,
            entityType,
            startDate,
            endDate
        }, page, limit);

        res.json(logs);
    } catch (error) {
        console.error('Get logs error:', error);
        res.status(500).json({ error: 'Error fetching logs' });
    }
};

module.exports = {
    getAllUsuarios,
    getUsuarioById,
    createUsuario,
    updateUsuario,
    resetPassword,
    deleteUsuario,
    getAuditLogs
};
