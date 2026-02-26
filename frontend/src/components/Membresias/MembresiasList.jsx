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
  const [activeTab, setActiveTab] = useState('activas')

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

  // Handle toggle plan status
  const handleToggleStatus = async (id, nombre, currentStatus) => {
    const actionText = currentStatus ? 'desactivar' : 'activar'
    if (!confirm(`¿Estás seguro de ${actionText} el plan "${nombre}"?`)) {
      return
    }

    try {
      await plansAPI.toggleStatus(id)
      toast.success(`Plan ${currentStatus ? 'desactivado' : 'activado'} correctamente`)
      fetchPlanes()
    } catch (error) {
      const message = error.response?.data?.message || `Error al ${actionText} plan`
      toast.error(message)
    }
  }

  // Get duration text
  const getDurationText = (duracion, tipo, dias) => {
    // If we have direct days from backend
    if (dias) {
      if (dias % 365 === 0) return `${dias / 365} Año${dias / 365 !== 1 ? 's' : ''}`
      if (dias % 30 === 0) return `${dias / 30} Mes${dias / 30 !== 1 ? 'es' : ''}`
      if (dias % 7 === 0) return `${dias / 7} Semana${dias / 7 !== 1 ? 's' : ''}`
      return `${dias} Día${dias !== 1 ? 's' : ''}`
    }

    // Fallback for legacy format
    const types = {
      dias: 'Día',
      meses: 'Mes',
      años: 'Año'
    }
    const typeLabel = types[tipo] || tipo
    return `${duracion} ${typeLabel}${duracion > 1 ? (tipo === 'meses' ? 'es' : 's') : ''}`
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

      {/* Tabs */}
      <div className="flex bg-gray-100 p-1 rounded-lg w-full max-w-md mx-auto mb-6">
        <button
          onClick={() => setActiveTab('activas')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition ${activeTab === 'activas'
              ? 'bg-white shadow text-gray-900'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
            }`}
        >
          Membresías Activas
        </button>
        <button
          onClick={() => setActiveTab('inactivas')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition ${activeTab === 'inactivas'
              ? 'bg-white shadow text-gray-900'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
            }`}
        >
          Membresías Inactivas
        </button>
      </div>

      {/* Plans Grid */}
      {loading ? (
        <div className="flex justify-center items-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : planes.filter(p => activeTab === 'activas' ? p.activo : !p.activo).length === 0 ? (
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
          {planes.filter(p => activeTab === 'activas' ? p.activo : !p.activo).map((plan, index) => {
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
                      <div className={`h-12 w-12 rounded-full ${colorScheme.bg} border-2 ${colorScheme.border} flex items-center justify-center transform group-hover:scale-110 transition-transform`}>
                        <CreditCard className={colorScheme.icon} size={24} />
                      </div>
                      <div>
                        <h3 className={`text-xl font-bold ${colorScheme.text}`}>{plan.nombre}</h3>
                        <div className="flex gap-2 mt-1">
                          {plan.activo ? (
                            <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-green-100 text-green-700 border border-green-200">
                              ACTIVO
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-gray-100 text-gray-600 border border-gray-200">
                              INACTIVO
                            </span>
                          )}
                          {plan.miembrosActivos > 0 && (
                            <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-blue-50 text-blue-600 border border-blue-100 flex items-center gap-1">
                              <Users size={10} />
                              {plan.miembrosActivos}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="mb-4 p-4 bg-white bg-opacity-60 rounded-lg border border-white/50 backdrop-blur-sm">
                    <div className="flex items-baseline gap-1">
                      <span className={`text-3xl font-extrabold ${colorScheme.text}`}>
                        {formatCurrency(plan.precio)}
                      </span>
                      <span className="text-gray-500 font-medium text-sm">
                        / {getDurationText(plan.duracion, plan.tipoDuracion, plan.duracion_dias)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Plan Details */}
                <div className="p-6 space-y-4 bg-white flex-1 flex flex-col">
                  {plan.descripcion ? (
                    <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">
                      {plan.descripcion}
                    </p>
                  ) : (
                    <p className="text-sm text-gray-400 italic">Sin descripción</p>
                  )}

                  <div className="mt-auto pt-4 border-t border-gray-100 grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <span className="block text-xs text-gray-400 uppercase font-bold tracking-wider">Duración</span>
                      <span className="font-semibold text-gray-700">
                        {getDurationText(plan.duracion, plan.tipoDuracion, plan.duracion_dias)}
                      </span>
                    </div>
                    <div className="text-center border-l border-gray-100">
                      <span className="block text-xs text-gray-400 uppercase font-bold tracking-wider">Costo Diario</span>
                      <span className="font-semibold text-gray-700">
                        {plan.duracion_dias
                          ? formatCurrency(plan.precio / plan.duracion_dias)
                          : (plan.tipoDuracion === 'dias'
                            ? formatCurrency(plan.precio / plan.duracion)
                            : formatCurrency(plan.precio / (plan.duracion * 30)))
                        }
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                {hasPermission(PERMISSIONS.CAN_CONFIGURE_SYSTEM) && (
                  <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex gap-3">
                    <Link
                      to={`/membresias/editar/${plan.id}`}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition text-sm font-semibold shadow-sm hover:shadow"
                    >
                      <Edit size={16} />
                      Editar
                    </Link>
                    <button
                      onClick={() => handleToggleStatus(plan.id, plan.nombre, plan.activo)}
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition text-sm font-semibold shadow-sm hover:shadow"
                      title={plan.activo ? "Desactivar membresía" : "Activar membresía"}
                    >
                      <div
                        className={`relative inline-flex items-center h-5 w-9 rounded-full transition-colors ${plan.activo ? 'bg-primary-600' : 'bg-gray-300'}`}
                      >
                        <span
                          className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${plan.activo ? 'translate-x-4' : 'translate-x-1'}`}
                        />
                      </div>
                      {plan.activo ? 'Desactivar' : 'Activar'}
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
