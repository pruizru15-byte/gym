import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { machinesAPI } from '../../services/api'
import {
  Dumbbell,
  Plus,
  Search,
  Edit,
  Trash2,
  Filter,
  X,
  AlertCircle,
  CheckCircle,
  Clock,
  Wrench
} from 'lucide-react'
import toast from 'react-hot-toast'

import { usePermissions } from '../../hooks/usePermissions'

/**
 * MaquinasList - List all gym machines with status filters
 */
const MaquinasList = () => {
  const { hasPermission, PERMISSIONS } = usePermissions()
  const [maquinas, setMaquinas] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all') // all, disponible, mantenimiento, fuera_servicio
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    fetchMaquinas()
  }, [])

  const fetchMaquinas = async () => {
    try {
      setLoading(true)
      const response = await machinesAPI.getAll()
      setMaquinas(response.data.maquinas || response.data || [])
    } catch (error) {
      toast.error('Error al cargar máquinas')
      console.error('Error fetching machines:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar esta máquina?')) return

    try {
      await machinesAPI.delete(id)
      toast.success('Máquina eliminada exitosamente')
      fetchMaquinas()
    } catch (error) {
      toast.error('Error al eliminar máquina')
      console.error('Error deleting machine:', error)
    }
  }

  // Filter machines
  const filteredMaquinas = maquinas.filter((maquina) => {
    const matchesSearch =
      maquina.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      maquina.codigo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      maquina.ubicacion?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus =
      statusFilter === 'all' || maquina.estado === statusFilter

    return matchesSearch && matchesStatus
  })

  // Get status config
  const getStatusConfig = (estado) => {
    const configs = {
      disponible: {
        label: 'Disponible',
        color: 'bg-green-100 text-green-800 border-green-200',
        icon: CheckCircle,
      },
      mantenimiento: {
        label: 'En Mantenimiento',
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        icon: Wrench,
      },
      fuera_servicio: {
        label: 'Fuera de Servicio',
        color: 'bg-red-100 text-red-800 border-red-200',
        icon: AlertCircle,
      },
    }
    return configs[estado] || configs.disponible
  }

  // Check if maintenance is due
  const isMaintenanceDue = (maquina) => {
    if (!maquina.proximo_mantenimiento) return false
    const nextMaintenance = new Date(maquina.proximo_mantenimiento)
    const today = new Date()
    const daysLeft = Math.ceil((nextMaintenance - today) / (1000 * 60 * 60 * 24))
    return daysLeft <= 7
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Máquinas</h1>
          <p className="text-gray-600 mt-1">
            {filteredMaquinas.length} máquina(s) encontrada(s)
          </p>
        </div>
        {hasPermission(PERMISSIONS.CAN_MANAGE_MACHINES) && (
          <Link
            to="/maquinas/nueva"
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Nueva Máquina
          </Link>
        )}
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por nombre, código o ubicación..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Filter className="w-5 h-5" />
            Filtros
          </button>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estado
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-64 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">Todos los estados</option>
              <option value="disponible">Disponible</option>
              <option value="mantenimiento">En Mantenimiento</option>
              <option value="fuera_servicio">Fuera de Servicio</option>
            </select>

            {statusFilter !== 'all' && (
              <button
                onClick={() => setStatusFilter('all')}
                className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 mt-3"
              >
                <X className="w-4 h-4" />
                Limpiar filtros
              </button>
            )}
          </div>
        )}
      </div>

      {/* Machines Grid */}
      {filteredMaquinas.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <Dumbbell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No se encontraron máquinas
          </h3>
          <p className="text-gray-600">
            {searchTerm || statusFilter !== 'all'
              ? 'Intenta ajustar los filtros de búsqueda'
              : 'Comienza agregando tu primera máquina'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMaquinas.map((maquina) => {
            const statusConfig = getStatusConfig(maquina.estado)
            const StatusIcon = statusConfig.icon
            const maintenanceDue = isMaintenanceDue(maquina)

            return (
              <div
                key={maquina.id}
                className="bg-white rounded-lg shadow-sm border-2 border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Status Bar */}
                <div className={`h-2 ${maquina.estado === 'disponible' ? 'bg-green-500' :
                  maquina.estado === 'mantenimiento' ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`}></div>

                <div className="p-5">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-gray-900 mb-1">
                        {maquina.nombre}
                      </h3>
                      <p className="text-sm text-gray-500">{maquina.codigo}</p>
                    </div>
                    <Dumbbell className="w-8 h-8 text-primary-600" />
                  </div>

                  {/* Status Badge */}
                  <div className="mb-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border ${statusConfig.color}`}>
                      <StatusIcon className="w-3.5 h-3.5" />
                      {statusConfig.label}
                    </span>
                  </div>

                  {/* Details */}
                  <div className="space-y-2 mb-4 text-sm">
                    {maquina.categoria && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Categoría:</span>
                        <span className="font-medium text-gray-900">{maquina.categoria}</span>
                      </div>
                    )}
                    {maquina.ubicacion && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Ubicación:</span>
                        <span className="font-medium text-gray-900">{maquina.ubicacion}</span>
                      </div>
                    )}
                    {maquina.marca && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Marca:</span>
                        <span className="font-medium text-gray-900">{maquina.marca}</span>
                      </div>
                    )}
                  </div>

                  {/* Maintenance Alert */}
                  {maintenanceDue && (
                    <div className="mb-4 p-2 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2">
                      <Clock className="w-4 h-4 text-yellow-600 flex-shrink-0" />
                      <span className="text-xs text-yellow-800">
                        Mantenimiento próximo
                      </span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Link
                      to={`/maquinas/${maquina.id}`}
                      className="flex-1 px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-center text-sm font-medium"
                    >
                      Ver Detalles
                    </Link>
                    {hasPermission(PERMISSIONS.CAN_MANAGE_MACHINES) && (
                      <>
                        <Link
                          to={`/maquinas/${maquina.id}/editar`}
                          className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(maquina.id)}
                          className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
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

export default MaquinasList
