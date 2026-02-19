
const db = require('./src/config/database');
const bcrypt = require('bcryptjs');

try {
    const username = 'piero';
    const email = 'rpieroalexandro@gmail.com';
    const password = 'piero123';
    const nombre = 'Piero Alexandro';
    const rol = 'admin';

    // Hash password
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);

    // Check if user exists
    const existingUser = db.prepare('SELECT * FROM usuarios WHERE email = ? OR username = ?').get(email, username);

    if (existingUser) {
        console.log(`User already exists (ID: ${existingUser.id}). Updating password and details...`);
        const updateStmt = db.prepare(`
            UPDATE usuarios 
            SET password_hash = ?, nombre = ?, email = ?, rol = ?
            WHERE id = ?
        `);
        updateStmt.run(passwordHash, nombre, email, rol, existingUser.id);
        console.log('User updated successfully.');
    } else {
        console.log('Creating new user...');
        const insertStmt = db.prepare(`
            INSERT INTO usuarios (username, password_hash, nombre, email, rol, activo)
            VALUES (?, ?, ?, ?, ?, 1)
        `);
        insertStmt.run(username, passwordHash, nombre, email, rol);
        console.log('User created successfully.');
    }

} catch (err) {
    console.error('Error creating/updating user:', err);
}
