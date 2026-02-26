const db = require('./src/config/database');

try {
    // Add columns to clientes_membresias if they don't exist
    const columns = db.prepare('PRAGMA table_info(clientes_membresias)').all();
    const hasEsCuotas = columns.some(c => c.name === 'es_cuotas');
    const hasNumCuotas = columns.some(c => c.name === 'num_cuotas');

    if (!hasEsCuotas) {
        db.prepare('ALTER TABLE clientes_membresias ADD COLUMN es_cuotas BOOLEAN DEFAULT 0').run();
        console.log('Added es_cuotas column to clientes_membresias');
    }
    if (!hasNumCuotas) {
        db.prepare('ALTER TABLE clientes_membresias ADD COLUMN num_cuotas INTEGER DEFAULT 1').run();
        console.log('Added num_cuotas column to clientes_membresias');
    }

    // Create cuotas table
    db.prepare(`
        CREATE TABLE IF NOT EXISTS cuotas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            asignacion_id INTEGER NOT NULL,
            numero_cuota INTEGER NOT NULL,
            monto DECIMAL(10,2) NOT NULL,
            fecha_vencimiento DATE NOT NULL,
            estado VARCHAR(50) DEFAULT 'pendiente', -- 'pendiente', 'pagado', 'vencido'
            fecha_pago DATE,
            pago_id INTEGER,
            FOREIGN KEY (asignacion_id) REFERENCES clientes_membresias(id),
            FOREIGN KEY (pago_id) REFERENCES pagos(id)
        )
    `).run();
    console.log('Created cuotas table successfully');

    // Add missing email_sent_date or similar if needed for winback. Wait, in pagosController it is hardcoded to not fail if it lacks a sent_date, or maybe it doesn't need to track it at table level.

} catch (e) {
    console.error('Error migrating DB:', e);
}
