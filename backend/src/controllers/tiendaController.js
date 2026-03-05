const db = require('../config/database');
const { logAction, ACTION_TYPES, ENTITY_TYPES } = require('../services/auditService');

/**
 * Get all products with pagination and filters
 */
const getAll = (req, res) => {
    try {
        const { page = 1, limit = 20, search = '', categoria = '', activo = '', stock_bajo = '' } = req.query;
        const offset = (page - 1) * limit;

        let query = 'SELECT * FROM productos WHERE 1=1';
        const params = [];

        if (search) {
            query += ' AND (nombre LIKE ? OR codigo LIKE ? OR descripcion LIKE ?)';
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }

        if (categoria) {
            query += ' AND categoria = ?';
            params.push(categoria);
        }

        if (activo !== '') {
            query += ' AND activo = ?';
            params.push(activo === 'true' ? 1 : 0);
        }

        if (stock_bajo === 'true') {
            query += ' AND stock_actual <= stock_minimo';
        }

        query += ' ORDER BY nombre ASC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), offset);

        const productos = db.prepare(query).all(...params);

        // Get total count
        let countQuery = 'SELECT COUNT(*) as total FROM productos WHERE 1=1';
        const countParams = [];
        if (search) {
            countQuery += ' AND (nombre LIKE ? OR codigo LIKE ? OR descripcion LIKE ?)';
            const searchTerm = `%${search}%`;
            countParams.push(searchTerm, searchTerm, searchTerm);
        }
        if (categoria) {
            countQuery += ' AND categoria = ?';
            countParams.push(categoria);
        }
        if (activo !== '') {
            countQuery += ' AND activo = ?';
            countParams.push(activo === 'true' ? 1 : 0);
        }
        if (stock_bajo === 'true') {
            countQuery += ' AND stock_actual <= stock_minimo';
        }

        const { total } = db.prepare(countQuery).get(...countParams);

        res.json({
            productos,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get products error:', error);
        res.status(500).json({ error: 'Error getting products' });
    }
};

/**
 * Get product by ID
 */
const getById = (req, res) => {
    try {
        const { id } = req.params;

        const producto = db.prepare('SELECT * FROM productos WHERE id = ?').get(id);

        if (!producto) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.json(producto);
    } catch (error) {
        console.error('Get product error:', error);
        res.status(500).json({ error: 'Error getting product' });
    }
};

/**
 * Get product by code (for barcode scanning)
 */
const getByCode = (req, res) => {
    try {
        const { codigo } = req.params;

        const producto = db.prepare('SELECT * FROM productos WHERE codigo = ? AND activo = 1').get(codigo);

        if (!producto) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.json(producto);
    } catch (error) {
        console.error('Get product by code error:', error);
        res.status(500).json({ error: 'Error getting product' });
    }
};

/**
 * Create product
 */
const create = (req, res) => {
    try {
        const {
            codigo,
            nombre,
            descripcion,
            categoria,
            precio_venta,
            precio_costo,
            stock_actual,
            stock_minimo,
            fecha_vencimiento,
            proveedor
        } = req.body;

        let imagen = req.body.imagen;
        if (req.file) {
            imagen = `/media/productos/${req.file.filename}`;
        }

        // Validation
        if (!codigo || !nombre || !precio_venta) {
            return res.status(400).json({ error: 'Code, name and sale price are required' });
        }

        // Check if code already exists
        const existing = db.prepare('SELECT id FROM productos WHERE codigo = ?').get(codigo);
        if (existing) {
            return res.status(400).json({ error: 'Product code already exists' });
        }

        // Convert string representations to numbers due to multipart/form-data
        const numPrecioVenta = parseFloat(precio_venta);
        const numPrecioCosto = precio_costo ? parseFloat(precio_costo) : null;
        const numStockActual = stock_actual ? parseInt(stock_actual, 10) : 0;
        const numStockMinimo = stock_minimo ? parseInt(stock_minimo, 10) : 5;

        if (isNaN(numPrecioVenta) || numPrecioVenta <= 0) {
            return res.status(400).json({ error: 'Sale price must be a valid number greater than 0' });
        }

        const params = [
            codigo,
            nombre,
            descripcion || null,
            categoria || null,
            numPrecioVenta,
            numPrecioCosto,
            numStockActual,
            numStockMinimo,
            fecha_vencimiento || null,
            imagen || null,
            proveedor || null
        ];

        console.log('SQL Params for Create:', params);
        console.log('Params length:', params.length);

        const result = db.prepare(`
            INSERT INTO productos (
                codigo, nombre, descripcion, categoria, precio_venta, precio_costo,
                stock_actual, stock_minimo, fecha_vencimiento, imagen, proveedor
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(...params);

        const newProductId = result.lastInsertRowid;

        // Log action
        logAction(req.user.id, ACTION_TYPES.CREATE, ENTITY_TYPES.PRODUCTO, newProductId, { nombre, codigo });

        const producto = db.prepare('SELECT * FROM productos WHERE id = ?').get(newProductId);
        res.status(201).json(producto);
    } catch (error) {
        console.error('Create product error:', error);
        res.status(500).json({ error: 'Error creating product' });
    }
};

/**
 * Update product
 */
const update = (req, res) => {
    try {
        const { id } = req.params;
        const {
            nombre,
            descripcion,
            categoria,
            precio_venta,
            precio_costo,
            stock_actual,
            stock_minimo,
            fecha_vencimiento,
            proveedor,
            activo
        } = req.body;

        console.log('Update Product - req.body:', req.body);
        console.log('Update Product - req.file:', req.file);

        let imagen = req.body.imagen;
        if (req.file) {
            imagen = `/media/productos/${req.file.filename}`;
        } else if (req.body.eliminar_imagen === 'true') {
            imagen = null;
        }

        const producto = db.prepare('SELECT * FROM productos WHERE id = ?').get(id);
        if (!producto) {
            return res.status(404).json({ error: 'Product not found' });
        }

        // If no new image and no request to delete, keep the existing one
        if (imagen === undefined) {
            imagen = producto.imagen;
        }

        // Validation
        if (!nombre || !precio_venta) {
            return res.status(400).json({ error: 'Name and sale price are required' });
        }

        // Convert types due to multipart/form-data payload behavior
        const numPrecioVenta = parseFloat(precio_venta);
        const numPrecioCosto = precio_costo ? parseFloat(precio_costo) : null;
        const numStockActual = stock_actual !== undefined ? parseInt(stock_actual, 10) : producto.stock_actual;
        const numStockMinimo = stock_minimo !== undefined ? parseInt(stock_minimo, 10) : producto.stock_minimo;
        const finalActivo = activo !== undefined ? parseInt(activo, 10) : producto.activo;

        if (isNaN(numPrecioVenta) || numPrecioVenta <= 0) {
            return res.status(400).json({ error: 'Sale price must be a valid number greater than 0' });
        }

        const params = [
            nombre,
            descripcion || null,
            categoria || null,
            numPrecioVenta,
            numPrecioCosto,
            numStockActual,
            numStockMinimo,
            fecha_vencimiento || null,
            imagen,
            proveedor || null,
            finalActivo,
            id
        ];

        console.log('SQL Params for Update:', params);
        console.log('Params length:', params.length);

        db.prepare(`
            UPDATE productos SET
                nombre = ?,
                descripcion = ?,
                categoria = ?,
                precio_venta = ?,
                precio_costo = ?,
                stock_actual = ?,
                stock_minimo = ?,
                fecha_vencimiento = ?,
                imagen = ?,
                proveedor = ?,
                activo = ?
            WHERE id = ?
        `).run(...params);

        // Log action
        logAction(req.user.id, ACTION_TYPES.UPDATE, ENTITY_TYPES.PRODUCTO, id, {
            nombre: nombre !== producto.nombre ? nombre : undefined,
            precio_venta: precio_venta !== producto.precio_venta ? precio_venta : undefined,
            stock_actual: stock_actual !== undefined && stock_actual !== producto.stock_actual ? stock_actual : undefined
        });

        const updatedProducto = db.prepare('SELECT * FROM productos WHERE id = ?').get(id);
        res.json(updatedProducto);
    } catch (error) {
        console.error('Update product error:', error);
        res.status(500).json({ error: 'Error updating product' });
    }
};

/**
 * Delete (deactivate) product
 */
const remove = (req, res) => {
    try {
        const { id } = req.params;

        const producto = db.prepare('SELECT * FROM productos WHERE id = ?').get(id);
        if (!producto) {
            return res.status(404).json({ error: 'Product not found' });
        }

        // Soft delete
        db.prepare('UPDATE productos SET activo = 0 WHERE id = ?').run(id);

        // Log action
        logAction(req.user.id, ACTION_TYPES.DELETE, ENTITY_TYPES.PRODUCTO, id, { nombre: producto.nombre });

        res.json({ message: 'Product deactivated successfully' });
    } catch (error) {
        console.error('Delete product error:', error);
        res.status(500).json({ error: 'Error deleting product' });
    }
};

/**
 * Update product stock
 */
const updateStock = (req, res) => {
    try {
        const { id } = req.params;
        const { cantidad, operacion } = req.body; // operacion: 'add' o 'subtract'

        if (!cantidad || !operacion) {
            return res.status(400).json({ error: 'Quantity and operation are required' });
        }

        if (cantidad <= 0) {
            return res.status(400).json({ error: 'Quantity must be greater than 0' });
        }

        const producto = db.prepare('SELECT * FROM productos WHERE id = ?').get(id);
        if (!producto) {
            return res.status(404).json({ error: 'Product not found' });
        }

        let newStock;
        if (operacion === 'add') {
            newStock = producto.stock_actual + cantidad;
        } else if (operacion === 'subtract') {
            newStock = producto.stock_actual - cantidad;
            if (newStock < 0) {
                return res.status(400).json({ error: 'Insufficient stock' });
            }
        } else {
            return res.status(400).json({ error: 'Invalid operation. Use "add" or "subtract"' });
        }

        db.prepare('UPDATE productos SET stock_actual = ? WHERE id = ?').run(newStock, id);

        // Log action
        logAction(req.user.id, ACTION_TYPES.UPDATE, ENTITY_TYPES.PRODUCTO, id, {
            action: 'update_stock',
            operacion,
            cantidad,
            newStock
        });

        const updatedProducto = db.prepare('SELECT * FROM productos WHERE id = ?').get(id);
        res.json(updatedProducto);
    } catch (error) {
        console.error('Update stock error:', error);
        res.status(500).json({ error: 'Error updating stock' });
    }
};

/**
 * Get low stock products
 */
const getLowStock = (req, res) => {
    try {
        const { threshold = 5 } = req.query;
        const productos = db.prepare(`
            SELECT * FROM productos
            WHERE activo = 1 AND stock_actual <= ?
            ORDER BY stock_actual ASC
        `).all(parseInt(threshold));

        res.json(productos);
    } catch (error) {
        console.error('Get low stock error:', error);
        res.status(500).json({ error: 'Error getting low stock products' });
    }
};

/**
 * Get products expiring soon (within 60 days)
 */
const getExpiringSoon = (req, res) => {
    try {
        const { days = 60 } = req.query;
        // Calculamos la fecha límite en JS y la pasamos como string ISO
        const limitDate = new Date();
        limitDate.setDate(limitDate.getDate() + parseInt(days));
        const limitStr = limitDate.toISOString().split('T')[0]; // 'YYYY-MM-DD'
        const todayStr = new Date().toISOString().split('T')[0];

        const productos = db.prepare(`
            SELECT * FROM productos
            WHERE activo = 1
              AND fecha_vencimiento IS NOT NULL
              AND fecha_vencimiento != ''
              AND fecha_vencimiento <= ?
              AND fecha_vencimiento >= ?
            ORDER BY fecha_vencimiento ASC
        `).all(limitStr, todayStr);

        res.json(productos);
    } catch (error) {
        console.error('Get expiring soon error:', error);
        res.status(500).json({ error: 'Error getting expiring products' });
    }
};

/**
 * Get product categories
 */
const getCategories = (req, res) => {
    try {
        const categorias = db.prepare(`
            SELECT id, nombre, descripcion, activa
            FROM tienda_categorias
            WHERE activa = 1
            ORDER BY nombre ASC
        `).all();

        res.json(categorias);
    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({ error: 'Error getting categories' });
    }
};

/**
 * Create product category
 */
const createCategory = (req, res) => {
    try {
        const { nombre, descripcion } = req.body;

        if (!nombre) {
            return res.status(400).json({ error: 'Name is required' });
        }

        const existing = db.prepare('SELECT id FROM tienda_categorias WHERE LOWER(nombre) = LOWER(?)').get(nombre);
        if (existing) {
            return res.status(400).json({ error: 'Category already exists' });
        }

        const result = db.prepare(`
            INSERT INTO tienda_categorias (nombre, descripcion)
            VALUES (?, ?)
        `).run(nombre, descripcion || '');

        const nuevaCategoria = db.prepare('SELECT * FROM tienda_categorias WHERE id = ?').get(result.lastInsertRowid);

        // Log action (optional)
        logAction(req.user.id, ACTION_TYPES.CREATE, ENTITY_TYPES.CONFIGURACION, result.lastInsertRowid, {
            action: 'create_category', nombre
        });

        res.status(201).json(nuevaCategoria);
    } catch (error) {
        console.error('Create category error:', error);
        res.status(500).json({ error: 'Error creating category' });
    }
};

module.exports = {
    getAll,
    getById,
    getByCode,
    create,
    update,
    remove,
    updateStock,
    getLowStock,
    getExpiringSoon,
    getCategories,
    createCategory
};
