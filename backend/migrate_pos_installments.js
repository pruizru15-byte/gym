const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.resolve(__dirname, 'database', 'gym.db');
const db = new Database(dbPath, { verbose: console.log });

console.log('Running migration: add columns to `ventas` and modify `cuotas` table...');

try {
    // 1. Modificar tabla ventas (monto_pagado, estado_pago)
    // Usar try-catch interno por si las columnas ya existen
    try {
        db.prepare('ALTER TABLE ventas ADD COLUMN monto_pagado DECIMAL(10,2) DEFAULT 0').run();
        console.log('✓ Added monto_pagado to ventas');
    } catch (e) {
        if (e.message.includes('duplicate column name')) {
            console.log('- Column monto_pagado already exists in ventas');
        } else {
            throw e;
        }
    }

    try {
        db.prepare("ALTER TABLE ventas ADD COLUMN estado_pago VARCHAR(20) DEFAULT 'pagado'").run();
        console.log('✓ Added estado_pago to ventas');
    } catch (e) {
        if (e.message.includes('duplicate column name')) {
            console.log('- Column estado_pago already exists in ventas');
        } else {
            throw e;
        }
    }

    // Actualizar ventas existentes asumiendo que ya fueron pagadas
    db.prepare("UPDATE ventas SET monto_pagado = total, estado_pago = 'pagado' WHERE monto_pagado = 0 OR monto_pagado IS NULL").run();


    // 2. Modificar tabla cuotas (añadir venta_id)
    try {
        db.prepare('ALTER TABLE cuotas ADD COLUMN venta_id INTEGER REFERENCES ventas(id)').run();
        console.log('✓ Added venta_id to cuotas');
    } catch (e) {
        if (e.message.includes('duplicate column name')) {
            console.log('- Column venta_id already exists in cuotas');
        } else {
            throw e;
        }
    }

    // Note: SQLite's ALTER TABLE ADD COLUMN cannot add a NOT NULL column without a default value
    // However, cuotas.asignacion_id is currently NOT NULL. We strictly cannot drop NOT NULL constraint
    // in SQLite using ALTER TABLE. But thankfully, SQLite won't complain on insertion if we just pass NULL
    // to a NOT NULL constraint column IF we are inserting using INSERT statements that omit it, but that's risky.
    // Instead of completely dropping and rebuilding the `cuotas` table which might have active data,
    // we will create a script that safely handles this if needed or we test it.
    // Wait, better-sqlite3 throws Constraint Error on NOT NULL. 
    // We must rebuild the cuotas table to remove the NOT NULL constraint from asignacion_id.

    // Let's check the schema first for cuotas before rebuilding
    const cuotasSchema = db.prepare("SELECT sql FROM sqlite_schema WHERE type='table' AND name='cuotas'").get().sql;
    if (cuotasSchema.includes('asignacion_id INTEGER NOT NULL')) {
        console.log('-> Rebuilding cuotas table to make asignacion_id nullable...');

        db.transaction(() => {
            // Create a temporary table with the desired schema
            db.prepare(`
                CREATE TABLE cuotas_new (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                asignacion_id INTEGER,
                venta_id INTEGER,
                numero_cuota INTEGER NOT NULL,
                monto DECIMAL(10,2) NOT NULL,
                fecha_vencimiento DATE NOT NULL,
                estado VARCHAR(20) DEFAULT 'pendiente',
                fecha_pago DATETIME,
                pago_id INTEGER,
                FOREIGN KEY (asignacion_id) REFERENCES clientes_membresias(id),
                FOREIGN KEY (venta_id) REFERENCES ventas(id),
                FOREIGN KEY (pago_id) REFERENCES pagos(id)
                )
            `).run();

            // Copy data over
            db.prepare(`
                INSERT INTO cuotas_new (id, asignacion_id, venta_id, numero_cuota, monto, fecha_vencimiento, estado, fecha_pago, pago_id)
                SELECT id, asignacion_id, venta_id, numero_cuota, monto, fecha_vencimiento, estado, fecha_pago, pago_id
                FROM cuotas
            `).run();

            // Drop old table
            db.prepare('DROP TABLE cuotas').run();

            // Rename new table to original name
            db.prepare('ALTER TABLE cuotas_new RENAME TO cuotas').run();

            // Re-create indexes
            db.prepare('CREATE INDEX idx_cuotas_asignacion ON cuotas(asignacion_id)').run();
            db.prepare('CREATE INDEX idx_cuotas_venta ON cuotas(venta_id)').run();
            db.prepare('CREATE INDEX idx_cuotas_estado ON cuotas(estado)').run();

            console.log('✓ Successfully rebuilt cuotas table.');
        })();
    } else {
        console.log('- cuotas.asignacion_id is already nullable or schema varied.');
    }

    console.log('Migration completed successfully!');

} catch (error) {
    console.error('Migration failed:', error);
} finally {
    db.close();
}
