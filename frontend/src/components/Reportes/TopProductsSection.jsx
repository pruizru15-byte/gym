import { useState, useEffect } from 'react'
import { reportsAPI } from '../../services/api'
import { formatCurrency, formatNumber } from '../../utils/formatters'
import { ShoppingBag, Medal } from 'lucide-react'
import toast from 'react-hot-toast'

const TopProductsSection = ({ fechaInicio, fechaFin }) => {
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchData()
    }, [fechaInicio, fechaFin])

    const fetchData = async () => {
        setLoading(true)
        try {
            const res = await reportsAPI.getTopProducts({ fecha_inicio: fechaInicio, fecha_fin: fechaFin })
            setProducts(res.data.productos || [])
        } catch (error) {
            console.error('Error fetching top products:', error)
            toast.error('Error al cargar productos más vendidos')
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="card animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-48 mb-4" />
                <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-10 bg-gray-100 dark:bg-gray-700 rounded" />)}
                </div>
            </div>
        )
    }

    const medalColors = ['text-yellow-500', 'text-gray-400', 'text-amber-700']
    const maxUnits = products.length > 0 ? products[0].unidades_vendidas : 1

    return (
        <div className="card overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-3 mb-5">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 text-white shadow-lg shadow-purple-500/25">
                    <ShoppingBag className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white dark:text-white">Productos Más Vendidos</h3>
            </div>

            {products.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                    <ShoppingBag className="w-10 h-10 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">No hay ventas en este período</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {products.slice(0, 5).map((product, index) => {
                        const pct = Math.round((product.unidades_vendidas / maxUnits) * 100)
                        return (
                            <div key={index} className="group">
                                <div className="flex items-center gap-3">
                                    {/* Rank */}
                                    <div className="flex-shrink-0 w-7 h-7 flex items-center justify-center">
                                        {index < 3 ? (
                                            <Medal className={`w-5 h-5 ${medalColors[index]}`} />
                                        ) : (
                                            <span className="text-sm font-bold text-gray-400">{index + 1}</span>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{product.nombre}</p>
                                            <p className="text-sm font-bold text-gray-900 dark:text-white ml-2 flex-shrink-0">
                                                {formatCurrency(product.ingresos_total)}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-1.5">
                                                <div
                                                    className="bg-gradient-to-r from-purple-500 to-violet-500 h-1.5 rounded-full transition-all duration-700"
                                                    style={{ width: `${pct}%` }}
                                                />
                                            </div>
                                            <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 w-16 text-right">
                                                {formatNumber(product.unidades_vendidas)} uds
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}

export default TopProductsSection
