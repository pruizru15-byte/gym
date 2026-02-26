const db = require('../config/database');
const { generateClientQR } = require('../utils/qrGenerator');
const { formatDate } = require('../utils/dateUtils');
const { logAction, ACTION_TYPES, ENTITY_TYPES } = require('../services/auditService');

/**
 * Get all clients with pagination and filters
 */
const getAll = (req, res) => {
    try {
        const { page = 1, limit = 20, search = '', activo = '', estado_membresia = '' } = req.query;
        const offset = (page - 1) * limit;

        // Base query with joins to get active membership info
        let query = `
            SELECT c.*, 
                   m.nombre as planNombre, 
                   cm.fecha_vencimiento as fechaVencimiento,
                   (CASE WHEN cm.id IS NOT NULL THEN 1 ELSE 0 END) as membresiaActiva
            FROM clientes c
            LEFT JOIN clientes_membresias cm ON c.id = cm.cliente_id AND cm.activo = 1 AND cm.fecha_vencimiento >= date('now')
            LEFT JOIN membresias m ON cm.membresia_id = m.id
            WHERE 1=1
        `;

        const params = [];

        if (search) {
            query += ' AND (c.nombre LIKE ? OR c.apellido LIKE ? OR c.codigo LIKE ? OR c.email LIKE ? OR c.telefono LIKE ?)';
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
        }

        if (activo !== '') {
            query += ' AND c.activo = ?';
            params.push(activo === 'true' ? 1 : 0);
        }

        // Filter by membership status
        if (estado_membresia === 'active') {
            query += ' AND cm.id IS NOT NULL';
        } else if (estado_membresia === 'inactive') {
            query += ' AND cm.id IS NULL';
        } else if (estado_membresia === 'expiring') {
            query += " AND cm.id IS NOT NULL AND cm.fecha_vencimiento BETWEEN date('now') AND date('now', '+7 days')";
        }

        // Group by client ID to avoid duplicates if multiple active memberships exist (shouldn't happen but safety)
        query += ' GROUP BY c.id';

        query += ' ORDER BY c.fecha_registro DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), offset);

        const clientes = db.prepare(query).all(...params);

        // Get total count
        let countQuery = `
            SELECT COUNT(DISTINCT c.id) as total 
            FROM clientes c 
            LEFT JOIN clientes_membresias cm ON c.id = cm.cliente_id AND cm.activo = 1 AND cm.fecha_vencimiento >= date('now')
            WHERE 1=1
        `;
        const countParams = [];
        if (search) {
            countQuery += ' AND (c.nombre LIKE ? OR c.apellido LIKE ? OR c.codigo LIKE ? OR c.email LIKE ? OR c.telefono LIKE ?)';
            const searchTerm = `%${search}%`;
            countParams.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
        }
        if (activo !== '') {
            countQuery += ' AND c.activo = ?';
            countParams.push(activo === 'true' ? 1 : 0);
        }

        if (estado_membresia === 'active') {
            countQuery += ' AND cm.id IS NOT NULL';
        } else if (estado_membresia === 'inactive') {
            countQuery += ' AND cm.id IS NULL';
        } else if (estado_membresia === 'expiring') {
            countQuery += " AND cm.id IS NOT NULL AND cm.fecha_vencimiento BETWEEN date('now') AND date('now', '+7 days')";
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
const getById = async (req, res) => {
    try {
        const { id } = req.params;

        const cliente = db.prepare('SELECT * FROM clientes WHERE id = ?').get(id);

        if (!cliente) {
            return res.status(404).json({ error: 'Client not found' });
        }

        // Auto-generate QR code for legacy clients without one
        if (!cliente.qr_code && cliente.codigo) {
            const newQr = await generateClientQR(cliente.codigo);
            db.prepare('UPDATE clientes SET qr_code = ? WHERE id = ?').run(newQr, id);
            cliente.qr_code = newQr;
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

const { generateClientCode } = require('../utils/codeUtils');

/**
 * Create new client
 */
const create = async (req, res) => {
    try {
        console.log('🔹 CREATE CLIENT REQUEST BODY:', JSON.stringify(req.body, null, 2));

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
            notas,
            // Allow camelCase inputs too
            fechaNacimiento,
            condicionesMedicas,
            contactoEmergencia,
            telefonoEmergencia
        } = req.body;

        // Normalize fields
        const finalCodigo = codigo || generateClientCode();
        const finalFechaNacimiento = fecha_nacimiento || fechaNacimiento || null;
        const finalCondicionesMedicas = condiciones_medicas || condicionesMedicas || null;
        const finalAlergias = alergias || null;
        const finalContactoEmergencia = contacto_emergencia || contactoEmergencia || null;
        const finalTelefonoEmergencia = telefono_emergencia || telefonoEmergencia || null;

        // Validation
        if (!nombre || !apellido) {
            return res.status(400).json({ error: 'Name and lastname are required' });
        }

        // Check if code already exists
        const existing = db.prepare('SELECT id FROM clientes WHERE codigo = ?').get(finalCodigo);
        if (existing) {
            // If auto-generated, try one more time
            if (!codigo) {
                const retryCodigo = generateClientCode();
                // Generate QR code
                const qrCode = await generateClientQR(retryCodigo);

                const result = db.prepare(`
                    INSERT INTO clientes (
                        codigo, nombre, apellido, email, telefono, fecha_nacimiento,
                        direccion, foto, qr_code, condiciones_medicas, alergias,
                        contacto_emergencia, telefono_emergencia, notas
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `).run(
                    retryCodigo, nombre, apellido, email || null, telefono || null,
                    finalFechaNacimiento, direccion || null, foto || null,
                    qrCode, finalCondicionesMedicas, finalAlergias,
                    finalContactoEmergencia, finalTelefonoEmergencia, notas || null
                );

                const newClientId = result.lastInsertRowid;
                logAction(req.user.id, ACTION_TYPES.CREATE, ENTITY_TYPES.CLIENTE, newClientId, { nombre, apellido, codigo: retryCodigo });
                const cliente = db.prepare('SELECT * FROM clientes WHERE id = ?').get(newClientId);
                return res.status(201).json(cliente);
            }
            return res.status(400).json({ error: 'Client code already exists' });
        }

        // Generate QR code
        const qrCode = await generateClientQR(finalCodigo);

        // Insert client
        const result = db.prepare(`
            INSERT INTO clientes (
                codigo, nombre, apellido, email, telefono, fecha_nacimiento,
                direccion, foto, qr_code, condiciones_medicas, alergias,
                contacto_emergencia, telefono_emergencia, notas
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
            finalCodigo, nombre, apellido, email || null, telefono || null,
            finalFechaNacimiento, direccion || null, foto || null,
            qrCode, finalCondicionesMedicas, finalAlergias,
            finalContactoEmergencia, finalTelefonoEmergencia, notas || null
        );

        const newClientId = result.lastInsertRowid;

        // Log action
        logAction(req.user.id, ACTION_TYPES.CREATE, ENTITY_TYPES.CLIENTE, newClientId, { nombre, apellido, codigo: finalCodigo });

        const cliente = db.prepare('SELECT * FROM clientes WHERE id = ?').get(newClientId);

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
            activo,
            // Allow camelCase inputs
            fechaNacimiento,
            condicionesMedicas,
            contactoEmergencia,
            telefonoEmergencia
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

        // Normalize fields (use existing if undefined, allow null if explicitly passed as null but that's handled by frontend usually sending empty strings)
        // For update, we want to update only if provided.

        const finalFechaNacimiento = fecha_nacimiento !== undefined ? fecha_nacimiento : (fechaNacimiento !== undefined ? fechaNacimiento : cliente.fecha_nacimiento);
        const finalCondicionesMedicas = condiciones_medicas !== undefined ? condiciones_medicas : (condicionesMedicas !== undefined ? condicionesMedicas : cliente.condiciones_medicas);
        const finalAlergias = alergias !== undefined ? alergias : cliente.alergias;
        const finalContactoEmergencia = contacto_emergencia !== undefined ? contacto_emergencia : (contactoEmergencia !== undefined ? contactoEmergencia : cliente.contacto_emergencia);
        const finalTelefonoEmergencia = telefono_emergencia !== undefined ? telefono_emergencia : (telefonoEmergencia !== undefined ? telefonoEmergencia : cliente.telefono_emergencia);

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
            finalFechaNacimiento, direccion || null, foto || null,
            finalCondicionesMedicas, finalAlergias,
            finalContactoEmergencia, finalTelefonoEmergencia,
            notas || null, activo !== undefined ? (activo ? 1 : 0) : cliente.activo, id
        );

        // Log action
        logAction(req.user.id, ACTION_TYPES.UPDATE, ENTITY_TYPES.CLIENTE, id, {
            nombre: nombre !== cliente.nombre ? nombre : undefined,
            apellido: apellido !== cliente.apellido ? apellido : undefined,
            activo: activo !== undefined && (activo ? 1 : 0) !== cliente.activo ? activo : undefined
        });

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

        const cliente = db.prepare('SELECT * FROM clientes WHERE id = ?').get(id);
        if (!cliente) {
            return res.status(404).json({ error: 'Client not found' });
        }

        // Soft delete
        db.prepare('UPDATE clientes SET activo = 0 WHERE id = ?').run(id);

        // Log action
        logAction(req.user.id, ACTION_TYPES.DELETE, ENTITY_TYPES.CLIENTE, id, { nombre: cliente.nombre, apellido: cliente.apellido });

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
