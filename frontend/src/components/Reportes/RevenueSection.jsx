import { useState, useEffect } from 'react'
import { reportsAPI } from '../../services/api'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { formatCurrency } from '../../utils/formatters'
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react'
import toast from 'react-hot-toast'

const RevenueSection = ({ fechaInicio, fechaFin }) => {
    const [data, setData] = useState(null)
    const [comparative, setComparative] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchData()
    }, [fechaInicio, fechaFin])

    const fetchData = async () => {
        setLoading(true)
        try {
            const [incomeRes, compRes] = await Promise.all([
                reportsAPI.getIncome({ fecha_inicio: fechaInicio, fecha_fin: fechaFin }),
                reportsAPI.getComparative({ fecha_inicio: fechaInicio, fecha_fin: fechaFin })
            ])
            setData(incomeRes.data)
            setComparative(compRes.data)
        } catch (error) {
            console.error('Error fetching revenue data:', error)
            toast.error('Error al cargar datos de ingresos')
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="card animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-32 mb-4" />
                <div className="h-48 bg-gray-100 dark:bg-gray-700 rounded" />
            </div>
        )
    }

    const ingresos = comparative?.ingresos || {}
    const cambio = ingresos.cambio_porcentaje || 0
    const isPositive = cambio >= 0

    // Revenue breakdown by type
    const porTipo = data?.por_tipo || []
    const totalIngresos = data?.total_ingresos || 0
    const membresiaIncome = porTipo.find(t => t.tipo === 'membresia')?.total || 0
    const ventaIncome = porTipo.find(t => t.tipo === 'venta')?.total || 0
    const membresiaPct = totalIngresos > 0 ? Math.round((membresiaIncome / totalIngresos) * 100) : 0
    const ventaPct = totalIngresos > 0 ? Math.round((ventaIncome / totalIngresos) * 100) : 0

    // Chart data
    const chartData = (data?.por_periodo || []).map(item => ({
        fecha: item.periodo?.substring(5) || item.periodo,
        ingresos: parseFloat(item.total || 0)
    })).reverse()

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-gray-900 text-white px-3 py-2 rounded-lg shadow-xl text-sm">
                    <p className="font-medium">{payload[0].payload.fecha}</p>
                    <p className="text-emerald-400 font-bold">{formatCurrency(payload[0].value)}</p>
                </div>
            )
        }
        return null
    }

    return (
        <div className="card overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-3 mb-5">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-500/25">
                    <DollarSign className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white dark:text-white">Ingresos</h3>
            </div>

            {/* Comparison cards */}
            <div className="grid grid-cols-3 gap-3 mb-5">
                <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl p-3 border border-emerald-100">
                    <p className="text-xs text-emerald-600 font-medium mb-1">Este Mes</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white dark:text-white">{formatCurrency(ingresos.actual || 0)}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-3 border border-gray-100 dark:border-gray-700 dark:border-gray-700">
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">Mes Pasado</p>
                    <p className="text-xl font-bold text-gray-700">{formatCurrency(ingresos.anterior || 0)}</p>
                </div>
                <div className={`rounded-xl p-3 border ${isPositive ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">Diferencia</p>
                    <div className="flex items-center gap-1">
                        {isPositive
                            ? <TrendingUp className="w-4 h-4 text-emerald-600" />
                            : <TrendingDown className="w-4 h-4 text-red-600" />}
                        <span className={`text-xl font-bold ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
                            {isPositive ? '+' : ''}{cambio}%
                        </span>
                    </div>
                </div>
            </div>

            {/* Breakdown */}
            <div className="space-y-2 mb-5">
                <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Membresías</span>
                    <span className="font-semibold text-gray-900 dark:text-white dark:text-white">{formatCurrency(membresiaIncome)} ({membresiaPct}%)</span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                    <div className="bg-gradient-to-r from-emerald-500 to-green-500 h-2 rounded-full transition-all duration-700" style={{ width: `${membresiaPct}%` }} />
                </div>
                <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Tienda</span>
                    <span className="font-semibold text-gray-900 dark:text-white dark:text-white">{formatCurrency(ventaIncome)} ({ventaPct}%)</span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                    <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all duration-700" style={{ width: `${ventaPct}%` }} />
                </div>
            </div>

            {/* Chart */}
            {chartData.length > 0 && (
                <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                            <XAxis dataKey="fecha" stroke="#9ca3af" style={{ fontSize: '11px' }} tickLine={false} axisLine={false} />
                            <YAxis stroke="#9ca3af" style={{ fontSize: '11px' }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} tickLine={false} axisLine={false} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="ingresos" fill="url(#revenueGradient)" radius={[6, 6, 0, 0]} />
                            <defs>
                                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#10b981" />
                                    <stop offset="100%" stopColor="#059669" />
                                </linearGradient>
                            </defs>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    )
}

export default RevenueSection
