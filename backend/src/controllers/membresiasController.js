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

        const activoInt = activo !== undefined ? (activo ? 1 : 0) : membresia.activo;

        db.prepare(`
            UPDATE membresias SET
                nombre = ?,
                duracion_dias = ?,
                precio = ?,
                descripcion = ?,
                activo = ?
            WHERE id = ?
        `).run(nombre, duracion_dias, precio, descripcion || null,
            activoInt, id);

        // Log action
        logAction(req.user.id, ACTION_TYPES.UPDATE, ENTITY_TYPES.MEMBRESIA, id, {
            nombre: nombre !== membresia.nombre ? nombre : undefined,
            precio: precio !== membresia.precio ? precio : undefined,
            activo: activo !== undefined && activoInt !== membresia.activo ? activoInt : undefined
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
            notas,
            num_cuotas,
            es_cuotas
        } = req.body;

        const numCuotasToUse = es_cuotas ? (parseInt(num_cuotas) || 1) : 1;
        const isCuotasPlan = numCuotasToUse > 1 || es_cuotas;

        // Validation
        if (!cliente_id || !membresia_id) {
            return res.status(400).json({ error: 'Client and membership are required' });
        }

        // Verifica que la caja esté abierta
        const lastCaja = db.prepare(`SELECT tipo FROM caja ORDER BY fecha_hora DESC LIMIT 1`).get();
        if (!lastCaja || lastCaja.tipo !== 'apertura') {
            return res.status(400).json({
                error: 'La caja está cerrada. Debe aperturar la caja en "Pagos" antes de vender una membresía.'
            });
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

        // Calculate custom payment logic
        const precioTotal = membresia.precio;
        const montoCuota = precioTotal / numCuotasToUse;
        const pagoInicialReal = isCuotasPlan ? montoCuota : (precio_pagado !== undefined ? precio_pagado : precioTotal);

        // Calculate dates
        const startDate = fecha_inicio ? new Date(fecha_inicio) : new Date();
        const endDate = addDays(startDate, membresia.duracion_dias);

        // Deactivate previous memberships
        db.prepare('UPDATE clientes_membresias SET activo = 0 WHERE cliente_id = ?').run(cliente_id);

        // Insert new membership
        const result = db.prepare(`
            INSERT INTO clientes_membresias (
                cliente_id, membresia_id, fecha_inicio, fecha_vencimiento,
                precio_pagado, metodo_pago, notas, usuario_registro_id, es_cuotas, num_cuotas
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
            cliente_id, membresia_id, formatDate(startDate), formatDate(endDate),
            pagoInicialReal, metodo_pago || null, notas || null, req.user.id,
            isCuotasPlan ? 1 : 0, numCuotasToUse
        );

        const asignacionId = result.lastInsertRowid;

        // Register initial payment
        const pagoResult = db.prepare(`
            INSERT INTO pagos (
                cliente_id, tipo, referencia_id, concepto, monto,
                metodo_pago, usuario_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(
            cliente_id, 'membresia', asignacionId,
            isCuotasPlan ? `Membresía ${membresia.nombre} (Cuota 1/${numCuotasToUse})` : `Membresía ${membresia.nombre}`,
            pagoInicialReal,
            metodo_pago || null, req.user.id
        );

        const idDelPago = pagoResult.lastInsertRowid;

        if (isCuotasPlan) {
            let intervaloDias = membresia.duracion_dias / numCuotasToUse;
            const insertCuota = db.prepare(`
                INSERT INTO cuotas (
                    asignacion_id, numero_cuota, monto, fecha_vencimiento,
                    estado, fecha_pago, pago_id
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
            `);

            for (let i = 1; i <= numCuotasToUse; i++) {
                // Determine expiration for this cuota based on interval
                const vencimientoCuota = i === numCuotasToUse
                    ? endDate
                    : addDays(startDate, Math.round(intervaloDias * i));

                if (i === 1) {
                    // First cuota is paid immediately
                    insertCuota.run(
                        asignacionId, i, montoCuota, formatDate(vencimientoCuota),
                        'pagado', formatDate(new Date()), idDelPago
                    );
                } else {
                    // Future cuotas are pending
                    insertCuota.run(
                        asignacionId, i, montoCuota, formatDate(vencimientoCuota),
                        'pendiente', null, null
                    );
                }
            }
        }

        // Log action (special case: logging assignment to client)
        logAction(req.user.id, ACTION_TYPES.UPDATE, ENTITY_TYPES.CLIENTE, cliente_id, {
            action: 'assign_membership',
            membresia: membresia.nombre,
            vencimiento: formatDate(endDate),
            cuotas: numCuotasToUse
        });

        const clienteMembresia = db.prepare(`
            SELECT cm.*, m.nombre as membresia_nombre, c.nombre as cliente_nombre, c.apellido as cliente_apellido
            FROM clientes_membresias cm
            JOIN membresias m ON cm.membresia_id = m.id
            JOIN clientes c ON cm.cliente_id = c.id
            WHERE cm.id = ?
            `).get(result.lastInsertRowid);

        res.status(201).json({
            success: true,
            data: {
                ...clienteMembresia,
                pago_id: idDelPago
            }
        });
    } catch (error) {
        console.error('Assign membership error:', error);
        res.status(500).json({ error: 'Error assigning membership: ' + error.message });
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
        const { days = 30 } = req.query;

        // Calculamos la fecha límite en JS y la pasamos como string ISO
        const limitDate = new Date();
        limitDate.setDate(limitDate.getDate() + parseInt(days));
        const limitStr = limitDate.toISOString().split('T')[0]; // 'YYYY-MM-DD'
        const todayStr = new Date().toISOString().split('T')[0];

        const membresias = db.prepare(`
            SELECT cm.*,
            m.nombre as membresia_nombre,
            c.codigo, c.nombre as cliente_nombre, c.apellido as cliente_apellido,
            c.telefono, c.email
            FROM clientes_membresias cm
            JOIN membresias m ON cm.membresia_id = m.id
            JOIN clientes c ON cm.cliente_id = c.id
            WHERE cm.activo = 1 
            AND cm.fecha_vencimiento BETWEEN ? AND ?
            ORDER BY cm.fecha_vencimiento ASC
            `).all(todayStr, limitStr);

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

/**
 * Get all membership assignments
 */
const getAllAssignments = (req, res) => {
    try {
        const { page = 1, limit = 20, search = '', estado = '' } = req.query;
        const offset = (page - 1) * limit;

        let query = `
            SELECT cm.*,
            m.nombre as membresia_nombre,
            c.nombre as cliente_nombre, c.apellido as cliente_apellido, c.codigo, c.email
            FROM clientes_membresias cm
            JOIN membresias m ON cm.membresia_id = m.id
            JOIN clientes c ON cm.cliente_id = c.id
            WHERE 1 = 1
            `;
        const params = [];

        if (search) {
            query += ' AND (c.nombre LIKE ? OR c.apellido LIKE ? OR c.codigo LIKE ? OR c.email LIKE ?)';
            const searchTerm = `% ${search} % `;
            params.push(searchTerm, searchTerm, searchTerm, searchTerm);
        }

        if (estado === 'active') {
            query += " AND cm.activo = 1 AND cm.fecha_vencimiento >= date('now')";
        } else if (estado === 'expired') {
            query += " AND (cm.activo = 0 OR cm.fecha_vencimiento < date('now'))";
        }

        query += ' ORDER BY cm.fecha_inicio DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), offset);

        const asignaciones = db.prepare(query).all(...params);

        // Get total count
        let countQuery = `
            SELECT COUNT(*) as total 
            FROM clientes_membresias cm
            JOIN clientes c ON cm.cliente_id = c.id
            WHERE 1 = 1
            `;
        const countParams = [];

        if (search) {
            countQuery += ' AND (c.nombre LIKE ? OR c.apellido LIKE ? OR c.codigo LIKE ? OR c.email LIKE ?)';
            const searchTerm = `% ${search} % `;
            countParams.push(searchTerm, searchTerm, searchTerm, searchTerm);
        }

        if (estado === 'active') {
            countQuery += " AND cm.activo = 1 AND cm.fecha_vencimiento >= date('now')";
        } else if (estado === 'expired') {
            countQuery += " AND (cm.activo = 0 OR cm.fecha_vencimiento < date('now'))";
        }

        const { total } = db.prepare(countQuery).get(...countParams);

        res.json({
            data: asignaciones,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get assignments error:', error);
        res.status(500).json({ error: 'Error getting assignments' });
    }
};
/**
 * Toggle membership active status
 */
const toggleStatus = (req, res) => {
    try {
        const { id } = req.params;

        const membresia = db.prepare('SELECT * FROM membresias WHERE id = ?').get(id);
        if (!membresia) {
            return res.status(404).json({ error: 'Membership not found' });
        }

        const newStatus = membresia.activo === 1 ? 0 : 1;

        db.prepare('UPDATE membresias SET activo = ? WHERE id = ?').run(newStatus, id);

        // Log action
        logAction(req.user.id, ACTION_TYPES.UPDATE, ENTITY_TYPES.MEMBRESIA, id, {
            action: 'toggle_status',
            activo: newStatus
        });

        res.json({ success: true, activo: newStatus, message: `Membership ${newStatus === 1 ? 'activated' : 'deactivated'} successfully` });
    } catch (error) {
        console.error('Toggle membership status error:', error);
        res.status(500).json({ error: 'Error toggling membership status' });
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
    getExpired,
    getAllAssignments,
    toggleStatus
};
