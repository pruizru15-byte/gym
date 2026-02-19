import { useState, useEffect } from 'react'
import { usersAPI } from '../../services/api'
import { Activity, Search, Filter, Calendar, Clock, User, ArrowRight } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import toast from 'react-hot-toast'

const AuditLog = () => {
    const [logs, setLogs] = useState([])
    const [loading, setLoading] = useState(false)
    const [filters, setFilters] = useState({
        page: 1,
        limit: 20,
        action: '',
        entityType: '',
        startDate: '',
        endDate: ''
    })
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 20,
        total: 0,
        pages: 1
    })

    const fetchLogs = async () => {
        setLoading(true)
        try {
            const response = await usersAPI.getAuditLogs(filters)
            setLogs(response.data.logs)
            setPagination(response.data.pagination)
        } catch (error) {
            console.error('Error fetching logs:', error)
            toast.error('Error al cargar registros')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchLogs()
    }, [filters.page, filters.action, filters.entityType, filters.startDate, filters.endDate])

    const handleFilterChange = (e) => {
        const { name, value } = e.target
        setFilters(prev => ({ ...prev, [name]: value, page: 1 }))
    }

    const getActionColor = (action) => {
        switch (action) {
            case 'CREATE': return 'bg-green-100 text-green-700'
            case 'UPDATE': return 'bg-blue-100 text-blue-700'
            case 'DELETE': return 'bg-red-100 text-red-700'
            case 'LOGIN': return 'bg-purple-100 text-purple-700'
            case 'LOGOUT': return 'bg-gray-100 text-gray-700'
            default: return 'bg-gray-100 text-gray-700'
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Registro de Actividad</h1>
                    <p className="text-gray-600 mt-1">Monitorea los cambios y acciones en el sistema</p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Acción</label>
                    <select
                        name="action"
                        value={filters.action}
                        onChange={handleFilterChange}
                        className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                    >
                        <option value="">Todas</option>
                        <option value="CREATE">Crear</option>
                        <option value="UPDATE">Actualizar</option>
                        <option value="DELETE">Eliminar</option>
                        <option value="LOGIN">Login</option>
                        <option value="LOGOUT">Logout</option>
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Entidad</label>
                    <select
                        name="entityType"
                        value={filters.entityType}
                        onChange={handleFilterChange}
                        className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                    >
                        <option value="">Todas</option>
                        <option value="USUARIO">Usuario</option>
                        <option value="CLIENTE">Cliente</option>
                        <option value="MEMBRESIA">Membresía</option>
                        <option value="MAQUINA">Máquina</option>
                        <option value="PRODUCTO">Producto</option>
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Desde</label>
                    <input
                        type="date"
                        name="startDate"
                        value={filters.startDate}
                        onChange={handleFilterChange}
                        className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Hasta</label>
                    <input
                        type="date"
                        name="endDate"
                        value={filters.endDate}
                        onChange={handleFilterChange}
                        className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                    />
                </div>
            </div>

            {/* List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200 text-xs text-gray-500 uppercase">
                                <th className="px-6 py-3 font-semibold">Usuario</th>
                                <th className="px-6 py-3 font-semibold">Acción</th>
                                <th className="px-6 py-3 font-semibold">Entidad</th>
                                <th className="px-6 py-3 font-semibold">Detalles</th>
                                <th className="px-6 py-3 font-semibold">Fecha</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                                        Cargando registros...
                                    </td>
                                </tr>
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                                        No se encontraron registros.
                                    </td>
                                </tr>
                            ) : (
                                logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-gray-50 transition">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 text-xs font-bold">
                                                    {log.nombre ? log.nombre.substring(0, 2).toUpperCase() : '??'}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">{log.nombre}</p>
                                                    <p className="text-xs text-gray-500">@{log.username}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActionColor(log.accion)}`}>
                                                {log.accion}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {log.entidad_tipo} #{log.entidad_id}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                                            {JSON.stringify(log.detalle)}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            <div className="flex flex-col">
                                                <span className="font-medium text-gray-900">
                                                    {format(new Date(log.fecha_hora), 'dd MMM yyyy', { locale: es })}
                                                </span>
                                                <span className="text-xs">
                                                    {format(new Date(log.fecha_hora), 'HH:mm:ss')}
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                        Mostrando {logs.length} de {pagination.total} registros
                    </span>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setFilters(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                            disabled={filters.page === 1}
                            className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                        >
                            Anterior
                        </button>
                        <button
                            onClick={() => setFilters(prev => ({ ...prev, page: Math.min(pagination.pages, prev.page + 1) }))}
                            disabled={filters.page >= pagination.pages}
                            className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                        >
                            Siguiente
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default AuditLog
