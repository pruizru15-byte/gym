const db = require('better-sqlite3')('database/gym.db');

try {
    const inactivosQuery = `
    SELECT 
        c.id as cliente_id,
        c.nombre as cliente_nombre,
        c.apellido as cliente_apellido,
        c.codigo as cliente_codigo,
        c.telefono,
        c.email,
        MAX(cm.fecha_vencimiento) as ultimo_vencimiento,
        m.nombre as ultimo_plan
    FROM clientes c
    LEFT JOIN clientes_membresias cm ON c.id = cm.cliente_id
    LEFT JOIN membresias m ON cm.membresia_id = m.id
    WHERE c.id NOT IN (
        SELECT cliente_id 
        FROM clientes_membresias 
        WHERE activo = 1 AND fecha_vencimiento >= date('now')
    )
    GROUP BY c.id
    ORDER BY ultimo_vencimiento DESC NULLS LAST
  `;
    const inactivos = db.prepare(inactivosQuery).all();
    console.log('inactivos OK', inactivos.length);
} catch (e) {
    console.error('INACTIVOS ERROR:', e);
}

try {
    const pendientesQuery = `
    SELECT 
        cm.id as asignacion_id,
        cm.fecha_inicio,
        cm.fecha_vencimiento,
        cm.precio_pagado as abonado,
        m.precio as total,
        (m.precio - cm.precio_pagado) as deuda,
        m.nombre as plan_nombre,
        c.id as cliente_id,
        c.nombre as cliente_nombre,
        c.apellido as cliente_apellido,
        c.codigo as cliente_codigo,
        c.telefono,
        c.email
    FROM clientes_membresias cm
    JOIN membresias m ON cm.membresia_id = m.id
    JOIN clientes c ON cm.cliente_id = c.id
    WHERE cm.activo = 1 
      AND cm.precio_pagado < m.precio
    ORDER BY deuda DESC
  `;
    const pendientes = db.prepare(pendientesQuery).all();
    console.log('pendientes OK', pendientes.length);
} catch (e) {
    console.error('PENDIENTES ERROR:', e);
}
