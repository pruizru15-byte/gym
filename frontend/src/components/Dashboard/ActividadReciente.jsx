import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { dashboardAPI } from '../../services/api'
import {
    LogIn, CreditCard, ShoppingCart,
    Clock, RefreshCw, Activity,
    ChevronLeft, ChevronRight
} from 'lucide-react'
import { getRelativeTime, formatCurrency } from '../../utils/formatters'

const PAGE_SIZE = 5

const ActividadReciente = () => {
    const [actividad, setActividad] = useState([])
    const [loading, setLoading] = useState(true)
    const [page, setPage] = useState(1)

    useEffect(() => {
        fetchActividad()
    }, [])

    const fetchActividad = async () => {
        setLoading(true)
        setPage(1)
        try {
            const res = await dashboardAPI.getRecentActivity()
            setActividad(Array.isArray(res.data) ? res.data : [])
        } catch (err) {
            console.error('Error fetching recent activity:', err)
            setActividad([])
        } finally {
            setLoading(false)
        }
    }

    // Pagination
    const totalPages = Math.max(1, Math.ceil(actividad.length / PAGE_SIZE))
    const start = (page - 1) * PAGE_SIZE
    const pageItems = actividad.slice(start, start + PAGE_SIZE)

    const tipoConfig = {
        checkin: {
            icon: <LogIn className="w-4 h-4 text-green-600" />,
            bg: 'bg-green-100 dark:bg-green-900/30',
            label: 'Check-in',
            labelColor: 'text-green-700',
            link: '/check-in'
        },
        membresia: {
            icon: <CreditCard className="w-4 h-4 text-blue-600" />,
            bg: 'bg-blue-100 dark:bg-blue-900/30',
            label: 'Membresía',
            labelColor: 'text-blue-700',
            link: '/pagos'
        },
        venta: {
            icon: <ShoppingCart className="w-4 h-4 text-purple-600" />,
            bg: 'bg-purple-100 dark:bg-purple-900/30',
            label: 'Venta',
            labelColor: 'text-purple-700',
            link: '/tienda/punto-venta'
        }
    }

    return (
        <div className="card">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Activity className="w-5 h-5 text-primary-600" />
                    Actividad Reciente
                    {!loading && actividad.length > 0 && (
                        <span className="text-xs font-normal text-gray-400 ml-1">
                            ({actividad.length} eventos)
                        </span>
                    )}
                </h2>
                <button
                    onClick={fetchActividad}
                    className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    title="Actualizar"
                >
                    <RefreshCw className="w-4 h-4 text-gray-400" />
                </button>
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex justify-center py-10">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
                </div>
            ) : actividad.length === 0 ? (
                <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                    <Activity className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                    <p className="text-sm">No hay actividad reciente</p>
                </div>
            ) : (
                <div className="space-y-1 min-h-[280px]">
                    {pageItems.map((item, idx) => {
                        const cfg = tipoConfig[item.tipo] || tipoConfig.checkin
                        return (
                            <Link
                                key={start + idx}
                                to={cfg.link}
                                className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                            >
                                <div className={`w-8 h-8 rounded-full ${cfg.bg} flex items-center justify-center flex-shrink-0`}>
                                    {cfg.icon}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                        {item.descripcion}
                                    </p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className={`text-xs font-medium ${cfg.labelColor}`}>
                                            {cfg.label}
                                        </span>
                                        <span className="text-gray-300">·</span>
                                        <span className="text-xs text-gray-400 flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {getRelativeTime(item.fecha_hora)}
                                        </span>
                                    </div>
                                </div>

                                {item.monto != null && (
                                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex-shrink-0">
                                        {formatCurrency(item.monto)}
                                    </span>
                                )}
                            </Link>
                        )
                    })}
                </div>
            )}

            {/* Pagination footer */}
            {!loading && actividad.length > 0 && (
                <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                    {/* Page info */}
                    <span className="text-xs text-gray-400">
                        {start + 1}–{Math.min(start + PAGE_SIZE, actividad.length)} de {actividad.length}
                    </span>

                    {/* Nav buttons */}
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            title="Anterior"
                        >
                            <ChevronLeft className="w-4 h-4 text-gray-600" />
                        </button>

                        {/* Page numbers */}
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                            <button
                                key={n}
                                onClick={() => setPage(n)}
                                className={`w-7 h-7 text-xs rounded-lg font-medium transition-colors ${n === page
                                    ? 'bg-primary-600 text-white'
                                    : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
                                    }`}
                            >
                                {n}
                            </button>
                        ))}

                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            title="Siguiente"
                        >
                            <ChevronRight className="w-4 h-4 text-gray-600" />
                        </button>
                    </div>

                    <Link to="/pagos" className="text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 font-medium">
                        Ver pagos →
                    </Link>
                </div>
            )}
        </div>
    )
}

export default ActividadReciente
