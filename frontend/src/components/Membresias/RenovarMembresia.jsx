import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  User, CreditCard, Calendar, DollarSign, ArrowLeft,
  Save, AlertCircle, RefreshCw, CheckCircle
} from 'lucide-react'
import { membersAPI, plansAPI, membershipsAPI, paymentsAPI } from '../../services/api'
import { formatDate, formatCurrency, daysUntil } from '../../utils/formatters'
import toast from 'react-hot-toast'

const RenovarMembresia = () => {
  const { id: miembroId } = useParams() // Member ID
  const navigate = useNavigate()

  const [cliente, setCliente] = useState(null)
  const [membresiaActual, setMembresiaActual] = useState(null)
  const [planes, setPlanes] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    planId: '',
    fechaInicio: '',
    metodoPago: 'efectivo',
    monto: '',
    notas: '',
    isCuotas: false,
    numCuotas: 2
  })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    loadData()
  }, [miembroId])

  // Load member, current membership, and available plans
  const loadData = async () => {
    setLoading(true)
    try {
      // Load member info
      const clienteRes = await membersAPI.getById(miembroId)
      const clienteData = clienteRes.data.miembro || clienteRes.data
      setCliente(clienteData)

      // Load current active membership
      try {
        const membresiaRes = await membershipsAPI.getActive(miembroId)
        // Handle response which might be an object or an array
        const rawData = membresiaRes.data.membresia || membresiaRes.data
        // If it's an array, take the first one (most recent), otherwise take the object
        const membresiaData = Array.isArray(rawData) ? rawData[0] : rawData

        setMembresiaActual(membresiaData)

        // Set default start date as the day after expiration
        if (membresiaData && membresiaData.fechaVencimiento) {
          const nextDay = new Date(membresiaData.fechaVencimiento)
          nextDay.setDate(nextDay.getDate() + 1)
          setFormData(prev => ({
            ...prev,
            fechaInicio: nextDay.toISOString().split('T')[0],
          }))
        }
      } catch (error) {
        // No active membership - set today as start date
        setFormData(prev => ({
          ...prev,
          fechaInicio: new Date().toISOString().split('T')[0],
        }))
      }

      // Load available plans
      const planesRes = await plansAPI.getAll({ activo: true })
      setPlanes(planesRes.data.planes || planesRes.data || [])
    } catch (error) {
      toast.error('Error al cargar datos')
      console.error('Error loading data:', error)
      navigate('/clientes')
    } finally {
      setLoading(false)
    }
  }

  // Handle plan selection
  const handlePlanSelect = (planId) => {
    const plan = planes.find(p => p.id === parseInt(planId))
    setFormData(prev => ({
      ...prev,
      planId,
      monto: plan ? plan.precio.toString() : '',
    }))
    if (errors.planId) {
      setErrors(prev => ({ ...prev, planId: '' }))
    }
  }

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  // Calculate new expiration date
  const getNewExpirationDate = () => {
    if (!formData.planId || !formData.fechaInicio) return null

    const plan = planes.find(p => p.id === parseInt(formData.planId))
    if (!plan) return null

    const startDate = new Date(formData.fechaInicio)
    const newDate = new Date(startDate)

    // Use duracion_dias if available (standard from backend)
    if (plan.duracion_dias) {
      newDate.setDate(newDate.getDate() + plan.duracion_dias)
    } else if (plan.duracion && plan.tipoDuracion) {
      // Fallback for types (though backend only has duracion_dias now)
      switch (plan.tipoDuracion) {
        case 'dias':
          newDate.setDate(newDate.getDate() + plan.duracion)
          break
        case 'meses':
          newDate.setMonth(newDate.getMonth() + plan.duracion)
          break
        case 'años':
          newDate.setFullYear(newDate.getFullYear() + plan.duracion)
          break
      }
    } else {
      // Fallback interpretation if only duration is present
      newDate.setDate(newDate.getDate() + (plan.duracion || 30))
    }

    return newDate
  }

  // Validate form
  const validate = () => {
    const newErrors = {}

    if (!formData.planId) {
      newErrors.planId = 'Selecciona un plan'
    }

    if (!formData.fechaInicio) {
      newErrors.fechaInicio = 'La fecha de inicio es requerida'
    }

    if (!formData.monto) {
      newErrors.monto = 'El monto es requerido'
    } else if (parseFloat(formData.monto) <= 0) {
      newErrors.monto = 'El monto debe ser mayor a 0'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validate()) {
      toast.error('Por favor corrige los errores en el formulario')
      return
    }

    setSubmitting(true)
    try {
      const newExpirationDate = getNewExpirationDate()

      // Create new membership assignment
      // The backend endpoint (membresias/asignar) handles both the membership assignment
      // and the payment record creation in a single transaction
      const upgradeData = {
        cliente_id: parseInt(miembroId),
        membresia_id: parseInt(formData.planId),
        fecha_inicio: formData.fechaInicio,
        precio_pagado: formData.isCuotas ? parseFloat(formData.monto) : parseFloat(formData.monto),
        metodo_pago: formData.metodoPago,
        notas: formData.notas,
        es_cuotas: formData.isCuotas,
        num_cuotas: formData.isCuotas ? parseInt(formData.numCuotas) : undefined
      }

      const res = await membershipsAPI.create(upgradeData)

      toast.success('Membresía renovada correctamente')

      if (res.data?.data?.pago_id) {
        navigate('/pagos/historial', { state: { showReceiptId: res.data.data.pago_id } })
      } else {
        navigate(`/clientes/${miembroId}`)
      }
    } catch (error) {
      console.error('Error renewing membership:', error)
      const message = error.response?.data?.error || 'Error al renovar membresía'
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  const selectedPlan = planes.find(p => p.id === parseInt(formData.planId))
  const newExpirationDate = getNewExpirationDate()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate(`/clientes/${miembroId}`)}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:text-white mb-4"
        >
          <ArrowLeft size={20} />
          Volver al cliente
        </button>

        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-primary-100 flex items-center justify-center">
            <RefreshCw className="text-primary-600 dark:text-primary-400 dark:text-primary-400" size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white dark:text-white">Renovar Membresía</h1>
            <p className="text-gray-600">{cliente?.nombre}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
            <div className="p-6 space-y-6">
              {/* Current Membership Info */}
              {membresiaActual && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-5 shadow-sm">
                  <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2 text-lg">
                    <AlertCircle size={20} />
                    Membresía Actual
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                    <div>
                      <p className="text-blue-700 font-medium mb-1">Plan Actual</p>
                      <p className="font-bold text-blue-900 text-lg">{membresiaActual.planNombre || membresiaActual.membresia_nombre}</p>
                    </div>
                    <div>
                      <p className="text-blue-700 font-medium mb-1">Fecha de Vencimiento</p>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-blue-900 text-lg">{formatDate(membresiaActual.fechaVencimiento || membresiaActual.fecha_vencimiento)}</p>
                        {daysUntil(membresiaActual.fechaVencimiento || membresiaActual.fecha_vencimiento) !== null && (
                          <span className={`px-2 py-1 text-xs font-bold rounded-full ${daysUntil(membresiaActual.fechaVencimiento || membresiaActual.fecha_vencimiento) >= 0
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                            }`}>
                            {daysUntil(membresiaActual.fechaVencimiento || membresiaActual.fecha_vencimiento) >= 0
                              ? `${daysUntil(membresiaActual.fechaVencimiento || membresiaActual.fecha_vencimiento)} días restantes`
                              : `Venció hace ${Math.abs(daysUntil(membresiaActual.fechaVencimiento || membresiaActual.fecha_vencimiento))} días`}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Select Plan */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Selecciona un Plan *
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {planes.map((plan) => (
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() => handlePlanSelect(plan.id.toString())}
                      className={`p-4 border-2 rounded-lg text-left transition ${formData.planId === plan.id.toString()
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:border-gray-600 dark:border-gray-600'
                        }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-900 dark:text-white dark:text-white">{plan.nombre}</h4>
                        {formData.planId === plan.id.toString() && (
                          <CheckCircle className="text-primary-600 dark:text-primary-400 dark:text-primary-400" size={20} />
                        )}
                      </div>
                      <p className="text-2xl font-bold text-primary-600 dark:text-primary-400 mb-1">
                        {formatCurrency(plan.precio)}
                      </p>
                      <p className="text-sm text-gray-600">
                        {plan.duracion} {plan.tipoDuracion}
                      </p>
                    </button>
                  ))}
                </div>
                {errors.planId && (
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {errors.planId}
                  </p>
                )}
              </div>

              {/* Start Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Fecha de Inicio *
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="date"
                    name="fechaInicio"
                    value={formData.fechaInicio}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${errors.fechaInicio ? 'border-red-500' : 'border-gray-300 dark:border-gray-600 dark:border-gray-600'
                      }`}
                  />
                </div>
                {errors.fechaInicio && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {errors.fechaInicio}
                  </p>
                )}
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Método de Pago
                </label>
                <select
                  name="metodoPago"
                  value={formData.metodoPago}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="efectivo">Efectivo</option>
                  <option value="tarjeta">Tarjeta</option>
                  <option value="transferencia">Transferencia</option>
                  <option value="otro">Otro</option>
                </select>
              </div>

              {/* Installments / Cuotas Option */}
              <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-4 rounded-xl">
                <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-4">Opciones de Pago</h4>

                <div className="flex flex-col sm:flex-row gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="tipoPago"
                      checked={!formData.isCuotas}
                      onChange={() => setFormData({ ...formData, isCuotas: false })}
                      className="w-4 h-4 text-primary-600 dark:text-primary-400 focus:ring-primary-500"
                    />
                    <span className="text-gray-700 dark:text-gray-300 font-medium">Pago Completado</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="tipoPago"
                      checked={formData.isCuotas}
                      onChange={() => setFormData({ ...formData, isCuotas: true })}
                      className="w-4 h-4 text-primary-600 dark:text-primary-400 focus:ring-primary-500"
                    />
                    <span className="text-gray-700 dark:text-gray-300 font-medium">Pagar en Cuotas</span>
                  </label>
                </div>

                {formData.isCuotas && (
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Número de Cuotas</label>
                      <input
                        type="number"
                        min="2"
                        max="12"
                        value={formData.numCuotas}
                        onChange={(e) => setFormData({ ...formData, numCuotas: parseInt(e.target.value) || 2 })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500"
                        required
                      />
                    </div>
                    <div className="flex flex-col justify-center">
                      <p className="text-sm font-medium text-gray-700">Monto Primera Cuota (Hoy):</p>
                      <p className="text-lg font-bold text-primary-600 dark:text-primary-400 dark:text-primary-400">
                        {formData.monto && formData.numCuotas
                          ? formatCurrency(parseFloat(formData.monto) / formData.numCuotas)
                          : '-'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        (Las siguientes cuotas se cargarán como pendientes)
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Amount */}
              {!formData.isCuotas && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Monto a Pagar (Hoy) *
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="number"
                      step="0.01"
                      name="monto"
                      value={formData.monto}
                      onChange={handleChange}
                      className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${errors.monto ? 'border-red-500' : 'border-gray-300 dark:border-gray-600 dark:border-gray-600'
                        }`}
                      placeholder="0.00"
                    />
                  </div>
                  {errors.monto && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle size={14} />
                      {errors.monto}
                    </p>
                  )}
                  {formData.monto && !errors.monto && (
                    <p className="mt-1 text-sm text-gray-500">
                      {formatCurrency(parseFloat(formData.monto))}
                    </p>
                  )}
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Notas
                </label>
                <textarea
                  name="notas"
                  value={formData.notas}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Notas adicionales sobre el pago..."
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 rounded-b-lg flex justify-end gap-3">
              <button
                type="button"
                onClick={() => navigate(`/clientes/${miembroId}`)}
                disabled={submitting}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-900 transition disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting || !formData.planId}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:opacity-50 flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Procesando...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Renovar Membresía
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Right Column - Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 sticky top-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Resumen</h3>

            <div className="space-y-4">
              {/* Client Info */}
              <div className="flex items-center gap-3 pb-4 border-b border-gray-200 dark:border-gray-700 dark:border-gray-700">
                <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center">
                  <User className="text-primary-600 dark:text-primary-400 dark:text-primary-400" size={20} />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white dark:text-white">{cliente?.nombre}</p>
                  <p className="text-sm text-gray-500">{cliente?.email}</p>
                </div>
              </div>

              {/* Selected Plan */}
              {selectedPlan ? (
                <>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Plan Seleccionado</p>
                    <p className="font-semibold text-gray-900 dark:text-white dark:text-white">{selectedPlan.nombre}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Precio</p>
                    <p className="text-2xl font-bold text-primary-600 dark:text-primary-400 dark:text-primary-400">
                      {formatCurrency(selectedPlan.precio)}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Duración</p>
                    <p className="font-semibold text-gray-900 dark:text-white dark:text-white">
                      {selectedPlan.duracion} {selectedPlan.tipoDuracion}
                    </p>
                  </div>

                  {formData.fechaInicio && (
                    <>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Fecha de Inicio</p>
                        <p className="font-semibold text-gray-900 dark:text-white dark:text-white">
                          {formatDate(formData.fechaInicio)}
                        </p>
                      </div>

                      {newExpirationDate && (
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Nueva Fecha de Vencimiento</p>
                          <p className="font-semibold text-green-600">
                            {formatDate(newExpirationDate)}
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </>
              ) : (
                <div className="text-center py-8">
                  <CreditCard className="mx-auto text-gray-400 mb-2" size={32} />
                  <p className="text-sm text-gray-600">Selecciona un plan para ver el resumen</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RenovarMembresia
