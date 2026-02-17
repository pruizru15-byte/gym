const db = require('../config/database');

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
            imagen,
            proveedor
        } = req.body;
        
        // Validation
        if (!codigo || !nombre || !precio_venta) {
            return res.status(400).json({ error: 'Code, name and sale price are required' });
        }
        
        if (precio_venta <= 0) {
            return res.status(400).json({ error: 'Sale price must be greater than 0' });
        }
        
        // Check if code already exists
        const existing = db.prepare('SELECT id FROM productos WHERE codigo = ?').get(codigo);
        if (existing) {
            return res.status(400).json({ error: 'Product code already exists' });
        }
        
        const result = db.prepare(`
            INSERT INTO productos (
                codigo, nombre, descripcion, categoria, precio_venta, precio_costo,
                stock_actual, stock_minimo, fecha_vencimiento, imagen, proveedor
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
            codigo, nombre, descripcion || null, categoria || null,
            precio_venta, precio_costo || null, stock_actual || 0,
            stock_minimo || 5, fecha_vencimiento || null, imagen || null, proveedor || null
        );
        
        const producto = db.prepare('SELECT * FROM productos WHERE id = ?').get(result.lastInsertRowid);
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
            imagen,
            proveedor,
            activo
        } = req.body;
        
        const producto = db.prepare('SELECT * FROM productos WHERE id = ?').get(id);
        if (!producto) {
            return res.status(404).json({ error: 'Product not found' });
        }
        
        // Validation
        if (!nombre || !precio_venta) {
            return res.status(400).json({ error: 'Name and sale price are required' });
        }
        
        if (precio_venta <= 0) {
            return res.status(400).json({ error: 'Sale price must be greater than 0' });
        }
        
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
        `).run(
            nombre, descripcion || null, categoria || null,
            precio_venta, precio_costo || null,
            stock_actual !== undefined ? stock_actual : producto.stock_actual,
            stock_minimo !== undefined ? stock_minimo : producto.stock_minimo,
            fecha_vencimiento || null, imagen || null, proveedor || null,
            activo !== undefined ? activo : producto.activo, id
        );
        
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
        
        const producto = db.prepare('SELECT id FROM productos WHERE id = ?').get(id);
        if (!producto) {
            return res.status(404).json({ error: 'Product not found' });
        }
        
        // Soft delete
        db.prepare('UPDATE productos SET activo = 0 WHERE id = ?').run(id);
        
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
        const productos = db.prepare(`
            SELECT * FROM productos
            WHERE activo = 1 AND stock_actual <= stock_minimo
            ORDER BY stock_actual ASC
        `).all();
        
        res.json(productos);
    } catch (error) {
        console.error('Get low stock error:', error);
        res.status(500).json({ error: 'Error getting low stock products' });
    }
};

/**
 * Get product categories
 */
const getCategories = (req, res) => {
    try {
        const categorias = db.prepare(`
            SELECT DISTINCT categoria, COUNT(*) as total
            FROM productos
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
    getByCode,
    create,
    update,
    remove,
    updateStock,
    getLowStock,
    getCategories
};
