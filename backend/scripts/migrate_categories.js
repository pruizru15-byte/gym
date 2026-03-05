const db = require('../src/config/database');

console.log('Iniciando migración de Categorías...');

try {
    // 1. Create table
    db.prepare(`
        CREATE TABLE IF NOT EXISTS tienda_categorias (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre VARCHAR(100) UNIQUE NOT NULL,
            descripcion TEXT,
            activa BOOLEAN DEFAULT 1,
            fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `).run();
    console.log('Tabla tienda_categorias creada (o ya existente).');

    // 2. Migrate existing categories from productos table
    const existingProductsCategories = db.prepare(`
        SELECT DISTINCT categoria 
        FROM productos 
        WHERE categoria IS NOT NULL AND categoria != ''
    `).all();

    console.log(`Encontradas ${existingProductsCategories.length} categorías en productos.`);

    const insertCategoria = db.prepare(`
        INSERT OR IGNORE INTO tienda_categorias (nombre, descripcion)
        VALUES (?, ?)
    `);

    // Insert default categories if not exist
    const defaultCategories = ['Suplementos', 'Bebidas', 'Snacks', 'Accesorios', 'Ropa', 'Otro'];
    defaultCategories.forEach(cat => {
        insertCategoria.run(cat, 'Categoría ' + cat);
    });

    // Insert categories being used by products
    existingProductsCategories.forEach(row => {
        insertCategoria.run(row.categoria, 'Categoría ' + row.categoria);
    });

    console.log('Migración de categorías completada con éxito.');
} catch (error) {
    console.error('Error durante la migración de categorías:', error);
}
