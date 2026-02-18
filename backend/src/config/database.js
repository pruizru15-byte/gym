const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = process.env.DB_PATH || './database/gym.db';
const dbDir = path.dirname(dbPath);

// Ensure database directory exists
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

// Initialize database connection
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

// Function to run migrations
function runMigrations() {
    console.log('Running migrations...');
    const migrationFile = path.join(__dirname, '../database/migrations/init.sql');
    const sql = fs.readFileSync(migrationFile, 'utf8');
    
    // Split by semicolon and execute each statement
    const statements = sql.split(';').filter(stmt => stmt.trim());
    statements.forEach(stmt => {
        if (stmt.trim()) {
            db.exec(stmt);
        }
    });
    
    console.log('Migrations completed successfully!');
}

// Function to seed initial data
function seedData() {
    console.log('Seeding initial data...');
    
    try {
        // Check if admin user already exists
        const existingAdmin = db.prepare('SELECT * FROM usuarios WHERE username = ?').get('admin');
        
        if (!existingAdmin) {
            // Create admin user
            const hashedPassword = bcrypt.hashSync('admin123', 10);
            db.prepare(`
                INSERT INTO usuarios (username, password_hash, nombre, email, rol, activo)
                VALUES (?, ?, ?, ?, ?, ?)
            `).run('admin', hashedPassword, 'Administrador', 'admin@gimnasio.com', 'admin', 1);
            console.log('Admin user created: username=admin, password=admin123');
        }
        
        // Check if memberships already exist
        const existingMembership = db.prepare('SELECT * FROM membresias LIMIT 1').get();
        
        if (!existingMembership) {
            // Create default memberships
            const memberships = [
                { nombre: 'Diario', duracion_dias: 1, precio: 5.00, descripcion: 'Acceso por 1 día' },
                { nombre: 'Semanal', duracion_dias: 7, precio: 25.00, descripcion: 'Acceso por 1 semana' },
                { nombre: 'Mensual', duracion_dias: 30, precio: 80.00, descripcion: 'Acceso por 1 mes' },
                { nombre: 'Trimestral', duracion_dias: 90, precio: 200.00, descripcion: 'Acceso por 3 meses' },
                { nombre: 'Semestral', duracion_dias: 180, precio: 350.00, descripcion: 'Acceso por 6 meses' },
                { nombre: 'Anual', duracion_dias: 365, precio: 600.00, descripcion: 'Acceso por 1 año' }
            ];
            
            const insertMembresia = db.prepare(`
                INSERT INTO membresias (nombre, duracion_dias, precio, descripcion, activo)
                VALUES (?, ?, ?, ?, ?)
            `);
            
            memberships.forEach(m => {
                insertMembresia.run(m.nombre, m.duracion_dias, m.precio, m.descripcion, 1);
            });
            console.log('Default memberships created');
        }
        
        // Check if config already exists
        const existingConfig = db.prepare('SELECT * FROM configuracion LIMIT 1').get();
        
        if (!existingConfig) {
            // Create initial configuration
            const configs = [
                { clave: 'gym_nombre', valor: 'Mi Gimnasio', descripcion: 'Nombre del gimnasio' },
                { clave: 'gym_direccion', valor: '', descripcion: 'Dirección del gimnasio' },
                { clave: 'gym_telefono', valor: '', descripcion: 'Teléfono del gimnasio' },
                { clave: 'gym_email', valor: '', descripcion: 'Email del gimnasio' },
                { clave: 'dias_alerta_membresia', valor: '7', descripcion: 'Días antes de vencimiento para alertar' },
                { clave: 'dias_alerta_producto', valor: '15', descripcion: 'Días antes de vencimiento de productos para alertar' },
                { clave: 'backup_enabled', valor: 'true', descripcion: 'Backups automáticos habilitados' },
                { clave: 'backup_schedule', valor: '0 2 * * *', descripcion: 'Horario de backup (cron)' },
                { clave: 'backup_retention_days', valor: '30', descripcion: 'Días de retención de backups' },
                { clave: 'moneda', valor: '$', descripcion: 'Símbolo de moneda' }
            ];
            
            const insertConfig = db.prepare(`
                INSERT INTO configuracion (clave, valor, descripcion)
                VALUES (?, ?, ?)
            `);
            
            configs.forEach(c => {
                insertConfig.run(c.clave, c.valor, c.descripcion);
            });
            console.log('Initial configuration created');
        }
        
        console.log('Seeding completed successfully!');
    } catch (error) {
        console.error('Error seeding data:', error);
        throw error;
    }
}

// Command line interface
if (require.main === module) {
    const command = process.argv[2];
    
    if (command === 'migrate') {
        runMigrations();
    } else if (command === 'seed') {
        runMigrations();
        seedData();
    } else {
        console.log('Usage: node database.js [migrate|seed]');
    }
} else {
    // If imported as module, run migrations and seed if database is new
    const tableExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='usuarios'").get();
    if (!tableExists) {
        runMigrations();
        seedData();
    }
}

module.exports = db;
