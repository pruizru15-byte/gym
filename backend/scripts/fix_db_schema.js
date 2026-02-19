require('dotenv').config();
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = process.env.DB_PATH || './database/gym.db';
const resolvedPath = path.resolve(dbPath);

console.log('--- Database Schema Fix ---');
console.log('Configured DB Path:', dbPath);
console.log('Resolved DB Path:', resolvedPath);

if (!fs.existsSync(resolvedPath)) {
    console.error('ERROR: Database file does not exist at resolved path!');
    process.exit(1);
}

const db = new Database(resolvedPath);
db.pragma('journal_mode = WAL');

try {
    // 1. Check/Add "foto" column to "usuarios"
    const usuariosColumns = db.prepare('PRAGMA table_info(usuarios)').all();
    const hasFoto = usuariosColumns.some(col => col.name === 'foto');

    console.log('Users table columns:', usuariosColumns.map(c => c.name).join(', '));
    console.log('Has "foto" column?', hasFoto);

    if (!hasFoto) {
        console.log('Adding "foto" column...');
        db.prepare('ALTER TABLE usuarios ADD COLUMN foto TEXT').run();
        console.log('✅ "foto" column added.');
    } else {
        console.log('✓ "foto" column already exists.');
    }

    // 2. Check/Create "audit_logs" table
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='audit_logs'").get();

    if (!tables) {
        console.log('Creating "audit_logs" table...');
        db.prepare(`
            CREATE TABLE IF NOT EXISTS audit_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                usuario_id INTEGER,
                accion VARCHAR(50) NOT NULL,
                entidad_tipo VARCHAR(50) NOT NULL,
                entidad_id INTEGER,
                detalle TEXT,
                fecha_hora DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `).run();

        db.prepare('CREATE INDEX IF NOT EXISTS idx_audit_usuario ON audit_logs(usuario_id)').run();
        db.prepare('CREATE INDEX IF NOT EXISTS idx_audit_accion ON audit_logs(accion)').run();
        db.prepare('CREATE INDEX IF NOT EXISTS idx_audit_entidad ON audit_logs(entidad_tipo, entidad_id)').run();
        db.prepare('CREATE INDEX IF NOT EXISTS idx_audit_fecha ON audit_logs(fecha_hora)').run();

        console.log('✅ "audit_logs" table created.');
    } else {
        console.log('✓ "audit_logs" table already exists.');
    }

} catch (error) {
    console.error('Database error:', error);
} finally {
    db.close();
    console.log('--- Done ---');
}
