const db = require('../config/database');
const { formatDate, formatDateTime } = require('../utils/dateUtils');

/**
 * Get all attendance records with pagination and filters
 */
const getAll = (req, res) => {
    try {
        const { page = 1, limit = 50, fecha, cliente_id } = req.query;
        const offset = (page - 1) * limit;
        
        let query = `
            SELECT a.*, 
                   c.codigo, c.nombre as cliente_nombre, c.apellido as cliente_apellido,
                   u.nombre as usuario_nombre
            FROM asistencias a
            JOIN clientes c ON a.cliente_id = c.id
            LEFT JOIN usuarios u ON a.usuario_registro_id = u.id
            WHERE 1=1
        `;
        const params = [];
        
        if (fecha) {
            query += ' AND date(a.fecha_hora) = ?';
            params.push(fecha);
        }
        
        if (cliente_id) {
            query += ' AND a.cliente_id = ?';
            params.push(cliente_id);
        }
        
        query += ' ORDER BY a.fecha_hora DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), offset);
        
        const asistencias = db.prepare(query).all(...params);
        
        // Get total count
        let countQuery = 'SELECT COUNT(*) as total FROM asistencias WHERE 1=1';
        const countParams = [];
        if (fecha) {
            countQuery += ' AND date(fecha_hora) = ?';
            countParams.push(fecha);
        }
        if (cliente_id) {
            countQuery += ' AND cliente_id = ?';
            countParams.push(cliente_id);
        }
        
        const { total } = db.prepare(countQuery).get(...countParams);
        
        res.json({
            asistencias,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get attendance error:', error);
        res.status(500).json({ error: 'Error getting attendance records' });
    }
};

/**
 * Check-in client by ID
 */
const checkIn = (req, res) => {
    try {
        const { cliente_id } = req.body;
        
        if (!cliente_id) {
            return res.status(400).json({ error: 'Client ID is required' });
        }
        
        // Get client info
        const cliente = db.prepare(`
            SELECT id, codigo, nombre, apellido, activo
            FROM clientes
            WHERE id = ?
        `).get(cliente_id);
        
        if (!cliente) {
            return res.status(404).json({ error: 'Client not found' });
        }
        
        if (!cliente.activo) {
            return res.status(400).json({ error: 'Client is inactive' });
        }
        
        // Check if client has active membership
        const membresia = db.prepare(`
            SELECT cm.*, m.nombre as membresia_nombre
            FROM clientes_membresias cm
            JOIN membresias m ON cm.membresia_id = m.id
            WHERE cm.cliente_id = ? 
            AND cm.activo = 1 
            AND cm.fecha_vencimiento >= date('now')
            ORDER BY cm.fecha_vencimiento DESC
            LIMIT 1
        `).get(cliente_id);
        
        if (!membresia) {
            return res.status(403).json({ 
                error: 'Client does not have an active membership',
                cliente: {
                    codigo: cliente.codigo,
                    nombre: cliente.nombre,
                    apellido: cliente.apellido
                }
            });
        }
        
        // Check if already checked in today
        const today = formatDate(new Date());
        const existingCheckIn = db.prepare(`
            SELECT id FROM asistencias
            WHERE cliente_id = ? AND date(fecha_hora) = ?
        `).get(cliente_id, today);
        
        if (existingCheckIn) {
            return res.status(400).json({ 
                error: 'Client already checked in today',
                cliente: {
                    codigo: cliente.codigo,
                    nombre: cliente.nombre,
                    apellido: cliente.apellido
                },
                membresia: {
                    nombre: membresia.membresia_nombre,
                    fecha_vencimiento: membresia.fecha_vencimiento
                }
            });
        }
        
        // Register check-in
        const result = db.prepare(`
            INSERT INTO asistencias (cliente_id, usuario_registro_id)
            VALUES (?, ?)
        `).run(cliente_id, req.user.id);
        
        const asistencia = db.prepare(`
            SELECT a.*, 
                   c.codigo, c.nombre as cliente_nombre, c.apellido as cliente_apellido,
                   u.nombre as usuario_nombre
            FROM asistencias a
            JOIN clientes c ON a.cliente_id = c.id
            LEFT JOIN usuarios u ON a.usuario_registro_id = u.id
            WHERE a.id = ?
        `).get(result.lastInsertRowid);
        
        res.status(201).json({
            ...asistencia,
            membresia: {
                nombre: membresia.membresia_nombre,
                fecha_vencimiento: membresia.fecha_vencimiento
            }
        });
    } catch (error) {
        console.error('Check-in error:', error);
        res.status(500).json({ error: 'Error registering check-in' });
    }
};

/**
 * Check-in client by QR code
 */
const checkInByCode = (req, res) => {
    try {
        const { codigo } = req.body;
        
        if (!codigo) {
            return res.status(400).json({ error: 'Client code is required' });
        }
        
        // Get client by code
        const cliente = db.prepare(`
            SELECT id, codigo, nombre, apellido, activo
            FROM clientes
            WHERE codigo = ?
        `).get(codigo);
        
        if (!cliente) {
            return res.status(404).json({ error: 'Client not found' });
        }
        
        if (!cliente.activo) {
            return res.status(400).json({ error: 'Client is inactive' });
        }
        
        // Use the same check-in logic
        req.body.cliente_id = cliente.id;
        return checkIn(req, res);
    } catch (error) {
        console.error('Check-in by code error:', error);
        res.status(500).json({ error: 'Error registering check-in' });
    }
};

/**
 * Get today's attendance
 */
const getToday = (req, res) => {
    try {
        const today = formatDate(new Date());
        
        const asistencias = db.prepare(`
            SELECT a.*, 
                   c.codigo, c.nombre as cliente_nombre, c.apellido as cliente_apellido,
                   u.nombre as usuario_nombre
            FROM asistencias a
            JOIN clientes c ON a.cliente_id = c.id
            LEFT JOIN usuarios u ON a.usuario_registro_id = u.id
            WHERE date(a.fecha_hora) = ?
            ORDER BY a.fecha_hora DESC
        `).all(today);
        
        // Get count
        const { total } = db.prepare(`
            SELECT COUNT(*) as total FROM asistencias
            WHERE date(fecha_hora) = ?
        `).get(today);
        
        res.json({
            fecha: today,
            total,
            asistencias
        });
    } catch (error) {
        console.error('Get today attendance error:', error);
        res.status(500).json({ error: 'Error getting today\'s attendance' });
    }
};

/**
 * Get attendance statistics
 */
const getStats = (req, res) => {
    try {
        const { fecha_inicio, fecha_fin } = req.query;
        
        let dateFilter = '';
        const params = [];
        
        if (fecha_inicio && fecha_fin) {
            dateFilter = 'WHERE date(fecha_hora) BETWEEN ? AND ?';
            params.push(fecha_inicio, fecha_fin);
        } else {
            // Default to last 30 days
            dateFilter = "WHERE fecha_hora >= datetime('now', '-30 days')";
        }
        
        // Total attendance
        const { total } = db.prepare(`
            SELECT COUNT(*) as total FROM asistencias ${dateFilter}
        `).get(...params);
        
        // Attendance by day
        const byDay = db.prepare(`
            SELECT date(fecha_hora) as fecha, COUNT(*) as total
            FROM asistencias ${dateFilter}
            GROUP BY date(fecha_hora)
            ORDER BY fecha DESC
        `).all(...params);
        
        // Top clients
        const topClients = db.prepare(`
            SELECT c.codigo, c.nombre, c.apellido, COUNT(*) as visitas
            FROM asistencias a
            JOIN clientes c ON a.cliente_id = c.id
            ${dateFilter}
            GROUP BY a.cliente_id
            ORDER BY visitas DESC
            LIMIT 10
        `).all(...params);
        
        // Peak hours
        const peakHours = db.prepare(`
            SELECT strftime('%H', fecha_hora) as hora, COUNT(*) as total
            FROM asistencias ${dateFilter}
            GROUP BY hora
            ORDER BY total DESC
        `).all(...params);
        
        res.json({
            total,
            byDay,
            topClients,
            peakHours,
            periodo: fecha_inicio && fecha_fin ? { fecha_inicio, fecha_fin } : 'Últimos 30 días'
        });
    } catch (error) {
        console.error('Get attendance stats error:', error);
        res.status(500).json({ error: 'Error getting attendance statistics' });
    }
};

/**
 * Get client attendance history
 */
const getClientHistory = (req, res) => {
    try {
        const { cliente_id } = req.params;
        const { limit = 30 } = req.query;
        
        const asistencias = db.prepare(`
            SELECT a.*, u.nombre as usuario_nombre
            FROM asistencias a
            LEFT JOIN usuarios u ON a.usuario_registro_id = u.id
            WHERE a.cliente_id = ?
            ORDER BY a.fecha_hora DESC
            LIMIT ?
        `).all(cliente_id, parseInt(limit));
        
        // Get total count
        const { total } = db.prepare(
            'SELECT COUNT(*) as total FROM asistencias WHERE cliente_id = ?'
        ).get(cliente_id);
        
        res.json({
            total,
            asistencias
        });
    } catch (error) {
        console.error('Get client history error:', error);
        res.status(500).json({ error: 'Error getting client attendance history' });
    }
};

module.exports = {
    getAll,
    checkIn,
    checkInByCode,
    getToday,
    getStats,
    getClientHistory
};
