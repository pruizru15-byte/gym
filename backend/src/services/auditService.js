const db = require('../config/database');

const ACTION_TYPES = {
    CREATE: 'CREATE',
    UPDATE: 'UPDATE',
    DELETE: 'DELETE',
    LOGIN: 'LOGIN',
    LOGOUT: 'LOGOUT'
};

const ENTITY_TYPES = {
    USUARIO: 'USUARIO',
    CLIENTE: 'CLIENTE',
    MEMBRESIA: 'MEMBRESIA',
    MAQUINA: 'MAQUINA',
    PRODUCTO: 'PRODUCTO',
    VENTA: 'VENTA',
    CONFIGURACION: 'CONFIGURACION'
};

/**
 * Log an action in the audit table
 * @param {number} userId - ID of the user performing the action
 * @param {string} action - Action type (CREATE, UPDATE, DELETE, etc.)
 * @param {string} entityType - Entity type (USUARIO, CLIENTE, etc.)
 * @param {number} entityId - ID of the affected entity
 * @param {object} details - Additional details about the action (e.g. changes)
 */
const logAction = (userId, action, entityType, entityId, details = {}) => {
    try {
        const stmt = db.prepare(`
            INSERT INTO audit_logs (usuario_id, accion, entidad_tipo, entidad_id, detalle)
            VALUES (?, ?, ?, ?, ?)
        `);

        stmt.run(
            userId,
            action,
            entityType,
            entityId,
            JSON.stringify(details)
        );

        console.log(`Audit log created: ${action} on ${entityType} ${entityId} by user ${userId}`);
    } catch (error) {
        console.error('Error creating audit log:', error);
        // Don't throw error to prevent blocking the main action if logging fails
    }
};

/**
 * Get system logs with pagination and filters
 */
const getSystemLogs = (filters = {}, page = 1, limit = 50) => {
    try {
        const offset = (page - 1) * limit;
        let query = `
            SELECT l.*, u.username, u.nombre 
            FROM audit_logs l
            LEFT JOIN usuarios u ON l.usuario_id = u.id
            WHERE 1=1
        `;
        const params = [];

        if (filters.userId) {
            query += ' AND l.usuario_id = ?';
            params.push(filters.userId);
        }

        if (filters.action) {
            query += ' AND l.accion = ?';
            params.push(filters.action);
        }

        if (filters.entityType) {
            query += ' AND l.entidad_tipo = ?';
            params.push(filters.entityType);
        }

        if (filters.startDate) {
            query += ' AND date(l.fecha_hora) >= ?';
            params.push(filters.startDate);
        }

        if (filters.endDate) {
            query += ' AND date(l.fecha_hora) <= ?';
            params.push(filters.endDate);
        }

        // Count total
        const countQuery = query.replace('SELECT l.*, u.username, u.nombre', 'SELECT COUNT(*) as count');
        const total = db.prepare(countQuery).get(...params).count;

        // Get paginated results
        query += ' ORDER BY l.fecha_hora DESC LIMIT ? OFFSET ?';
        params.push(limit, offset);

        const logs = db.prepare(query).all(...params);

        return {
            logs: logs.map(log => ({
                ...log,
                detalle: JSON.parse(log.detalle || '{}')
            })),
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        };

    } catch (error) {
        console.error('Error getting system logs:', error);
        throw error;
    }
};

/**
 * Get logs for specific user
 */
const getUserLogs = (userId) => {
    return getSystemLogs({ userId });
};

module.exports = {
    logAction,
    getSystemLogs,
    getUserLogs,
    ACTION_TYPES,
    ENTITY_TYPES
};
