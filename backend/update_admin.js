
const db = require('./src/config/database');

try {
    const stmt = db.prepare('UPDATE usuarios SET email = ? WHERE username = ?');
    const info = stmt.run('admin@gym.com', 'admin');
    console.log(`Updated admin email: ${info.changes} changes`);
} catch (err) {
    console.error('Error updating admin email:', err);
}
