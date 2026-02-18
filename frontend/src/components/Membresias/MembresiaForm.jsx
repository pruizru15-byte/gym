import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Save, X, CreditCard, Clock, DollarSign, FileText, AlertCircle, ToggleLeft, ToggleRight } from 'lucide-react'
import { plansAPI } from '../../services/api'
import { formatCurrency } from '../../utils/formatters'
import toast from 'react-hot-toast'

const MembresiaForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditing = Boolean(id)

  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    precio: '',
    duracion: '',
    tipoDuracion: 'meses',
    activo: true,
  })
  const [errors, setErrors] = useState({})

  // Load plan data if editing
  useEffect(() => {
    if (isEditing) {
      loadPlan()
    }
  }, [id])

  const loadPlan = async () => {
    setLoading(true)
    try {
      const response = await plansAPI.getById(id)
      const plan = response.data.plan || response.data
      
      setFormData({
        nombre: plan.nombre || '',
        descripcion: plan.descripcion || '',
        precio: plan.precio || '',
        duracion: plan.duracion || '',
        tipoDuracion: plan.tipoDuracion || 'meses',
        activo: plan.activo !== undefined ? plan.activo : true,
      })
    } catch (error) {
      toast.error('Error al cargar plan')
      navigate('/membresias')
    } finally {
      setLoading(false)
    }
  }

  // Handle input change
  const handleChange = (e) => {
    const { name, value, type } = e.target
    
    let finalValue = value
    if (name === 'precio' || name === 'duracion') {
      // Only allow numbers and decimal point for precio
      finalValue = value.replace(/[^\d.]/g, '')
      if (name === 'duracion') {
        finalValue = value.replace(/[^\d]/g, '')
      }
    }
    
    setFormData(prev => ({ ...prev, [name]: finalValue }))
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  // Toggle active status
  const toggleActivo = () => {
    setFormData(prev => ({ ...prev, activo: !prev.activo }))
  }

  // Validate form
  const validate = () => {
    const newErrors = {}

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido'
    }

    if (!formData.precio) {
      newErrors.precio = 'El precio es requerido'
    } else if (parseFloat(formData.precio) <= 0) {
      newErrors.precio = 'El precio debe ser mayor a 0'
    }

    if (!formData.duracion) {
      newErrors.duracion = 'La duración es requerida'
    } else if (parseInt(formData.duracion) <= 0) {
      newErrors.duracion = 'La duración debe ser mayor a 0'
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

    setLoading(true)
    try {
      const submitData = {
        ...formData,
        precio: parseFloat(formData.precio),
        duracion: parseInt(formData.duracion),
      }

      if (isEditing) {
        await plansAPI.update(id, submitData)
        toast.success('Plan actualizado correctamente')
      } else {
        await plansAPI.create(submitData)
        toast.success('Plan creado correctamente')
      }
      navigate('/membresias')
    } catch (error) {
      const message = error.response?.data?.message || 'Error al guardar plan'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  // Calculate price per day for preview
  const getPricePerDay = () => {
    if (!formData.precio || !formData.duracion) return null
    
    const days = {
      dias: parseInt(formData.duracion),
      meses: parseInt(formData.duracion) * 30,
      años: parseInt(formData.duracion) * 365,
    }[formData.tipoDuracion] || 0

    return days > 0 ? parseFloat(formData.precio) / days : 0
  }

  const pricePerDay = getPricePerDay()

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          {isEditing ? 'Editar Plan' : 'Nuevo Plan de Membresía'}
        </h1>
        <p className="text-gray-600 mt-1">
          {isEditing ? 'Actualiza la información del plan' : 'Define un nuevo plan de membresía'}
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm">
        <div className="p-6 space-y-6">
          {/* Basic Information Section */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <CreditCard size={20} />
              Información del Plan
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Name */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del Plan *
                </label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                    errors.nombre ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Ej: Membresía Mensual, Anual Premium"
                />
                {errors.nombre && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {errors.nombre}
                  </p>
                )}
              </div>

              {/* Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Precio *
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    name="precio"
                    value={formData.precio}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      errors.precio ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="0.00"
                  />
                </div>
                {errors.precio && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {errors.precio}
                  </p>
                )}
                {formData.precio && !errors.precio && (
                  <p className="mt-1 text-sm text-gray-500">
                    {formatCurrency(parseFloat(formData.precio))}
                  </p>
                )}
              </div>

              {/* Active Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estado
                </label>
                <button
                  type="button"
                  onClick={toggleActivo}
                  className={`w-full flex items-center justify-between px-4 py-2 border rounded-lg transition ${
                    formData.activo
                      ? 'bg-green-50 border-green-300 text-green-700'
                      : 'bg-gray-50 border-gray-300 text-gray-700'
                  }`}
                >
                  <span className="font-medium">
                    {formData.activo ? 'Activo' : 'Inactivo'}
                  </span>
                  {formData.activo ? (
                    <ToggleRight size={24} className="text-green-600" />
                  ) : (
                    <ToggleLeft size={24} className="text-gray-400" />
                  )}
                </button>
                <p className="mt-1 text-sm text-gray-500">
                  {formData.activo
                    ? 'Este plan está disponible para nuevas membresías'
                    : 'Este plan no estará disponible para nuevas membresías'}
                </p>
              </div>

              {/* Duration */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duración *
                </label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    name="duracion"
                    value={formData.duracion}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      errors.duracion ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="1"
                  />
                </div>
                {errors.duracion && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {errors.duracion}
                  </p>
                )}
              </div>

              {/* Duration Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Duración
                </label>
                <select
                  name="tipoDuracion"
                  value={formData.tipoDuracion}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="dias">Días</option>
                  <option value="meses">Meses</option>
                  <option value="años">Años</option>
                </select>
              </div>

              {/* Description */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 text-gray-400" size={18} />
                  <textarea
                    name="descripcion"
                    value={formData.descripcion}
                    onChange={handleChange}
                    rows={4}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Describe las características y beneficios de este plan..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Price Preview */}
          {pricePerDay !== null && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">Resumen del Plan</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-blue-700">Precio Total</p>
                  <p className="font-bold text-blue-900 text-lg">
                    {formatCurrency(parseFloat(formData.precio) || 0)}
                  </p>
                </div>
                <div>
                  <p className="text-blue-700">Duración</p>
                  <p className="font-bold text-blue-900 text-lg">
                    {formData.duracion} {formData.tipoDuracion}
                  </p>
                </div>
                <div>
                  <p className="text-blue-700">Precio por día</p>
                  <p className="font-bold text-blue-900 text-lg">
                    {formatCurrency(pricePerDay)}
                  </p>
                </div>
                <div>
                  <p className="text-blue-700">Estado</p>
                  <p className={`font-bold text-lg ${formData.activo ? 'text-green-700' : 'text-gray-700'}`}>
                    {formData.activo ? 'Activo' : 'Inactivo'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Form Actions */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/membresias')}
            disabled={loading}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition disabled:opacity-50 flex items-center gap-2"
          >
            <X size={18} />
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Guardando...
              </>
            ) : (
              <>
                <Save size={18} />
                {isEditing ? 'Actualizar' : 'Crear'} Plan
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

export default MembresiaForm
