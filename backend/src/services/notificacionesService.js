const cron = require('node-cron');
const db = require('../config/database');
const { addDays, formatDate, isWithinDays } = require('../utils/dateUtils');

/**
 * Servicio de Notificaciones
 * Genera notificaciones automáticas basadas en:
 * - Membresías próximas a vencer
 * - Productos próximos a vencer
 * - Productos con bajo stock
 * - Mantenimiento de máquinas pendiente
 * - Clientes inactivos (sin check-in en 30 días)
 */

class NotificacionesService {
  constructor() {
    this.cronJob = null;
  }

  /**
   * Inserta una notificación en la base de datos
   */
  _insertarNotificacion(tipo, titulo, mensaje, referencia_id = null) {
    try {
      const stmt = db.prepare(`
        INSERT INTO notificaciones (tipo, titulo, mensaje, referencia_id, leida, fecha_creacion)
        VALUES (?, ?, ?, ?, 0, datetime('now'))
      `);
      stmt.run(tipo, titulo, mensaje, referencia_id);
      return true;
    } catch (error) {
      console.error('Error al insertar notificación:', error);
      return false;
    }
  }

  /**
   * Verifica membresías próximas a vencer
   * @param {number} diasAnticipacion - Días de anticipación para notificar (default: 7)
   */
  verificarMembresiasProximasAVencer(diasAnticipacion = 7) {
    try {
      const fechaLimite = formatDate(addDays(new Date(), diasAnticipacion));
      const hoy = formatDate(new Date());

      const stmt = db.prepare(`
        SELECT 
          cm.id,
          cm.cliente_id,
          cm.fecha_fin,
          c.nombre,
          c.apellido,
          m.nombre as nombre_membresia
        FROM clientes_membresias cm
        INNER JOIN clientes c ON cm.cliente_id = c.id
        INNER JOIN membresias m ON cm.membresia_id = m.id
        WHERE cm.activa = 1
          AND cm.fecha_fin BETWEEN ? AND ?
          AND NOT EXISTS (
            SELECT 1 FROM notificaciones 
            WHERE tipo = 'membresia_vencimiento' 
              AND referencia_id = cm.id
              AND fecha_creacion >= date('now', '-1 day')
          )
      `);

      const membresias = stmt.all(hoy, fechaLimite);
      let notificacionesCreadas = 0;

      membresias.forEach(membresia => {
        const titulo = `Membresía próxima a vencer`;
        const mensaje = `La membresía ${membresia.nombre_membresia} de ${membresia.nombre} ${membresia.apellido} vence el ${membresia.fecha_fin}`;
        
        if (this._insertarNotificacion('membresia_vencimiento', titulo, mensaje, membresia.id)) {
          notificacionesCreadas++;
        }
      });

      console.log(`[Notificaciones] ${notificacionesCreadas} notificaciones de membresías próximas a vencer`);
      return notificacionesCreadas;
    } catch (error) {
      console.error('Error al verificar membresías próximas a vencer:', error);
      return 0;
    }
  }

  /**
   * Verifica productos próximos a vencer
   * @param {number} diasAnticipacion - Días de anticipación para notificar (default: 15)
   */
  verificarProductosProximosAVencer(diasAnticipacion = 15) {
    try {
      const fechaLimite = formatDate(addDays(new Date(), diasAnticipacion));
      const hoy = formatDate(new Date());

      const stmt = db.prepare(`
        SELECT 
          id,
          nombre,
          fecha_vencimiento,
          stock
        FROM productos
        WHERE fecha_vencimiento IS NOT NULL
          AND fecha_vencimiento BETWEEN ? AND ?
          AND stock > 0
          AND NOT EXISTS (
            SELECT 1 FROM notificaciones 
            WHERE tipo = 'producto_vencimiento' 
              AND referencia_id = id
              AND fecha_creacion >= date('now', '-1 day')
          )
      `);

      const productos = stmt.all(hoy, fechaLimite);
      let notificacionesCreadas = 0;

      productos.forEach(producto => {
        const titulo = `Producto próximo a vencer`;
        const mensaje = `El producto "${producto.nombre}" vence el ${producto.fecha_vencimiento} (Stock: ${producto.stock})`;
        
        if (this._insertarNotificacion('producto_vencimiento', titulo, mensaje, producto.id)) {
          notificacionesCreadas++;
        }
      });

      console.log(`[Notificaciones] ${notificacionesCreadas} notificaciones de productos próximos a vencer`);
      return notificacionesCreadas;
    } catch (error) {
      console.error('Error al verificar productos próximos a vencer:', error);
      return 0;
    }
  }

  /**
   * Verifica productos con bajo stock
   * @param {number} stockMinimo - Stock mínimo para alertar (default: 5)
   */
  verificarProductosBajoStock(stockMinimo = 5) {
    try {
      const stmt = db.prepare(`
        SELECT 
          id,
          nombre,
          stock,
          stock_minimo
        FROM productos
        WHERE stock <= ?
          AND stock > 0
          AND NOT EXISTS (
            SELECT 1 FROM notificaciones 
            WHERE tipo = 'bajo_stock' 
              AND referencia_id = id
              AND fecha_creacion >= date('now', '-1 day')
          )
      `);

      const productos = stmt.all(stockMinimo);
      let notificacionesCreadas = 0;

      productos.forEach(producto => {
        const titulo = `Producto con bajo stock`;
        const mensaje = `El producto "${producto.nombre}" tiene stock bajo (${producto.stock} unidades). Stock mínimo: ${producto.stock_minimo || stockMinimo}`;
        
        if (this._insertarNotificacion('bajo_stock', titulo, mensaje, producto.id)) {
          notificacionesCreadas++;
        }
      });

      console.log(`[Notificaciones] ${notificacionesCreadas} notificaciones de bajo stock`);
      return notificacionesCreadas;
    } catch (error) {
      console.error('Error al verificar productos con bajo stock:', error);
      return 0;
    }
  }

  /**
   * Verifica mantenimientos de máquinas pendientes
   */
  verificarMantenimientosPendientes() {
    try {
      const hoy = formatDate(new Date());

      const stmt = db.prepare(`
        SELECT 
          id,
          nombre,
          fecha_ultimo_mantenimiento,
          frecuencia_mantenimiento_dias,
          date(fecha_ultimo_mantenimiento, '+' || frecuencia_mantenimiento_dias || ' days') as fecha_proximo_mantenimiento
        FROM maquinas
        WHERE estado = 'activa'
          AND fecha_ultimo_mantenimiento IS NOT NULL
          AND frecuencia_mantenimiento_dias > 0
          AND date(fecha_ultimo_mantenimiento, '+' || frecuencia_mantenimiento_dias || ' days') <= ?
          AND NOT EXISTS (
            SELECT 1 FROM notificaciones 
            WHERE tipo = 'mantenimiento_pendiente' 
              AND referencia_id = id
              AND fecha_creacion >= date('now', '-1 day')
          )
      `);

      const maquinas = stmt.all(hoy);
      let notificacionesCreadas = 0;

      maquinas.forEach(maquina => {
        const titulo = `Mantenimiento pendiente`;
        const mensaje = `La máquina "${maquina.nombre}" requiere mantenimiento. Último mantenimiento: ${maquina.fecha_ultimo_mantenimiento}`;
        
        if (this._insertarNotificacion('mantenimiento_pendiente', titulo, mensaje, maquina.id)) {
          notificacionesCreadas++;
        }
      });

      console.log(`[Notificaciones] ${notificacionesCreadas} notificaciones de mantenimiento pendiente`);
      return notificacionesCreadas;
    } catch (error) {
      console.error('Error al verificar mantenimientos pendientes:', error);
      return 0;
    }
  }

  /**
   * Verifica clientes inactivos (sin check-in en los últimos 30 días)
   * @param {number} diasInactividad - Días sin actividad para considerar inactivo (default: 30)
   */
  verificarClientesInactivos(diasInactividad = 30) {
    try {
      const fechaLimite = formatDate(addDays(new Date(), -diasInactividad));

      const stmt = db.prepare(`
        SELECT 
          c.id,
          c.nombre,
          c.apellido,
          MAX(a.fecha_hora) as ultima_asistencia
        FROM clientes c
        INNER JOIN clientes_membresias cm ON c.id = cm.cliente_id
        LEFT JOIN asistencias a ON c.id = a.cliente_id
        WHERE cm.activa = 1
          AND c.estado = 'activo'
        GROUP BY c.id, c.nombre, c.apellido
        HAVING (MAX(a.fecha_hora) IS NULL OR MAX(a.fecha_hora) <= ?)
          AND NOT EXISTS (
            SELECT 1 FROM notificaciones 
            WHERE tipo = 'cliente_inactivo' 
              AND referencia_id = c.id
              AND fecha_creacion >= date('now', '-7 days')
          )
      `);

      const clientes = stmt.all(fechaLimite);
      let notificacionesCreadas = 0;

      clientes.forEach(cliente => {
        const titulo = `Cliente inactivo`;
        const ultimaAsistencia = cliente.ultima_asistencia || 'Nunca';
        const mensaje = `El cliente ${cliente.nombre} ${cliente.apellido} no ha registrado asistencia en ${diasInactividad} días. Última asistencia: ${ultimaAsistencia}`;
        
        if (this._insertarNotificacion('cliente_inactivo', titulo, mensaje, cliente.id)) {
          notificacionesCreadas++;
        }
      });

      console.log(`[Notificaciones] ${notificacionesCreadas} notificaciones de clientes inactivos`);
      return notificacionesCreadas;
    } catch (error) {
      console.error('Error al verificar clientes inactivos:', error);
      return 0;
    }
  }

  /**
   * Ejecuta todas las verificaciones de notificaciones
   */
  ejecutarVerificaciones() {
    console.log('[Notificaciones] Iniciando verificaciones automáticas...');
    
    try {
      const resultados = {
        membresias: this.verificarMembresiasProximasAVencer(7),
        productos: this.verificarProductosProximosAVencer(15),
        bajoStock: this.verificarProductosBajoStock(5),
        mantenimientos: this.verificarMantenimientosPendientes(),
        clientesInactivos: this.verificarClientesInactivos(30)
      };

      const total = Object.values(resultados).reduce((sum, val) => sum + val, 0);
      console.log(`[Notificaciones] Verificación completada. Total de notificaciones generadas: ${total}`);
      
      return resultados;
    } catch (error) {
      console.error('[Notificaciones] Error en verificaciones automáticas:', error);
      return null;
    }
  }

  /**
   * Inicia el trabajo cron para ejecutar verificaciones automáticas
   * Por defecto se ejecuta todos los días a medianoche (00:00)
   * @param {string} cronExpression - Expresión cron personalizada (opcional)
   */
  iniciarCronJob(cronExpression = '0 0 * * *') {
    if (this.cronJob) {
      console.log('[Notificaciones] Cron job ya está en ejecución');
      return;
    }

    try {
      this.cronJob = cron.schedule(cronExpression, () => {
        console.log('[Notificaciones] Ejecutando verificaciones programadas...');
        this.ejecutarVerificaciones();
      });

      console.log(`[Notificaciones] Cron job iniciado con expresión: ${cronExpression}`);
    } catch (error) {
      console.error('[Notificaciones] Error al iniciar cron job:', error);
    }
  }

  /**
   * Detiene el trabajo cron
   */
  detenerCronJob() {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
      console.log('[Notificaciones] Cron job detenido');
    }
  }

  /**
   * Marca una notificación como leída
   * @param {number} notificacionId - ID de la notificación
   */
  marcarComoLeida(notificacionId) {
    try {
      const stmt = db.prepare('UPDATE notificaciones SET leida = 1 WHERE id = ?');
      const result = stmt.run(notificacionId);
      return result.changes > 0;
    } catch (error) {
      console.error('Error al marcar notificación como leída:', error);
      return false;
    }
  }

  /**
   * Obtiene todas las notificaciones no leídas
   */
  obtenerNoLeidas() {
    try {
      const stmt = db.prepare(`
        SELECT * FROM notificaciones 
        WHERE leida = 0 
        ORDER BY fecha_creacion DESC
      `);
      return stmt.all();
    } catch (error) {
      console.error('Error al obtener notificaciones no leídas:', error);
      return [];
    }
  }

  /**
   * Elimina notificaciones antiguas
   * @param {number} diasAntiguedad - Días de antigüedad para eliminar (default: 30)
   */
  limpiarNotificacionesAntiguas(diasAntiguedad = 30) {
    try {
      const fechaLimite = formatDate(addDays(new Date(), -diasAntiguedad));
      const stmt = db.prepare(`
        DELETE FROM notificaciones 
        WHERE fecha_creacion < ? AND leida = 1
      `);
      const result = stmt.run(fechaLimite);
      console.log(`[Notificaciones] ${result.changes} notificaciones antiguas eliminadas`);
      return result.changes;
    } catch (error) {
      console.error('Error al limpiar notificaciones antiguas:', error);
      return 0;
    }
  }
}

// Exportar instancia única del servicio (Singleton)
const notificacionesService = new NotificacionesService();
module.exports = notificacionesService;
