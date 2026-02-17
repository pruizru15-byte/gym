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
        const membresiaData = membresiaRes.data.membresia || membresiaRes.data
        setMembresiaActual(membresiaData)
        
        // Set default start date as the day after expiration
        if (membresiaData.fechaVencimiento) {
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
      
      // Create new membership
      const membresiaData = {
        miembroId: parseInt(miembroId),
        planId: parseInt(formData.planId),
        fechaInicio: formData.fechaInicio,
        fechaVencimiento: newExpirationDate.toISOString().split('T')[0],
        activa: true,
      }
      
      const membresiaRes = await membershipsAPI.create(membresiaData)
      const newMembresia = membresiaRes.data.membresia || membresiaRes.data

      // Register payment
      const pagoData = {
        membresiaId: newMembresia.id,
        monto: parseFloat(formData.monto),
        metodoPago: formData.metodoPago,
        fechaPago: new Date().toISOString(),
        concepto: 'Renovación de membresía',
        notas: formData.notas,
      }
      
      await paymentsAPI.create(pagoData)

      toast.success('Membresía renovada correctamente')
      navigate(`/clientes/${miembroId}`)
    } catch (error) {
      const message = error.response?.data?.message || 'Error al renovar membresía'
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
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft size={20} />
          Volver al cliente
        </button>
        
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-primary-100 flex items-center justify-center">
            <RefreshCw className="text-primary-600" size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Renovar Membresía</h1>
            <p className="text-gray-600">{cliente?.nombre}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm">
            <div className="p-6 space-y-6">
              {/* Current Membership Info */}
              {membresiaActual && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h3 className="font-semibold text-yellow-900 mb-2 flex items-center gap-2">
                    <AlertCircle size={18} />
                    Membresía Actual
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-yellow-700">Plan</p>
                      <p className="font-semibold text-yellow-900">{membresiaActual.planNombre}</p>
                    </div>
                    <div>
                      <p className="text-yellow-700">Vencimiento</p>
                      <p className="font-semibold text-yellow-900">{formatDate(membresiaActual.fechaVencimiento)}</p>
                      {daysUntil(membresiaActual.fechaVencimiento) !== null && (
                        <p className="text-xs text-yellow-700 mt-1">
                          {daysUntil(membresiaActual.fechaVencimiento) >= 0
                            ? `${daysUntil(membresiaActual.fechaVencimiento)} días restantes`
                            : `Venció hace ${Math.abs(daysUntil(membresiaActual.fechaVencimiento))} días`}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Select Plan */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Selecciona un Plan *
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {planes.map((plan) => (
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() => handlePlanSelect(plan.id.toString())}
                      className={`p-4 border-2 rounded-lg text-left transition ${
                        formData.planId === plan.id.toString()
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-900">{plan.nombre}</h4>
                        {formData.planId === plan.id.toString() && (
                          <CheckCircle className="text-primary-600" size={20} />
                        )}
                      </div>
                      <p className="text-2xl font-bold text-primary-600 mb-1">
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de Inicio *
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="date"
                    name="fechaInicio"
                    value={formData.fechaInicio}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      errors.fechaInicio ? 'border-red-500' : 'border-gray-300'
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Método de Pago
                </label>
                <select
                  name="metodoPago"
                  value={formData.metodoPago}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="efectivo">Efectivo</option>
                  <option value="tarjeta">Tarjeta</option>
                  <option value="transferencia">Transferencia</option>
                  <option value="otro">Otro</option>
                </select>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Monto a Pagar *
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="number"
                    step="0.01"
                    name="monto"
                    value={formData.monto}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      errors.monto ? 'border-red-500' : 'border-gray-300'
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

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notas
                </label>
                <textarea
                  name="notas"
                  value={formData.notas}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Notas adicionales sobre el pago..."
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg flex justify-end gap-3">
              <button
                type="button"
                onClick={() => navigate(`/clientes/${miembroId}`)}
                disabled={submitting}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
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
          <div className="bg-white rounded-lg shadow-sm p-6 sticky top-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumen</h3>
            
            <div className="space-y-4">
              {/* Client Info */}
              <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
                <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center">
                  <User className="text-primary-600" size={20} />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{cliente?.nombre}</p>
                  <p className="text-sm text-gray-500">{cliente?.email}</p>
                </div>
              </div>

              {/* Selected Plan */}
              {selectedPlan ? (
                <>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Plan Seleccionado</p>
                    <p className="font-semibold text-gray-900">{selectedPlan.nombre}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500 mb-1">Precio</p>
                    <p className="text-2xl font-bold text-primary-600">
                      {formatCurrency(selectedPlan.precio)}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500 mb-1">Duración</p>
                    <p className="font-semibold text-gray-900">
                      {selectedPlan.duracion} {selectedPlan.tipoDuracion}
                    </p>
                  </div>

                  {formData.fechaInicio && (
                    <>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Fecha de Inicio</p>
                        <p className="font-semibold text-gray-900">
                          {formatDate(formData.fechaInicio)}
                        </p>
                      </div>

                      {newExpirationDate && (
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Nueva Fecha de Vencimiento</p>
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
