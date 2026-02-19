const db = require('../src/config/database');

try {
    const tableInfo = db.prepare('PRAGMA table_info(usuarios)').all();
    console.log('Usuarios table schema:', tableInfo);
} catch (error) {
    console.error('Error checking schema:', error);
}
