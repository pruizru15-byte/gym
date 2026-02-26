const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.resolve(__dirname, 'database', 'gym.db');
const db = new Database(dbPath, { verbose: console.log });

console.log('Running migration: create `cuotas` table...');

try {
    // Create table
    db.prepare(`
    CREATE TABLE IF NOT EXISTS cuotas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      asignacion_id INTEGER NOT NULL,
      numero_cuota INTEGER NOT NULL,
      monto DECIMAL(10,2) NOT NULL,
      fecha_vencimiento DATE NOT NULL,
      estado VARCHAR(20) DEFAULT 'pendiente', -- 'pendiente', 'pagado'
      fecha_pago DATETIME,
      pago_id INTEGER,
      FOREIGN KEY (asignacion_id) REFERENCES clientes_membresias(id),
      FOREIGN KEY (pago_id) REFERENCES pagos(id)
    )
  `).run();

    // Create indexes
    db.prepare('CREATE INDEX IF NOT EXISTS idx_cuotas_asignacion ON cuotas(asignacion_id)').run();
    db.prepare('CREATE INDEX IF NOT EXISTS idx_cuotas_estado ON cuotas(estado)').run();

    console.log('Migration successful!');
} catch (error) {
    console.error('Migration failed:', error);
} finally {
    db.close();
}
