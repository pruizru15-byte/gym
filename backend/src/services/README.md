# Servicios Backend - Sistema de Gestión de Gimnasio

Este directorio contiene los servicios principales del sistema de gestión del gimnasio.

## 📋 Servicios Disponibles

### 1. **notificacionesService.js** - Servicio de Notificaciones

Genera notificaciones automáticas basadas en diferentes eventos del sistema.

#### Características:
- ✅ Membresías próximas a vencer (configurable)
- ✅ Productos próximos a vencer
- ✅ Productos con bajo stock
- ✅ Mantenimiento de máquinas pendiente
- ✅ Clientes inactivos (sin check-in en 30 días)
- ✅ Cron job diario a medianoche

#### Uso Básico:
```javascript
const notificacionesService = require('./services/notificacionesService');

// Iniciar verificaciones automáticas (diario a medianoche)
notificacionesService.iniciarCronJob();

// O con expresión cron personalizada (cada hora)
notificacionesService.iniciarCronJob('0 * * * *');

// Ejecutar verificaciones manualmente
notificacionesService.ejecutarVerificaciones();

// Verificaciones individuales
notificacionesService.verificarMembresiasProximasAVencer(7); // 7 días antes
notificacionesService.verificarProductosProximosAVencer(15); // 15 días antes
notificacionesService.verificarProductosBajoStock(5); // stock <= 5
notificacionesService.verificarMantenimientosPendientes();
notificacionesService.verificarClientesInactivos(30); // 30 días sin asistencia

// Obtener notificaciones no leídas
const noLeidas = notificacionesService.obtenerNoLeidas();

// Marcar como leída
notificacionesService.marcarComoLeida(notificacionId);

// Limpiar notificaciones antiguas (30 días)
notificacionesService.limpiarNotificacionesAntiguas(30);

// Detener cron job
notificacionesService.detenerCronJob();
```

---

### 2. **backupService.js** - Servicio de Respaldos

Gestiona respaldos automáticos y manuales de la base de datos y archivos.

#### Características:
- ✅ Backups manuales bajo demanda
- ✅ Backups automáticos programados con cron
- ✅ Respaldo de base de datos SQLite
- ✅ Respaldo de carpeta uploads
- ✅ Gestión de retención (eliminar backups antiguos)
- ✅ Listar backups disponibles
- ✅ Restaurar desde backup
- ✅ Metadatos de cada backup

#### Uso Básico:
```javascript
const backupService = require('./services/backupService');

// Crear backup manual
const resultado = await backupService.crearBackup();
if (resultado.success) {
  console.log('Backup creado:', resultado.nombre);
  console.log('Tamaño:', resultado.metadata.tamaño);
}

// Iniciar backups automáticos (diario a las 2 AM)
backupService.iniciarBackupsAutomaticos('0 2 * * *');

// Listar backups disponibles
const backups = backupService.listarBackups();

// Obtener estadísticas
const stats = backupService.obtenerEstadisticas();

// Gestionar retención (mantener últimos 10 backups o 30 días)
backupService.gestionarRetencion(30, 10);

// Eliminar un backup específico
backupService.eliminarBackup('backup_2024-01-15T10-00-00-000Z');

// Restaurar desde backup
const restauracion = await backupService.restaurarBackup('backup_2024-01-15T10-00-00-000Z');
if (restauracion.success) {
  console.log('Backup restaurado. Reinicie el servidor.');
}

// Detener backups automáticos
backupService.detenerBackupsAutomaticos();
```

#### Estructura de Backups:
```
backups/
├── backup_2024-01-15T10-00-00-000Z/
│   ├── gym.db              # Base de datos
│   ├── uploads/            # Archivos subidos
│   └── metadata.json       # Información del backup
└── backup_2024-01-16T02-00-00-000Z/
    ├── gym.db
    ├── uploads/
    └── metadata.json
```

---

### 3. **reportesService.js** - Servicio de Reportes

Genera reportes detallados del sistema con soporte para rangos de fechas.

#### Características:
- ✅ Reporte de ingresos y egresos
- ✅ Reporte de clientes (nuevos, activos, inactivos)
- ✅ Reporte de asistencia
- ✅ Reporte de ventas
- ✅ Reporte de inventario
- ✅ Reporte de membresías
- ✅ Reporte consolidado (dashboard)
- ✅ Soporte de rangos de fechas
- ✅ Exportación a JSON

#### Uso Básico:
```javascript
const reportesService = require('./services/reportesService');

// 1. Reporte de Ingresos/Egresos
const ingresos = reportesService.reporteIngresosEgresos('2024-01-01', '2024-01-31');
console.log('Total ingresos:', ingresos.resumen.totalIngresos);
console.log('Total egresos:', ingresos.resumen.totalEgresos);
console.log('Utilidad neta:', ingresos.resumen.utilidadNeta);

// 2. Reporte de Clientes
const clientes = reportesService.reporteClientes('2024-01-01', '2024-01-31');
console.log('Clientes nuevos:', clientes.resumen.nuevos);
console.log('Clientes activos:', clientes.resumen.activos);
console.log('Clientes inactivos:', clientes.resumen.inactivos);

// 3. Reporte de Asistencia
const asistencia = reportesService.reporteAsistencia('2024-01-01', '2024-01-31');
console.log('Total asistencias:', asistencia.resumen.totalAsistencias);
console.log('Promedio diario:', asistencia.resumen.promedioAsistenciasDiarias);
console.log('Hora pico:', asistencia.resumen.horaPico);

// 4. Reporte de Ventas
const ventas = reportesService.reporteVentas('2024-01-01', '2024-01-31');
console.log('Total ventas:', ventas.resumen.totalVentas);
console.log('Ticket promedio:', ventas.resumen.ticketPromedio);
console.log('Productos más vendidos:', ventas.productosMasVendidos);

// 5. Reporte de Inventario
const inventario = reportesService.reporteInventario();
console.log('Total productos:', inventario.resumen.totalProductos);
console.log('Valor inventario:', inventario.resumen.valorInventarioCosto);
console.log('Productos bajo stock:', inventario.productosBajoStock);

// 6. Reporte de Membresías
const membresias = reportesService.reporteMembresias('2024-01-01', '2024-01-31');
console.log('Total ingresos:', membresias.resumen.totalIngresos);
console.log('Membresías vendidas:', membresias.resumen.totalVendidas);

// 7. Reporte Consolidado (todos los reportes)
const consolidado = reportesService.reporteConsolidado('2024-01-01', '2024-01-31');

// 8. Exportar a JSON
const exportado = reportesService.exportarJSON(ventas, 'reporte-ventas.json');
```

#### Rangos de Fechas:
- Si no se especifican fechas, usa el mes actual (desde el día 1 hasta hoy)
- Formato de fechas: `YYYY-MM-DD`
- Ejemplos:
  ```javascript
  // Mes actual
  reportesService.reporteVentas();
  
  // Enero 2024
  reportesService.reporteVentas('2024-01-01', '2024-01-31');
  
  // Último trimestre
  reportesService.reporteVentas('2024-10-01', '2024-12-31');
  ```

---

## 🚀 Integración en el Sistema

### Inicialización en `server.js`:

```javascript
const notificacionesService = require('./services/notificacionesService');
const backupService = require('./services/backupService');

// Iniciar servicios automáticos
notificacionesService.iniciarCronJob('0 0 * * *'); // Medianoche
backupService.iniciarBackupsAutomaticos('0 2 * * *'); // 2 AM

console.log('✓ Servicios iniciados');
```

### Crear Endpoints API:

```javascript
// routes/notificaciones.js
router.get('/notificaciones/no-leidas', (req, res) => {
  const notificaciones = notificacionesService.obtenerNoLeidas();
  res.json(notificaciones);
});

router.put('/notificaciones/:id/leer', (req, res) => {
  const resultado = notificacionesService.marcarComoLeida(req.params.id);
  res.json({ success: resultado });
});

// routes/backups.js
router.post('/backups/crear', async (req, res) => {
  const resultado = await backupService.crearBackup();
  res.json(resultado);
});

router.get('/backups/listar', (req, res) => {
  const backups = backupService.listarBackups();
  res.json(backups);
});

// routes/reportes.js
router.get('/reportes/ventas', (req, res) => {
  const { fechaInicio, fechaFin } = req.query;
  const reporte = reportesService.reporteVentas(fechaInicio, fechaFin);
  res.json(reporte);
});

router.get('/reportes/consolidado', (req, res) => {
  const { fechaInicio, fechaFin } = req.query;
  const reporte = reportesService.reporteConsolidado(fechaInicio, fechaFin);
  res.json(reporte);
});
```

---

## 📅 Expresiones Cron

Ejemplos de expresiones cron para programar tareas:

```
* * * * *        - Cada minuto
0 * * * *        - Cada hora
0 0 * * *        - Medianoche (00:00)
0 2 * * *        - 2 AM diariamente
0 0 * * 0        - Domingo a medianoche
0 0 1 * *        - Primer día de cada mes
*/5 * * * *      - Cada 5 minutos
0 9,17 * * *     - 9 AM y 5 PM diariamente
0 0 * * 1-5      - Medianoche de lunes a viernes
```

Formato: `minuto hora día mes día_semana`

---

## 🔧 Configuración

### Variables de Entorno Recomendadas:

```env
# Notificaciones
NOTIF_MEMBRESIAS_DIAS=7          # Días antes para notificar membresías
NOTIF_PRODUCTOS_DIAS=15          # Días antes para notificar productos
NOTIF_STOCK_MINIMO=5             # Stock mínimo para alertar
NOTIF_INACTIVIDAD_DIAS=30        # Días sin asistencia
NOTIF_CRON_EXPRESSION=0 0 * * *  # Expresión cron

# Backups
BACKUP_CRON_EXPRESSION=0 2 * * * # Expresión cron
BACKUP_RETENCION_DIAS=30         # Días de retención
BACKUP_MAX_BACKUPS=10            # Máximo de backups a mantener
BACKUP_DIR=./backups             # Directorio de backups
```

---

## 📊 Tipos de Notificaciones

La tabla `notificaciones` soporta los siguientes tipos:

1. `membresia_vencimiento` - Membresía próxima a vencer
2. `producto_vencimiento` - Producto próximo a vencer
3. `bajo_stock` - Producto con bajo stock
4. `mantenimiento_pendiente` - Máquina requiere mantenimiento
5. `cliente_inactivo` - Cliente sin asistencia reciente

---

## 🧪 Testing

Ver `ejemplosUso.js` para ejemplos detallados de cómo usar cada servicio.

Ejecutar ejemplos:
```bash
cd backend/src/services
node ejemplosUso.js
```

---

## 📝 Notas Importantes

### Notificaciones:
- Las notificaciones no se duplican (verifica que no existan notificaciones recientes del mismo tipo)
- Se pueden personalizar los umbrales de cada verificación
- El cron job se ejecuta de forma independiente

### Backups:
- **IMPORTANTE**: Al restaurar un backup, se debe reiniciar el servidor
- Se crea un backup de seguridad antes de cada restauración
- Los backups incluyen tanto la base de datos como la carpeta uploads
- La gestión de retención se ejecuta automáticamente después de cada backup automático

### Reportes:
- Los reportes son generados bajo demanda (no se almacenan)
- Soportan rangos de fechas flexibles
- El reporte consolidado incluye todos los reportes en un solo objeto
- Formato de salida JSON estándar, fácil de integrar con frontend

---

## 🔐 Seguridad

- Los servicios usan la conexión de base de datos existente (no crean nuevas conexiones)
- Los backups se almacenan localmente (considerar respaldo externo para producción)
- Los reportes no exponen información sensible innecesaria
- Las notificaciones se limpian automáticamente después de 30 días

---

## 📚 Dependencias

Estos servicios requieren:
- `node-cron` (^3.0.3) ✅ Ya instalado
- `better-sqlite3` (^9.2.2) ✅ Ya instalado
- Node.js módulos nativos: `fs`, `path`, `child_process`, `util`

---

## 🤝 Contribuir

Para añadir nuevos tipos de notificaciones o reportes:

1. Agregar función en el servicio correspondiente
2. Seguir el patrón de nomenclatura existente
3. Incluir manejo de errores apropiado
4. Documentar en este README
5. Añadir ejemplo en `ejemplosUso.js`

---

## 📞 Soporte

Para preguntas o issues relacionados con los servicios, revisar:
- Logs del servidor para errores de cron jobs
- Archivo `ejemplosUso.js` para casos de uso
- Documentación de node-cron: https://github.com/node-cron/node-cron
