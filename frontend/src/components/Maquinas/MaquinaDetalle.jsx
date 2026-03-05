import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { machinesAPI } from '../../services/api'
import {
  ArrowLeft,
  Dumbbell,
  Calendar,
  AlertCircle,
  CheckCircle,
  Wrench,
  Edit,
  Plus,
  MapPin,
  DollarSign,
  Clock,
  FileText,
  ClipboardList,
  Power,
  RotateCcw,
  ChevronDown
} from 'lucide-react'
import toast from 'react-hot-toast'

/**
 * MaquinaDetalle - Machine detail view with maintenance history and quick status updates
 */
const MaquinaDetalle = () => {
  const { id } = useParams()
  const navigate = useNavigate()

  const [maquina, setMaquina] = useState(null)
  const [maintenanceHistory, setMaintenanceHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false)
  const [showStatusDropdown, setShowStatusDropdown] = useState(false)
  const [changingStatus, setChangingStatus] = useState(false)
  const [maintenanceForm, setMaintenanceForm] = useState({
    tipo: 'preventivo',
    descripcion: '',
    costo: '',
    realizado_por: '',
    notas: '',
    nuevo_estado: '',
  })

  useEffect(() => {
    fetchMaquina()
    fetchMaintenanceHistory()
  }, [id])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setShowStatusDropdown(false)
    if (showStatusDropdown) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [showStatusDropdown])

  const fetchMaquina = async () => {
    try {
      setLoading(true)
      const response = await machinesAPI.getById(id)
      setMaquina(response.data)
    } catch (error) {
      toast.error('Error al cargar máquina')
      console.error('Error fetching machine:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMaintenanceHistory = async () => {
    try {
      const response = await machinesAPI.getMaintenanceHistory(id)
      setMaintenanceHistory(response.data)
    } catch (error) {
      console.error('Error fetching maintenance history:', error)
    }
  }

  const handleStatusChange = async (newStatus) => {
    setShowStatusDropdown(false)
    setChangingStatus(true)
    try {
      await machinesAPI.updateStatus(id, { estado: newStatus })
      const statusLabels = {
        disponible: 'Disponible',
        mantenimiento: 'En Mantenimiento',
        fuera_servicio: 'Fuera de Servicio'
      }
      toast.success(`Estado cambiado a "${statusLabels[newStatus]}"`)
      fetchMaquina()
    } catch (error) {
      toast.error('Error al cambiar estado')
      console.error('Error updating status:', error)
    } finally {
      setChangingStatus(false)
    }
  }

  const handleMaintenanceSubmit = async (e) => {
    e.preventDefault()

    try {
      const dataToSend = {
        ...maintenanceForm,
        fecha: new Date().toISOString().split('T')[0],
      }
      // Only send nuevo_estado if user selected one
      if (!dataToSend.nuevo_estado) {
        delete dataToSend.nuevo_estado
      }

      await machinesAPI.recordMaintenance(id, dataToSend)
      toast.success('Mantenimiento registrado exitosamente')

      // Reset form and refresh data
      setMaintenanceForm({
        tipo: 'preventivo',
        descripcion: '',
        costo: '',
        realizado_por: '',
        notas: '',
        nuevo_estado: '',
      })
      setShowMaintenanceModal(false)
      fetchMaquina()
      fetchMaintenanceHistory()
    } catch (error) {
      toast.error('Error al registrar mantenimiento')
      console.error('Error recording maintenance:', error)
    }
  }

  // Get status configuration
  const getStatusConfig = (estado) => {
    const configs = {
      disponible: {
        label: 'Disponible',
        color: 'bg-green-100 text-green-800 border-green-200',
        icon: CheckCircle,
        bgGradient: 'from-green-50 to-green-100',
        dotColor: 'bg-green-500'
      },
      mantenimiento: {
        label: 'En Mantenimiento',
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        icon: Wrench,
        bgGradient: 'from-yellow-50 to-yellow-100',
        dotColor: 'bg-yellow-500'
      },
      fuera_servicio: {
        label: 'Fuera de Servicio',
        color: 'bg-red-100 text-red-800 border-red-200',
        icon: AlertCircle,
        bgGradient: 'from-red-50 to-red-100',
        dotColor: 'bg-red-500'
      },
    }
    return configs[estado] || configs.disponible
  }

  // Calculate days until next maintenance
  const getDaysUntilMaintenance = (date) => {
    if (!date) return null
    const nextDate = new Date(date)
    const today = new Date()
    const diffTime = nextDate - today
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  // Get quick status options (excluding current status)
  const getQuickStatusOptions = (currentStatus) => {
    const allOptions = [
      { value: 'disponible', label: 'Marcar Disponible', icon: CheckCircle, color: 'text-green-700 hover:bg-green-50', dotColor: 'bg-green-500' },
      { value: 'mantenimiento', label: 'Enviar a Mantenimiento', icon: Wrench, color: 'text-yellow-700 hover:bg-yellow-50', dotColor: 'bg-yellow-500' },
      { value: 'fuera_servicio', label: 'Fuera de Servicio', icon: AlertCircle, color: 'text-red-700 hover:bg-red-50', dotColor: 'bg-red-500' },
    ]
    return allOptions.filter(opt => opt.value !== currentStatus)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!maquina) {
    return (
      <div className="text-center py-12">
        <Dumbbell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Máquina no encontrada
        </h3>
        <Link to="/maquinas" className="text-primary-600 dark:text-primary-400 hover:text-primary-700">
          Volver a máquinas
        </Link>
      </div>
    )
  }

  const statusConfig = getStatusConfig(maquina.estado)
  const StatusIcon = statusConfig.icon
  const daysUntilMaintenance = getDaysUntilMaintenance(maquina.proximo_mantenimiento)
  const quickStatusOptions = getQuickStatusOptions(maquina.estado)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/maquinas')}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 dark:bg-gray-700 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white dark:text-white">{maquina.nombre}</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">{maquina.codigo}</p>
        </div>
        <Link
          to={`/maquinas/${id}/editar`}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Edit className="w-5 h-5" />
          Editar
        </Link>
      </div>

      {/* Status Banner with Quick Actions */}
      <div className={`bg-gradient-to-r ${statusConfig.bgGradient} border-2 ${statusConfig.color.replace('bg-', 'border-')} rounded-lg p-6`}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <StatusIcon className="w-8 h-8" />
            <div>
              <h2 className="text-xl font-bold">{statusConfig.label}</h2>
              {daysUntilMaintenance !== null && (
                <p className="text-sm mt-1">
                  {daysUntilMaintenance > 0
                    ? `Próximo mantenimiento en ${daysUntilMaintenance} día(s)`
                    : daysUntilMaintenance === 0
                      ? 'Mantenimiento programado para hoy'
                      : `Mantenimiento atrasado por ${Math.abs(daysUntilMaintenance)} día(s)`
                  }
                </p>
              )}
            </div>
          </div>

          {/* Quick Status Change Dropdown */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowStatusDropdown(!showStatusDropdown)
              }}
              disabled={changingStatus}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-white dark:bg-gray-800 transition-colors text-sm font-medium text-gray-700 dark:text-gray-300 shadow-sm"
            >
              {changingStatus ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                  Cambiando...
                </>
              ) : (
                <>
                  <RotateCcw className="w-4 h-4" />
                  Cambiar Estado
                  <ChevronDown className="w-4 h-4" />
                </>
              )}
            </button>

            {showStatusDropdown && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
                {quickStatusOptions.map((option) => {
                  const Icon = option.icon
                  return (
                    <button
                      key={option.value}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleStatusChange(option.value)
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium ${option.color} transition-colors`}
                    >
                      <span className={`w-2.5 h-2.5 rounded-full ${option.dotColor}`}></span>
                      {option.label}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Información General
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start gap-3">
                <Dumbbell className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Categoría</p>
                  <p className="font-semibold text-gray-900 dark:text-white dark:text-white">{maquina.categoria}</p>
                </div>
              </div>

              {maquina.marca && (
                <div className="flex items-start gap-3">
                  <ClipboardList className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Marca</p>
                    <p className="font-semibold text-gray-900 dark:text-white dark:text-white">{maquina.marca}</p>
                  </div>
                </div>
              )}

              {maquina.modelo && (
                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Modelo</p>
                    <p className="font-semibold text-gray-900 dark:text-white dark:text-white">{maquina.modelo}</p>
                  </div>
                </div>
              )}

              {maquina.ubicacion && (
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Ubicación</p>
                    <p className="font-semibold text-gray-900 dark:text-white dark:text-white">{maquina.ubicacion}</p>
                  </div>
                </div>
              )}

              {maquina.fecha_adquisicion && (
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Fecha de Adquisición</p>
                    <p className="font-semibold text-gray-900 dark:text-white dark:text-white">
                      {new Date(maquina.fecha_adquisicion).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )}

              {maquina.costo && (
                <div className="flex items-start gap-3">
                  <DollarSign className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Costo</p>
                    <p className="font-semibold text-gray-900 dark:text-white dark:text-white">
                      ${Number(maquina.costo).toFixed(2)}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {maquina.descripcion && (
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 dark:border-gray-700">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Descripción</p>
                <p className="text-gray-900 dark:text-white dark:text-white">{maquina.descripcion}</p>
              </div>
            )}

            {maquina.instrucciones_uso && (
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 dark:border-gray-700">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Instrucciones de Uso</p>
                <p className="text-gray-900 dark:text-white whitespace-pre-line">{maquina.instrucciones_uso}</p>
              </div>
            )}
          </div>

          {/* Maintenance History */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Wrench className="w-5 h-5" />
                Historial de Mantenimiento
              </h3>
              <button
                onClick={() => setShowMaintenanceModal(true)}
                className="flex items-center gap-2 px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm"
              >
                <Plus className="w-4 h-4" />
                Registrar Mantenimiento
              </button>
            </div>

            {maintenanceHistory.length === 0 ? (
              <div className="text-center py-8">
                <Wrench className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 dark:text-gray-400 text-sm">No hay registros de mantenimiento</p>
              </div>
            ) : (
              <div className="space-y-4">
                {maintenanceHistory.map((record) => (
                  <div
                    key={record.id}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${record.tipo === 'preventivo'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-orange-100 text-orange-800'
                          }`}>
                          {record.tipo === 'preventivo' ? 'Preventivo' : 'Correctivo'}
                        </span>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {new Date(record.fecha).toLocaleDateString()} - {record.realizado_por}
                        </p>
                      </div>
                      {record.costo && (
                        <p className="font-semibold text-gray-900 dark:text-white dark:text-white">
                          ${Number(record.costo).toFixed(2)}
                        </p>
                      )}
                    </div>
                    <p className="text-gray-900 dark:text-white mb-2">{record.descripcion}</p>
                    {record.notas && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 italic">{record.notas}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Maintenance Schedule */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Programa de Mantenimiento
            </h3>
            <div className="space-y-4">
              {maquina.frecuencia_mantenimiento_dias && (
                <div>
                  <p className="text-sm text-gray-600">Frecuencia</p>
                  <p className="font-semibold text-gray-900 dark:text-white dark:text-white">
                    Cada {maquina.frecuencia_mantenimiento_dias} días
                  </p>
                </div>
              )}

              {maquina.ultimo_mantenimiento && (
                <div>
                  <p className="text-sm text-gray-600">Último Mantenimiento</p>
                  <p className="font-semibold text-gray-900 dark:text-white dark:text-white">
                    {new Date(maquina.ultimo_mantenimiento).toLocaleDateString()}
                  </p>
                </div>
              )}

              {maquina.proximo_mantenimiento && (
                <div>
                  <p className="text-sm text-gray-600">Próximo Mantenimiento</p>
                  <p className={`font-bold ${daysUntilMaintenance && daysUntilMaintenance <= 7
                      ? 'text-red-600'
                      : 'text-gray-900 dark:text-white dark:text-white'
                    }`}>
                    {new Date(maquina.proximo_mantenimiento).toLocaleDateString()}
                  </p>
                  {daysUntilMaintenance !== null && daysUntilMaintenance <= 7 && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded flex items-center gap-2">
                      <Clock className="w-4 h-4 text-red-600" />
                      <span className="text-xs text-red-800">
                        {daysUntilMaintenance > 0
                          ? `En ${daysUntilMaintenance} día(s)`
                          : daysUntilMaintenance === 0
                            ? 'Hoy'
                            : `Atrasado ${Math.abs(daysUntilMaintenance)} día(s)`
                        }
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Additional Info */}
          {maquina.vida_util_anos && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Información Adicional
              </h3>
              <div>
                <p className="text-sm text-gray-600">Vida Útil</p>
                <p className="font-semibold text-gray-900 dark:text-white dark:text-white">
                  {maquina.vida_util_anos} año(s)
                </p>
              </div>
            </div>
          )}

          {maquina.notas && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm font-medium text-yellow-900 mb-2">Notas</p>
              <p className="text-sm text-yellow-800">{maquina.notas}</p>
            </div>
          )}
        </div>
      </div>

      {/* Maintenance Modal */}
      {showMaintenanceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Registrar Mantenimiento
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Fecha: {new Date().toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>

            <form onSubmit={handleMaintenanceSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tipo de Mantenimiento
                </label>
                <select
                  value={maintenanceForm.tipo}
                  onChange={(e) => setMaintenanceForm({ ...maintenanceForm, tipo: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="preventivo">Preventivo</option>
                  <option value="correctivo">Correctivo</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Descripción <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={maintenanceForm.descripcion}
                  onChange={(e) => setMaintenanceForm({ ...maintenanceForm, descripcion: e.target.value })}
                  required
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Describe el mantenimiento realizado..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Realizado Por
                </label>
                <input
                  type="text"
                  value={maintenanceForm.realizado_por}
                  onChange={(e) => setMaintenanceForm({ ...maintenanceForm, realizado_por: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Nombre del técnico"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Costo
                </label>
                <input
                  type="number"
                  value={maintenanceForm.costo}
                  onChange={(e) => setMaintenanceForm({ ...maintenanceForm, costo: e.target.value })}
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>

              {/* Status Change Option */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Cambiar estado de la máquina
                </label>
                <select
                  value={maintenanceForm.nuevo_estado}
                  onChange={(e) => setMaintenanceForm({ ...maintenanceForm, nuevo_estado: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">Sin cambio (mantener "{statusConfig.label}")</option>
                  {maquina.estado !== 'disponible' && (
                    <option value="disponible">✅ Marcar como Disponible</option>
                  )}
                  {maquina.estado !== 'mantenimiento' && (
                    <option value="mantenimiento">🔧 Enviar a Mantenimiento</option>
                  )}
                  {maquina.estado !== 'fuera_servicio' && (
                    <option value="fuera_servicio">⛔ Fuera de Servicio</option>
                  )}
                </select>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Estado actual: {statusConfig.label}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Notas
                </label>
                <textarea
                  value={maintenanceForm.notas}
                  onChange={(e) => setMaintenanceForm({ ...maintenanceForm, notas: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Notas adicionales..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowMaintenanceModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-900 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Registrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default MaquinaDetalle
