import { useState, useEffect } from 'react'
import { reportsAPI } from '../../services/api'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Users, UserPlus, UserCheck, UserX } from 'lucide-react'
import toast from 'react-hot-toast'

const ClientsSection = ({ fechaInicio, fechaFin }) => {
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchData()
    }, [fechaInicio, fechaFin])

    const fetchData = async () => {
        setLoading(true)
        try {
            const res = await reportsAPI.getClientStats({ fecha_inicio: fechaInicio, fecha_fin: fechaFin })
            setData(res.data)
        } catch (error) {
            console.error('Error fetching client stats:', error)
            toast.error('Error al cargar datos de clientes')
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

    const stats = data || {}

    const statItems = [
        {
            icon: UserPlus,
            label: 'Nuevos',
            value: stats.nuevos || 0,
            color: 'text-blue-600',
            bg: 'bg-blue-50'
        },
        {
            icon: UserCheck,
            label: 'Renovaciones',
            value: stats.renovaciones || 0,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50'
        },
        {
            icon: UserX,
            label: 'Cancelaciones',
            value: stats.cancelaciones || 0,
            color: 'text-red-500',
            bg: 'bg-red-50'
        }
    ]

    return (
        <div className="card overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-3 mb-5">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25">
                    <Users className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white dark:text-white">Clientes</h3>
            </div>

            {/* Main stat */}
            <div className="mb-5 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                <div className="flex items-baseline justify-between">
                    <div>
                        <p className="text-sm text-blue-600 font-medium">Total activos</p>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                            {stats.total_activos || 0}
                        </p>
                    </div>
                    <div className="text-right">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                            +{stats.nuevos || 0} este mes
                        </span>
                    </div>
                </div>
            </div>

            {/* Stat grid */}
            <div className="grid grid-cols-3 gap-3 mb-5">
                {statItems.map((item) => (
                    <div key={item.label} className={`flex flex-col items-center p-3 rounded-xl ${item.bg} border border-opacity-50`}>
                        <item.icon className={`w-5 h-5 ${item.color} mb-1.5`} />
                        <span className="text-2xl font-bold text-gray-900 dark:text-white dark:text-white">{item.value}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{item.label}</span>
                    </div>
                ))}
            </div>

            {/* Renewal rate */}
            <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-700 dark:border-gray-700">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600">Tasa de renovación</span>
                    <span className="text-lg font-bold text-emerald-600">{stats.tasa_renovacion || 0}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                        className="bg-gradient-to-r from-emerald-500 to-green-400 h-2.5 rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${Math.min(stats.tasa_renovacion || 0, 100)}%` }}
                    />
                </div>
            </div>
        </div>
    )
}

export default ClientsSection
