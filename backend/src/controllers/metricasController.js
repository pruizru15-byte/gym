const db = require('../config/database');
const { formatDate } = require('../utils/dateUtils');

/**
 * Get dashboard metrics
 */
const getDashboard = (req, res) => {
    try {
        const today = formatDate(new Date());
        
        // Active clients
        const { clientes_activos } = db.prepare(`
            SELECT COUNT(*) as clientes_activos FROM clientes WHERE activo = 1
        `).get();
        
        // Clients with active memberships
        const { membresias_activas } = db.prepare(`
            SELECT COUNT(DISTINCT cliente_id) as membresias_activas
            FROM clientes_membresias
            WHERE activo = 1 AND fecha_vencimiento >= date('now')
        `).get();
        
        // Today's attendance
        const { asistencias_hoy } = db.prepare(`
            SELECT COUNT(*) as asistencias_hoy
            FROM asistencias
            WHERE date(fecha_hora) = ?
        `).get(today);
        
        // Today's sales
        const todaySales = db.prepare(`
            SELECT 
                COUNT(*) as total_ventas,
                COALESCE(SUM(total), 0) as ingresos_hoy
            FROM ventas
            WHERE date(fecha_hora) = ?
        `).get(today);
        
        // This month's revenue
        const monthRevenue = db.prepare(`
            SELECT COALESCE(SUM(monto), 0) as ingresos_mes
            FROM pagos
            WHERE strftime('%Y-%m', fecha_hora) = strftime('%Y-%m', 'now')
        `).get();
        
        // Expiring memberships (next 7 days)
        const { membresias_por_vencer } = db.prepare(`
            SELECT COUNT(*) as membresias_por_vencer
            FROM clientes_membresias
            WHERE activo = 1 
            AND fecha_vencimiento BETWEEN date('now') AND date('now', '+7 days')
        `).get();
        
        // Low stock products
        const { productos_stock_bajo } = db.prepare(`
            SELECT COUNT(*) as productos_stock_bajo
            FROM productos
            WHERE activo = 1 AND stock_actual <= stock_minimo
        `).get();
        
        // Machines needing maintenance
        const { maquinas_mantenimiento } = db.prepare(`
            SELECT COUNT(*) as maquinas_mantenimiento
            FROM maquinas
            WHERE activo = 1 
            AND proximo_mantenimiento IS NOT NULL
            AND proximo_mantenimiento <= date('now', '+7 days')
        `).get();
        
        // Unread notifications
        const { notificaciones_pendientes } = db.prepare(`
            SELECT COUNT(*) as notificaciones_pendientes
            FROM notificaciones
            WHERE leida = 0
        `).get();
        
        res.json({
            clientes: {
                activos: clientes_activos,
                con_membresia: membresias_activas,
                asistencias_hoy: asistencias_hoy
            },
            ventas: {
                hoy: todaySales.total_ventas,
                ingresos_hoy: todaySales.ingresos_hoy,
                ingresos_mes: monthRevenue.ingresos_mes
            },
            alertas: {
                membresias_por_vencer,
                productos_stock_bajo,
                maquinas_mantenimiento,
                notificaciones_pendientes
            },
            fecha: today
        });
    } catch (error) {
        console.error('Get dashboard error:', error);
        res.status(500).json({ error: 'Error getting dashboard metrics' });
    }
};

/**
 * Get revenue statistics
 */
const getRevenue = (req, res) => {
    try {
        const { fecha_inicio, fecha_fin, agrupacion = 'dia' } = req.query; // agrupacion: 'dia', 'mes', 'año'
        
        let dateFilter = '';
        let groupBy = '';
        let dateFormat = '';
        const params = [];
        
        if (fecha_inicio && fecha_fin) {
            dateFilter = 'WHERE date(fecha_hora) BETWEEN ? AND ?';
            params.push(fecha_inicio, fecha_fin);
        } else {
            // Default to current month
            dateFilter = "WHERE strftime('%Y-%m', fecha_hora) = strftime('%Y-%m', 'now')";
        }
        
        // Set grouping
        switch (agrupacion) {
            case 'mes':
                groupBy = "strftime('%Y-%m', fecha_hora)";
                dateFormat = "strftime('%Y-%m', fecha_hora) as periodo";
                break;
            case 'año':
                groupBy = "strftime('%Y', fecha_hora)";
                dateFormat = "strftime('%Y', fecha_hora) as periodo";
                break;
            default: // dia
                groupBy = "date(fecha_hora)";
                dateFormat = "date(fecha_hora) as periodo";
        }
        
        // Revenue by period
        const ingresosPorPeriodo = db.prepare(`
            SELECT ${dateFormat},
                   COALESCE(SUM(monto), 0) as total,
                   COUNT(*) as cantidad
            FROM pagos
            ${dateFilter}
            GROUP BY ${groupBy}
            ORDER BY periodo DESC
        `).all(...params);
        
        // Revenue by type
        const ingresosPorTipo = db.prepare(`
            SELECT tipo,
                   COALESCE(SUM(monto), 0) as total,
                   COUNT(*) as cantidad
            FROM pagos
            ${dateFilter}
            GROUP BY tipo
        `).all(...params);
        
        // Revenue by payment method
        const ingresosPorMetodo = db.prepare(`
            SELECT metodo_pago,
                   COALESCE(SUM(monto), 0) as total,
                   COUNT(*) as cantidad
            FROM pagos
            ${dateFilter}
            GROUP BY metodo_pago
        `).all(...params);
        
        // Total revenue
        const { total_ingresos, total_transacciones } = db.prepare(`
            SELECT 
                COALESCE(SUM(monto), 0) as total_ingresos,
                COUNT(*) as total_transacciones
            FROM pagos
            ${dateFilter}
        `).get(...params);
        
        res.json({
            total_ingresos,
            total_transacciones,
            por_periodo: ingresosPorPeriodo,
            por_tipo: ingresosPorTipo,
            por_metodo: ingresosPorMetodo,
            agrupacion
        });
    } catch (error) {
        console.error('Get revenue error:', error);
        res.status(500).json({ error: 'Error getting revenue statistics' });
    }
};

/**
 * Get expenses statistics
 */
const getExpenses = (req, res) => {
    try {
        const { fecha_inicio, fecha_fin } = req.query;
        
        let dateFilter = '';
        const params = [];
        
        if (fecha_inicio && fecha_fin) {
            dateFilter = 'WHERE fecha BETWEEN ? AND ?';
            params.push(fecha_inicio, fecha_fin);
        } else {
            // Default to current month
            dateFilter = "WHERE strftime('%Y-%m', fecha) = strftime('%Y-%m', 'now')";
        }
        
        // Total expenses
        const { total_egresos, total_transacciones } = db.prepare(`
            SELECT 
                COALESCE(SUM(monto), 0) as total_egresos,
                COUNT(*) as total_transacciones
            FROM egresos
            ${dateFilter}
        `).get(...params);
        
        // Expenses by category
        const egresosPorCategoria = db.prepare(`
            SELECT categoria,
                   COALESCE(SUM(monto), 0) as total,
                   COUNT(*) as cantidad
            FROM egresos
            ${dateFilter}
            GROUP BY categoria
            ORDER BY total DESC
        `).all(...params);
        
        // Expenses by date
        const egresosPorDia = db.prepare(`
            SELECT fecha,
                   COALESCE(SUM(monto), 0) as total,
                   COUNT(*) as cantidad
            FROM egresos
            ${dateFilter}
            GROUP BY fecha
            ORDER BY fecha DESC
        `).all(...params);
        
        res.json({
            total_egresos,
            total_transacciones,
            por_categoria: egresosPorCategoria,
            por_dia: egresosPorDia
        });
    } catch (error) {
        console.error('Get expenses error:', error);
        res.status(500).json({ error: 'Error getting expenses statistics' });
    }
};

/**
 * Get attendance statistics
 */
const getAttendance = (req, res) => {
    try {
        const { fecha_inicio, fecha_fin } = req.query;
        
        let dateFilter = '';
        const params = [];
        
        if (fecha_inicio && fecha_fin) {
            dateFilter = 'WHERE date(fecha_hora) BETWEEN ? AND ?';
            params.push(fecha_inicio, fecha_fin);
        } else {
            // Default to last 30 days
            dateFilter = "WHERE fecha_hora >= datetime('now', '-30 days')";
        }
        
        // Total attendance
        const { total_asistencias } = db.prepare(`
            SELECT COUNT(*) as total_asistencias
            FROM asistencias ${dateFilter}
        `).get(...params);
        
        // Attendance by day
        const asistenciasPorDia = db.prepare(`
            SELECT date(fecha_hora) as fecha, COUNT(*) as total
            FROM asistencias ${dateFilter}
            GROUP BY date(fecha_hora)
            ORDER BY fecha DESC
        `).all(...params);
        
        // Attendance by hour
        const asistenciasPorHora = db.prepare(`
            SELECT strftime('%H', fecha_hora) as hora, COUNT(*) as total
            FROM asistencias ${dateFilter}
            GROUP BY hora
            ORDER BY total DESC
        `).all(...params);
        
        // Top clients
        const topClientes = db.prepare(`
            SELECT c.codigo, c.nombre, c.apellido, COUNT(*) as visitas
            FROM asistencias a
            JOIN clientes c ON a.cliente_id = c.id
            ${dateFilter}
            GROUP BY a.cliente_id
            ORDER BY visitas DESC
            LIMIT 10
        `).all(...params);
        
        // Average daily attendance
        const avgDaily = asistenciasPorDia.length > 0 
            ? Math.round(total_asistencias / asistenciasPorDia.length)
            : 0;
        
        res.json({
            total_asistencias,
            promedio_diario: avgDaily,
            por_dia: asistenciasPorDia,
            por_hora: asistenciasPorHora,
            top_clientes: topClientes
        });
    } catch (error) {
        console.error('Get attendance statistics error:', error);
        res.status(500).json({ error: 'Error getting attendance statistics' });
    }
};

/**
 * Get membership statistics
 */
const getMemberships = (req, res) => {
    try {
        // Active memberships
        const { activas } = db.prepare(`
            SELECT COUNT(*) as activas
            FROM clientes_membresias
            WHERE activo = 1 AND fecha_vencimiento >= date('now')
        `).get();
        
        // Expired memberships
        const { vencidas } = db.prepare(`
            SELECT COUNT(*) as vencidas
            FROM clientes_membresias
            WHERE activo = 1 AND fecha_vencimiento < date('now')
        `).get();
        
        // Expiring soon (7 days)
        const { por_vencer } = db.prepare(`
            SELECT COUNT(*) as por_vencer
            FROM clientes_membresias
            WHERE activo = 1 
            AND fecha_vencimiento BETWEEN date('now') AND date('now', '+7 days')
        `).get();
        
        // Memberships by plan
        const porPlan = db.prepare(`
            SELECT m.nombre, m.precio, COUNT(*) as cantidad
            FROM clientes_membresias cm
            JOIN membresias m ON cm.membresia_id = m.id
            WHERE cm.activo = 1 AND cm.fecha_vencimiento >= date('now')
            GROUP BY m.id
            ORDER BY cantidad DESC
        `).all();
        
        // New memberships this month
        const { nuevas_mes } = db.prepare(`
            SELECT COUNT(*) as nuevas_mes
            FROM clientes_membresias
            WHERE strftime('%Y-%m', fecha_inicio) = strftime('%Y-%m', 'now')
        `).get();
        
        // Renewals this month
        const { renovaciones_mes } = db.prepare(`
            SELECT COUNT(*) as renovaciones_mes
            FROM clientes_membresias
            WHERE strftime('%Y-%m', fecha_inicio) = strftime('%Y-%m', 'now')
            AND cliente_id IN (
                SELECT cliente_id FROM clientes_membresias 
                WHERE id != clientes_membresias.id
                GROUP BY cliente_id HAVING COUNT(*) > 1
            )
        `).get();
        
        res.json({
            activas,
            vencidas,
            por_vencer,
            nuevas_mes,
            renovaciones_mes,
            por_plan: porPlan
        });
    } catch (error) {
        console.error('Get membership statistics error:', error);
        res.status(500).json({ error: 'Error getting membership statistics' });
    }
};

/**
 * Get products statistics
 */
const getProducts = (req, res) => {
    try {
        // Total active products
        const { total_productos } = db.prepare(`
            SELECT COUNT(*) as total_productos
            FROM productos WHERE activo = 1
        `).get();
        
        // Low stock products
        const { stock_bajo } = db.prepare(`
            SELECT COUNT(*) as stock_bajo
            FROM productos
            WHERE activo = 1 AND stock_actual <= stock_minimo
        `).get();
        
        // Out of stock
        const { sin_stock } = db.prepare(`
            SELECT COUNT(*) as sin_stock
            FROM productos
            WHERE activo = 1 AND stock_actual = 0
        `).get();
        
        // Products by category
        const porCategoria = db.prepare(`
            SELECT categoria, COUNT(*) as cantidad
            FROM productos
            WHERE activo = 1
            GROUP BY categoria
            ORDER BY cantidad DESC
        `).all();
        
        // Total inventory value
        const { valor_inventario } = db.prepare(`
            SELECT COALESCE(SUM(stock_actual * precio_costo), 0) as valor_inventario
            FROM productos
            WHERE activo = 1 AND precio_costo IS NOT NULL
        `).get();
        
        res.json({
            total_productos,
            stock_bajo,
            sin_stock,
            por_categoria: porCategoria,
            valor_inventario
        });
    } catch (error) {
        console.error('Get products statistics error:', error);
        res.status(500).json({ error: 'Error getting products statistics' });
    }
};

/**
 * Get machines statistics
 */
const getMachines = (req, res) => {
    try {
        // Total machines
        const { total_maquinas } = db.prepare(`
            SELECT COUNT(*) as total_maquinas
            FROM maquinas WHERE activo = 1
        `).get();
        
        // Machines by status
        const porEstado = db.prepare(`
            SELECT estado, COUNT(*) as cantidad
            FROM maquinas
            WHERE activo = 1
            GROUP BY estado
        `).all();
        
        // Needing maintenance
        const { necesitan_mantenimiento } = db.prepare(`
            SELECT COUNT(*) as necesitan_mantenimiento
            FROM maquinas
            WHERE activo = 1 
            AND proximo_mantenimiento IS NOT NULL
            AND proximo_mantenimiento <= date('now', '+7 days')
        `).get();
        
        // Machines by category
        const porCategoria = db.prepare(`
            SELECT categoria, COUNT(*) as cantidad
            FROM maquinas
            WHERE activo = 1 AND categoria IS NOT NULL
            GROUP BY categoria
            ORDER BY cantidad DESC
        `).all();
        
        // Maintenance this month
        const { mantenimientos_mes } = db.prepare(`
            SELECT COUNT(*) as mantenimientos_mes
            FROM mantenimientos
            WHERE strftime('%Y-%m', fecha) = strftime('%Y-%m', 'now')
        `).get();
        
        // Total maintenance cost this year
        const { costo_mantenimiento_anio } = db.prepare(`
            SELECT COALESCE(SUM(costo), 0) as costo_mantenimiento_anio
            FROM mantenimientos
            WHERE strftime('%Y', fecha) = strftime('%Y', 'now')
        `).get();
        
        res.json({
            total_maquinas,
            por_estado: porEstado,
            necesitan_mantenimiento,
            por_categoria: porCategoria,
            mantenimientos_mes,
            costo_mantenimiento_anio
        });
    } catch (error) {
        console.error('Get machines statistics error:', error);
        res.status(500).json({ error: 'Error getting machines statistics' });
    }
};

/**
 * Get comparative statistics (current vs previous period)
 */
const getComparative = (req, res) => {
    try {
        const { periodo = 'mes' } = req.query; // 'dia', 'semana', 'mes'
        
        let currentFilter, previousFilter;
        
        switch (periodo) {
            case 'dia':
                currentFilter = "date(fecha_hora) = date('now')";
                previousFilter = "date(fecha_hora) = date('now', '-1 day')";
                break;
            case 'semana':
                currentFilter = "date(fecha_hora) >= date('now', '-7 days')";
                previousFilter = "date(fecha_hora) >= date('now', '-14 days') AND date(fecha_hora) < date('now', '-7 days')";
                break;
            default: // mes
                currentFilter = "strftime('%Y-%m', fecha_hora) = strftime('%Y-%m', 'now')";
                previousFilter = "strftime('%Y-%m', fecha_hora) = strftime('%Y-%m', 'now', '-1 month')";
        }
        
        // Revenue comparison
        const currentRevenue = db.prepare(`
            SELECT COALESCE(SUM(monto), 0) as total FROM pagos WHERE ${currentFilter}
        `).get();
        
        const previousRevenue = db.prepare(`
            SELECT COALESCE(SUM(monto), 0) as total FROM pagos WHERE ${previousFilter}
        `).get();
        
        // Attendance comparison
        const currentAttendance = db.prepare(`
            SELECT COUNT(*) as total FROM asistencias WHERE ${currentFilter}
        `).get();
        
        const previousAttendance = db.prepare(`
            SELECT COUNT(*) as total FROM asistencias WHERE ${previousFilter}
        `).get();
        
        // New clients comparison
        const currentClients = db.prepare(`
            SELECT COUNT(*) as total FROM clientes WHERE ${currentFilter.replace('fecha_hora', 'fecha_registro')}
        `).get();
        
        const previousClients = db.prepare(`
            SELECT COUNT(*) as total FROM clientes WHERE ${previousFilter.replace('fecha_hora', 'fecha_registro')}
        `).get();
        
        // Calculate percentages
        const revenueChange = previousRevenue.total > 0 
            ? ((currentRevenue.total - previousRevenue.total) / previousRevenue.total * 100).toFixed(2)
            : 0;
        
        const attendanceChange = previousAttendance.total > 0
            ? ((currentAttendance.total - previousAttendance.total) / previousAttendance.total * 100).toFixed(2)
            : 0;
        
        const clientsChange = previousClients.total > 0
            ? ((currentClients.total - previousClients.total) / previousClients.total * 100).toFixed(2)
            : 0;
        
        res.json({
            periodo,
            ingresos: {
                actual: currentRevenue.total,
                anterior: previousRevenue.total,
                cambio_porcentaje: parseFloat(revenueChange)
            },
            asistencias: {
                actual: currentAttendance.total,
                anterior: previousAttendance.total,
                cambio_porcentaje: parseFloat(attendanceChange)
            },
            clientes_nuevos: {
                actual: currentClients.total,
                anterior: previousClients.total,
                cambio_porcentaje: parseFloat(clientsChange)
            }
        });
    } catch (error) {
        console.error('Get comparative statistics error:', error);
        res.status(500).json({ error: 'Error getting comparative statistics' });
    }
};

module.exports = {
    getDashboard,
    getRevenue,
    getExpenses,
    getAttendance,
    getMemberships,
    getProducts,
    getMachines,
    getComparative
};
