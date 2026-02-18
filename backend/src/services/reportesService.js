const db = require('../config/database');
const { formatDate } = require('../utils/dateUtils');

/**
 * Servicio de Reportes
 * Genera reportes diversos para el sistema de gestión del gimnasio:
 * - Reportes de ingresos/egresos
 * - Reportes de clientes (nuevos, activos, inactivos)
 * - Reportes de asistencia
 * - Reportes de ventas
 * - Reportes de inventario
 * Todos los reportes soportan rangos de fechas y exportación a JSON
 */

class ReportesService {
  /**
   * Valida y formatea el rango de fechas
   */
  _validarRangoFechas(fechaInicio, fechaFin) {
    const inicio = fechaInicio || formatDate(new Date(new Date().setDate(1))); // Primer día del mes
    const fin = fechaFin || formatDate(new Date()); // Hoy

    return { inicio, fin };
  }

  /**
   * Reporte de Ingresos y Egresos
   * @param {string} fechaInicio - Fecha de inicio (YYYY-MM-DD)
   * @param {string} fechaFin - Fecha de fin (YYYY-MM-DD)
   */
  reporteIngresosEgresos(fechaInicio = null, fechaFin = null) {
    try {
      const { inicio, fin } = this._validarRangoFechas(fechaInicio, fechaFin);

      // Obtener ingresos por membresías
      const ingresosMembresias = db.prepare(`
        SELECT 
          DATE(p.fecha_pago) as fecha,
          'membresia' as tipo,
          SUM(p.monto) as total,
          COUNT(*) as cantidad
        FROM pagos p
        WHERE p.fecha_pago BETWEEN ? AND ?
        GROUP BY DATE(p.fecha_pago)
      `).all(inicio, fin);

      // Obtener ingresos por ventas
      const ingresosVentas = db.prepare(`
        SELECT 
          DATE(v.fecha) as fecha,
          'venta' as tipo,
          SUM(v.total) as total,
          COUNT(*) as cantidad
        FROM ventas v
        WHERE DATE(v.fecha) BETWEEN ? AND ?
        GROUP BY DATE(v.fecha)
      `).all(inicio, fin);

      // Obtener egresos
      const egresos = db.prepare(`
        SELECT 
          DATE(e.fecha) as fecha,
          e.categoria,
          e.descripcion,
          e.monto,
          e.metodo_pago
        FROM egresos e
        WHERE DATE(e.fecha) BETWEEN ? AND ?
        ORDER BY e.fecha DESC
      `).all(inicio, fin);

      // Calcular totales
      const totalIngresosMembresias = ingresosMembresias.reduce((sum, item) => sum + item.total, 0);
      const totalIngresosVentas = ingresosVentas.reduce((sum, item) => sum + item.total, 0);
      const totalEgresos = egresos.reduce((sum, item) => sum + item.monto, 0);
      const totalIngresos = totalIngresosMembresias + totalIngresosVentas;
      const utilidadNeta = totalIngresos - totalEgresos;

      // Agrupar egresos por categoría
      const egresosPorCategoria = {};
      egresos.forEach(egreso => {
        if (!egresosPorCategoria[egreso.categoria]) {
          egresosPorCategoria[egreso.categoria] = 0;
        }
        egresosPorCategoria[egreso.categoria] += egreso.monto;
      });

      return {
        periodo: { inicio, fin },
        resumen: {
          totalIngresos,
          totalIngresosMembresias,
          totalIngresosVentas,
          totalEgresos,
          utilidadNeta,
          margenUtilidad: totalIngresos > 0 ? ((utilidadNeta / totalIngresos) * 100).toFixed(2) : 0
        },
        ingresos: {
          membresias: ingresosMembresias,
          ventas: ingresosVentas
        },
        egresos: {
          detalle: egresos,
          porCategoria: egresosPorCategoria
        }
      };
    } catch (error) {
      console.error('[Reportes] Error en reporte de ingresos/egresos:', error);
      return null;
    }
  }

  /**
   * Reporte de Clientes
   * @param {string} fechaInicio - Fecha de inicio (YYYY-MM-DD)
   * @param {string} fechaFin - Fecha de fin (YYYY-MM-DD)
   */
  reporteClientes(fechaInicio = null, fechaFin = null) {
    try {
      const { inicio, fin } = this._validarRangoFechas(fechaInicio, fechaFin);

      // Clientes nuevos en el período
      const clientesNuevos = db.prepare(`
        SELECT 
          c.id,
          c.nombre,
          c.apellido,
          c.email,
          c.telefono,
          DATE(c.fecha_registro) as fecha_registro
        FROM clientes c
        WHERE DATE(c.fecha_registro) BETWEEN ? AND ?
        ORDER BY c.fecha_registro DESC
      `).all(inicio, fin);

      // Clientes activos (con membresía activa)
      const clientesActivos = db.prepare(`
        SELECT 
          c.id,
          c.nombre,
          c.apellido,
          c.email,
          c.telefono,
          m.nombre as membresia,
          cm.fecha_inicio,
          cm.fecha_fin
        FROM clientes c
        INNER JOIN clientes_membresias cm ON c.id = cm.cliente_id
        INNER JOIN membresias m ON cm.membresia_id = m.id
        WHERE cm.activa = 1
          AND cm.fecha_fin >= ?
        ORDER BY c.nombre, c.apellido
      `).all(formatDate(new Date()));

      // Clientes inactivos (sin asistencia en últimos 30 días pero con membresía activa)
      const fechaInactividad = new Date();
      fechaInactividad.setDate(fechaInactividad.getDate() - 30);
      const clientesInactivos = db.prepare(`
        SELECT 
          c.id,
          c.nombre,
          c.apellido,
          c.email,
          c.telefono,
          MAX(a.fecha_hora) as ultima_asistencia
        FROM clientes c
        INNER JOIN clientes_membresias cm ON c.id = cm.cliente_id
        LEFT JOIN asistencias a ON c.id = a.cliente_id
        WHERE cm.activa = 1
        GROUP BY c.id, c.nombre, c.apellido, c.email, c.telefono
        HAVING MAX(a.fecha_hora) IS NULL OR MAX(a.fecha_hora) < ?
        ORDER BY ultima_asistencia
      `).all(formatDate(fechaInactividad));

      // Total de clientes en el sistema
      const totalClientes = db.prepare('SELECT COUNT(*) as total FROM clientes WHERE estado = "activo"').get();

      // Distribución por género
      const distribucionGenero = db.prepare(`
        SELECT 
          genero,
          COUNT(*) as cantidad
        FROM clientes
        WHERE estado = 'activo'
        GROUP BY genero
      `).all();

      return {
        periodo: { inicio, fin },
        resumen: {
          totalClientes: totalClientes.total,
          nuevos: clientesNuevos.length,
          activos: clientesActivos.length,
          inactivos: clientesInactivos.length,
          distribucionGenero
        },
        clientesNuevos,
        clientesActivos,
        clientesInactivos
      };
    } catch (error) {
      console.error('[Reportes] Error en reporte de clientes:', error);
      return null;
    }
  }

  /**
   * Reporte de Asistencia
   * @param {string} fechaInicio - Fecha de inicio (YYYY-MM-DD)
   * @param {string} fechaFin - Fecha de fin (YYYY-MM-DD)
   */
  reporteAsistencia(fechaInicio = null, fechaFin = null) {
    try {
      const { inicio, fin } = this._validarRangoFechas(fechaInicio, fechaFin);

      // Asistencias por día
      const asistenciasPorDia = db.prepare(`
        SELECT 
          DATE(fecha_hora) as fecha,
          COUNT(*) as total_asistencias,
          COUNT(DISTINCT cliente_id) as clientes_unicos
        FROM asistencias
        WHERE DATE(fecha_hora) BETWEEN ? AND ?
        GROUP BY DATE(fecha_hora)
        ORDER BY fecha DESC
      `).all(inicio, fin);

      // Asistencias por hora (para identificar horas pico)
      const asistenciasPorHora = db.prepare(`
        SELECT 
          CAST(strftime('%H', fecha_hora) AS INTEGER) as hora,
          COUNT(*) as total_asistencias
        FROM asistencias
        WHERE DATE(fecha_hora) BETWEEN ? AND ?
        GROUP BY hora
        ORDER BY hora
      `).all(inicio, fin);

      // Clientes más frecuentes
      const clientesFrecuentes = db.prepare(`
        SELECT 
          c.id,
          c.nombre,
          c.apellido,
          COUNT(a.id) as total_asistencias
        FROM asistencias a
        INNER JOIN clientes c ON a.cliente_id = c.id
        WHERE DATE(a.fecha_hora) BETWEEN ? AND ?
        GROUP BY c.id, c.nombre, c.apellido
        ORDER BY total_asistencias DESC
        LIMIT 20
      `).all(inicio, fin);

      // Calcular promedios
      const totalAsistencias = asistenciasPorDia.reduce((sum, dia) => sum + dia.total_asistencias, 0);
      const diasConAsistencia = asistenciasPorDia.length;
      const promedioAsistenciasDiarias = diasConAsistencia > 0 ? (totalAsistencias / diasConAsistencia).toFixed(2) : 0;

      // Encontrar hora pico
      const horaPico = asistenciasPorHora.length > 0 
        ? asistenciasPorHora.reduce((max, hora) => hora.total_asistencias > max.total_asistencias ? hora : max)
        : null;

      return {
        periodo: { inicio, fin },
        resumen: {
          totalAsistencias,
          promedioAsistenciasDiarias,
          diasConAsistencia,
          horaPico: horaPico ? `${horaPico.hora}:00 - ${horaPico.hora + 1}:00 (${horaPico.total_asistencias} asistencias)` : 'N/A'
        },
        asistenciasPorDia,
        asistenciasPorHora,
        clientesFrecuentes
      };
    } catch (error) {
      console.error('[Reportes] Error en reporte de asistencia:', error);
      return null;
    }
  }

  /**
   * Reporte de Ventas
   * @param {string} fechaInicio - Fecha de inicio (YYYY-MM-DD)
   * @param {string} fechaFin - Fecha de fin (YYYY-MM-DD)
   */
  reporteVentas(fechaInicio = null, fechaFin = null) {
    try {
      const { inicio, fin } = this._validarRangoFechas(fechaInicio, fechaFin);

      // Ventas totales
      const ventasTotales = db.prepare(`
        SELECT 
          v.id,
          DATE(v.fecha) as fecha,
          v.total,
          v.metodo_pago,
          u.nombre as vendedor,
          c.nombre || ' ' || c.apellido as cliente
        FROM ventas v
        LEFT JOIN usuarios u ON v.usuario_id = u.id
        LEFT JOIN clientes c ON v.cliente_id = c.id
        WHERE DATE(v.fecha) BETWEEN ? AND ?
        ORDER BY v.fecha DESC
      `).all(inicio, fin);

      // Ventas por día
      const ventasPorDia = db.prepare(`
        SELECT 
          DATE(fecha) as fecha,
          COUNT(*) as cantidad_ventas,
          SUM(total) as total
        FROM ventas
        WHERE DATE(fecha) BETWEEN ? AND ?
        GROUP BY DATE(fecha)
        ORDER BY fecha DESC
      `).all(inicio, fin);

      // Productos más vendidos
      const productosMasVendidos = db.prepare(`
        SELECT 
          p.id,
          p.nombre,
          SUM(vd.cantidad) as cantidad_vendida,
          SUM(vd.subtotal) as total_vendido,
          AVG(vd.precio_unitario) as precio_promedio
        FROM ventas_detalle vd
        INNER JOIN productos p ON vd.producto_id = p.id
        INNER JOIN ventas v ON vd.venta_id = v.id
        WHERE DATE(v.fecha) BETWEEN ? AND ?
        GROUP BY p.id, p.nombre
        ORDER BY cantidad_vendida DESC
        LIMIT 20
      `).all(inicio, fin);

      // Ventas por método de pago
      const ventasPorMetodoPago = db.prepare(`
        SELECT 
          metodo_pago,
          COUNT(*) as cantidad,
          SUM(total) as total
        FROM ventas
        WHERE DATE(fecha) BETWEEN ? AND ?
        GROUP BY metodo_pago
      `).all(inicio, fin);

      // Calcular totales y promedios
      const totalVentas = ventasTotales.reduce((sum, venta) => sum + venta.total, 0);
      const cantidadVentas = ventasTotales.length;
      const ticketPromedio = cantidadVentas > 0 ? (totalVentas / cantidadVentas).toFixed(2) : 0;

      // Ventas por vendedor
      const ventasPorVendedor = {};
      ventasTotales.forEach(venta => {
        const vendedor = venta.vendedor || 'Sin vendedor';
        if (!ventasPorVendedor[vendedor]) {
          ventasPorVendedor[vendedor] = { cantidad: 0, total: 0 };
        }
        ventasPorVendedor[vendedor].cantidad++;
        ventasPorVendedor[vendedor].total += venta.total;
      });

      return {
        periodo: { inicio, fin },
        resumen: {
          totalVentas,
          cantidadVentas,
          ticketPromedio,
          metodosPago: ventasPorMetodoPago
        },
        ventasTotales,
        ventasPorDia,
        productosMasVendidos,
        ventasPorVendedor
      };
    } catch (error) {
      console.error('[Reportes] Error en reporte de ventas:', error);
      return null;
    }
  }

  /**
   * Reporte de Inventario
   */
  reporteInventario() {
    try {
      // Productos en stock
      const productosEnStock = db.prepare(`
        SELECT 
          id,
          nombre,
          categoria,
          stock,
          stock_minimo,
          precio_venta,
          precio_costo,
          fecha_vencimiento,
          CASE 
            WHEN stock <= stock_minimo THEN 'Bajo'
            WHEN stock <= (stock_minimo * 2) THEN 'Medio'
            ELSE 'Normal'
          END as nivel_stock
        FROM productos
        ORDER BY stock ASC
      `).all();

      // Productos con bajo stock
      const productosBajoStock = productosEnStock.filter(p => p.nivel_stock === 'Bajo');

      // Productos próximos a vencer (próximos 30 días)
      const fechaLimite = new Date();
      fechaLimite.setDate(fechaLimite.getDate() + 30);
      const productosProximosVencer = db.prepare(`
        SELECT 
          id,
          nombre,
          stock,
          fecha_vencimiento,
          precio_venta
        FROM productos
        WHERE fecha_vencimiento IS NOT NULL
          AND fecha_vencimiento <= ?
          AND stock > 0
        ORDER BY fecha_vencimiento ASC
      `).all(formatDate(fechaLimite));

      // Valor total del inventario
      const valorInventario = productosEnStock.reduce((sum, producto) => {
        return sum + (producto.stock * producto.precio_costo);
      }, 0);

      const valorVentaInventario = productosEnStock.reduce((sum, producto) => {
        return sum + (producto.stock * producto.precio_venta);
      }, 0);

      // Productos por categoría
      const productosPorCategoria = {};
      productosEnStock.forEach(producto => {
        const categoria = producto.categoria || 'Sin categoría';
        if (!productosPorCategoria[categoria]) {
          productosPorCategoria[categoria] = {
            cantidad: 0,
            stock: 0,
            valorCosto: 0,
            valorVenta: 0
          };
        }
        productosPorCategoria[categoria].cantidad++;
        productosPorCategoria[categoria].stock += producto.stock;
        productosPorCategoria[categoria].valorCosto += (producto.stock * producto.precio_costo);
        productosPorCategoria[categoria].valorVenta += (producto.stock * producto.precio_venta);
      });

      return {
        resumen: {
          totalProductos: productosEnStock.length,
          productosBajoStock: productosBajoStock.length,
          productosProximosVencer: productosProximosVencer.length,
          valorInventarioCosto: valorInventario.toFixed(2),
          valorInventarioVenta: valorVentaInventario.toFixed(2),
          utilidadPotencial: (valorVentaInventario - valorInventario).toFixed(2),
          margenUtilidad: valorInventario > 0 ? (((valorVentaInventario - valorInventario) / valorInventario) * 100).toFixed(2) : 0
        },
        productos: productosEnStock,
        productosBajoStock,
        productosProximosVencer,
        productosPorCategoria
      };
    } catch (error) {
      console.error('[Reportes] Error en reporte de inventario:', error);
      return null;
    }
  }

  /**
   * Reporte de Membresías
   * @param {string} fechaInicio - Fecha de inicio (YYYY-MM-DD)
   * @param {string} fechaFin - Fecha de fin (YYYY-MM-DD)
   */
  reporteMembresias(fechaInicio = null, fechaFin = null) {
    try {
      const { inicio, fin } = this._validarRangoFechas(fechaInicio, fechaFin);

      // Membresías vendidas en el período
      const membresiasVendidas = db.prepare(`
        SELECT 
          m.nombre as membresia,
          COUNT(*) as cantidad_vendida,
          SUM(p.monto) as total_ingresos
        FROM pagos p
        INNER JOIN clientes_membresias cm ON p.membresia_cliente_id = cm.id
        INNER JOIN membresias m ON cm.membresia_id = m.id
        WHERE DATE(p.fecha_pago) BETWEEN ? AND ?
        GROUP BY m.nombre
        ORDER BY cantidad_vendida DESC
      `).all(inicio, fin);

      // Membresías activas por tipo
      const membresiasActivas = db.prepare(`
        SELECT 
          m.nombre as membresia,
          COUNT(*) as cantidad_activas,
          m.duracion_dias
        FROM clientes_membresias cm
        INNER JOIN membresias m ON cm.membresia_id = m.id
        WHERE cm.activa = 1
        GROUP BY m.nombre, m.duracion_dias
        ORDER BY cantidad_activas DESC
      `).all();

      // Membresías próximas a vencer (próximos 7 días)
      const fechaVencimiento = new Date();
      fechaVencimiento.setDate(fechaVencimiento.getDate() + 7);
      const membresiasProximasVencer = db.prepare(`
        SELECT 
          c.nombre || ' ' || c.apellido as cliente,
          m.nombre as membresia,
          cm.fecha_fin,
          c.telefono,
          c.email
        FROM clientes_membresias cm
        INNER JOIN clientes c ON cm.cliente_id = c.id
        INNER JOIN membresias m ON cm.membresia_id = m.id
        WHERE cm.activa = 1
          AND cm.fecha_fin <= ?
        ORDER BY cm.fecha_fin ASC
      `).all(formatDate(fechaVencimiento));

      // Calcular totales
      const totalIngresos = membresiasVendidas.reduce((sum, m) => sum + m.total_ingresos, 0);
      const totalVendidas = membresiasVendidas.reduce((sum, m) => sum + m.cantidad_vendida, 0);

      return {
        periodo: { inicio, fin },
        resumen: {
          totalIngresos,
          totalVendidas,
          ingresoPromedio: totalVendidas > 0 ? (totalIngresos / totalVendidas).toFixed(2) : 0,
          membresiasActivas: membresiasActivas.reduce((sum, m) => sum + m.cantidad_activas, 0),
          proximasVencer: membresiasProximasVencer.length
        },
        membresiasVendidas,
        membresiasActivas,
        membresiasProximasVencer
      };
    } catch (error) {
      console.error('[Reportes] Error en reporte de membresías:', error);
      return null;
    }
  }

  /**
   * Reporte consolidado (dashboard)
   * @param {string} fechaInicio - Fecha de inicio (YYYY-MM-DD)
   * @param {string} fechaFin - Fecha de fin (YYYY-MM-DD)
   */
  reporteConsolidado(fechaInicio = null, fechaFin = null) {
    try {
      const { inicio, fin } = this._validarRangoFechas(fechaInicio, fechaFin);

      return {
        periodo: { inicio, fin },
        ingresos: this.reporteIngresosEgresos(inicio, fin),
        clientes: this.reporteClientes(inicio, fin),
        asistencia: this.reporteAsistencia(inicio, fin),
        ventas: this.reporteVentas(inicio, fin),
        inventario: this.reporteInventario(),
        membresias: this.reporteMembresias(inicio, fin),
        generadoEn: new Date().toISOString()
      };
    } catch (error) {
      console.error('[Reportes] Error en reporte consolidado:', error);
      return null;
    }
  }

  /**
   * Exporta un reporte a JSON
   * @param {Object} reporte - Objeto del reporte
   * @param {string} nombreArchivo - Nombre del archivo de salida
   */
  exportarJSON(reporte, nombreArchivo = 'reporte.json') {
    try {
      return {
        success: true,
        data: reporte,
        formato: 'json',
        archivo: nombreArchivo,
        generado: new Date().toISOString()
      };
    } catch (error) {
      console.error('[Reportes] Error al exportar reporte:', error);
      return { success: false, error: error.message };
    }
  }
}

// Exportar instancia única del servicio (Singleton)
const reportesService = new ReportesService();
module.exports = reportesService;
