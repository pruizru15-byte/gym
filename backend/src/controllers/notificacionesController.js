const db = require('../config/database');
const { isWithinDays } = require('../utils/dateUtils');

/**
 * Get all notifications with pagination and filters
 */
const getAll = (req, res) => {
    try {
        const { page = 1, limit = 50, tipo = '', prioridad = '', leida = '' } = req.query;
        const offset = (page - 1) * limit;
        
        let query = 'SELECT * FROM notificaciones WHERE 1=1';
        const params = [];
        
        if (tipo) {
            query += ' AND tipo = ?';
            params.push(tipo);
        }
        
        if (prioridad) {
            query += ' AND prioridad = ?';
            params.push(prioridad);
        }
        
        if (leida !== '') {
            query += ' AND leida = ?';
            params.push(leida === 'true' ? 1 : 0);
        }
        
        query += ' ORDER BY fecha_creacion DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), offset);
        
        const notificaciones = db.prepare(query).all(...params);
        
        // Get total count
        let countQuery = 'SELECT COUNT(*) as total FROM notificaciones WHERE 1=1';
        const countParams = [];
        if (tipo) {
            countQuery += ' AND tipo = ?';
            countParams.push(tipo);
        }
        if (prioridad) {
            countQuery += ' AND prioridad = ?';
            countParams.push(prioridad);
        }
        if (leida !== '') {
            countQuery += ' AND leida = ?';
            countParams.push(leida === 'true' ? 1 : 0);
        }
        
        const { total } = db.prepare(countQuery).get(...countParams);
        
        // Get unread count
        const { no_leidas } = db.prepare('SELECT COUNT(*) as no_leidas FROM notificaciones WHERE leida = 0').get();
        
        res.json({
            notificaciones,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            },
            no_leidas
        });
    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({ error: 'Error getting notifications' });
    }
};

/**
 * Get notification by ID
 */
const getById = (req, res) => {
    try {
        const { id } = req.params;
        
        const notificacion = db.prepare('SELECT * FROM notificaciones WHERE id = ?').get(id);
        
        if (!notificacion) {
            return res.status(404).json({ error: 'Notification not found' });
        }
        
        res.json(notificacion);
    } catch (error) {
        console.error('Get notification error:', error);
        res.status(500).json({ error: 'Error getting notification' });
    }
};

/**
 * Create notification
 */
const create = (req, res) => {
    try {
        const {
            tipo,
            prioridad,
            titulo,
            mensaje,
            referencia_id,
            referencia_tipo
        } = req.body;
        
        // Validation
        if (!tipo || !titulo || !mensaje) {
            return res.status(400).json({ error: 'Type, title and message are required' });
        }
        
        const result = db.prepare(`
            INSERT INTO notificaciones (
                tipo, prioridad, titulo, mensaje, referencia_id, referencia_tipo
            ) VALUES (?, ?, ?, ?, ?, ?)
        `).run(
            tipo, prioridad || 'media', titulo, mensaje,
            referencia_id || null, referencia_tipo || null
        );
        
        const notificacion = db.prepare('SELECT * FROM notificaciones WHERE id = ?').get(result.lastInsertRowid);
        res.status(201).json(notificacion);
    } catch (error) {
        console.error('Create notification error:', error);
        res.status(500).json({ error: 'Error creating notification' });
    }
};

/**
 * Mark notification as read
 */
const markAsRead = (req, res) => {
    try {
        const { id } = req.params;
        
        const notificacion = db.prepare('SELECT id FROM notificaciones WHERE id = ?').get(id);
        if (!notificacion) {
            return res.status(404).json({ error: 'Notification not found' });
        }
        
        db.prepare('UPDATE notificaciones SET leida = 1 WHERE id = ?').run(id);
        
        const updated = db.prepare('SELECT * FROM notificaciones WHERE id = ?').get(id);
        res.json(updated);
    } catch (error) {
        console.error('Mark as read error:', error);
        res.status(500).json({ error: 'Error marking notification as read' });
    }
};

/**
 * Mark all notifications as read
 */
const markAllAsRead = (req, res) => {
    try {
        db.prepare('UPDATE notificaciones SET leida = 1 WHERE leida = 0').run();
        
        res.json({ message: 'All notifications marked as read' });
    } catch (error) {
        console.error('Mark all as read error:', error);
        res.status(500).json({ error: 'Error marking all notifications as read' });
    }
};

/**
 * Delete notification
 */
const remove = (req, res) => {
    try {
        const { id } = req.params;
        
        const notificacion = db.prepare('SELECT id FROM notificaciones WHERE id = ?').get(id);
        if (!notificacion) {
            return res.status(404).json({ error: 'Notification not found' });
        }
        
        db.prepare('DELETE FROM notificaciones WHERE id = ?').run(id);
        
        res.json({ message: 'Notification deleted successfully' });
    } catch (error) {
        console.error('Delete notification error:', error);
        res.status(500).json({ error: 'Error deleting notification' });
    }
};

/**
 * Delete all read notifications
 */
const deleteAllRead = (req, res) => {
    try {
        const result = db.prepare('DELETE FROM notificaciones WHERE leida = 1').run();
        
        res.json({ 
            message: 'Read notifications deleted successfully',
            deleted: result.changes
        });
    } catch (error) {
        console.error('Delete read notifications error:', error);
        res.status(500).json({ error: 'Error deleting read notifications' });
    }
};

/**
 * Get unread count
 */
const getUnreadCount = (req, res) => {
    try {
        const { no_leidas } = db.prepare('SELECT COUNT(*) as no_leidas FROM notificaciones WHERE leida = 0').get();
        
        res.json({ no_leidas });
    } catch (error) {
        console.error('Get unread count error:', error);
        res.status(500).json({ error: 'Error getting unread count' });
    }
};

/**
 * Generate automatic notifications (should be called by cron job or on-demand)
 */
const generateAutomatic = (req, res) => {
    try {
        const notifications = [];
        
        // 1. Check expiring memberships (7 days)
        const expiringMemberships = db.prepare(`
            SELECT cm.id, cm.fecha_vencimiento,
                   c.codigo, c.nombre, c.apellido, c.telefono,
                   m.nombre as membresia_nombre
            FROM clientes_membresias cm
            JOIN clientes c ON cm.cliente_id = c.id
            JOIN membresias m ON cm.membresia_id = m.id
            WHERE cm.activo = 1 
            AND cm.fecha_vencimiento BETWEEN date('now') AND date('now', '+7 days')
        `).all();
        
        for (const mem of expiringMemberships) {
            const existing = db.prepare(`
                SELECT id FROM notificaciones 
                WHERE tipo = 'membresia_vence' 
                AND referencia_id = ? 
                AND date(fecha_creacion) = date('now')
            `).get(mem.id);
            
            if (!existing) {
                db.prepare(`
                    INSERT INTO notificaciones (tipo, prioridad, titulo, mensaje, referencia_id, referencia_tipo)
                    VALUES (?, ?, ?, ?, ?, ?)
                `).run(
                    'membresia_vence', 'alta',
                    'Membresía por vencer',
                    `La membresía de ${mem.nombre} ${mem.apellido} (${mem.codigo}) vence el ${mem.fecha_vencimiento}`,
                    mem.id, 'cliente_membresia'
                );
                notifications.push('membresia_vence');
            }
        }
        
        // 2. Check low stock products
        const lowStockProducts = db.prepare(`
            SELECT id, codigo, nombre, stock_actual, stock_minimo
            FROM productos
            WHERE activo = 1 AND stock_actual <= stock_minimo
        `).all();
        
        for (const prod of lowStockProducts) {
            const existing = db.prepare(`
                SELECT id FROM notificaciones 
                WHERE tipo = 'stock_bajo' 
                AND referencia_id = ? 
                AND leida = 0
            `).get(prod.id);
            
            if (!existing) {
                db.prepare(`
                    INSERT INTO notificaciones (tipo, prioridad, titulo, mensaje, referencia_id, referencia_tipo)
                    VALUES (?, ?, ?, ?, ?, ?)
                `).run(
                    'stock_bajo', 'media',
                    'Stock bajo',
                    `${prod.nombre} (${prod.codigo}) tiene stock bajo: ${prod.stock_actual} unidades`,
                    prod.id, 'producto'
                );
                notifications.push('stock_bajo');
            }
        }
        
        // 3. Check machines needing maintenance
        const machinesMaintenance = db.prepare(`
            SELECT id, codigo, nombre, proximo_mantenimiento
            FROM maquinas
            WHERE activo = 1 
            AND proximo_mantenimiento IS NOT NULL
            AND proximo_mantenimiento <= date('now', '+7 days')
        `).all();
        
        for (const maq of machinesMaintenance) {
            const existing = db.prepare(`
                SELECT id FROM notificaciones 
                WHERE tipo = 'mantenimiento_maquina' 
                AND referencia_id = ? 
                AND date(fecha_creacion) >= date('now', '-7 days')
            `).get(maq.id);
            
            if (!existing) {
                db.prepare(`
                    INSERT INTO notificaciones (tipo, prioridad, titulo, mensaje, referencia_id, referencia_tipo)
                    VALUES (?, ?, ?, ?, ?, ?)
                `).run(
                    'mantenimiento_maquina', 'media',
                    'Mantenimiento de máquina',
                    `${maq.nombre} (${maq.codigo}) requiere mantenimiento el ${maq.proximo_mantenimiento}`,
                    maq.id, 'maquina'
                );
                notifications.push('mantenimiento_maquina');
            }
        }
        
        // 4. Check expired products
        const expiredProducts = db.prepare(`
            SELECT id, codigo, nombre, fecha_vencimiento
            FROM productos
            WHERE activo = 1 
            AND fecha_vencimiento IS NOT NULL
            AND fecha_vencimiento <= date('now', '+15 days')
        `).all();
        
        for (const prod of expiredProducts) {
            const existing = db.prepare(`
                SELECT id FROM notificaciones 
                WHERE tipo = 'producto_vence' 
                AND referencia_id = ? 
                AND leida = 0
            `).get(prod.id);
            
            if (!existing) {
                const prioridad = new Date(prod.fecha_vencimiento) <= new Date() ? 'alta' : 'media';
                db.prepare(`
                    INSERT INTO notificaciones (tipo, prioridad, titulo, mensaje, referencia_id, referencia_tipo)
                    VALUES (?, ?, ?, ?, ?, ?)
                `).run(
                    'producto_vence', prioridad,
                    'Producto por vencer',
                    `${prod.nombre} (${prod.codigo}) vence el ${prod.fecha_vencimiento}`,
                    prod.id, 'producto'
                );
                notifications.push('producto_vence');
            }
        }
        
        res.json({ 
            message: 'Automatic notifications generated',
            generated: notifications.length,
            types: notifications
        });
    } catch (error) {
        console.error('Generate notifications error:', error);
        res.status(500).json({ error: 'Error generating automatic notifications' });
    }
};

module.exports = {
    getAll,
    getById,
    create,
    markAsRead,
    markAllAsRead,
    remove,
    deleteAllRead,
    getUnreadCount,
    generateAutomatic
};
