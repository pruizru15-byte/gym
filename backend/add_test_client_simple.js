const db = require('./src/config/database');

try {
    const existing = db.prepare('SELECT * FROM clientes WHERE codigo = ?').get('CLI001');
    if (existing) {
        console.log('Test client already exists:', existing);
    } else {
        const stmt = db.prepare(`
            INSERT INTO clientes (codigo, nombre, apellido, email, telefono, fecha_nacimiento, direccion, activo, fecha_registro)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
        `);
        const info = stmt.run('CLI001', 'Test', 'Client', 'test@example.com', '555-1234', '1990-01-01', 'Calle Falsa 123', 1);
        console.log('Test client inserted with ID:', info.lastInsertRowid);
    }
} catch (err) {
    console.error('Error inserting client:', err);
}
