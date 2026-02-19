
const db = require('./src/config/database');
const rows = db.prepare("PRAGMA table_info(usuarios)").all();
console.log(JSON.stringify(rows, null, 2));
