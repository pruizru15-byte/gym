const db = require('../config/database');
const { addDays, formatDate } = require('../utils/dateUtils');

/**
 * Get all machines with pagination and filters
 */
const getAll = (req, res) => {
    try {
        const { page = 1, limit = 20, search = '', categoria = '', estado = '', activo = '' } = req.query;
        const offset = (page - 1) * limit;
        
        let query = 'SELECT * FROM maquinas WHERE 1=1';
        const params = [];
        
        if (search) {
            query += ' AND (nombre LIKE ? OR codigo LIKE ? OR marca LIKE ? OR modelo LIKE ?)';
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm, searchTerm, searchTerm);
        }
        
        if (categoria) {
            query += ' AND categoria = ?';
            params.push(categoria);
        }
        
        if (estado) {
            query += ' AND estado = ?';
            params.push(estado);
        }
        
        if (activo !== '') {
            query += ' AND activo = ?';
            params.push(activo === 'true' ? 1 : 0);
        }
        
        query += ' ORDER BY nombre ASC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), offset);
        
        const maquinas = db.prepare(query).all(...params);
        
        // Get total count
        let countQuery = 'SELECT COUNT(*) as total FROM maquinas WHERE 1=1';
        const countParams = [];
        if (search) {
            countQuery += ' AND (nombre LIKE ? OR codigo LIKE ? OR marca LIKE ? OR modelo LIKE ?)';
            const searchTerm = `%${search}%`;
            countParams.push(searchTerm, searchTerm, searchTerm, searchTerm);
        }
        if (categoria) {
            countQuery += ' AND categoria = ?';
            countParams.push(categoria);
        }
        if (estado) {
            countQuery += ' AND estado = ?';
            countParams.push(estado);
        }
        if (activo !== '') {
            countQuery += ' AND activo = ?';
            countParams.push(activo === 'true' ? 1 : 0);
        }
        
        const { total } = db.prepare(countQuery).get(...countParams);
        
        res.json({
            maquinas,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get machines error:', error);
        res.status(500).json({ error: 'Error getting machines' });
    }
};

/**
 * Get machine by ID with maintenance history
 */
const getById = (req, res) => {
    try {
        const { id } = req.params;
        
        const maquina = db.prepare('SELECT * FROM maquinas WHERE id = ?').get(id);
        
        if (!maquina) {
            return res.status(404).json({ error: 'Machine not found' });
        }
        
        // Get maintenance history
        const mantenimientos = db.prepare(`
            SELECT m.*, u.nombre as usuario_nombre
            FROM mantenimientos m
            LEFT JOIN usuarios u ON m.usuario_registro_id = u.id
            WHERE m.maquina_id = ?
            ORDER BY m.fecha DESC
            LIMIT 10
        `).all(id);
        
        res.json({
            ...maquina,
            mantenimientos
        });
    } catch (error) {
        console.error('Get machine error:', error);
        res.status(500).json({ error: 'Error getting machine' });
    }
};

/**
 * Create machine
 */
const create = (req, res) => {
    try {
        const {
            codigo,
            nombre,
            categoria,
            marca,
            modelo,
            numero_serie,
            fecha_compra,
            costo,
            estado,
            foto,
            frecuencia_mantenimiento_dias,
            ultimo_mantenimiento,
            notas
        } = req.body;
        
        // Validation
        if (!codigo || !nombre) {
            return res.status(400).json({ error: 'Code and name are required' });
        }
        
        // Check if code already exists
        const existing = db.prepare('SELECT id FROM maquinas WHERE codigo = ?').get(codigo);
        if (existing) {
            return res.status(400).json({ error: 'Machine code already exists' });
        }
        
        // Calculate next maintenance date
        let proximo_mantenimiento = null;
        if (ultimo_mantenimiento && frecuencia_mantenimiento_dias) {
            const lastMaintenance = new Date(ultimo_mantenimiento);
            proximo_mantenimiento = formatDate(addDays(lastMaintenance, frecuencia_mantenimiento_dias));
        }
        
        const result = db.prepare(`
            INSERT INTO maquinas (
                codigo, nombre, categoria, marca, modelo, numero_serie,
                fecha_compra, costo, estado, foto, frecuencia_mantenimiento_dias,
                ultimo_mantenimiento, proximo_mantenimiento, notas
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
            codigo, nombre, categoria || null, marca || null, modelo || null,
            numero_serie || null, fecha_compra || null, costo || null,
            estado || 'bueno', foto || null, frecuencia_mantenimiento_dias || 90,
            ultimo_mantenimiento || null, proximo_mantenimiento, notas || null
        );
        
        const maquina = db.prepare('SELECT * FROM maquinas WHERE id = ?').get(result.lastInsertRowid);
        res.status(201).json(maquina);
    } catch (error) {
        console.error('Create machine error:', error);
        res.status(500).json({ error: 'Error creating machine' });
    }
};

/**
 * Update machine
 */
const update = (req, res) => {
    try {
        const { id } = req.params;
        const {
            nombre,
            categoria,
            marca,
            modelo,
            numero_serie,
            fecha_compra,
            costo,
            estado,
            foto,
            frecuencia_mantenimiento_dias,
            ultimo_mantenimiento,
            notas,
            activo
        } = req.body;
        
        const maquina = db.prepare('SELECT * FROM maquinas WHERE id = ?').get(id);
        if (!maquina) {
            return res.status(404).json({ error: 'Machine not found' });
        }
        
        // Validation
        if (!nombre) {
            return res.status(400).json({ error: 'Name is required' });
        }
        
        // Calculate next maintenance date if last maintenance or frequency changed
        let proximo_mantenimiento = maquina.proximo_mantenimiento;
        const newUltimoMantenimiento = ultimo_mantenimiento !== undefined ? ultimo_mantenimiento : maquina.ultimo_mantenimiento;
        const newFrecuencia = frecuencia_mantenimiento_dias !== undefined ? frecuencia_mantenimiento_dias : maquina.frecuencia_mantenimiento_dias;
        
        if (newUltimoMantenimiento && newFrecuencia) {
            const lastMaintenance = new Date(newUltimoMantenimiento);
            proximo_mantenimiento = formatDate(addDays(lastMaintenance, newFrecuencia));
        }
        
        db.prepare(`
            UPDATE maquinas SET
                nombre = ?,
                categoria = ?,
                marca = ?,
                modelo = ?,
                numero_serie = ?,
                fecha_compra = ?,
                costo = ?,
                estado = ?,
                foto = ?,
                frecuencia_mantenimiento_dias = ?,
                ultimo_mantenimiento = ?,
                proximo_mantenimiento = ?,
                notas = ?,
                activo = ?
            WHERE id = ?
        `).run(
            nombre, categoria || null, marca || null, modelo || null,
            numero_serie || null, fecha_compra || null, costo || null,
            estado !== undefined ? estado : maquina.estado, foto || null,
            newFrecuencia, newUltimoMantenimiento || null, proximo_mantenimiento,
            notas || null, activo !== undefined ? activo : maquina.activo, id
        );
        
        const updatedMaquina = db.prepare('SELECT * FROM maquinas WHERE id = ?').get(id);
        res.json(updatedMaquina);
    } catch (error) {
        console.error('Update machine error:', error);
        res.status(500).json({ error: 'Error updating machine' });
    }
};

/**
 * Delete (deactivate) machine
 */
const remove = (req, res) => {
    try {
        const { id } = req.params;
        
        const maquina = db.prepare('SELECT id FROM maquinas WHERE id = ?').get(id);
        if (!maquina) {
            return res.status(404).json({ error: 'Machine not found' });
        }
        
        // Soft delete
        db.prepare('UPDATE maquinas SET activo = 0 WHERE id = ?').run(id);
        
        res.json({ message: 'Machine deactivated successfully' });
    } catch (error) {
        console.error('Delete machine error:', error);
        res.status(500).json({ error: 'Error deleting machine' });
    }
};

/**
 * Add maintenance record
 */
const addMaintenance = (req, res) => {
    try {
        const { maquina_id } = req.params;
        const { fecha, tipo, descripcion, costo, realizado_por } = req.body;
        
        // Validation
        if (!fecha || !tipo || !descripcion) {
            return res.status(400).json({ error: 'Date, type and description are required' });
        }
        
        const maquina = db.prepare('SELECT * FROM maquinas WHERE id = ?').get(maquina_id);
        if (!maquina) {
            return res.status(404).json({ error: 'Machine not found' });
        }
        
        // Insert maintenance record
        const result = db.prepare(`
            INSERT INTO mantenimientos (
                maquina_id, fecha, tipo, descripcion, costo, realizado_por, usuario_registro_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(
            maquina_id, fecha, tipo, descripcion, costo || null,
            realizado_por || null, req.user.id
        );
        
        // Update machine's last maintenance and calculate next
        const nextMaintenance = formatDate(addDays(new Date(fecha), maquina.frecuencia_mantenimiento_dias));
        db.prepare(`
            UPDATE maquinas SET
                ultimo_mantenimiento = ?,
                proximo_mantenimiento = ?
            WHERE id = ?
        `).run(fecha, nextMaintenance, maquina_id);
        
        const mantenimiento = db.prepare(`
            SELECT m.*, u.nombre as usuario_nombre
            FROM mantenimientos m
            LEFT JOIN usuarios u ON m.usuario_registro_id = u.id
            WHERE m.id = ?
        `).get(result.lastInsertRowid);
        
        res.status(201).json(mantenimiento);
    } catch (error) {
        console.error('Add maintenance error:', error);
        res.status(500).json({ error: 'Error adding maintenance record' });
    }
};

/**
 * Get maintenance history for a machine
 */
const getMaintenanceHistory = (req, res) => {
    try {
        const { maquina_id } = req.params;
        const { limit = 20 } = req.query;
        
        const mantenimientos = db.prepare(`
            SELECT m.*, u.nombre as usuario_nombre
            FROM mantenimientos m
            LEFT JOIN usuarios u ON m.usuario_registro_id = u.id
            WHERE m.maquina_id = ?
            ORDER BY m.fecha DESC
            LIMIT ?
        `).all(maquina_id, parseInt(limit));
        
        res.json(mantenimientos);
    } catch (error) {
        console.error('Get maintenance history error:', error);
        res.status(500).json({ error: 'Error getting maintenance history' });
    }
};

/**
 * Get machines needing maintenance
 */
const getNeedingMaintenance = (req, res) => {
    try {
        const { days = 7 } = req.query;
        
        const maquinas = db.prepare(`
            SELECT * FROM maquinas
            WHERE activo = 1 
            AND proximo_mantenimiento IS NOT NULL
            AND proximo_mantenimiento <= date('now', '+' || ? || ' days')
            ORDER BY proximo_mantenimiento ASC
        `).all(parseInt(days));
        
        res.json(maquinas);
    } catch (error) {
        console.error('Get needing maintenance error:', error);
        res.status(500).json({ error: 'Error getting machines needing maintenance' });
    }
};

/**
 * Get machine categories
 */
const getCategories = (req, res) => {
    try {
        const categorias = db.prepare(`
            SELECT DISTINCT categoria, COUNT(*) as total
            FROM maquinas
            WHERE categoria IS NOT NULL AND activo = 1
            GROUP BY categoria
            ORDER BY categoria ASC
        `).all();
        
        res.json(categorias);
    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({ error: 'Error getting categories' });
    }
};

module.exports = {
    getAll,
    getById,
    create,
    update,
    remove,
    addMaintenance,
    getMaintenanceHistory,
    getNeedingMaintenance,
    getCategories
};
