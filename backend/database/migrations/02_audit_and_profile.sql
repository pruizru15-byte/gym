-- Add foto column to usuarios if it doesn't exist
-- SQLite doesn't support IF NOT EXISTS for ADD COLUMN, so we catch the error in the script if it exists
ALTER TABLE usuarios
ADD COLUMN foto TEXT;
-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER,
    accion VARCHAR(50) NOT NULL,
    -- 'CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT'
    entidad_tipo VARCHAR(50) NOT NULL,
    -- 'USUARIO', 'CLIENTE', 'MEMBRESIA', 'MAQUINA', 'PRODUCTO', 'VENTA'
    entidad_id INTEGER,
    detalle TEXT,
    -- JSON string with details of the change (e.g., fields changed)
    fecha_hora DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);
-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_audit_usuario ON audit_logs(usuario_id);
CREATE INDEX IF NOT EXISTS idx_audit_fecha ON audit_logs(fecha_hora);
CREATE INDEX IF NOT EXISTS idx_audit_accion ON audit_logs(accion);
CREATE INDEX IF NOT EXISTS idx_audit_entidad ON audit_logs(entidad_tipo, entidad_id);