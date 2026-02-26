const db = require('./src/config/database');

const clientId = 22; // From screenshot

console.log('--- Client Info ---');
const client = db.prepare('SELECT * FROM clientes WHERE id = ?').get(clientId);
console.log(client);

console.log('\n--- Memberships for Client ---');
const memberships = db.prepare('SELECT * FROM clientes_membresias WHERE cliente_id = ?').all(clientId);
console.log(memberships);

console.log('\n--- Test Query from Controller ---');
const query = `
    SELECT c.id, c.nombre, 
           m.nombre as planNombre, 
           cm.fecha_vencimiento as fechaVencimiento,
           cm.activo as cm_activo,
           cm.id as cm_id,
           date('now') as db_now,
           (CASE WHEN cm.id IS NOT NULL THEN 1 ELSE 0 END) as membresiaActiva
    FROM clientes c
    LEFT JOIN clientes_membresias cm ON c.id = cm.cliente_id AND cm.activo = 1 AND cm.fecha_vencimiento >= date('now')
    LEFT JOIN membresias m ON cm.membresia_id = m.id
    WHERE c.id = ?
`;
const result = db.prepare(query).get(clientId);
console.log(result);
