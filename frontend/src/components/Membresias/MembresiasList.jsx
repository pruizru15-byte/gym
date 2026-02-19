import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Plus, CreditCard, Clock, DollarSign, Users, AlertCircle, Edit, Trash2 } from 'lucide-react'
import { plansAPI } from '../../services/api'
import { formatCurrency } from '../../utils/formatters'
import toast from 'react-hot-toast'

import { usePermissions } from '../../hooks/usePermissions'

const MembresiasList = () => {
  const { hasPermission, PERMISSIONS } = usePermissions()
  const [planes, setPlanes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPlanes()
  }, [])

  // Fetch membership plans
  const fetchPlanes = async () => {
    setLoading(true)
    try {
      const response = await plansAPI.getAll()
      setPlanes(response.data.planes || response.data || [])
    } catch (error) {
      toast.error('Error al cargar planes de membresía')
      console.error('Error fetching plans:', error)
    } finally {
      setLoading(false)
    }
  }

  // Handle delete plan
  const handleDelete = async (id, nombre) => {
    if (!confirm(`¿Estás seguro de eliminar el plan "${nombre}"?`)) {
      return
    }

    try {
      await plansAPI.delete(id)
      toast.success('Plan eliminado correctamente')
      fetchPlanes()
    } catch (error) {
      const message = error.response?.data?.message || 'Error al eliminar plan'
      toast.error(message)
    }
  }

  // Get duration text
  const getDurationText = (duracion, tipoDuracion) => {
    const unit = {
      dias: duracion === 1 ? 'día' : 'días',
      meses: duracion === 1 ? 'mes' : 'meses',
      años: duracion === 1 ? 'año' : 'años',
    }[tipoDuracion] || 'días'

    return `${duracion} ${unit}`
  }

  // Get plan color scheme
  const getPlanColorScheme = (index) => {
    const schemes = [
      { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', icon: 'text-blue-600' },
      { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', icon: 'text-purple-600' },
      { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', icon: 'text-green-600' },
      { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', icon: 'text-orange-600' },
    ]
    return schemes[index % schemes.length]
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Planes de Membresía</h1>
          <p className="text-gray-600 mt-1">Gestiona los planes y precios</p>
        </div>
        {hasPermission(PERMISSIONS.CAN_CONFIGURE_SYSTEM) && (
          <Link
            to="/membresias/nuevo"
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
          >
            <Plus size={20} />
            Nuevo Plan
          </Link>
        )}
      </div>

      {/* Plans Grid */}
      {loading ? (
        <div className="flex justify-center items-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : planes.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <AlertCircle className="mx-auto text-gray-400 mb-4" size={48} />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay planes registrados</h3>
          <p className="text-gray-600 mb-6">Crea tu primer plan de membresía</p>
          {hasPermission(PERMISSIONS.CAN_CONFIGURE_SYSTEM) && (
            <Link
              to="/membresias/nuevo"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
            >
              <Plus size={20} />
              Crear Plan
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {planes.map((plan, index) => {
            const colorScheme = getPlanColorScheme(index)
            return (
              <div
                key={plan.id}
                className={`${colorScheme.bg} border-2 ${colorScheme.border} rounded-lg overflow-hidden hover:shadow-lg transition`}
              >
                {/* Plan Header */}
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`h-12 w-12 rounded-full ${colorScheme.bg} border-2 ${colorScheme.border} flex items-center justify-center`}>
                        <CreditCard className={colorScheme.icon} size={24} />
                      </div>
                      <div>
                        <h3 className={`text-xl font-bold ${colorScheme.text}`}>{plan.nombre}</h3>
                        {plan.activo ? (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                            Activo
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                            Inactivo
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="mb-2">
                    <div className="flex items-baseline gap-2">
                      <span className={`text-4xl font-bold ${colorScheme.text}`}>
                        {formatCurrency(plan.precio)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      por {getDurationText(plan.duracion, plan.tipoDuracion)}
                    </p>
                  </div>
                </div>

                {/* Plan Details */}
                <div className="p-6 space-y-3 bg-white">
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Clock size={16} className="text-gray-400" />
                    <span>Duración: {getDurationText(plan.duracion, plan.tipoDuracion)}</span>
                  </div>

                  {plan.descripcion && (
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {plan.descripcion}
                    </p>
                  )}

                  {plan.miembrosActivos !== undefined && (
                    <div className="flex items-center gap-2 text-sm text-gray-700 pt-2 border-t border-gray-100">
                      <Users size={16} className="text-gray-400" />
                      <span>{plan.miembrosActivos} miembro{plan.miembrosActivos !== 1 ? 's' : ''} activo{plan.miembrosActivos !== 1 ? 's' : ''}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                {hasPermission(PERMISSIONS.CAN_CONFIGURE_SYSTEM) && (
                  <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex gap-2">
                    <Link
                      to={`/membresias/editar/${plan.id}`}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition text-sm font-medium"
                    >
                      <Edit size={16} />
                      Editar
                    </Link>
                    <button
                      onClick={() => handleDelete(plan.id, plan.nombre)}
                      className="flex items-center justify-center gap-2 px-3 py-2 bg-white border border-red-300 rounded-lg text-red-700 hover:bg-red-50 transition text-sm font-medium"
                    >
                      <Trash2 size={16} />
                      Eliminar
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Summary Stats */}
      {!loading && planes.length > 0 && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <CreditCard className="text-blue-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Planes Totales</p>
                <p className="text-2xl font-bold text-gray-900">{planes.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <DollarSign className="text-green-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Precio Promedio</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(
                    planes.reduce((sum, plan) => sum + (plan.precio || 0), 0) / planes.length
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                <Users className="text-purple-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Miembros Totales</p>
                <p className="text-2xl font-bold text-gray-900">
                  {planes.reduce((sum, plan) => sum + (plan.miembrosActivos || 0), 0)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MembresiasList
