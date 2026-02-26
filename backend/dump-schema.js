const db = require('better-sqlite3')('database/gym.db');
const tables = db.prepare("SELECT name, sql FROM sqlite_master WHERE type='table'").all();
const fs = require('fs');
fs.writeFileSync('schema.sql', tables.map(t => `-- Table: ${t.name}\n${t.sql}`).join('\n\n'));
console.log('Schema dumped to schema.sql');
