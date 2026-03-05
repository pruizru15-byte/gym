import { useState, useEffect } from 'react'
import { machinesAPI } from '../../services/api'
import { Dumbbell, Wrench, CheckCircle, AlertTriangle, XCircle, Clock } from 'lucide-react'
import toast from 'react-hot-toast'

const STATUS_CONFIG = {
    disponible: { label: 'Disponible', color: 'emerald', icon: CheckCircle },
    bueno: { label: 'Buen Estado', color: 'emerald', icon: CheckCircle },
    mantenimiento: { label: 'En Mantenimiento', color: 'amber', icon: Wrench },
    fuera_servicio: { label: 'Fuera de Servicio', color: 'red', icon: XCircle },
}

const COLOR_MAP = {
    emerald: {
        bg: 'bg-emerald-50 dark:bg-emerald-900/20',
        border: 'border-emerald-200 dark:border-emerald-800',
        text: 'text-emerald-700 dark:text-emerald-400',
        bar: 'from-emerald-500 to-green-500',
        icon: 'text-emerald-600',
    },
    amber: {
        bg: 'bg-amber-50 dark:bg-amber-900/20',
        border: 'border-amber-200 dark:border-amber-800',
        text: 'text-amber-700 dark:text-amber-400',
        bar: 'from-amber-500 to-yellow-500',
        icon: 'text-amber-600',
    },
    red: {
        bg: 'bg-red-50 dark:bg-red-900/20',
        border: 'border-red-200 dark:border-red-800',
        text: 'text-red-700 dark:text-red-400',
        bar: 'from-red-500 to-rose-500',
        icon: 'text-red-600',
    },
    gray: {
        bg: 'bg-gray-50 dark:bg-gray-800',
        border: 'border-gray-200 dark:border-gray-700',
        text: 'text-gray-700 dark:text-gray-400',
        bar: 'from-gray-400 to-gray-500',
        icon: 'text-gray-500',
    },
}

const MachinesSection = () => {
    const [machines, setMachines] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        setLoading(true)
        try {
            // Request all machines (no pagination limit)
            const res = await machinesAPI.getAll({ limit: 9999 })
            // Backend returns { maquinas: [...], pagination: {...} }
            const data = res.data
            const list = data.maquinas || data.data || (Array.isArray(data) ? data : [])
            setMachines(list)
        } catch (error) {
            console.error('Error fetching machines data:', error)
            toast.error('Error al cargar datos de máquinas')
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
                        {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-10 bg-gray-100 dark:bg-gray-700 rounded" />)}
                    </div>
                </div>
            </>
        )
    }

    // --- Report 1: Status Distribution ---
    const statusCounts = {}
    machines.forEach(m => {
        const estado = m.estado || 'disponible'
        statusCounts[estado] = (statusCounts[estado] || 0) + 1
    })
    const total = machines.length || 1

    // Count operational machines (disponible or bueno)
    const operationalCount = (statusCounts['disponible'] || 0) + (statusCounts['bueno'] || 0)

    // --- Report 2: Machines needing attention ---
    const needsMaint = machines.filter(m =>
        m.estado === 'mantenimiento' || m.estado === 'fuera_servicio'
    )
    const healthPct = machines.length > 0 ? Math.round((operationalCount / machines.length) * 100) : 100

    // Determine which statuses actually exist in the data
    const existingStatuses = Object.keys(statusCounts)
    const statusesToShow = Object.entries(STATUS_CONFIG).filter(([key]) =>
        existingStatuses.includes(key)
    )

    return (
        <>
            {/* Report 1: Machine Status Distribution */}
            <div className="card overflow-hidden">
                <div className="flex items-center gap-3 mb-5">
                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25">
                        <Dumbbell className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Estado de Máquinas</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{machines.length} máquinas en total</p>
                    </div>
                </div>

                {machines.length === 0 ? (
                    <div className="text-center py-8">
                        <Dumbbell className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-500 dark:text-gray-400">No hay máquinas registradas</p>
                    </div>
                ) : (
                    <>
                        {/* Health meter */}
                        <div className="mb-5 p-3 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-xl">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Salud del equipo</span>
                                <span className={`text-2xl font-bold ${healthPct >= 80 ? 'text-emerald-600' : healthPct >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                                    {healthPct}%
                                </span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-3">
                                <div
                                    className={`h-3 rounded-full transition-all duration-700 bg-gradient-to-r ${healthPct >= 80 ? 'from-emerald-500 to-green-500' : healthPct >= 50 ? 'from-amber-500 to-yellow-500' : 'from-red-500 to-rose-500'}`}
                                    style={{ width: `${healthPct}%` }}
                                />
                            </div>
                        </div>

                        {/* Status breakdown */}
                        <div className="space-y-3">
                            {statusesToShow.map(([key, cfg]) => {
                                const count = statusCounts[key] || 0
                                const pct = Math.round((count / total) * 100)
                                const colors = COLOR_MAP[cfg.color]
                                const Icon = cfg.icon
                                return (
                                    <div key={key} className={`flex items-center gap-3 p-3 rounded-xl border ${colors.bg} ${colors.border}`}>
                                        <Icon className={`w-5 h-5 flex-shrink-0 ${colors.icon}`} />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className={`text-sm font-semibold ${colors.text}`}>{cfg.label}</span>
                                                <span className={`text-sm font-bold ${colors.text}`}>{count}</span>
                                            </div>
                                            <div className="w-full bg-gray-200/50 dark:bg-gray-600/50 rounded-full h-1.5">
                                                <div
                                                    className={`bg-gradient-to-r ${colors.bar} h-1.5 rounded-full transition-all duration-700`}
                                                    style={{ width: `${pct}%` }}
                                                />
                                            </div>
                                        </div>
                                        <span className="text-xs font-medium text-gray-400 w-10 text-right">{pct}%</span>
                                    </div>
                                )
                            })}
                        </div>
                    </>
                )}
            </div>

            {/* Report 2: Machines Requiring Attention */}
            <div className="card overflow-hidden">
                <div className="flex items-center gap-3 mb-5">
                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 text-white shadow-lg shadow-orange-500/25">
                        <Wrench className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Máquinas que Requieren Atención</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            {needsMaint.length === 0 ? 'Todas operativas' : `${needsMaint.length} requieren atención`}
                        </p>
                    </div>
                </div>

                {needsMaint.length === 0 ? (
                    <div className="text-center py-8">
                        <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">¡Todas las máquinas están operativas!</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">No hay máquinas en mantenimiento o fuera de servicio</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {needsMaint.map((machine) => {
                            const estadoCfg = STATUS_CONFIG[machine.estado] || STATUS_CONFIG.mantenimiento
                            const colors = COLOR_MAP[estadoCfg.color]
                            const Icon = estadoCfg.icon
                            return (
                                <div
                                    key={machine.id}
                                    className={`flex items-center gap-3 p-3 rounded-xl border ${colors.bg} ${colors.border} transition-colors`}
                                >
                                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${colors.bg}`}>
                                        <Icon className={`w-4 h-4 ${colors.icon}`} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                            {machine.nombre}
                                        </p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${colors.bg} ${colors.text} border ${colors.border}`}>
                                                {estadoCfg.label}
                                            </span>
                                            {machine.categoria && (
                                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                                    {machine.categoria}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    {machine.ultimo_mantenimiento && (
                                        <div className="text-right flex-shrink-0">
                                            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                Último mant.
                                            </p>
                                            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                                                {new Date(machine.ultimo_mantenimiento).toLocaleDateString()}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}

                {/* Summary footer */}
                <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700 grid grid-cols-3 gap-3 text-center">
                    <div>
                        <p className="text-xl font-bold text-emerald-600">{operationalCount}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Operativas</p>
                    </div>
                    <div>
                        <p className="text-xl font-bold text-amber-600">{statusCounts['mantenimiento'] || 0}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">En Mant.</p>
                    </div>
                    <div>
                        <p className="text-xl font-bold text-red-600">{statusCounts['fuera_servicio'] || 0}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Fuera Servicio</p>
                    </div>
                </div>
            </div>
        </>
    )
}

export default MachinesSection
