const db = require('../src/config/database');
const fs = require('fs');

try {
    const usuariosInfo = db.prepare('PRAGMA table_info(usuarios)').all();
    const auditLogsInfo = db.prepare('PRAGMA table_info(audit_logs)').all();

    const output = {
        usuarios: usuariosInfo,
        audit_logs: auditLogsInfo
    };

    fs.writeFileSync('schema_check.json', JSON.stringify(output, null, 2));
    console.log('Schema check complete. Wrote to schema_check.json');
} catch (error) {
    console.error('Error checking schema:', error);
}
