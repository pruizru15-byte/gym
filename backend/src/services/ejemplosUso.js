/**
 * Ejemplo de uso de los servicios creados
 * Este archivo demuestra cómo usar los servicios de:
 * - Notificaciones
 * - Backup
 * - Reportes
 */

const notificacionesService = require('./notificacionesService');
const backupService = require('./backupService');
const reportesService = require('./reportesService');

// ==============================================
// EJEMPLOS DE USO - SERVICIO DE NOTIFICACIONES
// ==============================================

console.log('\n========== SERVICIO DE NOTIFICACIONES ==========\n');

// 1. Ejecutar verificaciones manuales
function ejemploNotificacionesManual() {
  console.log('1. Verificaciones manuales:');
  
  // Verificar membresías próximas a vencer (7 días de anticipación)
  const membresias = notificacionesService.verificarMembresiasProximasAVencer(7);
  console.log(`   - Membresías próximas a vencer: ${membresias}`);
  
  // Verificar productos próximos a vencer (15 días de anticipación)
  const productos = notificacionesService.verificarProductosProximosAVencer(15);
  console.log(`   - Productos próximos a vencer: ${productos}`);
  
  // Verificar productos con bajo stock
  const bajoStock = notificacionesService.verificarProductosBajoStock(5);
  console.log(`   - Productos con bajo stock: ${bajoStock}`);
  
  // Verificar mantenimientos pendientes
  const mantenimientos = notificacionesService.verificarMantenimientosPendientes();
  console.log(`   - Mantenimientos pendientes: ${mantenimientos}`);
  
  // Verificar clientes inactivos (30 días sin asistencia)
  const inactivos = notificacionesService.verificarClientesInactivos(30);
  console.log(`   - Clientes inactivos: ${inactivos}\n`);
}

// 2. Iniciar cron job automático (se ejecuta a medianoche todos los días)
function ejemploNotificacionesCron() {
  console.log('2. Iniciar verificaciones automáticas con cron job:');
  
  // Iniciar con expresión por defecto (medianoche)
  notificacionesService.iniciarCronJob();
  console.log('   - Cron job iniciado (00:00 diariamente)\n');
  
  // O con expresión personalizada (ejemplo: cada hora)
  // notificacionesService.iniciarCronJob('0 * * * *');
}

// 3. Obtener notificaciones no leídas
function ejemploObtenerNotificaciones() {
  console.log('3. Obtener notificaciones no leídas:');
  const noLeidas = notificacionesService.obtenerNoLeidas();
  console.log(`   - Total no leídas: ${noLeidas.length}\n`);
}

// 4. Marcar notificación como leída
function ejemploMarcarLeida(notificacionId) {
  console.log('4. Marcar notificación como leída:');
  const resultado = notificacionesService.marcarComoLeida(notificacionId);
  console.log(`   - Resultado: ${resultado ? 'Éxito' : 'Error'}\n`);
}

// 5. Limpiar notificaciones antiguas (más de 30 días)
function ejemploLimpiarNotificaciones() {
  console.log('5. Limpiar notificaciones antiguas:');
  const eliminadas = notificacionesService.limpiarNotificacionesAntiguas(30);
  console.log(`   - Notificaciones eliminadas: ${eliminadas}\n`);
}

// ==============================================
// EJEMPLOS DE USO - SERVICIO DE BACKUP
// ==============================================

console.log('\n========== SERVICIO DE BACKUP ==========\n');

// 1. Crear backup manual
async function ejemploBackupManual() {
  console.log('1. Crear backup manual:');
  const resultado = await backupService.crearBackup();
  
  if (resultado.success) {
    console.log(`   ✓ Backup creado: ${resultado.nombre}`);
    console.log(`   - Tamaño: ${(resultado.metadata.tamaño / 1024 / 1024).toFixed(2)} MB\n`);
  } else {
    console.log(`   ✗ Error: ${resultado.error}\n`);
  }
}

// 2. Listar backups disponibles
function ejemploListarBackups() {
  console.log('2. Listar backups disponibles:');
  const backups = backupService.listarBackups();
  console.log(`   - Total de backups: ${backups.length}`);
  
  if (backups.length > 0) {
    console.log('   - Backups disponibles:');
    backups.slice(0, 5).forEach(backup => {
      const fecha = new Date(backup.fecha).toLocaleString();
      const tamaño = ((backup.tamaño || 0) / 1024 / 1024).toFixed(2);
      console.log(`     • ${backup.nombre || backup.nombreBackup} - ${fecha} (${tamaño} MB)`);
    });
  }
  console.log('');
}

// 3. Obtener estadísticas de backups
function ejemploEstadisticasBackups() {
  console.log('3. Estadísticas de backups:');
  const stats = backupService.obtenerEstadisticas();
  
  if (stats) {
    console.log(`   - Total backups: ${stats.totalBackups}`);
    console.log(`   - Tamaño total: ${stats.tamañoTotalMB} MB`);
    if (stats.backupMasReciente) {
      const fecha = new Date(stats.backupMasReciente.fecha).toLocaleString();
      console.log(`   - Backup más reciente: ${fecha}`);
    }
  }
  console.log('');
}

// 4. Iniciar backups automáticos (diarios a las 2 AM)
function ejemploBackupsAutomaticos() {
  console.log('4. Iniciar backups automáticos:');
  backupService.iniciarBackupsAutomaticos('0 2 * * *');
  console.log('   - Backups automáticos iniciados (02:00 diariamente)\n');
}

// 5. Gestionar retención (eliminar backups antiguos)
function ejemploRetencionBackups() {
  console.log('5. Aplicar política de retención:');
  const resultado = backupService.gestionarRetencion(30, 10);
  
  if (resultado.success) {
    console.log(`   - Backups eliminados: ${resultado.eliminados}`);
  }
  console.log('');
}

// 6. Restaurar desde backup
async function ejemploRestaurarBackup(nombreBackup) {
  console.log('6. Restaurar desde backup:');
  const resultado = await backupService.restaurarBackup(nombreBackup);
  
  if (resultado.success) {
    console.log(`   ✓ ${resultado.mensaje}`);
    console.log(`   - Backup de seguridad: ${resultado.backupSeguridad}`);
  } else {
    console.log(`   ✗ Error: ${resultado.error}`);
  }
  console.log('');
}

// ==============================================
// EJEMPLOS DE USO - SERVICIO DE REPORTES
// ==============================================

console.log('\n========== SERVICIO DE REPORTES ==========\n');

// 1. Reporte de ingresos y egresos
function ejemploReporteIngresos() {
  console.log('1. Reporte de ingresos/egresos (mes actual):');
  const reporte = reportesService.reporteIngresosEgresos();
  
  if (reporte) {
    console.log(`   Período: ${reporte.periodo.inicio} a ${reporte.periodo.fin}`);
    console.log(`   - Total ingresos: $${reporte.resumen.totalIngresos.toFixed(2)}`);
    console.log(`   - Total egresos: $${reporte.resumen.totalEgresos.toFixed(2)}`);
    console.log(`   - Utilidad neta: $${reporte.resumen.utilidadNeta.toFixed(2)}`);
    console.log(`   - Margen: ${reporte.resumen.margenUtilidad}%`);
  }
  console.log('');
}

// 2. Reporte de clientes
function ejemploReporteClientes() {
  console.log('2. Reporte de clientes (mes actual):');
  const reporte = reportesService.reporteClientes();
  
  if (reporte) {
    console.log(`   Período: ${reporte.periodo.inicio} a ${reporte.periodo.fin}`);
    console.log(`   - Total clientes: ${reporte.resumen.totalClientes}`);
    console.log(`   - Nuevos: ${reporte.resumen.nuevos}`);
    console.log(`   - Activos: ${reporte.resumen.activos}`);
    console.log(`   - Inactivos: ${reporte.resumen.inactivos}`);
  }
  console.log('');
}

// 3. Reporte de asistencia
function ejemploReporteAsistencia() {
  console.log('3. Reporte de asistencia (mes actual):');
  const reporte = reportesService.reporteAsistencia();
  
  if (reporte) {
    console.log(`   Período: ${reporte.periodo.inicio} a ${reporte.periodo.fin}`);
    console.log(`   - Total asistencias: ${reporte.resumen.totalAsistencias}`);
    console.log(`   - Promedio diario: ${reporte.resumen.promedioAsistenciasDiarias}`);
    console.log(`   - Hora pico: ${reporte.resumen.horaPico}`);
  }
  console.log('');
}

// 4. Reporte de ventas
function ejemploReporteVentas() {
  console.log('4. Reporte de ventas (mes actual):');
  const reporte = reportesService.reporteVentas();
  
  if (reporte) {
    console.log(`   Período: ${reporte.periodo.inicio} a ${reporte.periodo.fin}`);
    console.log(`   - Total ventas: $${reporte.resumen.totalVentas.toFixed(2)}`);
    console.log(`   - Cantidad de ventas: ${reporte.resumen.cantidadVentas}`);
    console.log(`   - Ticket promedio: $${reporte.resumen.ticketPromedio}`);
  }
  console.log('');
}

// 5. Reporte de inventario
function ejemploReporteInventario() {
  console.log('5. Reporte de inventario:');
  const reporte = reportesService.reporteInventario();
  
  if (reporte) {
    console.log(`   - Total productos: ${reporte.resumen.totalProductos}`);
    console.log(`   - Bajo stock: ${reporte.resumen.productosBajoStock}`);
    console.log(`   - Próximos a vencer: ${reporte.resumen.productosProximosVencer}`);
    console.log(`   - Valor inventario (costo): $${reporte.resumen.valorInventarioCosto}`);
    console.log(`   - Valor inventario (venta): $${reporte.resumen.valorInventarioVenta}`);
    console.log(`   - Margen de utilidad: ${reporte.resumen.margenUtilidad}%`);
  }
  console.log('');
}

// 6. Reporte de membresías
function ejemploReporteMembresias() {
  console.log('6. Reporte de membresías (mes actual):');
  const reporte = reportesService.reporteMembresias();
  
  if (reporte) {
    console.log(`   Período: ${reporte.periodo.inicio} a ${reporte.periodo.fin}`);
    console.log(`   - Total ingresos: $${reporte.resumen.totalIngresos.toFixed(2)}`);
    console.log(`   - Membresías vendidas: ${reporte.resumen.totalVendidas}`);
    console.log(`   - Membresías activas: ${reporte.resumen.membresiasActivas}`);
    console.log(`   - Próximas a vencer: ${reporte.resumen.proximasVencer}`);
  }
  console.log('');
}

// 7. Reporte consolidado (dashboard completo)
function ejemploReporteConsolidado() {
  console.log('7. Reporte consolidado (dashboard):');
  const reporte = reportesService.reporteConsolidado();
  
  if (reporte) {
    console.log(`   Período: ${reporte.periodo.inicio} a ${reporte.periodo.fin}`);
    console.log('   ✓ Incluye todos los reportes en un solo objeto');
    console.log(`   - Generado: ${reporte.generadoEn}`);
  }
  console.log('');
}

// 8. Exportar reporte a JSON
function ejemploExportarReporte() {
  console.log('8. Exportar reporte a JSON:');
  const reporte = reportesService.reporteIngresosEgresos();
  const exportado = reportesService.exportarJSON(reporte, 'ingresos-egresos.json');
  
  if (exportado.success) {
    console.log(`   ✓ Reporte exportado: ${exportado.archivo}`);
    console.log(`   - Formato: ${exportado.formato}`);
    console.log(`   - Generado: ${exportado.generado}`);
  }
  console.log('');
}

// 9. Reportes con rangos de fechas personalizados
function ejemploReporteFechasPersonalizadas() {
  console.log('9. Reporte con fechas personalizadas:');
  const fechaInicio = '2024-01-01';
  const fechaFin = '2024-01-31';
  const reporte = reportesService.reporteVentas(fechaInicio, fechaFin);
  
  if (reporte) {
    console.log(`   Período: ${reporte.periodo.inicio} a ${reporte.periodo.fin}`);
    console.log(`   - Total ventas: $${reporte.resumen.totalVentas.toFixed(2)}`);
  }
  console.log('');
}

// ==============================================
// FUNCIÓN PRINCIPAL PARA EJECUTAR EJEMPLOS
// ==============================================

async function main() {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║  EJEMPLOS DE USO - SERVICIOS DEL GIMNASIO             ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  
  // Descomentar los ejemplos que desees ejecutar:
  
  // NOTIFICACIONES
  // ejemploNotificacionesManual();
  // ejemploNotificacionesCron();
  // ejemploObtenerNotificaciones();
  // ejemploLimpiarNotificaciones();
  
  // BACKUP
  // await ejemploBackupManual();
  // ejemploListarBackups();
  // ejemploEstadisticasBackups();
  // ejemploBackupsAutomaticos();
  // ejemploRetencionBackups();
  
  // REPORTES
  // ejemploReporteIngresos();
  // ejemploReporteClientes();
  // ejemploReporteAsistencia();
  // ejemploReporteVentas();
  // ejemploReporteInventario();
  // ejemploReporteMembresias();
  // ejemploReporteConsolidado();
  // ejemploExportarReporte();
  // ejemploReporteFechasPersonalizadas();
  
  console.log('\n✓ Para usar los servicios, descomentar los ejemplos en este archivo\n');
}

// Ejecutar si se ejecuta directamente
if (require.main === module) {
  main().catch(console.error);
}

// Exportar funciones de ejemplo
module.exports = {
  notificaciones: {
    ejemploManual: ejemploNotificacionesManual,
    ejemploCron: ejemploNotificacionesCron,
    ejemploObtener: ejemploObtenerNotificaciones,
    ejemploMarcar: ejemploMarcarLeida,
    ejemploLimpiar: ejemploLimpiarNotificaciones
  },
  backup: {
    ejemploManual: ejemploBackupManual,
    ejemploListar: ejemploListarBackups,
    ejemploEstadisticas: ejemploEstadisticasBackups,
    ejemploAutomaticos: ejemploBackupsAutomaticos,
    ejemploRetencion: ejemploRetencionBackups,
    ejemploRestaurar: ejemploRestaurarBackup
  },
  reportes: {
    ejemploIngresos: ejemploReporteIngresos,
    ejemploClientes: ejemploReporteClientes,
    ejemploAsistencia: ejemploReporteAsistencia,
    ejemploVentas: ejemploReporteVentas,
    ejemploInventario: ejemploReporteInventario,
    ejemploMembresias: ejemploReporteMembresias,
    ejemploConsolidado: ejemploReporteConsolidado,
    ejemploExportar: ejemploExportarReporte,
    ejemploFechas: ejemploReporteFechasPersonalizadas
  }
};
