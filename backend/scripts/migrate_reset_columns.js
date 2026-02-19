const db = require('../src/config/database');

console.log('Running migration: Adding reset password columns to usuarios table...');

try {
    // Check if columns already exist
    const tableInfo = db.prepare('PRAGMA table_info(usuarios)').all();
    const columns = tableInfo.map(c => c.name);

    if (!columns.includes('reset_code')) {
        db.prepare('ALTER TABLE usuarios ADD COLUMN reset_code TEXT').run();
        console.log('Added column: reset_code');
    } else {
        console.log('Column reset_code already exists.');
    }

    if (!columns.includes('reset_code_expires')) {
        db.prepare('ALTER TABLE usuarios ADD COLUMN reset_code_expires DATETIME').run();
        console.log('Added column: reset_code_expires');
    } else {
        console.log('Column reset_code_expires already exists.');
    }

    console.log('Migration completed successfully.');
} catch (error) {
    console.error('Migration failed:', error);
}
