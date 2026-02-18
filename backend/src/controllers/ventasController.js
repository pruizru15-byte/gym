const db = require('../config/database');
const { formatDateTime } = require('../utils/dateUtils');

/**
 * Get all sales with pagination and filters
 */
const getAll = (req, res) => {
    try {
        const { page = 1, limit = 20, fecha_inicio, fecha_fin, metodo_pago } = req.query;
        const offset = (page - 1) * limit;
        
        let query = `
            SELECT v.*, 
                   c.codigo as cliente_codigo, c.nombre as cliente_nombre, c.apellido as cliente_apellido,
                   u.nombre as usuario_nombre
            FROM ventas v
            LEFT JOIN clientes c ON v.cliente_id = c.id
            LEFT JOIN usuarios u ON v.usuario_id = u.id
            WHERE 1=1
        `;
        const params = [];
        
        if (fecha_inicio && fecha_fin) {
            query += ' AND date(v.fecha_hora) BETWEEN ? AND ?';
            params.push(fecha_inicio, fecha_fin);
        }
        
        if (metodo_pago) {
            query += ' AND v.metodo_pago = ?';
            params.push(metodo_pago);
        }
        
        query += ' ORDER BY v.fecha_hora DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), offset);
        
        const ventas = db.prepare(query).all(...params);
        
        // Get total count and sum
        let countQuery = 'SELECT COUNT(*) as total, COALESCE(SUM(total), 0) as monto_total FROM ventas WHERE 1=1';
        const countParams = [];
        if (fecha_inicio && fecha_fin) {
            countQuery += ' AND date(fecha_hora) BETWEEN ? AND ?';
            countParams.push(fecha_inicio, fecha_fin);
        }
        if (metodo_pago) {
            countQuery += ' AND metodo_pago = ?';
            countParams.push(metodo_pago);
        }
        
        const stats = db.prepare(countQuery).get(...countParams);
        
        res.json({
            ventas,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: stats.total,
                pages: Math.ceil(stats.total / limit)
            },
            monto_total: stats.monto_total
        });
    } catch (error) {
        console.error('Get sales error:', error);
        res.status(500).json({ error: 'Error getting sales' });
    }
};

/**
 * Get sale by ID with details
 */
const getById = (req, res) => {
    try {
        const { id } = req.params;
        
        // Get sale header
        const venta = db.prepare(`
            SELECT v.*, 
                   c.codigo as cliente_codigo, c.nombre as cliente_nombre, c.apellido as cliente_apellido,
                   u.nombre as usuario_nombre
            FROM ventas v
            LEFT JOIN clientes c ON v.cliente_id = c.id
            LEFT JOIN usuarios u ON v.usuario_id = u.id
            WHERE v.id = ?
        `).get(id);
        
        if (!venta) {
            return res.status(404).json({ error: 'Sale not found' });
        }
        
        // Get sale details
        const detalles = db.prepare(`
            SELECT vd.*, p.nombre as producto_nombre, p.codigo as producto_codigo
            FROM ventas_detalle vd
            JOIN productos p ON vd.producto_id = p.id
            WHERE vd.venta_id = ?
        `).all(id);
        
        res.json({
            ...venta,
            detalles
        });
    } catch (error) {
        console.error('Get sale error:', error);
        res.status(500).json({ error: 'Error getting sale' });
    }
};

/**
 * Create new sale (Point of Sale)
 */
const create = (req, res) => {
    try {
        const {
            cliente_id,
            productos, // Array of { producto_id, cantidad, precio_unitario }
            metodo_pago,
            monto_recibido,
            notas
        } = req.body;
        
        // Validation
        if (!productos || !Array.isArray(productos) || productos.length === 0) {
            return res.status(400).json({ error: 'Products are required' });
        }
        
        // Calculate total
        let total = 0;
        const productosValidados = [];
        
        for (const item of productos) {
            if (!item.producto_id || !item.cantidad || !item.precio_unitario) {
                return res.status(400).json({ error: 'Invalid product data' });
            }
            
            // Get product info
            const producto = db.prepare('SELECT * FROM productos WHERE id = ? AND activo = 1').get(item.producto_id);
            if (!producto) {
                return res.status(404).json({ error: `Product ${item.producto_id} not found` });
            }
            
            // Check stock
            if (producto.stock_actual < item.cantidad) {
                return res.status(400).json({ 
                    error: `Insufficient stock for ${producto.nombre}. Available: ${producto.stock_actual}` 
                });
            }
            
            const subtotal = item.cantidad * item.precio_unitario;
            total += subtotal;
            
            productosValidados.push({
                producto_id: item.producto_id,
                producto: producto,
                cantidad: item.cantidad,
                precio_unitario: item.precio_unitario,
                subtotal: subtotal
            });
        }
        
        // Calculate change
        const cambio = monto_recibido ? monto_recibido - total : 0;
        
        if (monto_recibido && cambio < 0) {
            return res.status(400).json({ error: 'Insufficient payment amount' });
        }
        
        // Start transaction
        const insertVenta = db.prepare(`
            INSERT INTO ventas (cliente_id, total, metodo_pago, monto_recibido, cambio, notas, usuario_id)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
        
        const insertDetalle = db.prepare(`
            INSERT INTO ventas_detalle (venta_id, producto_id, cantidad, precio_unitario, subtotal)
            VALUES (?, ?, ?, ?, ?)
        `);
        
        const updateStock = db.prepare(`
            UPDATE productos SET stock_actual = stock_actual - ? WHERE id = ?
        `);
        
        const insertPago = db.prepare(`
            INSERT INTO pagos (cliente_id, tipo, referencia_id, concepto, monto, metodo_pago, usuario_id)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
        
        const transaction = db.transaction(() => {
            // Insert sale
            const ventaResult = insertVenta.run(
                cliente_id || null, total, metodo_pago || null,
                monto_recibido || null, cambio, notas || null, req.user.id
            );
            const ventaId = ventaResult.lastInsertRowid;
            
            // Insert details and update stock
            for (const item of productosValidados) {
                insertDetalle.run(
                    ventaId, item.producto_id, item.cantidad,
                    item.precio_unitario, item.subtotal
                );
                
                updateStock.run(item.cantidad, item.producto_id);
            }
            
            // Register payment
            insertPago.run(
                cliente_id || null, 'venta', ventaId,
                'Venta de productos', total, metodo_pago || null, req.user.id
            );
            
            return ventaId;
        });
        
        const ventaId = transaction();
        
        // Get created sale with details
        const venta = db.prepare(`
            SELECT v.*, 
                   c.codigo as cliente_codigo, c.nombre as cliente_nombre, c.apellido as cliente_apellido,
                   u.nombre as usuario_nombre
            FROM ventas v
            LEFT JOIN clientes c ON v.cliente_id = c.id
            LEFT JOIN usuarios u ON v.usuario_id = u.id
            WHERE v.id = ?
        `).get(ventaId);
        
        const detalles = db.prepare(`
            SELECT vd.*, p.nombre as producto_nombre, p.codigo as producto_codigo
            FROM ventas_detalle vd
            JOIN productos p ON vd.producto_id = p.id
            WHERE vd.venta_id = ?
        `).all(ventaId);
        
        res.status(201).json({
            ...venta,
            detalles
        });
    } catch (error) {
        console.error('Create sale error:', error);
        res.status(500).json({ error: 'Error creating sale' });
    }
};

/**
 * Get sales by date range
 */
const getByDateRange = (req, res) => {
    try {
        const { fecha_inicio, fecha_fin } = req.query;
        
        if (!fecha_inicio || !fecha_fin) {
            return res.status(400).json({ error: 'Start and end dates are required' });
        }
        
        const ventas = db.prepare(`
            SELECT v.*, 
                   c.codigo as cliente_codigo, c.nombre as cliente_nombre, c.apellido as cliente_apellido,
                   u.nombre as usuario_nombre
            FROM ventas v
            LEFT JOIN clientes c ON v.cliente_id = c.id
            LEFT JOIN usuarios u ON v.usuario_id = u.id
            WHERE date(v.fecha_hora) BETWEEN ? AND ?
            ORDER BY v.fecha_hora DESC
        `).all(fecha_inicio, fecha_fin);
        
        // Get totals
        const totales = db.prepare(`
            SELECT 
                COUNT(*) as total_ventas,
                COALESCE(SUM(total), 0) as monto_total,
                COALESCE(SUM(CASE WHEN metodo_pago = 'efectivo' THEN total ELSE 0 END), 0) as total_efectivo,
                COALESCE(SUM(CASE WHEN metodo_pago = 'tarjeta' THEN total ELSE 0 END), 0) as total_tarjeta,
                COALESCE(SUM(CASE WHEN metodo_pago = 'transferencia' THEN total ELSE 0 END), 0) as total_transferencia
            FROM ventas
            WHERE date(fecha_hora) BETWEEN ? AND ?
        `).get(fecha_inicio, fecha_fin);
        
        res.json({
            ventas,
            totales,
            periodo: { fecha_inicio, fecha_fin }
        });
    } catch (error) {
        console.error('Get sales by date error:', error);
        res.status(500).json({ error: 'Error getting sales' });
    }
};

/**
 * Get today's sales
 */
const getToday = (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        
        const ventas = db.prepare(`
            SELECT v.*, 
                   c.codigo as cliente_codigo, c.nombre as cliente_nombre, c.apellido as cliente_apellido,
                   u.nombre as usuario_nombre
            FROM ventas v
            LEFT JOIN clientes c ON v.cliente_id = c.id
            LEFT JOIN usuarios u ON v.usuario_id = u.id
            WHERE date(v.fecha_hora) = ?
            ORDER BY v.fecha_hora DESC
        `).all(today);
        
        const totales = db.prepare(`
            SELECT 
                COUNT(*) as total_ventas,
                COALESCE(SUM(total), 0) as monto_total,
                COALESCE(SUM(CASE WHEN metodo_pago = 'efectivo' THEN total ELSE 0 END), 0) as total_efectivo,
                COALESCE(SUM(CASE WHEN metodo_pago = 'tarjeta' THEN total ELSE 0 END), 0) as total_tarjeta,
                COALESCE(SUM(CASE WHEN metodo_pago = 'transferencia' THEN total ELSE 0 END), 0) as total_transferencia
            FROM ventas
            WHERE date(fecha_hora) = ?
        `).get(today);
        
        res.json({
            fecha: today,
            ventas,
            totales
        });
    } catch (error) {
        console.error('Get today sales error:', error);
        res.status(500).json({ error: 'Error getting today\'s sales' });
    }
};

/**
 * Get top selling products
 */
const getTopProducts = (req, res) => {
    try {
        const { fecha_inicio, fecha_fin, limit = 10 } = req.query;
        
        let query = `
            SELECT 
                p.id, p.codigo, p.nombre, p.categoria,
                SUM(vd.cantidad) as cantidad_vendida,
                SUM(vd.subtotal) as total_ventas
            FROM ventas_detalle vd
            JOIN productos p ON vd.producto_id = p.id
            JOIN ventas v ON vd.venta_id = v.id
        `;
        const params = [];
        
        if (fecha_inicio && fecha_fin) {
            query += ' WHERE date(v.fecha_hora) BETWEEN ? AND ?';
            params.push(fecha_inicio, fecha_fin);
        }
        
        query += ' GROUP BY p.id ORDER BY cantidad_vendida DESC LIMIT ?';
        params.push(parseInt(limit));
        
        const productos = db.prepare(query).all(...params);
        
        res.json(productos);
    } catch (error) {
        console.error('Get top products error:', error);
        res.status(500).json({ error: 'Error getting top products' });
    }
};

module.exports = {
    getAll,
    getById,
    create,
    getByDateRange,
    getToday,
    getTopProducts
};
