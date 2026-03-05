import { useState, useMemo, useCallback } from 'react'
import { BarChart3, FileText, FileSpreadsheet, Printer } from 'lucide-react'
import RevenueSection from './RevenueSection'
import ClientsSection from './ClientsSection'
import AttendanceSection from './AttendanceSection'
import TopProductsSection from './TopProductsSection'
import MachinesSection from './MachinesSection'
import AlertsSection from './AlertsSection'
import ReportGeneratorModal from './ReportGeneratorModal'
import { reportsAPI } from '../../services/api'
import { exportFullReport } from '../../utils/reportExporter'
import { generateFullPDF } from '../../utils/pdfReportGenerator'
import toast from 'react-hot-toast'

const MONTHS = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

const Reportes = () => {
    const now = new Date()
    const [selectedMonth, setSelectedMonth] = useState(now.getMonth())
    const [selectedYear, setSelectedYear] = useState(now.getFullYear())
    const [showReportModal, setShowReportModal] = useState(false)
    const [exporting, setExporting] = useState(false)
    const [exportingPDF, setExportingPDF] = useState(false)

    // Compute date range from selected month/year
    const { fechaInicio, fechaFin } = useMemo(() => {
        const start = new Date(selectedYear, selectedMonth, 1)
        const end = new Date(selectedYear, selectedMonth + 1, 0)
        return {
            fechaInicio: start.toISOString().split('T')[0],
            fechaFin: end.toISOString().split('T')[0]
        }
    }, [selectedMonth, selectedYear])

    const periodoLabel = `${MONTHS[selectedMonth]} ${selectedYear}`
    const yearOptions = [now.getFullYear(), now.getFullYear() - 1, now.getFullYear() - 2]

    // Fetch all data helper
    const fetchAllData = useCallback(async () => {
        const params = { fecha_inicio: fechaInicio, fecha_fin: fechaFin }
        const [incomeRes, compRes, clientRes, attendRes, prodRes] = await Promise.all([
            reportsAPI.getIncome(params),
            reportsAPI.getComparative(params),
            reportsAPI.getClientStats(params),
            reportsAPI.getAttendance(params),
            reportsAPI.getTopProducts(params),
        ])
        return { incomeRes, compRes, clientRes, attendRes, prodRes }
    }, [fechaInicio, fechaFin])

    // Export to Excel/CSV
    const handleExportExcel = useCallback(async () => {
        setExporting(true)
        try {
            const { incomeRes, compRes, clientRes, attendRes, prodRes } = await fetchAllData()
            exportFullReport(
                incomeRes.data, compRes.data, clientRes.data,
                attendRes.data, prodRes.data.productos || [], periodoLabel
            )
            toast.success('Reporte Excel exportado exitosamente')
        } catch (error) {
            console.error('Export error:', error)
            toast.error('Error al exportar reporte')
        } finally {
            setExporting(false)
        }
    }, [fetchAllData, periodoLabel])

    // Export to PDF
    const handleExportPDF = useCallback(async () => {
        setExportingPDF(true)
        try {
            const { incomeRes, compRes, clientRes, attendRes, prodRes } = await fetchAllData()
            generateFullPDF(
                incomeRes.data, compRes.data, clientRes.data,
                attendRes.data, prodRes.data.productos || [], periodoLabel
            )
            toast.success('Reporte PDF generado exitosamente')
        } catch (error) {
            console.error('PDF export error:', error)
            toast.error('Error al generar PDF')
        } finally {
            setExportingPDF(false)
        }
    }, [fetchAllData, periodoLabel])

    return (
        <div className="space-y-6">
            {/* Page header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-gradient-to-br from-gray-900 to-black text-lime-400 shadow-lg shadow-gray-900/30">
                        <BarChart3 className="w-7 h-7" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white dark:text-white">Métricas y Reportes</h1>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">Análisis detallado del rendimiento del gimnasio</p>
                    </div>
                </div>

                {/* Period selectors */}
                <div className="flex items-center gap-2 flex-wrap">
                    <select
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-lime-500 focus:border-lime-500 shadow-sm cursor-pointer"
                    >
                        {MONTHS.map((m, i) => (
                            <option key={i} value={i}>{m}</option>
                        ))}
                    </select>
                    <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-lime-500 focus:border-lime-500 shadow-sm cursor-pointer"
                    >
                        {yearOptions.map(y => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Metrics grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <RevenueSection fechaInicio={fechaInicio} fechaFin={fechaFin} />
                <ClientsSection fechaInicio={fechaInicio} fechaFin={fechaFin} />
                <AttendanceSection fechaInicio={fechaInicio} fechaFin={fechaFin} />
                <TopProductsSection fechaInicio={fechaInicio} fechaFin={fechaFin} />
                <MachinesSection />
                <AlertsSection />
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-3">
                <button
                    onClick={() => setShowReportModal(true)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-gray-900 to-black text-lime-400 rounded-xl text-sm font-bold hover:from-gray-800 hover:to-gray-900 transition-all shadow-lg"
                >
                    <FileText className="w-4 h-4" />
                    Generar Reporte
                </button>
                <button
                    onClick={handleExportPDF}
                    disabled={exportingPDF}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-900 transition-colors shadow-sm disabled:opacity-60"
                >
                    {exportingPDF ? (
                        <>
                            <div className="w-4 h-4 border-2 border-gray-300 dark:border-gray-600 border-t-gray-600 rounded-full animate-spin" />
                            Exportando...
                        </>
                    ) : (
                        <>
                            <FileText className="w-4 h-4 text-red-500" />
                            Exportar PDF
                        </>
                    )}
                </button>
                <button
                    onClick={handleExportExcel}
                    disabled={exporting}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-900 transition-colors shadow-sm disabled:opacity-60"
                >
                    {exporting ? (
                        <>
                            <div className="w-4 h-4 border-2 border-gray-300 dark:border-gray-600 border-t-gray-600 rounded-full animate-spin" />
                            Exportando...
                        </>
                    ) : (
                        <>
                            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                            Exportar Excel
                        </>
                    )}
                </button>
                <button
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-900 transition-colors shadow-sm"
                >
                    <Printer className="w-4 h-4 text-gray-500" />
                    Imprimir
                </button>
            </div>

            {/* Report Generator Modal */}
            <ReportGeneratorModal
                isOpen={showReportModal}
                onClose={() => setShowReportModal(false)}
                fechaInicio={fechaInicio}
                fechaFin={fechaFin}
            />
        </div>
    )
}

export default Reportes
