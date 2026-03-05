import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { productsAPI, membershipsAPI } from '../../services/api'
import { AlertTriangle, TrendingDown, Clock, Package, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'

const AlertsSection = () => {
    const [lowStock, setLowStock] = useState([])
    const [expiringMemberships, setExpiringMemberships] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        setLoading(true)
        try {
            const [stockRes, membersRes] = await Promise.all([
                productsAPI.getLowStock(),
                membershipsAPI.getExpiring(7) // memberships expiring in next 7 days
            ])

            setLowStock(Array.isArray(stockRes.data) ? stockRes.data : (stockRes.data?.data || []))
            setExpiringMemberships(Array.isArray(membersRes.data) ? membersRes.data : (membersRes.data?.data || []))
        } catch (error) {
            console.error('Error fetching alerts data:', error)
            toast.error('Error al cargar datos de alertas y vencimientos')
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <>
                <div className="card animate-pulse">
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-4" />
                    <div className="space-y-3">
                        {[1, 2, 3, 4].map(i => <div key={i} className="h-12 bg-gray-100 dark:bg-gray-700 rounded" />)}
                    </div>
                </div>
                <div className="card animate-pulse">
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-4" />
                    <div className="space-y-3">
                        {[1, 2, 3, 4].map(i => <div key={i} className="h-12 bg-gray-100 dark:bg-gray-700 rounded" />)}
                    </div>
                </div>
            </>
        )
    }

    return (
        <>
            {/* Report 1: Low Stock */}
            <div className="card overflow-hidden flex flex-col h-full max-h-[500px]">
                <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-gradient-to-br from-yellow-400 to-yellow-600 text-white shadow-lg shadow-yellow-500/25">
                            <TrendingDown className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Productos con Bajo Stock</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                {lowStock.length === 0 ? 'Stock adecuado' : `${lowStock.length} productos requieren reabastecimiento`}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 space-y-2">
                    {lowStock.length === 0 ? (
                        <div className="text-center py-8">
                            <Package className="w-10 h-10 text-emerald-400 mx-auto mb-2 opacity-80" />
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Inventario saludable</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">No hay productos con bajo stock actualmente.</p>
                        </div>
                    ) : (
                        lowStock.map(p => (
                            <div
                                key={p.id}
                                className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl"
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-8 h-8 rounded-lg bg-yellow-100 dark:bg-yellow-900/50 flex items-center justify-center flex-shrink-0">
                                        <Package className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{p.nombre}</p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                                Min: {p.stock_minimo}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right flex-shrink-0 ml-3">
                                    <span className={`text-sm font-bold ${p.stock_actual === 0 ? 'text-red-600 dark:text-red-400' : 'text-yellow-600 dark:text-yellow-400'}`}>
                                        {p.stock_actual === 0 ? 'Agotado' : `${p.stock_actual} uds`}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {lowStock.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700 text-center">
                        <Link to="/tienda/alertas" className="text-xs font-medium text-primary-600 dark:text-primary-400 hover:underline inline-flex items-center gap-1">
                            Ver inventario <ArrowRight className="w-3 h-3" />
                        </Link>
                    </div>
                )}
            </div>

            {/* Report 2: Expiring Memberships */}
            <div className="card overflow-hidden flex flex-col h-full max-h-[500px]">
                <div className="flex items-center gap-3 mb-5">
                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 text-white shadow-lg shadow-orange-500/25">
                        <Clock className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Próximos Vencimientos</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            Membresías que vencen en los próximos 7 días
                        </p>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 space-y-2">
                    {expiringMemberships.length === 0 ? (
                        <div className="text-center py-8">
                            <Clock className="w-10 h-10 text-emerald-400 mx-auto mb-2 opacity-80" />
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Sin vencimientos cercanos</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">No hay membresías por vencer en los próximos 7 días.</p>
                        </div>
                    ) : (
                        expiringMemberships.map(m => {
                            const days = Math.ceil((new Date(m.fecha_vencimiento) - new Date()) / (1000 * 60 * 60 * 24))
                            const isExpiredOrToday = days <= 0
                            const nombre = `${m.cliente_nombre || ''} ${m.cliente_apellido || ''}`.trim()

                            return (
                                <div
                                    key={m.id}
                                    className={`flex items-center justify-between p-3 rounded-xl border ${isExpiredOrToday
                                            ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                                            : 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
                                        }`}
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isExpiredOrToday ? 'bg-red-100 dark:bg-red-900/50' : 'bg-orange-100 dark:bg-orange-900/50'
                                            }`}>
                                            <AlertTriangle className={`w-4 h-4 ${isExpiredOrToday ? 'text-red-600 dark:text-red-400' : 'text-orange-600 dark:text-orange-400'}`} />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{nombre}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{m.membresia_nombre}</p>
                                        </div>
                                    </div>
                                    <div className="text-right flex-shrink-0 ml-3">
                                        <span className={`text-sm font-bold ${isExpiredOrToday ? 'text-red-600 dark:text-red-400' : 'text-orange-600 dark:text-orange-400'
                                            }`}>
                                            {isExpiredOrToday ? 'Vence Hoy' : `En ${days} días`}
                                        </span>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {new Date(m.fecha_vencimiento).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>

                {expiringMemberships.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700 text-center">
                        <Link to="/membresias/vencimientos" className="text-xs font-medium text-primary-600 dark:text-primary-400 hover:underline inline-flex items-center gap-1">
                            Ver todos los vencimientos <ArrowRight className="w-3 h-3" />
                        </Link>
                    </div>
                )}
            </div>
        </>
    )
}

export default AlertsSection
