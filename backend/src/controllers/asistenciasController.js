const db = require('../config/database');
const { formatDate, formatDateTime } = require('../utils/dateUtils');

/**
 * Get all attendance records with pagination and filters
 */
const getAll = (req, res) => {
    try {
        const { page = 1, limit = 50, fecha, cliente_id, fecha_inicio, fecha_fin, busqueda } = req.query;
        const offset = (page - 1) * limit;

        let query = `
            SELECT a.*, 
                   c.codigo, c.nombre as cliente_nombre, c.apellido as cliente_apellido, c.foto as cliente_foto,
                   u.nombre as usuario_nombre
            FROM asistencias a
            JOIN clientes c ON a.cliente_id = c.id
            LEFT JOIN usuarios u ON a.usuario_registro_id = u.id
            WHERE 1=1
        `;
        const params = [];
        let filterClause = '';

        if (fecha) {
            filterClause += " AND date(a.fecha_hora, 'localtime') = ?";
            params.push(fecha);
        }

        if (fecha_inicio && fecha_fin) {
            filterClause += " AND date(a.fecha_hora, 'localtime') BETWEEN ? AND ?";
            params.push(fecha_inicio, fecha_fin);
        } else if (fecha_inicio) {
            filterClause += " AND date(a.fecha_hora, 'localtime') >= ?";
            params.push(fecha_inicio);
        } else if (fecha_fin) {
            filterClause += " AND date(a.fecha_hora, 'localtime') <= ?";
            params.push(fecha_fin);
        }

        if (cliente_id) {
            filterClause += ' AND a.cliente_id = ?';
            params.push(cliente_id);
        }

        if (busqueda) {
            filterClause += " AND (c.nombre LIKE ? OR c.apellido LIKE ? OR c.codigo LIKE ?)";
            const searchTerm = `%${busqueda}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }

        query += filterClause;
        query += ' ORDER BY a.fecha_hora DESC LIMIT ? OFFSET ?';
        const queryParams = [...params, parseInt(limit), offset];

        const asistencias = db.prepare(query).all(...queryParams);

        // Get total count with same filters
        let countQuery = `
            SELECT COUNT(*) as total FROM asistencias a
            JOIN clientes c ON a.cliente_id = c.id
            WHERE 1=1 ${filterClause}
        `;
        const { total } = db.prepare(countQuery).get(...params);

        // --- Resumen / summary stats ---
        const today = formatDate(new Date());

        // Total active clients
        const { totalClientes } = db.prepare(
            "SELECT COUNT(*) as totalClientes FROM clientes WHERE activo = 1"
        ).get();

        // Attendance entries today
        const { asistenciasHoy } = db.prepare(
            "SELECT COUNT(DISTINCT cliente_id) as asistenciasHoy FROM asistencias WHERE date(fecha_hora, 'localtime') = ?"
        ).get(today);

        // Average daily attendance in the filtered range (or last 30 days)
        let avgQuery;
        const avgParams = [];
        if (fecha_inicio && fecha_fin) {
            avgQuery = `
                SELECT COALESCE(AVG(cnt), 0) as promedioAsistencias FROM (
                    SELECT date(fecha_hora, 'localtime') as dia, COUNT(DISTINCT cliente_id) as cnt
                    FROM asistencias
                    WHERE date(fecha_hora, 'localtime') BETWEEN ? AND ?
                    GROUP BY dia
                )
            `;
            avgParams.push(fecha_inicio, fecha_fin);
        } else {
            avgQuery = `
                SELECT COALESCE(AVG(cnt), 0) as promedioAsistencias FROM (
                    SELECT date(fecha_hora, 'localtime') as dia, COUNT(DISTINCT cliente_id) as cnt
                    FROM asistencias
                    WHERE fecha_hora >= datetime('now', '-30 days')
                    GROUP BY dia
                )
            `;
        }
        const { promedioAsistencias } = db.prepare(avgQuery).get(...avgParams);

        // Average session duration (hours) — based on entrada/salida pairs on the same day
        let durQuery;
        const durParams = [];
        if (fecha_inicio && fecha_fin) {
            durQuery = `
                SELECT COALESCE(AVG(duracion), 0) as duracionPromedio FROM (
                    SELECT 
                        e.cliente_id,
                        date(e.fecha_hora, 'localtime') as dia,
                        (julianday(s.fecha_hora) - julianday(e.fecha_hora)) * 24 as duracion
                    FROM asistencias e
                    INNER JOIN asistencias s 
                        ON e.cliente_id = s.cliente_id 
                        AND date(e.fecha_hora, 'localtime') = date(s.fecha_hora, 'localtime')
                        AND e.tipo = 'entrada' AND s.tipo = 'salida'
                    WHERE date(e.fecha_hora, 'localtime') BETWEEN ? AND ?
                )
            `;
            durParams.push(fecha_inicio, fecha_fin);
        } else {
            durQuery = `
                SELECT COALESCE(AVG(duracion), 0) as duracionPromedio FROM (
                    SELECT 
                        e.cliente_id,
                        date(e.fecha_hora, 'localtime') as dia,
                        (julianday(s.fecha_hora) - julianday(e.fecha_hora)) * 24 as duracion
                    FROM asistencias e
                    INNER JOIN asistencias s 
                        ON e.cliente_id = s.cliente_id 
                        AND date(e.fecha_hora, 'localtime') = date(s.fecha_hora, 'localtime')
                        AND e.tipo = 'entrada' AND s.tipo = 'salida'
                    WHERE e.fecha_hora >= datetime('now', '-30 days')
                )
            `;
        }
        const { duracionPromedio } = db.prepare(durQuery).get(...durParams);

        res.json({
            asistencias,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            },
            resumen: {
                totalClientes,
                asistenciasHoy,
                promedioAsistencias: Math.round(promedioAsistencias * 10) / 10,
                duracionPromedio: Math.round(duracionPromedio * 10) / 10
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
            WHERE cliente_id = ? AND date(fecha_hora, 'localtime') = ?
        `).get(cliente_id, today);

        if (existingCheckIn) {
            return res.status(400).json({ error: 'El cliente ya registró su asistencia el día de hoy' });
        }

        // Register check-in
        const result = db.prepare(`
            INSERT INTO asistencias (cliente_id, usuario_registro_id, tipo)
            VALUES (?, ?, 'entrada')
        `).run(cliente_id, req.user.id);

        const asistencia = db.prepare(`
            SELECT a.*, 
                   c.codigo, c.nombre as cliente_nombre, c.apellido as cliente_apellido, c.foto as cliente_foto,
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
 * Explicit check-out client
 */
const checkOut = (req, res) => {
    try {
        const { cliente_id } = req.body;

        if (!cliente_id) {
            return res.status(400).json({ error: 'Client ID is required' });
        }

        const today = formatDate(new Date());

        // Verify the client has an 'entrada' today
        const entradaHoy = db.prepare(`
            SELECT id FROM asistencias
            WHERE cliente_id = ? AND date(fecha_hora, 'localtime') = ? AND tipo = 'entrada'
            ORDER BY fecha_hora DESC LIMIT 1
        `).get(cliente_id, today);

        if (!entradaHoy) {
            return res.status(400).json({ error: 'El cliente no tiene un registro de entrada el día de hoy' });
        }

        // Verify the client hasn't already checked out today
        const salidaHoy = db.prepare(`
            SELECT id FROM asistencias
            WHERE cliente_id = ? AND date(fecha_hora, 'localtime') = ? AND tipo = 'salida'
        `).get(cliente_id, today);

        if (salidaHoy) {
            return res.status(400).json({ error: 'El cliente ya registró su salida el día de hoy' });
        }

        // Register check-out
        const result = db.prepare(`
            INSERT INTO asistencias (cliente_id, usuario_registro_id, tipo)
            VALUES (?, ?, 'salida')
        `).run(cliente_id, req.user.id);

        const asistencia = db.prepare(`
            SELECT a.*, 
                   c.codigo, c.nombre as cliente_nombre, c.apellido as cliente_apellido, c.foto as cliente_foto,
                   u.nombre as usuario_nombre
            FROM asistencias a
            JOIN clientes c ON a.cliente_id = c.id
            LEFT JOIN usuarios u ON a.usuario_registro_id = u.id
            WHERE a.id = ?
        `).get(result.lastInsertRowid);

        // Get basic membership info for the modal
        const membresia = db.prepare(`
            SELECT m.nombre as membresia_nombre, cm.fecha_vencimiento
            FROM clientes_membresias cm
            JOIN membresias m ON cm.membresia_id = m.id
            WHERE cm.cliente_id = ? AND cm.activo = 1 
            ORDER BY cm.fecha_vencimiento DESC LIMIT 1
        `).get(cliente_id);

        res.status(201).json({
            ...asistencia,
            membresia: membresia ? {
                nombre: membresia.membresia_nombre,
                fecha_vencimiento: membresia.fecha_vencimiento
            } : null
        });
    } catch (error) {
        console.error('Check-out error:', error);
        res.status(500).json({ error: 'Error registering check-out' });
    }
};

/**
 * Explicit check-out by QR code
 */
const checkOutByCode = (req, res) => {
    try {
        const { codigo } = req.body;

        if (!codigo) {
            return res.status(400).json({ error: 'Client code is required' });
        }

        // Get client by code
        const cliente = db.prepare(`
            SELECT id, activo FROM clientes WHERE codigo = ?
        `).get(codigo);

        if (!cliente) {
            return res.status(404).json({ error: 'Client not found' });
        }

        if (!cliente.activo) {
            return res.status(400).json({ error: 'Client is inactive' });
        }

        // Use the checkout logic
        req.body.cliente_id = cliente.id;
        return checkOut(req, res);
    } catch (error) {
        console.error('Check-out by code error:', error);
        res.status(500).json({ error: 'Error registering check-out' });
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
                   c.codigo, c.nombre as cliente_nombre, c.apellido as cliente_apellido, c.foto as cliente_foto,
                   u.nombre as usuario_nombre
            FROM asistencias a
            JOIN clientes c ON a.cliente_id = c.id
            LEFT JOIN usuarios u ON a.usuario_registro_id = u.id
            WHERE date(a.fecha_hora, 'localtime') = ?
            ORDER BY a.fecha_hora DESC
        `).all(today);

        // Get count
        const { total } = db.prepare(`
            SELECT COUNT(*) as total FROM asistencias
            WHERE date(fecha_hora, 'localtime') = ?
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
    checkOut,
    checkOutByCode,
    getToday,
    getStats,
    getClientHistory
};
