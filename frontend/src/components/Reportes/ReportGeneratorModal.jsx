import { useState, useEffect } from 'react'
import { X, FileText, Download } from 'lucide-react'
import { reportsAPI } from '../../services/api'
import {
    exportRevenueCSV,
    exportClientStatsCSV,
    exportAttendanceCSV,
    exportTopProductsCSV,
    exportFullReport
} from '../../utils/reportExporter'
import {
    generateFullPDF,
    generateRevenuePDF,
    generateClientsPDF,
    generateAttendancePDF,
    generateProductsPDF
} from '../../utils/pdfReportGenerator'
import toast from 'react-hot-toast'

const reportTypes = [
    { id: 'ingresos_egresos', label: 'Ingresos y egresos' },
    { id: 'clientes', label: 'Clientes (nuevos, activos, bajas)' },
    { id: 'asistencias', label: 'Asistencias' },
    { id: 'ventas_tienda', label: 'Ventas de tienda' },
    { id: 'inventario', label: 'Inventario actual' },
    { id: 'completo', label: 'Reporte completo' },
]

const formatOptions = [
    { id: 'pdf', label: 'PDF' },
    { id: 'excel', label: 'Excel' },
    { id: 'ambos', label: 'Ambos' },
]

const ReportGeneratorModal = ({ isOpen, onClose, fechaInicio: defaultInicio, fechaFin: defaultFin }) => {
    const [tipo, setTipo] = useState('completo')
    const [formato, setFormato] = useState('pdf')
    const [desde, setDesde] = useState(defaultInicio || '')
    const [hasta, setHasta] = useState(defaultFin || '')
    const [generating, setGenerating] = useState(false)

    useEffect(() => {
        if (defaultInicio) setDesde(defaultInicio)
        if (defaultFin) setHasta(defaultFin)
    }, [defaultInicio, defaultFin])

    if (!isOpen) return null

    const periodoLabel = (() => {
        try {
            const start = new Date(desde + 'T00:00:00')
            const end = new Date(hasta + 'T00:00:00')
            const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
            if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
                return `${months[start.getMonth()]} ${start.getFullYear()}`
            }
            return `${desde} a ${hasta}`
        } catch {
            return `${desde} a ${hasta}`
        }
    })()

    const handleGenerate = async () => {
        if (!desde || !hasta) {
            toast.error('Selecciona un rango de fechas')
            return
        }

        setGenerating(true)
        const params = { fecha_inicio: desde, fecha_fin: hasta }
        const doPDF = formato === 'pdf' || formato === 'ambos'
        const doCSV = formato === 'excel' || formato === 'ambos'

        try {
            switch (tipo) {
                case 'ingresos_egresos': {
                    const [incomeRes, compRes] = await Promise.all([
                        reportsAPI.getIncome(params),
                        reportsAPI.getComparative(params)
                    ])
                    if (doPDF) generateRevenuePDF(incomeRes.data, compRes.data, periodoLabel)
                    if (doCSV) exportRevenueCSV(incomeRes.data, compRes.data, `reporte_ingresos_${desde}_${hasta}.csv`)
                    break
                }
                case 'clientes': {
                    const res = await reportsAPI.getClientStats(params)
                    if (doPDF) generateClientsPDF(res.data, periodoLabel)
                    if (doCSV) exportClientStatsCSV(res.data, `reporte_clientes_${desde}_${hasta}.csv`)
                    break
                }
                case 'asistencias': {
                    const res = await reportsAPI.getAttendance(params)
                    if (doPDF) generateAttendancePDF(res.data, periodoLabel)
                    if (doCSV) exportAttendanceCSV(res.data, `reporte_asistencias_${desde}_${hasta}.csv`)
                    break
                }
                case 'ventas_tienda':
                case 'inventario': {
                    const res = await reportsAPI.getTopProducts(params)
                    if (doPDF) generateProductsPDF(res.data.productos || [], periodoLabel)
                    if (doCSV) exportTopProductsCSV(res.data.productos || [], `reporte_productos_${desde}_${hasta}.csv`)
                    break
                }
                case 'completo':
                default: {
                    const [incomeRes, compRes, clientRes, attendRes, prodRes] = await Promise.all([
                        reportsAPI.getIncome(params),
                        reportsAPI.getComparative(params),
                        reportsAPI.getClientStats(params),
                        reportsAPI.getAttendance(params),
                        reportsAPI.getTopProducts(params),
                    ])
                    if (doPDF) {
                        generateFullPDF(
                            incomeRes.data, compRes.data, clientRes.data,
                            attendRes.data, prodRes.data.productos || [], periodoLabel
                        )
                    }
                    if (doCSV) {
                        exportFullReport(
                            incomeRes.data, compRes.data, clientRes.data,
                            attendRes.data, prodRes.data.productos || [], periodoLabel
                        )
                    }
                    break
                }
            }

            toast.success(
                formato === 'ambos'
                    ? 'Reportes PDF y Excel generados exitosamente'
                    : `Reporte ${formato.toUpperCase()} generado exitosamente`
            )
            onClose()
        } catch (error) {
            console.error('Report generation error:', error)
            toast.error('Error al generar el reporte')
        } finally {
            setGenerating(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

            <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-gray-900 to-black px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-lime-500/20 rounded-lg">
                                <FileText className="w-5 h-5 text-lime-400" />
                            </div>
                            <h2 className="text-lg font-bold text-white">Generar Reporte</h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1.5 text-white/80 hover:text-white hover:bg-white dark:bg-gray-800 dark:bg-gray-800/20 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="px-6 py-5 space-y-5 max-h-[60vh] overflow-y-auto">
                    {/* Report type */}
                    <div>
                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 block">Tipo de reporte</label>
                        <div className="space-y-2">
                            {reportTypes.map(opt => (
                                <label
                                    key={opt.id}
                                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${tipo === opt.id
                                            ? 'border-lime-500 bg-lime-50 ring-1 ring-lime-500'
                                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-900 dark:bg-gray-900'
                                        }`}
                                >
                                    <input
                                        type="radio" name="tipo" value={opt.id}
                                        checked={tipo === opt.id}
                                        onChange={(e) => setTipo(e.target.value)}
                                        className="w-4 h-4 text-lime-600 focus:ring-lime-500"
                                    />
                                    <span className={`text-sm font-medium ${tipo === opt.id ? 'text-lime-700' : 'text-gray-700 dark:text-gray-300'}`}>
                                        {opt.label}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Date range */}
                    <div>
                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 block">Período</label>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Desde</label>
                                <input
                                    type="date" value={desde}
                                    onChange={(e) => setDesde(e.target.value)}
                                    className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-sm focus:ring-2 focus:ring-lime-500 focus:border-lime-500"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Hasta</label>
                                <input
                                    type="date" value={hasta}
                                    onChange={(e) => setHasta(e.target.value)}
                                    className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-sm focus:ring-2 focus:ring-lime-500 focus:border-lime-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Format */}
                    <div>
                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 block">Formato</label>
                        <div className="flex gap-2">
                            {formatOptions.map(opt => (
                                <button
                                    key={opt.id}
                                    onClick={() => setFormato(opt.id)}
                                    className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium border transition-all ${formato === opt.id
                                            ? 'border-lime-500 bg-lime-50 text-lime-700 ring-1 ring-lime-500'
                                            : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-900 dark:bg-gray-900'
                                        }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-700 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700 dark:bg-gray-700 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleGenerate}
                        disabled={generating}
                        className="flex-1 px-4 py-2.5 bg-gradient-to-r from-gray-900 to-black text-lime-400 rounded-xl text-sm font-bold hover:from-gray-800 hover:to-gray-900 transition-all disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg"
                    >
                        {generating ? (
                            <>
                                <div className="w-4 h-4 border-2 border-lime-400/30 border-t-lime-400 rounded-full animate-spin" />
                                Generando...
                            </>
                        ) : (
                            <>
                                <Download className="w-4 h-4" />
                                Generar
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default ReportGeneratorModal
