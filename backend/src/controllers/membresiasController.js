const db = require('../config/database');
const { addDays, formatDate } = require('../utils/dateUtils');
const { logAction, ACTION_TYPES, ENTITY_TYPES } = require('../services/auditService');

/**
 * Get all membership plans
 */
const getAll = (req, res) => {
    try {
        const { activo = '' } = req.query;

        let query = 'SELECT * FROM membresias WHERE 1=1';
        const params = [];

        if (activo !== '') {
            query += ' AND activo = ?';
            params.push(activo === 'true' ? 1 : 0);
        }

        query += ' ORDER BY precio ASC';

        const membresias = db.prepare(query).all(...params);
        res.json(membresias);
    } catch (error) {
        console.error('Get memberships error:', error);
        res.status(500).json({ error: 'Error getting memberships' });
    }
};

/**
 * Get membership by ID
 */
const getById = (req, res) => {
    try {
        const { id } = req.params;

        const membresia = db.prepare('SELECT * FROM membresias WHERE id = ?').get(id);

        if (!membresia) {
            return res.status(404).json({ error: 'Membership not found' });
        }

        // Get active clients count
        const stats = db.prepare(`
            SELECT COUNT(*) as clientes_activos
            FROM clientes_membresias
            WHERE membresia_id = ? AND activo = 1 AND fecha_vencimiento >= date('now')
        `).get(id);

        res.json({
            ...membresia,
            ...stats
        });
    } catch (error) {
        console.error('Get membership error:', error);
        res.status(500).json({ error: 'Error getting membership' });
    }
};

/**
 * Create membership plan
 */
const create = (req, res) => {
    try {
        const { nombre, duracion_dias, precio, descripcion } = req.body;

        // Validation
        if (!nombre || !duracion_dias || !precio) {
            return res.status(400).json({ error: 'Name, duration and price are required' });
        }

        if (duracion_dias <= 0) {
            return res.status(400).json({ error: 'Duration must be greater than 0' });
        }

        if (precio <= 0) {
            return res.status(400).json({ error: 'Price must be greater than 0' });
        }

        const result = db.prepare(`
            INSERT INTO membresias (nombre, duracion_dias, precio, descripcion)
            VALUES (?, ?, ?, ?)
        `).run(nombre, duracion_dias, precio, descripcion || null);

        const newMembresiaId = result.lastInsertRowid;

        // Log action
        logAction(req.user.id, ACTION_TYPES.CREATE, ENTITY_TYPES.MEMBRESIA, newMembresiaId, { nombre, precio });

        const membresia = db.prepare('SELECT * FROM membresias WHERE id = ?').get(newMembresiaId);
        res.status(201).json(membresia);
    } catch (error) {
        console.error('Create membership error:', error);
        res.status(500).json({ error: 'Error creating membership' });
    }
};

/**
 * Update membership plan
 */
const update = (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, duracion_dias, precio, descripcion, activo } = req.body;

        const membresia = db.prepare('SELECT * FROM membresias WHERE id = ?').get(id);
        if (!membresia) {
            return res.status(404).json({ error: 'Membership not found' });
        }

        // Validation
        if (!nombre || !duracion_dias || !precio) {
            return res.status(400).json({ error: 'Name, duration and price are required' });
        }

        if (duracion_dias <= 0) {
            return res.status(400).json({ error: 'Duration must be greater than 0' });
        }

        if (precio <= 0) {
            return res.status(400).json({ error: 'Price must be greater than 0' });
        }

        db.prepare(`
            UPDATE membresias SET
                nombre = ?,
                duracion_dias = ?,
                precio = ?,
                descripcion = ?,
                activo = ?
            WHERE id = ?
        `).run(nombre, duracion_dias, precio, descripcion || null,
            activo !== undefined ? activo : membresia.activo, id);

        // Log action
        logAction(req.user.id, ACTION_TYPES.UPDATE, ENTITY_TYPES.MEMBRESIA, id, {
            nombre: nombre !== membresia.nombre ? nombre : undefined,
            precio: precio !== membresia.precio ? precio : undefined,
            activo: activo !== undefined && activo !== membresia.activo ? activo : undefined
        });

        const updatedMembresia = db.prepare('SELECT * FROM membresias WHERE id = ?').get(id);
        res.json(updatedMembresia);
    } catch (error) {
        console.error('Update membership error:', error);
        res.status(500).json({ error: 'Error updating membership' });
    }
};

/**
 * Delete (deactivate) membership plan
 */
const remove = (req, res) => {
    try {
        const { id } = req.params;

        const membresia = db.prepare('SELECT * FROM membresias WHERE id = ?').get(id);
        if (!membresia) {
            return res.status(404).json({ error: 'Membership not found' });
        }

        // Soft delete
        db.prepare('UPDATE membresias SET activo = 0 WHERE id = ?').run(id);

        // Log action
        logAction(req.user.id, ACTION_TYPES.DELETE, ENTITY_TYPES.MEMBRESIA, id, { nombre: membresia.nombre });

        res.json({ message: 'Membership deactivated successfully' });
    } catch (error) {
        console.error('Delete membership error:', error);
        res.status(500).json({ error: 'Error deleting membership' });
    }
};

/**
 * Assign membership to client
 */
const assignToClient = (req, res) => {
    try {
        const {
            cliente_id,
            membresia_id,
            fecha_inicio,
            precio_pagado,
            metodo_pago,
            notas
        } = req.body;

        // Validation
        if (!cliente_id || !membresia_id || !precio_pagado) {
            return res.status(400).json({ error: 'Client, membership and price are required' });
        }

        // Check if client exists
        const cliente = db.prepare('SELECT id, nombre, apellido FROM clientes WHERE id = ? AND activo = 1').get(cliente_id);
        if (!cliente) {
            return res.status(404).json({ error: 'Client not found' });
        }

        // Get membership details
        const membresia = db.prepare('SELECT * FROM membresias WHERE id = ? AND activo = 1').get(membresia_id);
        if (!membresia) {
            return res.status(404).json({ error: 'Membership not found' });
        }

        // Calculate dates
        const startDate = fecha_inicio ? new Date(fecha_inicio) : new Date();
        const endDate = addDays(startDate, membresia.duracion_dias);

        // Deactivate previous memberships
        db.prepare('UPDATE clientes_membresias SET activo = 0 WHERE cliente_id = ?').run(cliente_id);

        // Insert new membership
        const result = db.prepare(`
            INSERT INTO clientes_membresias (
                cliente_id, membresia_id, fecha_inicio, fecha_vencimiento,
                precio_pagado, metodo_pago, notas, usuario_registro_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
            cliente_id, membresia_id, formatDate(startDate), formatDate(endDate),
            precio_pagado, metodo_pago || null, notas || null, req.user.id
        );

        // Register payment
        db.prepare(`
            INSERT INTO pagos (
                cliente_id, tipo, referencia_id, concepto, monto,
                metodo_pago, usuario_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(
            cliente_id, 'membresia', result.lastInsertRowid,
            `Membresía ${membresia.nombre}`, precio_pagado,
            metodo_pago || null, req.user.id
        );

        // Log action (special case: logging assignment to client)
        logAction(req.user.id, ACTION_TYPES.UPDATE, ENTITY_TYPES.CLIENTE, cliente_id, {
            action: 'assign_membership',
            membresia: membresia.nombre,
            vencimiento: formatDate(endDate)
        });

        const clienteMembresia = db.prepare(`
            SELECT cm.*, m.nombre as membresia_nombre, c.nombre as cliente_nombre, c.apellido as cliente_apellido
            FROM clientes_membresias cm
            JOIN membresias m ON cm.membresia_id = m.id
            JOIN clientes c ON cm.cliente_id = c.id
            WHERE cm.id = ?
        `).get(result.lastInsertRowid);

        res.status(201).json(clienteMembresia);
    } catch (error) {
        console.error('Assign membership error:', error);
        res.status(500).json({ error: 'Error assigning membership' });
    }
};

/**
 * Get client memberships (active and history)
 */
const getClientMemberships = (req, res) => {
    try {
        const { cliente_id } = req.params;

        const membresias = db.prepare(`
            SELECT cm.*, m.nombre as membresia_nombre, m.descripcion,
                   u.nombre as usuario_nombre
            FROM clientes_membresias cm
            JOIN membresias m ON cm.membresia_id = m.id
            LEFT JOIN usuarios u ON cm.usuario_registro_id = u.id
            WHERE cm.cliente_id = ?
            ORDER BY cm.fecha_inicio DESC
        `).all(cliente_id);

        res.json(membresias);
    } catch (error) {
        console.error('Get client memberships error:', error);
        res.status(500).json({ error: 'Error getting client memberships' });
    }
};

/**
 * Get expiring memberships (next N days)
 */
const getExpiring = (req, res) => {
    try {
        const { days = 7 } = req.query;

        const membresias = db.prepare(`
            SELECT cm.*, 
                   m.nombre as membresia_nombre,
                   c.codigo, c.nombre as cliente_nombre, c.apellido as cliente_apellido,
                   c.telefono, c.email
            FROM clientes_membresias cm
            JOIN membresias m ON cm.membresia_id = m.id
            JOIN clientes c ON cm.cliente_id = c.id
            WHERE cm.activo = 1 
            AND cm.fecha_vencimiento BETWEEN date('now') AND date('now', '+' || ? || ' days')
            ORDER BY cm.fecha_vencimiento ASC
        `).all(parseInt(days));

        res.json(membresias);
    } catch (error) {
        console.error('Get expiring memberships error:', error);
        res.status(500).json({ error: 'Error getting expiring memberships' });
    }
};

/**
 * Get expired memberships
 */
const getExpired = (req, res) => {
    try {
        const membresias = db.prepare(`
            SELECT cm.*, 
                   m.nombre as membresia_nombre,
                   c.codigo, c.nombre as cliente_nombre, c.apellido as cliente_apellido,
                   c.telefono, c.email
            FROM clientes_membresias cm
            JOIN membresias m ON cm.membresia_id = m.id
            JOIN clientes c ON cm.cliente_id = c.id
            WHERE cm.activo = 1 
            AND cm.fecha_vencimiento < date('now')
            ORDER BY cm.fecha_vencimiento DESC
        `).all();

        res.json(membresias);
    } catch (error) {
        console.error('Get expired memberships error:', error);
        res.status(500).json({ error: 'Error getting expired memberships' });
    }
};

module.exports = {
    getAll,
    getById,
    create,
    update,
    remove,
    assignToClient,
    getClientMemberships,
    getExpiring,
    getExpired
};
