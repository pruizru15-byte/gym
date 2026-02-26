const db = require('./backend/src/config/database');
const users = db.prepare('SELECT username, rol FROM usuarios').all();
console.log('Users and roles:', users);
