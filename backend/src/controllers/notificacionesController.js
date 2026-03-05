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

        // Read notification settings from configuration
        const getConfig = (clave, defaultVal) => {
            const row = db.prepare('SELECT valor FROM configuracion WHERE clave = ?').get(clave);
            return row ? row.valor : defaultVal;
        };

        const diasAlertaVencimiento = parseInt(getConfig('dias_alerta_vencimiento', '7')) || 7;
        const diasAlertaProducto = parseInt(getConfig('dias_alerta_producto', '15')) || 15;
        const alertaStockMinimo = getConfig('alerta_stock_minimo', 'true') !== 'false';
        const alertaMantenimiento = getConfig('alerta_mantenimiento', 'true') !== 'false';

        // 1. Check expiring memberships (using configured days)
        const expiringMemberships = db.prepare(`
            SELECT cm.id, cm.fecha_vencimiento,
                   c.codigo, c.nombre, c.apellido, c.telefono,
                   m.nombre as membresia_nombre
            FROM clientes_membresias cm
            JOIN clientes c ON cm.cliente_id = c.id
            JOIN membresias m ON cm.membresia_id = m.id
            WHERE cm.activo = 1 
            AND cm.fecha_vencimiento BETWEEN date('now') AND date('now', '+' || ? || ' days')
        `).all(diasAlertaVencimiento);

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

        // 2. Check low stock products (only if enabled)
        const lowStockProducts = alertaStockMinimo ? db.prepare(`
            SELECT id, codigo, nombre, stock_actual, stock_minimo
            FROM productos
            WHERE activo = 1 AND stock_actual <= stock_minimo
        `).all() : [];

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

        // 3. Check machines needing maintenance (only if enabled)
        const machinesMaintenance = alertaMantenimiento ? db.prepare(`
            SELECT id, codigo, nombre, proximo_mantenimiento
            FROM maquinas
            WHERE activo = 1 
            AND proximo_mantenimiento IS NOT NULL
            AND proximo_mantenimiento <= date('now', '+7 days')
        `).all() : [];

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

        // 4. Check expired products (using configured days)
        const expiredProducts = db.prepare(`
            SELECT id, codigo, nombre, fecha_vencimiento
            FROM productos
            WHERE activo = 1 
            AND fecha_vencimiento IS NOT NULL
            AND fecha_vencimiento <= date('now', '+' || ? || ' days')
        `).all(diasAlertaProducto);

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
            message: 'Notificaciones automáticas generadas',
            generated: notifications.length,
            types: notifications,
            settings_applied: {
                dias_alerta_vencimiento: diasAlertaVencimiento,
                dias_alerta_producto: diasAlertaProducto,
                alerta_stock_minimo: alertaStockMinimo,
                alerta_mantenimiento: alertaMantenimiento
            }
        });
    } catch (error) {
        console.error('Generate notifications error:', error);
        res.status(500).json({ error: 'Error generating automatic notifications' });
    }
};

/**
 * Get unified activity feed combining notifications + audit logs
 * Returns most recent items with links for frontend navigation
 */
const getActivityFeed = (req, res) => {
    try {
        const { limit = 20 } = req.query;

        // 1. Get recent notifications
        const notifications = db.prepare(`
            SELECT 
                'notification' as source,
                n.id,
                n.tipo,
                n.prioridad,
                n.titulo,
                n.mensaje,
                n.referencia_id,
                n.referencia_tipo,
                n.leida,
                n.fecha_creacion
            FROM notificaciones n
            ORDER BY n.fecha_creacion DESC
            LIMIT ?
        `).all(parseInt(limit));

        // 2. Get recent audit logs
        const auditLogs = db.prepare(`
            SELECT 
                'audit' as source,
                a.id,
                a.accion,
                a.entidad_tipo,
                a.entidad_id,
                a.detalle,
                a.fecha_hora as fecha_creacion,
                u.nombre as usuario_nombre
            FROM audit_logs a
            LEFT JOIN usuarios u ON a.usuario_id = u.id
            ORDER BY a.fecha_hora DESC
            LIMIT ?
        `).all(parseInt(limit));

        // 3. Transform audit logs into activity items
        const auditItems = auditLogs.map(log => {
            let detalle = {};
            try { detalle = JSON.parse(log.detalle || '{}'); } catch (e) { }

            const accionMap = {
                'CREATE': 'Creación',
                'UPDATE': 'Actualización',
                'DELETE': 'Eliminación',
                'LOGIN': 'Inicio de sesión',
                'LOGOUT': 'Cierre de sesión'
            };

            const entidadMap = {
                'USUARIO': 'usuario',
                'CLIENTE': 'cliente',
                'MEMBRESIA': 'membresía',
                'MAQUINA': 'máquina',
                'PRODUCTO': 'producto',
                'VENTA': 'venta',
                'PAGO': 'pago',
                'ASISTENCIA': 'asistencia',
                'CONFIGURACION': 'configuración'
            };

            const accionText = accionMap[log.accion] || log.accion;
            const entidadText = entidadMap[log.entidad_tipo] || log.entidad_tipo;
            const nombreEntidad = detalle.nombre || detalle.codigo || '';

            return {
                source: 'audit',
                id: `audit_${log.id}`,
                tipo: `audit_${log.accion?.toLowerCase() || 'action'}`,
                prioridad: log.accion === 'DELETE' ? 'alta' : 'baja',
                titulo: `${accionText} de ${entidadText}`,
                mensaje: nombreEntidad
                    ? `${log.usuario_nombre || 'Sistema'} — ${nombreEntidad}`
                    : `${log.usuario_nombre || 'Sistema'}`,
                referencia_id: log.entidad_id,
                referencia_tipo: log.entidad_tipo,
                leida: 1,
                fecha_creacion: log.fecha_creacion,
                link: getLink(log.entidad_tipo, log.entidad_id)
            };
        });

        // 4. Transform notifications into activity items
        const notifItems = notifications.map(n => ({
            ...n,
            link: getLink(n.referencia_tipo, n.referencia_id)
        }));

        // 5. Merge and sort by date
        const feed = [...notifItems, ...auditItems]
            .sort((a, b) => new Date(b.fecha_creacion) - new Date(a.fecha_creacion))
            .slice(0, parseInt(limit));

        // 6. Get unread notification count
        const { no_leidas } = db.prepare('SELECT COUNT(*) as no_leidas FROM notificaciones WHERE leida = 0').get();

        // 7. Get total recent activity count (last 24 hours)
        const { audit_recientes } = db.prepare(`
            SELECT COUNT(*) as audit_recientes FROM audit_logs 
            WHERE fecha_hora >= datetime('now', '-24 hours')
        `).get();

        // Total activity = unread notifications + recent audit activity
        const total_actividad = no_leidas + audit_recientes;

        res.json({
            actividad: feed,
            no_leidas,
            audit_recientes,
            total_actividad
        });
    } catch (error) {
        console.error('Get activity feed error:', error);
        res.status(500).json({ error: 'Error getting activity feed' });
    }
};

/**
 * Helper: map entity type + id to frontend route
 */
function getLink(tipo, id) {
    if (!tipo) return '/dashboard';
    const t = tipo.toUpperCase();
    switch (t) {
        case 'CLIENTE':
            return id ? `/clientes/${id}` : '/clientes';
        case 'CLIENTE_MEMBRESIA':
        case 'MEMBRESIA':
            return '/membresias';
        case 'PRODUCTO':
            return '/tienda/productos';
        case 'MAQUINA':
            return id ? `/maquinas/${id}` : '/maquinas';
        case 'VENTA':
            return '/pagos';
        case 'PAGO':
            return '/pagos';
        case 'USUARIO':
            return '/configuracion';
        case 'ASISTENCIA':
            return '/asistencias';
        case 'CONFIGURACION':
            return '/configuracion';
        default:
            return '/dashboard';
    }
}

module.exports = {
    getAll,
    getById,
    create,
    markAsRead,
    markAllAsRead,
    remove,
    deleteAllRead,
    getUnreadCount,
    generateAutomatic,
    getActivityFeed
};
