const db = require('../config/database');
const { generateClientQR } = require('../utils/qrGenerator');
const { formatDate } = require('../utils/dateUtils');

/**
 * Get all clients with pagination and filters
 */
const getAll = (req, res) => {
    try {
        const { page = 1, limit = 20, search = '', activo = '' } = req.query;
        const offset = (page - 1) * limit;
        
        let query = 'SELECT * FROM clientes WHERE 1=1';
        const params = [];
        
        if (search) {
            query += ' AND (nombre LIKE ? OR apellido LIKE ? OR codigo LIKE ? OR email LIKE ? OR telefono LIKE ?)';
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
        }
        
        if (activo !== '') {
            query += ' AND activo = ?';
            params.push(activo === 'true' ? 1 : 0);
        }
        
        query += ' ORDER BY fecha_registro DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), offset);
        
        const clientes = db.prepare(query).all(...params);
        
        // Get total count
        let countQuery = 'SELECT COUNT(*) as total FROM clientes WHERE 1=1';
        const countParams = [];
        if (search) {
            countQuery += ' AND (nombre LIKE ? OR apellido LIKE ? OR codigo LIKE ? OR email LIKE ? OR telefono LIKE ?)';
            const searchTerm = `%${search}%`;
            countParams.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
        }
        if (activo !== '') {
            countQuery += ' AND activo = ?';
            countParams.push(activo === 'true' ? 1 : 0);
        }
        
        const { total } = db.prepare(countQuery).get(...countParams);
        
        res.json({
            clientes,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get clients error:', error);
        res.status(500).json({ error: 'Error getting clients' });
    }
};

/**
 * Get client by ID with membership info
 */
const getById = (req, res) => {
    try {
        const { id } = req.params;
        
        const cliente = db.prepare('SELECT * FROM clientes WHERE id = ?').get(id);
        
        if (!cliente) {
            return res.status(404).json({ error: 'Client not found' });
        }
        
        // Get active membership
        const membresia = db.prepare(`
            SELECT cm.*, m.nombre as membresia_nombre, m.descripcion as membresia_descripcion
            FROM clientes_membresias cm
            JOIN membresias m ON cm.membresia_id = m.id
            WHERE cm.cliente_id = ? AND cm.activo = 1
            ORDER BY cm.fecha_vencimiento DESC
            LIMIT 1
        `).get(id);
        
        // Get attendance count (last 30 days)
        const asistencias = db.prepare(`
            SELECT COUNT(*) as total
            FROM asistencias
            WHERE cliente_id = ? AND fecha_hora >= datetime('now', '-30 days')
        `).get(id);
        
        res.json({
            ...cliente,
            membresia_activa: membresia || null,
            asistencias_30dias: asistencias.total
        });
    } catch (error) {
        console.error('Get client error:', error);
        res.status(500).json({ error: 'Error getting client' });
    }
};

/**
 * Get client by code (for QR scanning)
 */
const getByCode = (req, res) => {
    try {
        const { codigo } = req.params;
        
        const cliente = db.prepare('SELECT * FROM clientes WHERE codigo = ? AND activo = 1').get(codigo);
        
        if (!cliente) {
            return res.status(404).json({ error: 'Client not found' });
        }
        
        // Get active membership
        const membresia = db.prepare(`
            SELECT cm.*, m.nombre as membresia_nombre
            FROM clientes_membresias cm
            JOIN membresias m ON cm.membresia_id = m.id
            WHERE cm.cliente_id = ? AND cm.activo = 1 AND cm.fecha_vencimiento >= date('now')
            ORDER BY cm.fecha_vencimiento DESC
            LIMIT 1
        `).get(cliente.id);
        
        res.json({
            ...cliente,
            membresia_activa: membresia || null,
            tiene_acceso: membresia ? true : false
        });
    } catch (error) {
        console.error('Get client by code error:', error);
        res.status(500).json({ error: 'Error getting client' });
    }
};

/**
 * Create new client
 */
const create = async (req, res) => {
    try {
        const {
            codigo,
            nombre,
            apellido,
            email,
            telefono,
            fecha_nacimiento,
            direccion,
            foto,
            condiciones_medicas,
            alergias,
            contacto_emergencia,
            telefono_emergencia,
            notas
        } = req.body;
        
        // Validation
        if (!codigo || !nombre || !apellido) {
            return res.status(400).json({ error: 'Code, name and lastname are required' });
        }
        
        // Check if code already exists
        const existing = db.prepare('SELECT id FROM clientes WHERE codigo = ?').get(codigo);
        if (existing) {
            return res.status(400).json({ error: 'Client code already exists' });
        }
        
        // Generate QR code
        const qrCode = await generateClientQR(codigo);
        
        // Insert client
        const result = db.prepare(`
            INSERT INTO clientes (
                codigo, nombre, apellido, email, telefono, fecha_nacimiento,
                direccion, foto, qr_code, condiciones_medicas, alergias,
                contacto_emergencia, telefono_emergencia, notas
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
            codigo, nombre, apellido, email || null, telefono || null,
            fecha_nacimiento || null, direccion || null, foto || null,
            qrCode, condiciones_medicas || null, alergias || null,
            contacto_emergencia || null, telefono_emergencia || null, notas || null
        );
        
        const cliente = db.prepare('SELECT * FROM clientes WHERE id = ?').get(result.lastInsertRowid);
        
        res.status(201).json(cliente);
    } catch (error) {
        console.error('Create client error:', error);
        res.status(500).json({ error: 'Error creating client' });
    }
};

/**
 * Update client
 */
const update = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            nombre,
            apellido,
            email,
            telefono,
            fecha_nacimiento,
            direccion,
            foto,
            condiciones_medicas,
            alergias,
            contacto_emergencia,
            telefono_emergencia,
            notas,
            activo
        } = req.body;
        
        // Check if client exists
        const cliente = db.prepare('SELECT * FROM clientes WHERE id = ?').get(id);
        if (!cliente) {
            return res.status(404).json({ error: 'Client not found' });
        }
        
        // Validation
        if (!nombre || !apellido) {
            return res.status(400).json({ error: 'Name and lastname are required' });
        }
        
        // Update client
        db.prepare(`
            UPDATE clientes SET
                nombre = ?,
                apellido = ?,
                email = ?,
                telefono = ?,
                fecha_nacimiento = ?,
                direccion = ?,
                foto = ?,
                condiciones_medicas = ?,
                alergias = ?,
                contacto_emergencia = ?,
                telefono_emergencia = ?,
                notas = ?,
                activo = ?
            WHERE id = ?
        `).run(
            nombre, apellido, email || null, telefono || null,
            fecha_nacimiento || null, direccion || null, foto || null,
            condiciones_medicas || null, alergias || null,
            contacto_emergencia || null, telefono_emergencia || null,
            notas || null, activo !== undefined ? activo : cliente.activo, id
        );
        
        const updatedCliente = db.prepare('SELECT * FROM clientes WHERE id = ?').get(id);
        res.json(updatedCliente);
    } catch (error) {
        console.error('Update client error:', error);
        res.status(500).json({ error: 'Error updating client' });
    }
};

/**
 * Delete (deactivate) client
 */
const remove = (req, res) => {
    try {
        const { id } = req.params;
        
        const cliente = db.prepare('SELECT id FROM clientes WHERE id = ?').get(id);
        if (!cliente) {
            return res.status(404).json({ error: 'Client not found' });
        }
        
        // Soft delete
        db.prepare('UPDATE clientes SET activo = 0 WHERE id = ?').run(id);
        
        res.json({ message: 'Client deactivated successfully' });
    } catch (error) {
        console.error('Delete client error:', error);
        res.status(500).json({ error: 'Error deleting client' });
    }
};

/**
 * Regenerate QR code for client
 */
const regenerateQR = async (req, res) => {
    try {
        const { id } = req.params;
        
        const cliente = db.prepare('SELECT codigo FROM clientes WHERE id = ?').get(id);
        if (!cliente) {
            return res.status(404).json({ error: 'Client not found' });
        }
        
        // Generate new QR code
        const qrCode = await generateClientQR(cliente.codigo);
        
        // Update QR code
        db.prepare('UPDATE clientes SET qr_code = ? WHERE id = ?').run(qrCode, id);
        
        res.json({ qr_code: qrCode });
    } catch (error) {
        console.error('Regenerate QR error:', error);
        res.status(500).json({ error: 'Error regenerating QR code' });
    }
};

/**
 * Get client attendance history
 */
const getAttendance = (req, res) => {
    try {
        const { id } = req.params;
        const { limit = 30 } = req.query;
        
        const asistencias = db.prepare(`
            SELECT a.*, u.nombre as usuario_nombre
            FROM asistencias a
            LEFT JOIN usuarios u ON a.usuario_registro_id = u.id
            WHERE a.cliente_id = ?
            ORDER BY a.fecha_hora DESC
            LIMIT ?
        `).all(id, parseInt(limit));
        
        res.json(asistencias);
    } catch (error) {
        console.error('Get attendance error:', error);
        res.status(500).json({ error: 'Error getting attendance' });
    }
};

/**
 * Get client membership history
 */
const getMemberships = (req, res) => {
    try {
        const { id } = req.params;
        
        const membresias = db.prepare(`
            SELECT cm.*, m.nombre as membresia_nombre, m.duracion_dias,
                   u.nombre as usuario_nombre
            FROM clientes_membresias cm
            JOIN membresias m ON cm.membresia_id = m.id
            LEFT JOIN usuarios u ON cm.usuario_registro_id = u.id
            WHERE cm.cliente_id = ?
            ORDER BY cm.fecha_inicio DESC
        `).all(id);
        
        res.json(membresias);
    } catch (error) {
        console.error('Get memberships error:', error);
        res.status(500).json({ error: 'Error getting memberships' });
    }
};

module.exports = {
    getAll,
    getById,
    getByCode,
    create,
    update,
    remove,
    regenerateQR,
    getAttendance,
    getMemberships
};
