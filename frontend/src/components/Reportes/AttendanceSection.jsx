import { useState, useEffect } from 'react'
import { reportsAPI } from '../../services/api'
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { formatNumber } from '../../utils/formatters'
import { CalendarDays, Clock, TrendingUp } from 'lucide-react'
import toast from 'react-hot-toast'

const AttendanceSection = ({ fechaInicio, fechaFin }) => {
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [view, setView] = useState('diario') // 'diario' | 'horas'

    useEffect(() => {
        fetchData()
    }, [fechaInicio, fechaFin])

    const fetchData = async () => {
        setLoading(true)
        try {
            const res = await reportsAPI.getAttendance({ fecha_inicio: fechaInicio, fecha_fin: fechaFin })
            setData(res.data)
        } catch (error) {
            console.error('Error fetching attendance:', error)
            toast.error('Error al cargar datos de asistencias')
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
    const dailyData = (stats.por_dia || []).map(d => ({
        fecha: d.fecha?.substring(5) || d.fecha,
        total: d.total
    })).reverse()

    const hourlyData = (stats.por_hora || []).map(h => ({
        hora: `${h.hora}:00`,
        total: h.total
    }))

    // Find peak hour
    const peakHour = stats.por_hora?.length
        ? stats.por_hora.reduce((a, b) => a.total > b.total ? a : b)
        : null

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-gray-900 text-white px-3 py-2 rounded-lg shadow-xl text-sm">
                    <p className="font-medium">{payload[0].payload.fecha || payload[0].payload.hora}</p>
                    <p className="text-amber-400 font-bold">{formatNumber(payload[0].value)} asistencias</p>
                </div>
            )
        }
        return null
    }

    return (
        <div className="card overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/25">
                        <CalendarDays className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white dark:text-white">Asistencias</h3>
                </div>
                {/* Toggle */}
                <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-0.5">
                    <button
                        onClick={() => setView('diario')}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${view === 'diario' ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-300'
                            }`}
                    >
                        Diario
                    </button>
                    <button
                        onClick={() => setView('horas')}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${view === 'horas' ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-300'
                            }`}
                    >
                        Por Hora
                    </button>
                </div>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-3 gap-3 mb-5">
                <div className="bg-amber-50 rounded-xl p-3 border border-amber-100 text-center">
                    <TrendingUp className="w-4 h-4 text-amber-600 mx-auto mb-1" />
                    <p className="text-2xl font-bold text-gray-900 dark:text-white dark:text-white">{formatNumber(stats.total_asistencias || 0)}</p>
                    <p className="text-xs text-gray-500">Total del mes</p>
                </div>
                <div className="bg-orange-50 rounded-xl p-3 border border-orange-100 text-center">
                    <CalendarDays className="w-4 h-4 text-orange-600 mx-auto mb-1" />
                    <p className="text-2xl font-bold text-gray-900 dark:text-white dark:text-white">{stats.promedio_diario || 0}</p>
                    <p className="text-xs text-gray-500">Promedio diario</p>
                </div>
                <div className="bg-yellow-50 rounded-xl p-3 border border-yellow-100 text-center">
                    <Clock className="w-4 h-4 text-yellow-600 mx-auto mb-1" />
                    <p className="text-2xl font-bold text-gray-900 dark:text-white dark:text-white">
                        {peakHour ? `${peakHour.hora}:00` : '-'}
                    </p>
                    <p className="text-xs text-gray-500">Hora pico</p>
                </div>
            </div>

            {/* Chart */}
            <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={view === 'diario' ? dailyData : hourlyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                        <XAxis
                            dataKey={view === 'diario' ? 'fecha' : 'hora'}
                            stroke="#9ca3af"
                            style={{ fontSize: '10px' }}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis stroke="#9ca3af" style={{ fontSize: '10px' }} tickLine={false} axisLine={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="total" fill="url(#attendanceGradient)" radius={[4, 4, 0, 0]} />
                        <defs>
                            <linearGradient id="attendanceGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#f59e0b" />
                                <stop offset="100%" stopColor="#d97706" />
                            </linearGradient>
                        </defs>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
}

export default AttendanceSection
