const axios = require('axios');

async function createClient() {
    try {
        const response = await axios.post('http://localhost:5000/api/clientes', {
            codigo: 'CLI001',
            nombre: 'Juan',
            apellido: 'Perez',
            email: 'juan@example.com',
            telefono: '555-1234',
            fecha_nacimiento: '1990-01-01',
            direccion: 'Calle Falsa 123',
            activo: 1
        }, {
            headers: {
                // We need to login first or use a known token, but let's try to bypass or use a hardcoded token if we had one.
                // Actually, let's just insert directly into DB to avoid auth issues for this test.
            }
        });
        console.log('Client created:', response.data);
    } catch (error) {
        console.error('Error creating client:', error.response ? error.response.data : error.message);
    }
}

// Better to insert directly into DB since we might not have a valid token handy without logging in
const db = require('./src/config/database');
try {
    const stmt = db.prepare(`
        INSERT INTO clientes (codigo, nombre, apellido, email, telefono, fecha_nacimiento, direccion, activo, fecha_registro)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `);
    const info = stmt.run('CLI001', 'Juan', 'Perez', 'juan@example.com', '555-1234', '1990-01-01', 'Calle Falsa 123', 1);
    console.log('Client inserted with ID:', info.lastInsertRowid);
} catch (err) {
    console.error('Error inserting client:', err);
}
