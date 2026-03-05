import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

// ─── Gym Brand Colors ───
const COLORS = {
    black: [18, 18, 18],
    darkLime: [101, 163, 13],    // #65a30d
    lime: [132, 204, 22],        // #84cc16
    limeLight: [217, 249, 157],  // #d9f99d
    white: [255, 255, 255],
    gray: [120, 120, 120],
    grayLight: [240, 240, 240],
    grayMed: [200, 200, 200],
}

/**
 * Draw the professional header with gym branding
 */
const drawHeader = (doc, title, periodo) => {
    const pageWidth = doc.internal.pageSize.getWidth()

    // Black header bar
    doc.setFillColor(...COLORS.black)
    doc.rect(0, 0, pageWidth, 42, 'F')

    // Lime accent line
    doc.setFillColor(...COLORS.darkLime)
    doc.rect(0, 42, pageWidth, 3, 'F')

    // Gym name
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(22)
    doc.setTextColor(...COLORS.lime)
    doc.text('GYMPRO', 20, 20)

    // Subtitle
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(...COLORS.grayMed)
    doc.text('Sistema de Gestión de Gimnasio', 20, 30)

    // Report title on the right
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    doc.setTextColor(...COLORS.white)
    doc.text(title, pageWidth - 20, 20, { align: 'right' })

    // Period
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(...COLORS.limeLight)
    doc.text(periodo, pageWidth - 20, 30, { align: 'right' })

    return 55 // Return Y position after header
}

/**
 * Draw a section title with lime accent
 */
const drawSectionTitle = (doc, title, y, icon = '●') => {
    const pageWidth = doc.internal.pageSize.getWidth()

    // Check if we need a new page
    if (y > doc.internal.pageSize.getHeight() - 60) {
        doc.addPage()
        y = 20
    }

    // Lime accent bar
    doc.setFillColor(...COLORS.darkLime)
    doc.roundedRect(15, y, 4, 16, 2, 2, 'F')

    // Title text
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    doc.setTextColor(...COLORS.black)
    doc.text(`${icon}  ${title}`, 25, y + 11)

    // Subtle line
    doc.setDrawColor(...COLORS.grayLight)
    doc.setLineWidth(0.5)
    doc.line(25, y + 18, pageWidth - 15, y + 18)

    return y + 24
}

/**
 * Draw a metric box
 */
const drawMetricBox = (doc, x, y, width, label, value, highlight = false) => {
    // Background
    if (highlight) {
        doc.setFillColor(...COLORS.limeLight)
    } else {
        doc.setFillColor(...COLORS.grayLight)
    }
    doc.roundedRect(x, y, width, 32, 3, 3, 'F')

    // Label
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(...COLORS.gray)
    doc.text(label, x + width / 2, y + 10, { align: 'center' })

    // Value
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    doc.setTextColor(...COLORS.black)
    doc.text(String(value), x + width / 2, y + 24, { align: 'center' })

    return y + 38
}

/**
 * Draw a horizontal bar chart
 */
const drawBarChart = (doc, data, x, y, maxWidth, maxBarHeight = 8) => {
    if (!data || data.length === 0) return y

    const maxVal = Math.max(...data.map(d => d.value), 1)
    const barSpacing = maxBarHeight + 8

    data.forEach((item, i) => {
        const barY = y + i * barSpacing
        const barWidth = (item.value / maxVal) * (maxWidth - 80)

        // Check page overflow
        if (barY > doc.internal.pageSize.getHeight() - 30) return

        // Label
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8)
        doc.setTextColor(...COLORS.gray)
        doc.text(item.label, x, barY + maxBarHeight - 1)

        // Bar background
        doc.setFillColor(...COLORS.grayLight)
        doc.roundedRect(x + 75, barY, maxWidth - 80, maxBarHeight, 2, 2, 'F')

        // Bar fill
        if (barWidth > 0) {
            doc.setFillColor(...COLORS.darkLime)
            doc.roundedRect(x + 75, barY, Math.max(barWidth, 4), maxBarHeight, 2, 2, 'F')
        }

        // Value
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(8)
        doc.setTextColor(...COLORS.black)
        doc.text(String(item.valueLabel || item.value), x + 75 + Math.max(barWidth, 4) + 4, barY + maxBarHeight - 1)
    })

    return y + data.length * barSpacing + 5
}

/**
 * Draw footer
 */
const drawFooter = (doc) => {
    const pageCount = doc.internal.getNumberOfPages()
    const pageHeight = doc.internal.pageSize.getHeight()
    const pageWidth = doc.internal.pageSize.getWidth()

    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)

        // Footer line
        doc.setDrawColor(...COLORS.darkLime)
        doc.setLineWidth(1)
        doc.line(15, pageHeight - 18, pageWidth - 15, pageHeight - 18)

        // Footer text
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(7)
        doc.setTextColor(...COLORS.gray)
        doc.text(
            `GymPro - Reporte generado el ${new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`,
            15,
            pageHeight - 10
        )
        doc.text(`Página ${i} de ${pageCount}`, pageWidth - 15, pageHeight - 10, { align: 'right' })
    }
}

import { getCurrencySymbol, getCurrencyLocale } from './currencyConfig'

/**
 * Format currency using system-configured currency
 */
const fmt = (val) => {
    const n = parseFloat(val) || 0
    return getCurrencySymbol() + n.toLocaleString(getCurrencyLocale(), { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const fmtN = (val) => {
    return (parseFloat(val) || 0).toLocaleString(getCurrencyLocale())
}

// ═══════════════════════════════════════════════════════
//  PUBLIC EXPORT FUNCTIONS
// ═══════════════════════════════════════════════════════

/**
 * Generate a full comprehensive PDF report
 */
export const generateFullPDF = (revenueData, comparative, clientData, attendanceData, products, periodo) => {
    const doc = new jsPDF('p', 'mm', 'letter')
    const pageWidth = doc.internal.pageSize.getWidth()
    const margin = 15
    const contentWidth = pageWidth - margin * 2

    let y = drawHeader(doc, 'REPORTE COMPLETO', periodo)

    // ─── 1. INGRESOS ───
    y = drawSectionTitle(doc, 'INGRESOS', y, '💰')

    const ingresos = comparative?.ingresos || {}
    const cambio = ingresos.cambio_porcentaje || 0
    const boxWidth = (contentWidth - 10) / 3

    drawMetricBox(doc, margin, y, boxWidth, 'ESTE MES', fmt(ingresos.actual || 0), true)
    drawMetricBox(doc, margin + boxWidth + 5, y, boxWidth, 'MES ANTERIOR', fmt(ingresos.anterior || 0))
    drawMetricBox(doc, margin + (boxWidth + 5) * 2, y, boxWidth, 'DIFERENCIA',
        `${cambio >= 0 ? '+' : ''}${cambio}%`, cambio >= 0)
    y += 40

    // Revenue breakdown by type
    const porTipo = revenueData?.por_tipo || []
    const totalIngresos = revenueData?.total_ingresos || 0

    if (porTipo.length > 0) {
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(9)
        doc.setTextColor(...COLORS.black)
        doc.text('Desglose por concepto:', margin, y)
        y += 6

        autoTable(doc, {
            startY: y,
            margin: { left: margin, right: margin },
            head: [['Concepto', 'Total', '% del Total']],
            body: porTipo.map(t => {
                const pct = totalIngresos > 0 ? ((t.total / totalIngresos) * 100).toFixed(1) : '0'
                return [t.tipo?.charAt(0).toUpperCase() + t.tipo?.slice(1), fmt(t.total), `${pct}%`]
            }),
            headStyles: {
                fillColor: COLORS.black,
                textColor: COLORS.lime,
                fontStyle: 'bold',
                fontSize: 9,
            },
            bodyStyles: { fontSize: 9, textColor: COLORS.black },
            alternateRowStyles: { fillColor: COLORS.grayLight },
            styles: { cellPadding: 3 },
        })
        y = doc.lastAutoTable.finalY + 8
    }

    // Revenue by day chart
    const porPeriodo = revenueData?.por_periodo || []
    if (porPeriodo.length > 0) {
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(9)
        doc.setTextColor(...COLORS.black)
        doc.text('Ingresos por día:', margin, y)
        y += 6

        const chartData = porPeriodo.slice(0, 15).reverse().map(p => ({
            label: p.periodo?.substring(5) || p.periodo,
            value: parseFloat(p.total) || 0,
            valueLabel: fmt(p.total)
        }))
        y = drawBarChart(doc, chartData, margin, y, contentWidth)
    }

    // ─── 2. CLIENTES ───
    y = drawSectionTitle(doc, 'CLIENTES', y, '👥')

    const halfWidth = (contentWidth - 15) / 4

    drawMetricBox(doc, margin, y, halfWidth, 'TOTAL ACTIVOS', fmtN(clientData?.total_activos || 0), true)
    drawMetricBox(doc, margin + halfWidth + 5, y, halfWidth, 'NUEVOS', fmtN(clientData?.nuevos || 0))
    drawMetricBox(doc, margin + (halfWidth + 5) * 2, y, halfWidth, 'RENOVACIONES', fmtN(clientData?.renovaciones || 0))
    drawMetricBox(doc, margin + (halfWidth + 5) * 3, y, halfWidth, 'CANCELACIONES', fmtN(clientData?.cancelaciones || 0))
    y += 40

    // Renewal rate
    const tasaRen = clientData?.tasa_renovacion || 0
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...COLORS.gray)
    doc.text('Tasa de renovación:', margin, y)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...COLORS.darkLime)
    doc.text(`${tasaRen}%`, margin + 45, y)

    // Draw a progress bar
    doc.setFillColor(...COLORS.grayLight)
    doc.roundedRect(margin + 60, y - 4, contentWidth - 60, 6, 3, 3, 'F')
    if (tasaRen > 0) {
        doc.setFillColor(...COLORS.darkLime)
        doc.roundedRect(margin + 60, y - 4, Math.max(((contentWidth - 60) * Math.min(tasaRen, 100)) / 100, 4), 6, 3, 3, 'F')
    }
    y += 14

    // ─── 3. ASISTENCIAS ───
    y = drawSectionTitle(doc, 'ASISTENCIAS', y, '📅')

    const thirdWidth = (contentWidth - 10) / 3
    drawMetricBox(doc, margin, y, thirdWidth, 'TOTAL DEL MES', fmtN(attendanceData?.total_asistencias || 0), true)
    drawMetricBox(doc, margin + thirdWidth + 5, y, thirdWidth, 'PROMEDIO DIARIO', fmtN(attendanceData?.promedio_diario || 0))

    // Peak hour
    const peakHour = attendanceData?.por_hora?.length
        ? attendanceData.por_hora.reduce((a, b) => a.total > b.total ? a : b)
        : null
    drawMetricBox(doc, margin + (thirdWidth + 5) * 2, y, thirdWidth, 'HORA PICO',
        peakHour ? `${peakHour.hora}:00` : '-')
    y += 40

    // Attendance by day
    const porDia = attendanceData?.por_dia || []
    if (porDia.length > 0) {
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(9)
        doc.setTextColor(...COLORS.black)
        doc.text('Asistencias por día:', margin, y)
        y += 6

        const attendChartData = porDia.slice(0, 15).reverse().map(d => ({
            label: d.fecha?.substring(5) || d.fecha,
            value: d.total,
            valueLabel: String(d.total)
        }))
        y = drawBarChart(doc, attendChartData, margin, y, contentWidth)
    }

    // Hourly distribution
    const porHora = attendanceData?.por_hora || []
    if (porHora.length > 0) {
        // Check page
        if (y > doc.internal.pageSize.getHeight() - 80) {
            doc.addPage()
            y = 20
        }

        doc.setFont('helvetica', 'bold')
        doc.setFontSize(9)
        doc.setTextColor(...COLORS.black)
        doc.text('Distribución por hora:', margin, y)
        y += 6

        autoTable(doc, {
            startY: y,
            margin: { left: margin, right: margin },
            head: [['Hora', 'Asistencias']],
            body: porHora.map(h => [`${h.hora}:00`, String(h.total)]),
            headStyles: {
                fillColor: COLORS.black,
                textColor: COLORS.lime,
                fontStyle: 'bold',
                fontSize: 9,
            },
            bodyStyles: { fontSize: 9, textColor: COLORS.black },
            alternateRowStyles: { fillColor: COLORS.grayLight },
            styles: { cellPadding: 3 },
            columnStyles: { 0: { cellWidth: 30 } },
        })
        y = doc.lastAutoTable.finalY + 8
    }

    // ─── 4. PRODUCTOS MÁS VENDIDOS ───
    y = drawSectionTitle(doc, 'PRODUCTOS MÁS VENDIDOS', y, '🛍️')

    const prods = products || []
    if (prods.length > 0) {
        autoTable(doc, {
            startY: y,
            margin: { left: margin, right: margin },
            head: [['#', 'Producto', 'Unidades', 'Ingresos']],
            body: prods.map((p, i) => [
                String(i + 1),
                p.nombre,
                fmtN(p.unidades_vendidas),
                fmt(p.ingresos_total)
            ]),
            headStyles: {
                fillColor: COLORS.black,
                textColor: COLORS.lime,
                fontStyle: 'bold',
                fontSize: 9,
            },
            bodyStyles: { fontSize: 9, textColor: COLORS.black },
            alternateRowStyles: { fillColor: COLORS.grayLight },
            styles: { cellPadding: 3 },
            columnStyles: {
                0: { cellWidth: 12, halign: 'center' },
                2: { halign: 'center' },
                3: { halign: 'right' },
            },
            didDrawCell: (data) => {
                // Highlight top 3 rows
                if (data.section === 'body' && data.row.index < 3 && data.column.index === 0) {
                    const medals = ['🥇', '🥈', '🥉']
                    doc.setFontSize(10)
                    doc.text(medals[data.row.index], data.cell.x + data.cell.width / 2, data.cell.y + data.cell.height / 2 + 1, { align: 'center' })
                }
            }
        })
        y = doc.lastAutoTable.finalY + 8
    } else {
        doc.setFont('helvetica', 'italic')
        doc.setFontSize(9)
        doc.setTextColor(...COLORS.gray)
        doc.text('No hay ventas de productos en este período.', margin, y)
        y += 10
    }

    // Footer
    drawFooter(doc)

    // Save
    doc.save(`Reporte_GymPro_${periodo.replace(/\s/g, '_')}.pdf`)
}

/**
 * Generate revenue-only PDF
 */
export const generateRevenuePDF = (revenueData, comparative, periodo) => {
    const doc = new jsPDF('p', 'mm', 'letter')
    const margin = 15
    const contentWidth = doc.internal.pageSize.getWidth() - margin * 2

    let y = drawHeader(doc, 'REPORTE DE INGRESOS', periodo)

    y = drawSectionTitle(doc, 'RESUMEN DE INGRESOS', y, '💰')

    const ingresos = comparative?.ingresos || {}
    const boxWidth = (contentWidth - 10) / 3
    drawMetricBox(doc, margin, y, boxWidth, 'ESTE MES', fmt(ingresos.actual || 0), true)
    drawMetricBox(doc, margin + boxWidth + 5, y, boxWidth, 'MES ANTERIOR', fmt(ingresos.anterior || 0))
    const cambio = ingresos.cambio_porcentaje || 0
    drawMetricBox(doc, margin + (boxWidth + 5) * 2, y, boxWidth, 'DIFERENCIA',
        `${cambio >= 0 ? '+' : ''}${cambio}%`, cambio >= 0)
    y += 42

    // Tables
    const porTipo = revenueData?.por_tipo || []
    const porMetodo = revenueData?.por_metodo || []
    const porPeriodo = revenueData?.por_periodo || []

    if (porTipo.length > 0) {
        y = drawSectionTitle(doc, 'POR CONCEPTO', y)
        autoTable(doc, {
            startY: y,
            margin: { left: margin, right: margin },
            head: [['Concepto', 'Total', 'Transacciones']],
            body: porTipo.map(t => [t.tipo, fmt(t.total), String(t.cantidad)]),
            headStyles: { fillColor: COLORS.black, textColor: COLORS.lime, fontStyle: 'bold', fontSize: 9 },
            bodyStyles: { fontSize: 9 },
            alternateRowStyles: { fillColor: COLORS.grayLight },
        })
        y = doc.lastAutoTable.finalY + 8
    }

    if (porMetodo.length > 0) {
        y = drawSectionTitle(doc, 'POR MÉTODO DE PAGO', y)
        autoTable(doc, {
            startY: y,
            margin: { left: margin, right: margin },
            head: [['Método', 'Total', 'Transacciones']],
            body: porMetodo.map(m => [m.metodo_pago || 'N/A', fmt(m.total), String(m.cantidad)]),
            headStyles: { fillColor: COLORS.black, textColor: COLORS.lime, fontStyle: 'bold', fontSize: 9 },
            bodyStyles: { fontSize: 9 },
            alternateRowStyles: { fillColor: COLORS.grayLight },
        })
        y = doc.lastAutoTable.finalY + 8
    }

    if (porPeriodo.length > 0) {
        y = drawSectionTitle(doc, 'DETALLE POR DÍA', y)
        autoTable(doc, {
            startY: y,
            margin: { left: margin, right: margin },
            head: [['Fecha', 'Total', 'Transacciones']],
            body: porPeriodo.map(p => [p.periodo, fmt(p.total), String(p.cantidad)]),
            headStyles: { fillColor: COLORS.black, textColor: COLORS.lime, fontStyle: 'bold', fontSize: 9 },
            bodyStyles: { fontSize: 9 },
            alternateRowStyles: { fillColor: COLORS.grayLight },
        })
    }

    drawFooter(doc)
    doc.save(`Reporte_Ingresos_GymPro_${periodo.replace(/\s/g, '_')}.pdf`)
}

/**
 * Generate clients-only PDF
 */
export const generateClientsPDF = (clientData, periodo) => {
    const doc = new jsPDF('p', 'mm', 'letter')
    const margin = 15
    const contentWidth = doc.internal.pageSize.getWidth() - margin * 2

    let y = drawHeader(doc, 'REPORTE DE CLIENTES', periodo)
    y = drawSectionTitle(doc, 'ESTADÍSTICAS DE CLIENTES', y, '👥')

    const halfWidth = (contentWidth - 15) / 4
    drawMetricBox(doc, margin, y, halfWidth, 'TOTAL ACTIVOS', fmtN(clientData?.total_activos || 0), true)
    drawMetricBox(doc, margin + halfWidth + 5, y, halfWidth, 'NUEVOS', fmtN(clientData?.nuevos || 0))
    drawMetricBox(doc, margin + (halfWidth + 5) * 2, y, halfWidth, 'RENOVACIONES', fmtN(clientData?.renovaciones || 0))
    drawMetricBox(doc, margin + (halfWidth + 5) * 3, y, halfWidth, 'CANCELACIONES', fmtN(clientData?.cancelaciones || 0))
    y += 42

    // Summary table
    autoTable(doc, {
        startY: y,
        margin: { left: margin, right: margin },
        head: [['Métrica', 'Valor']],
        body: [
            ['Total de clientes activos', fmtN(clientData?.total_activos || 0)],
            ['Clientes nuevos en el período', fmtN(clientData?.nuevos || 0)],
            ['Renovaciones de membresía', fmtN(clientData?.renovaciones || 0)],
            ['Cancelaciones / No renovaciones', fmtN(clientData?.cancelaciones || 0)],
            ['Tasa de renovación', `${clientData?.tasa_renovacion || 0}%`],
        ],
        headStyles: { fillColor: COLORS.black, textColor: COLORS.lime, fontStyle: 'bold', fontSize: 9 },
        bodyStyles: { fontSize: 9 },
        alternateRowStyles: { fillColor: COLORS.grayLight },
    })

    drawFooter(doc)
    doc.save(`Reporte_Clientes_GymPro_${periodo.replace(/\s/g, '_')}.pdf`)
}

/**
 * Generate attendance-only PDF
 */
export const generateAttendancePDF = (attendanceData, periodo) => {
    const doc = new jsPDF('p', 'mm', 'letter')
    const margin = 15
    const contentWidth = doc.internal.pageSize.getWidth() - margin * 2

    let y = drawHeader(doc, 'REPORTE DE ASISTENCIAS', periodo)
    y = drawSectionTitle(doc, 'RESUMEN DE ASISTENCIAS', y, '📅')

    const thirdWidth = (contentWidth - 10) / 3
    drawMetricBox(doc, margin, y, thirdWidth, 'TOTAL', fmtN(attendanceData?.total_asistencias || 0), true)
    drawMetricBox(doc, margin + thirdWidth + 5, y, thirdWidth, 'PROMEDIO DIARIO', fmtN(attendanceData?.promedio_diario || 0))
    const peakHour = attendanceData?.por_hora?.length
        ? attendanceData.por_hora.reduce((a, b) => a.total > b.total ? a : b) : null
    drawMetricBox(doc, margin + (thirdWidth + 5) * 2, y, thirdWidth, 'HORA PICO', peakHour ? `${peakHour.hora}:00` : '-')
    y += 42

    // Daily table
    const porDia = attendanceData?.por_dia || []
    if (porDia.length > 0) {
        y = drawSectionTitle(doc, 'ASISTENCIAS POR DÍA', y)
        autoTable(doc, {
            startY: y,
            margin: { left: margin, right: margin },
            head: [['Fecha', 'Total Asistencias']],
            body: porDia.map(d => [d.fecha, String(d.total)]),
            headStyles: { fillColor: COLORS.black, textColor: COLORS.lime, fontStyle: 'bold', fontSize: 9 },
            bodyStyles: { fontSize: 9 },
            alternateRowStyles: { fillColor: COLORS.grayLight },
        })
        y = doc.lastAutoTable.finalY + 8
    }

    // Hourly table
    const porHora = attendanceData?.por_hora || []
    if (porHora.length > 0) {
        y = drawSectionTitle(doc, 'DISTRIBUCIÓN POR HORA', y)
        autoTable(doc, {
            startY: y,
            margin: { left: margin, right: margin },
            head: [['Hora', 'Total Asistencias']],
            body: porHora.map(h => [`${h.hora}:00`, String(h.total)]),
            headStyles: { fillColor: COLORS.black, textColor: COLORS.lime, fontStyle: 'bold', fontSize: 9 },
            bodyStyles: { fontSize: 9 },
            alternateRowStyles: { fillColor: COLORS.grayLight },
        })
        y = doc.lastAutoTable.finalY + 8
    }

    // Top clients table
    const topClientes = attendanceData?.top_clientes || []
    if (topClientes.length > 0) {
        y = drawSectionTitle(doc, 'CLIENTES MÁS FRECUENTES', y)
        autoTable(doc, {
            startY: y,
            margin: { left: margin, right: margin },
            head: [['#', 'Código', 'Nombre', 'Visitas']],
            body: topClientes.map((c, i) => [String(i + 1), c.codigo, `${c.nombre} ${c.apellido}`, String(c.visitas)]),
            headStyles: { fillColor: COLORS.black, textColor: COLORS.lime, fontStyle: 'bold', fontSize: 9 },
            bodyStyles: { fontSize: 9 },
            alternateRowStyles: { fillColor: COLORS.grayLight },
        })
    }

    drawFooter(doc)
    doc.save(`Reporte_Asistencias_GymPro_${periodo.replace(/\s/g, '_')}.pdf`)
}

/**
 * Generate products/sales PDF
 */
export const generateProductsPDF = (products, periodo) => {
    const doc = new jsPDF('p', 'mm', 'letter')
    const margin = 15

    let y = drawHeader(doc, 'REPORTE DE VENTAS', periodo)
    y = drawSectionTitle(doc, 'PRODUCTOS MÁS VENDIDOS', y, '🛍️')

    const prods = products || []
    if (prods.length > 0) {
        // Summary
        const totalUnits = prods.reduce((s, p) => s + (p.unidades_vendidas || 0), 0)
        const totalRev = prods.reduce((s, p) => s + (parseFloat(p.ingresos_total) || 0), 0)

        const contentWidth = doc.internal.pageSize.getWidth() - margin * 2
        const halfW = (contentWidth - 5) / 2
        drawMetricBox(doc, margin, y, halfW, 'TOTAL UNIDADES VENDIDAS', fmtN(totalUnits), true)
        drawMetricBox(doc, margin + halfW + 5, y, halfW, 'INGRESOS POR PRODUCTOS', fmt(totalRev), true)
        y += 42

        autoTable(doc, {
            startY: y,
            margin: { left: margin, right: margin },
            head: [['#', 'Producto', 'Unidades Vendidas', 'Ingresos']],
            body: prods.map((p, i) => [
                String(i + 1),
                p.nombre,
                fmtN(p.unidades_vendidas),
                fmt(p.ingresos_total)
            ]),
            headStyles: { fillColor: COLORS.black, textColor: COLORS.lime, fontStyle: 'bold', fontSize: 9 },
            bodyStyles: { fontSize: 9 },
            alternateRowStyles: { fillColor: COLORS.grayLight },
            columnStyles: {
                0: { cellWidth: 12, halign: 'center' },
                2: { halign: 'center' },
                3: { halign: 'right' },
            },
        })
    } else {
        doc.setFont('helvetica', 'italic')
        doc.setFontSize(9)
        doc.setTextColor(...COLORS.gray)
        doc.text('No hay ventas de productos en este período.', margin, y)
    }

    drawFooter(doc)
    doc.save(`Reporte_Productos_GymPro_${periodo.replace(/\s/g, '_')}.pdf`)
}
