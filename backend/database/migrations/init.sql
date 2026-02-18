-- Usuarios del Sistema
CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    rol VARCHAR(20) NOT NULL, -- 'admin', 'recepcion', 'cajero'
    activo BOOLEAN DEFAULT 1,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Clientes
CREATE TABLE IF NOT EXISTS clientes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    codigo VARCHAR(20) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    telefono VARCHAR(20),
    fecha_nacimiento DATE,
    direccion TEXT,
    foto TEXT,
    qr_code TEXT,
    -- Información médica
    condiciones_medicas TEXT,
    alergias TEXT,
    contacto_emergencia VARCHAR(100),
    telefono_emergencia VARCHAR(20),
    notas TEXT,
    fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
    activo BOOLEAN DEFAULT 1
);

-- Planes de Membresía
CREATE TABLE IF NOT EXISTS membresias (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre VARCHAR(50) NOT NULL,
    duracion_dias INTEGER NOT NULL,
    precio DECIMAL(10,2) NOT NULL,
    descripcion TEXT,
    activo BOOLEAN DEFAULT 1
);

-- Membresías Activas (Relación Cliente-Membresía)
CREATE TABLE IF NOT EXISTS clientes_membresias (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cliente_id INTEGER NOT NULL,
    membresia_id INTEGER NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_vencimiento DATE NOT NULL,
    precio_pagado DECIMAL(10,2) NOT NULL,
    metodo_pago VARCHAR(50),
    activo BOOLEAN DEFAULT 1,
    notas TEXT,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    usuario_registro_id INTEGER,
    FOREIGN KEY (cliente_id) REFERENCES clientes(id),
    FOREIGN KEY (membresia_id) REFERENCES membresias(id),
    FOREIGN KEY (usuario_registro_id) REFERENCES usuarios(id)
);

-- Asistencias (Check-in)
CREATE TABLE IF NOT EXISTS asistencias (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cliente_id INTEGER NOT NULL,
    fecha_hora DATETIME DEFAULT CURRENT_TIMESTAMP,
    usuario_registro_id INTEGER,
    FOREIGN KEY (cliente_id) REFERENCES clientes(id),
    FOREIGN KEY (usuario_registro_id) REFERENCES usuarios(id)
);

-- Productos (Tienda)
CREATE TABLE IF NOT EXISTS productos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    codigo VARCHAR(50) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    categoria VARCHAR(50),
    precio_venta DECIMAL(10,2) NOT NULL,
    precio_costo DECIMAL(10,2),
    stock_actual INTEGER DEFAULT 0,
    stock_minimo INTEGER DEFAULT 5,
    fecha_vencimiento DATE,
    imagen TEXT,
    proveedor VARCHAR(100),
    activo BOOLEAN DEFAULT 1,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Ventas
CREATE TABLE IF NOT EXISTS ventas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cliente_id INTEGER,
    total DECIMAL(10,2) NOT NULL,
    metodo_pago VARCHAR(50),
    monto_recibido DECIMAL(10,2),
    cambio DECIMAL(10,2),
    fecha_hora DATETIME DEFAULT CURRENT_TIMESTAMP,
    usuario_id INTEGER,
    notas TEXT,
    FOREIGN KEY (cliente_id) REFERENCES clientes(id),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- Detalle de Ventas
CREATE TABLE IF NOT EXISTS ventas_detalle (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    venta_id INTEGER NOT NULL,
    producto_id INTEGER NOT NULL,
    cantidad INTEGER NOT NULL,
    precio_unitario DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (venta_id) REFERENCES ventas(id),
    FOREIGN KEY (producto_id) REFERENCES productos(id)
);

-- Máquinas del Gimnasio
CREATE TABLE IF NOT EXISTS maquinas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    codigo VARCHAR(50) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    categoria VARCHAR(50),
    marca VARCHAR(100),
    modelo VARCHAR(100),
    numero_serie VARCHAR(100),
    fecha_compra DATE,
    costo DECIMAL(10,2),
    estado VARCHAR(50) DEFAULT 'bueno', -- 'bueno', 'mantenimiento', 'reparacion', 'fuera_servicio'
    foto TEXT,
    frecuencia_mantenimiento_dias INTEGER DEFAULT 90,
    ultimo_mantenimiento DATE,
    proximo_mantenimiento DATE,
    notas TEXT,
    activo BOOLEAN DEFAULT 1,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Historial de Mantenimiento de Máquinas
CREATE TABLE IF NOT EXISTS mantenimientos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    maquina_id INTEGER NOT NULL,
    fecha DATE NOT NULL,
    tipo VARCHAR(50), -- 'preventivo', 'correctivo', 'reparacion'
    descripcion TEXT,
    costo DECIMAL(10,2),
    realizado_por VARCHAR(100),
    usuario_registro_id INTEGER,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (maquina_id) REFERENCES maquinas(id),
    FOREIGN KEY (usuario_registro_id) REFERENCES usuarios(id)
);

-- Notificaciones
CREATE TABLE IF NOT EXISTS notificaciones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tipo VARCHAR(50) NOT NULL, -- 'membresia_vence', 'producto_vence', 'stock_bajo', 'mantenimiento_maquina', 'cliente_inactivo'
    prioridad VARCHAR(20) DEFAULT 'media', -- 'baja', 'media', 'alta', 'critica'
    titulo VARCHAR(200) NOT NULL,
    mensaje TEXT NOT NULL,
    referencia_id INTEGER,
    referencia_tipo VARCHAR(50), -- 'cliente', 'producto', 'maquina', etc.
    leida BOOLEAN DEFAULT 0,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Configuración
CREATE TABLE IF NOT EXISTS configuracion (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    clave VARCHAR(50) UNIQUE NOT NULL,
    valor TEXT,
    descripcion TEXT,
    fecha_modificacion DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Pagos (historial unificado)
CREATE TABLE IF NOT EXISTS pagos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cliente_id INTEGER,
    tipo VARCHAR(50) NOT NULL, -- 'membresia', 'venta'
    referencia_id INTEGER, -- ID de clientes_membresias o ventas
    concepto TEXT NOT NULL,
    monto DECIMAL(10,2) NOT NULL,
    metodo_pago VARCHAR(50),
    fecha_hora DATETIME DEFAULT CURRENT_TIMESTAMP,
    usuario_id INTEGER,
    FOREIGN KEY (cliente_id) REFERENCES clientes(id),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- Egresos/Gastos
CREATE TABLE IF NOT EXISTS egresos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    concepto VARCHAR(200) NOT NULL,
    descripcion TEXT,
    monto DECIMAL(10,2) NOT NULL,
    categoria VARCHAR(50),
    fecha DATE NOT NULL,
    fecha_hora DATETIME DEFAULT CURRENT_TIMESTAMP,
    usuario_id INTEGER,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- Caja (Cortes de Caja)
CREATE TABLE IF NOT EXISTS caja (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fecha DATE NOT NULL,
    tipo VARCHAR(20) NOT NULL, -- 'apertura', 'cierre'
    monto_inicial DECIMAL(10,2),
    ingresos_efectivo DECIMAL(10,2),
    ingresos_tarjeta DECIMAL(10,2),
    ingresos_transferencia DECIMAL(10,2),
    egresos DECIMAL(10,2),
    monto_final DECIMAL(10,2),
    diferencia DECIMAL(10,2),
    notas TEXT,
    fecha_hora DATETIME DEFAULT CURRENT_TIMESTAMP,
    usuario_id INTEGER,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- Índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_clientes_codigo ON clientes(codigo);
CREATE INDEX IF NOT EXISTS idx_clientes_activo ON clientes(activo);
CREATE INDEX IF NOT EXISTS idx_membresias_activas ON clientes_membresias(activo, fecha_vencimiento);
CREATE INDEX IF NOT EXISTS idx_asistencias_cliente ON asistencias(cliente_id);
CREATE INDEX IF NOT EXISTS idx_asistencias_fecha ON asistencias(fecha_hora);
CREATE INDEX IF NOT EXISTS idx_productos_codigo ON productos(codigo);
CREATE INDEX IF NOT EXISTS idx_productos_categoria ON productos(categoria);
CREATE INDEX IF NOT EXISTS idx_ventas_fecha ON ventas(fecha_hora);
CREATE INDEX IF NOT EXISTS idx_notificaciones_leida ON notificaciones(leida);
CREATE INDEX IF NOT EXISTS idx_maquinas_codigo ON maquinas(codigo);
CREATE INDEX IF NOT EXISTS idx_pagos_fecha ON pagos(fecha_hora);
