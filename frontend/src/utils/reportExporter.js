import { formatCurrency } from './formatters'

/**
 * Generate a CSV string from rows of data
 * @param {string[]} headers - Column headers
 * @param {Array<Array>} rows - Data rows
 * @returns {string} CSV content
 */
const generateCSV = (headers, rows) => {
    const escape = (val) => {
        const str = String(val ?? '')
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`
        }
        return str
    }

    const lines = [
        headers.map(escape).join(','),
        ...rows.map(row => row.map(escape).join(','))
    ]
    return '\uFEFF' + lines.join('\r\n') // BOM for Excel UTF-8 support
}

/**
 * Trigger a file download in the browser
 * @param {string} content - File content
 * @param {string} filename - File name
 * @param {string} mimeType - MIME type
 */
const downloadFile = (content, filename, mimeType = 'text/csv;charset=utf-8') => {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
}

/**
 * Export revenue data to CSV
 */
export const exportRevenueCSV = (revenueData, comparative, filename) => {
    const ingresos = comparative?.ingresos || {}
    const porTipo = revenueData?.por_tipo || []
    const porPeriodo = revenueData?.por_periodo || []

    const headers = ['Concepto', 'Valor']
    const rows = [
        ['Ingresos Este Mes', formatCurrency(ingresos.actual || 0)],
        ['Ingresos Mes Pasado', formatCurrency(ingresos.anterior || 0)],
        ['Cambio Porcentual', `${ingresos.cambio_porcentaje || 0}%`],
        ['', ''],
        ['--- Desglose por Tipo ---', ''],
        ...porTipo.map(t => [t.tipo, formatCurrency(t.total)]),
        ['', ''],
        ['--- Ingresos por Día ---', ''],
        ['Fecha', 'Total'],
        ...porPeriodo.map(p => [p.periodo, formatCurrency(p.total)])
    ]

    const csv = generateCSV(headers, rows)
    downloadFile(csv, filename || 'reporte_ingresos.csv')
}

/**
 * Export client stats to CSV
 */
export const exportClientStatsCSV = (clientData, filename) => {
    const headers = ['Métrica', 'Valor']
    const rows = [
        ['Total Activos', clientData?.total_activos || 0],
        ['Nuevos Este Mes', clientData?.nuevos || 0],
        ['Renovaciones', clientData?.renovaciones || 0],
        ['Cancelaciones', clientData?.cancelaciones || 0],
        ['Tasa de Renovación', `${clientData?.tasa_renovacion || 0}%`],
    ]

    const csv = generateCSV(headers, rows)
    downloadFile(csv, filename || 'reporte_clientes.csv')
}

/**
 * Export attendance data to CSV
 */
export const exportAttendanceCSV = (attendanceData, filename) => {
    const headers = ['Métrica', 'Valor']
    const summaryRows = [
        ['Total Asistencias', attendanceData?.total_asistencias || 0],
        ['Promedio Diario', attendanceData?.promedio_diario || 0],
        ['', ''],
        ['--- Asistencias por Día ---', ''],
    ]

    const dailyHeaders = ['Fecha', 'Total']
    const dailyRows = (attendanceData?.por_dia || []).map(d => [d.fecha, d.total])

    const hourHeaders = ['', '', '--- Asistencias por Hora ---', '']
    const hourRows = (attendanceData?.por_hora || []).map(h => [`${h.hora}:00`, h.total])

    const allRows = [
        ...summaryRows,
        dailyHeaders,
        ...dailyRows,
        ['', ''],
        ['--- Asistencias por Hora ---', ''],
        ['Hora', 'Total'],
        ...hourRows,
    ]

    const csv = generateCSV(headers, allRows)
    downloadFile(csv, filename || 'reporte_asistencias.csv')
}

/**
 * Export top products to CSV
 */
export const exportTopProductsCSV = (products, filename) => {
    const headers = ['#', 'Producto', 'Unidades Vendidas', 'Ingresos']
    const rows = (products || []).map((p, i) => [
        i + 1,
        p.nombre,
        p.unidades_vendidas,
        formatCurrency(p.ingresos_total)
    ])

    const csv = generateCSV(headers, rows)
    downloadFile(csv, filename || 'reporte_productos.csv')
}

/**
 * Export a complete report combining all data sections
 */
export const exportFullReport = (revenueData, comparative, clientData, attendanceData, products, periodo) => {
    const headers = ['Sección', 'Detalle']

    const rows = [
        ['REPORTE COMPLETO', periodo || ''],
        ['Generado', new Date().toLocaleString('es-MX')],
        ['', ''],

        // Revenue
        ['=== INGRESOS ===', ''],
        ['Ingresos Este Mes', formatCurrency(comparative?.ingresos?.actual || 0)],
        ['Ingresos Mes Pasado', formatCurrency(comparative?.ingresos?.anterior || 0)],
        ['Cambio', `${comparative?.ingresos?.cambio_porcentaje || 0}%`],
        ...(revenueData?.por_tipo || []).map(t => [`  ${t.tipo}`, formatCurrency(t.total)]),
        ['', ''],

        // Clients
        ['=== CLIENTES ===', ''],
        ['Total Activos', clientData?.total_activos || 0],
        ['Nuevos', clientData?.nuevos || 0],
        ['Renovaciones', clientData?.renovaciones || 0],
        ['Cancelaciones', clientData?.cancelaciones || 0],
        ['Tasa de Renovación', `${clientData?.tasa_renovacion || 0}%`],
        ['', ''],

        // Attendance
        ['=== ASISTENCIAS ===', ''],
        ['Total del Mes', attendanceData?.total_asistencias || 0],
        ['Promedio Diario', attendanceData?.promedio_diario || 0],
        ['', ''],

        // Products
        ['=== PRODUCTOS MÁS VENDIDOS ===', ''],
        ['Producto', 'Unidades / Ingresos'],
        ...(products || []).map((p, i) => [
            `${i + 1}. ${p.nombre}`,
            `${p.unidades_vendidas} uds - ${formatCurrency(p.ingresos_total)}`
        ]),
    ]

    const csv = generateCSV(headers, rows)
    downloadFile(csv, `reporte_completo_${periodo || 'gym'}.csv`)
}
