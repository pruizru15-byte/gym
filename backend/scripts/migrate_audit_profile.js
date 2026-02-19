const db = require('../src/config/database');
const fs = require('fs');
const path = require('path');

const migrate = () => {
    console.log('Applying Audit and Profile Migration...');

    const migrationFile = path.join(__dirname, '../database/migrations/02_audit_and_profile.sql');
    const sql = fs.readFileSync(migrationFile, 'utf8');

    // Split statements (simple split by semicolon)
    const statements = sql.split(';').filter(stmt => stmt.trim());

    // Run each statement
    statements.forEach(stmt => {
        if (stmt.trim()) {
            try {
                db.exec(stmt);
                console.log('Executed:', stmt.substring(0, 50) + '...');
            } catch (error) {
                // Ignore "duplicate column name" error for idempotent ADD COLUMN
                if (error.message.includes('duplicate column name')) {
                    console.log('Column already exists, skipping:', stmt.substring(0, 50) + '...');
                } else {
                    console.error('Error executing statement:', stmt);
                    console.error(error);
                }
            }
        }
    });

    console.log('Migration completed.');
};

migrate();
