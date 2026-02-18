const db = require('../config/database');

/**
 * Get all configuration settings
 */
const getAll = (req, res) => {
    try {
        const configuracion = db.prepare('SELECT * FROM configuracion ORDER BY clave ASC').all();
        
        // Convert to key-value object
        const config = {};
        configuracion.forEach(item => {
            config[item.clave] = {
                valor: item.valor,
                descripcion: item.descripcion,
                fecha_modificacion: item.fecha_modificacion
            };
        });
        
        res.json(config);
    } catch (error) {
        console.error('Get configuration error:', error);
        res.status(500).json({ error: 'Error getting configuration' });
    }
};

/**
 * Get configuration by key
 */
const getByKey = (req, res) => {
    try {
        const { clave } = req.params;
        
        const config = db.prepare('SELECT * FROM configuracion WHERE clave = ?').get(clave);
        
        if (!config) {
            return res.status(404).json({ error: 'Configuration not found' });
        }
        
        res.json(config);
    } catch (error) {
        console.error('Get configuration by key error:', error);
        res.status(500).json({ error: 'Error getting configuration' });
    }
};

/**
 * Set or update configuration
 */
const set = (req, res) => {
    try {
        const { clave, valor, descripcion } = req.body;
        
        if (!clave) {
            return res.status(400).json({ error: 'Key is required' });
        }
        
        // Check if exists
        const existing = db.prepare('SELECT id FROM configuracion WHERE clave = ?').get(clave);
        
        if (existing) {
            // Update
            db.prepare(`
                UPDATE configuracion SET
                    valor = ?,
                    descripcion = ?,
                    fecha_modificacion = CURRENT_TIMESTAMP
                WHERE clave = ?
            `).run(valor, descripcion || null, clave);
        } else {
            // Insert
            db.prepare(`
                INSERT INTO configuracion (clave, valor, descripcion)
                VALUES (?, ?, ?)
            `).run(clave, valor, descripcion || null);
        }
        
        const config = db.prepare('SELECT * FROM configuracion WHERE clave = ?').get(clave);
        res.json(config);
    } catch (error) {
        console.error('Set configuration error:', error);
        res.status(500).json({ error: 'Error setting configuration' });
    }
};

/**
 * Update multiple configuration settings
 */
const updateMultiple = (req, res) => {
    try {
        const { configuraciones } = req.body; // Array of { clave, valor, descripcion }
        
        if (!Array.isArray(configuraciones) || configuraciones.length === 0) {
            return res.status(400).json({ error: 'Configurations array is required' });
        }
        
        const updateStmt = db.prepare(`
            UPDATE configuracion SET
                valor = ?,
                descripcion = ?,
                fecha_modificacion = CURRENT_TIMESTAMP
            WHERE clave = ?
        `);
        
        const insertStmt = db.prepare(`
            INSERT INTO configuracion (clave, valor, descripcion)
            VALUES (?, ?, ?)
        `);
        
        const transaction = db.transaction(() => {
            for (const config of configuraciones) {
                if (!config.clave) continue;
                
                const existing = db.prepare('SELECT id FROM configuracion WHERE clave = ?').get(config.clave);
                
                if (existing) {
                    updateStmt.run(config.valor, config.descripcion || null, config.clave);
                } else {
                    insertStmt.run(config.clave, config.valor, config.descripcion || null);
                }
            }
        });
        
        transaction();
        
        // Get all updated configurations
        const claves = configuraciones.map(c => c.clave);
        const placeholders = claves.map(() => '?').join(',');
        const updated = db.prepare(`SELECT * FROM configuracion WHERE clave IN (${placeholders})`).all(...claves);
        
        res.json(updated);
    } catch (error) {
        console.error('Update multiple configurations error:', error);
        res.status(500).json({ error: 'Error updating configurations' });
    }
};

/**
 * Delete configuration
 */
const remove = (req, res) => {
    try {
        const { clave } = req.params;
        
        const config = db.prepare('SELECT id FROM configuracion WHERE clave = ?').get(clave);
        if (!config) {
            return res.status(404).json({ error: 'Configuration not found' });
        }
        
        db.prepare('DELETE FROM configuracion WHERE clave = ?').run(clave);
        
        res.json({ message: 'Configuration deleted successfully' });
    } catch (error) {
        console.error('Delete configuration error:', error);
        res.status(500).json({ error: 'Error deleting configuration' });
    }
};

/**
 * Initialize default configuration settings
 */
const initializeDefaults = (req, res) => {
    try {
        const defaults = [
            {
                clave: 'nombre_gimnasio',
                valor: 'Mi Gimnasio',
                descripcion: 'Nombre del gimnasio'
            },
            {
                clave: 'direccion',
                valor: '',
                descripcion: 'Dirección del gimnasio'
            },
            {
                clave: 'telefono',
                valor: '',
                descripcion: 'Teléfono de contacto'
            },
            {
                clave: 'email',
                valor: '',
                descripcion: 'Email de contacto'
            },
            {
                clave: 'moneda',
                valor: 'MXN',
                descripcion: 'Moneda utilizada (MXN, USD, etc.)'
            },
            {
                clave: 'zona_horaria',
                valor: 'America/Mexico_City',
                descripcion: 'Zona horaria'
            },
            {
                clave: 'dias_alerta_vencimiento',
                valor: '7',
                descripcion: 'Días antes de vencimiento para alertar'
            },
            {
                clave: 'horario_apertura',
                valor: '06:00',
                descripcion: 'Hora de apertura'
            },
            {
                clave: 'horario_cierre',
                valor: '22:00',
                descripcion: 'Hora de cierre'
            },
            {
                clave: 'permitir_acceso_vencido',
                valor: 'false',
                descripcion: 'Permitir acceso a clientes con membresía vencida'
            },
            {
                clave: 'logo',
                valor: '',
                descripcion: 'URL o path del logo del gimnasio'
            },
            {
                clave: 'tema_color',
                valor: '#3b82f6',
                descripcion: 'Color principal del tema'
            },
            {
                clave: 'idioma',
                valor: 'es',
                descripcion: 'Idioma del sistema (es, en)'
            },
            {
                clave: 'backup_automatico',
                valor: 'true',
                descripcion: 'Activar respaldos automáticos'
            },
            {
                clave: 'frecuencia_backup_dias',
                valor: '7',
                descripcion: 'Frecuencia de respaldos en días'
            },
            {
                clave: 'notificaciones_email',
                valor: 'false',
                descripcion: 'Enviar notificaciones por email'
            },
            {
                clave: 'notificaciones_sms',
                valor: 'false',
                descripcion: 'Enviar notificaciones por SMS'
            },
            {
                clave: 'impuesto_ventas',
                valor: '0',
                descripcion: 'Porcentaje de impuesto en ventas (IVA)'
            },
            {
                clave: 'formato_codigo_cliente',
                valor: 'CLI-{numero}',
                descripcion: 'Formato para códigos de cliente'
            },
            {
                clave: 'formato_codigo_producto',
                valor: 'PROD-{numero}',
                descripcion: 'Formato para códigos de producto'
            }
        ];
        
        const insertStmt = db.prepare(`
            INSERT OR IGNORE INTO configuracion (clave, valor, descripcion)
            VALUES (?, ?, ?)
        `);
        
        const transaction = db.transaction(() => {
            for (const config of defaults) {
                insertStmt.run(config.clave, config.valor, config.descripcion);
            }
        });
        
        transaction();
        
        const configuracion = db.prepare('SELECT * FROM configuracion ORDER BY clave ASC').all();
        
        res.json({
            message: 'Default configuration initialized',
            total: configuracion.length,
            configuracion
        });
    } catch (error) {
        console.error('Initialize defaults error:', error);
        res.status(500).json({ error: 'Error initializing default configuration' });
    }
};

/**
 * Get gym info (for display)
 */
const getGymInfo = (req, res) => {
    try {
        const info = {};
        
        const keys = [
            'nombre_gimnasio', 'direccion', 'telefono', 'email',
            'horario_apertura', 'horario_cierre', 'logo', 'tema_color'
        ];
        
        const placeholders = keys.map(() => '?').join(',');
        const configs = db.prepare(`SELECT * FROM configuracion WHERE clave IN (${placeholders})`).all(...keys);
        
        configs.forEach(config => {
            info[config.clave] = config.valor;
        });
        
        res.json(info);
    } catch (error) {
        console.error('Get gym info error:', error);
        res.status(500).json({ error: 'Error getting gym info' });
    }
};

/**
 * Update gym info
 */
const updateGymInfo = (req, res) => {
    try {
        const {
            nombre_gimnasio,
            direccion,
            telefono,
            email,
            horario_apertura,
            horario_cierre,
            logo,
            tema_color
        } = req.body;
        
        const updates = {
            nombre_gimnasio,
            direccion,
            telefono,
            email,
            horario_apertura,
            horario_cierre,
            logo,
            tema_color
        };
        
        const updateStmt = db.prepare(`
            UPDATE configuracion SET
                valor = ?,
                fecha_modificacion = CURRENT_TIMESTAMP
            WHERE clave = ?
        `);
        
        const insertStmt = db.prepare(`
            INSERT INTO configuracion (clave, valor, descripcion)
            VALUES (?, ?, ?)
        `);
        
        const transaction = db.transaction(() => {
            for (const [clave, valor] of Object.entries(updates)) {
                if (valor === undefined) continue;
                
                const existing = db.prepare('SELECT id FROM configuracion WHERE clave = ?').get(clave);
                
                if (existing) {
                    updateStmt.run(valor, clave);
                } else {
                    insertStmt.run(clave, valor, `Información del gimnasio: ${clave}`);
                }
            }
        });
        
        transaction();
        
        res.json({ message: 'Gym info updated successfully' });
    } catch (error) {
        console.error('Update gym info error:', error);
        res.status(500).json({ error: 'Error updating gym info' });
    }
};

/**
 * Get system settings
 */
const getSystemSettings = (req, res) => {
    try {
        const settings = {};
        
        const keys = [
            'moneda', 'zona_horaria', 'idioma', 'dias_alerta_vencimiento',
            'permitir_acceso_vencido', 'backup_automatico', 'frecuencia_backup_dias',
            'notificaciones_email', 'notificaciones_sms', 'impuesto_ventas',
            'formato_codigo_cliente', 'formato_codigo_producto'
        ];
        
        const placeholders = keys.map(() => '?').join(',');
        const configs = db.prepare(`SELECT * FROM configuracion WHERE clave IN (${placeholders})`).all(...keys);
        
        configs.forEach(config => {
            // Convert boolean strings
            if (config.valor === 'true' || config.valor === 'false') {
                settings[config.clave] = config.valor === 'true';
            } else {
                settings[config.clave] = config.valor;
            }
        });
        
        res.json(settings);
    } catch (error) {
        console.error('Get system settings error:', error);
        res.status(500).json({ error: 'Error getting system settings' });
    }
};

module.exports = {
    getAll,
    getByKey,
    set,
    updateMultiple,
    remove,
    initializeDefaults,
    getGymInfo,
    updateGymInfo,
    getSystemSettings
};
